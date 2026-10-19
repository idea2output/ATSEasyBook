import crypto from 'crypto';
import { db } from './database';
import { UserProfile, AuthSession, RegisterRequest, UserRole } from '@/types/auth';
import { AuditLogEntry } from '@/types/cloud';

const SESSION_TTL_SECONDS = 7 * 24 * 3600; // 7 days
const RESET_TOKEN_TTL_SECONDS = 3600; // 1 hour

// In-memory rate limiting tracker (max 5 failed attempts per 15 minutes per email/IP)
const failedAttemptsMap: Map<string, { count: number; firstAttempt: number }> = new Map();

export class AuthService {
  /**
   * Hashes a password with PBKDF2 and a unique salt.
   */
  public hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  }

  /**
   * Generates a cryptographically random salt.
   */
  public generateSalt(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Checks if an identifier is rate-limited.
   */
  public isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = failedAttemptsMap.get(identifier);
    if (!entry) return false;

    // Reset window after 15 minutes
    if (now - entry.firstAttempt > 15 * 60 * 1000) {
      failedAttemptsMap.delete(identifier);
      return false;
    }

    return entry.count >= 5;
  }

  public recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const entry = failedAttemptsMap.get(identifier);
    if (!entry || now - entry.firstAttempt > 15 * 60 * 1000) {
      failedAttemptsMap.set(identifier, { count: 1, firstAttempt: now });
    } else {
      entry.count++;
    }
  }

  public clearFailedAttempts(identifier: string): void {
    failedAttemptsMap.delete(identifier);
  }

  /**
   * Logs a security action with zero-leak sanitization.
   */
  public logAudit(action: string, userId: string, userEmail: string, details: Record<string, any>, projectId?: string): void {
    const sanitizedDetails = { ...details };
    // Explicitly delete sensitive keys if present
    delete sanitizedDetails.password;
    delete sanitizedDetails.token;
    delete sanitizedDetails.salt;
    delete sanitizedDetails.rawManuscript;

    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      userId,
      userEmail,
      projectId,
      action,
      details: sanitizedDetails,
    };

    db.insert('audit_logs', entry);
  }

  /**
   * Registers a new user account.
   */
  public async register(req: RegisterRequest): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    const email = req.email.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }

    if (!req.password || req.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    // Check existing
    const existing = db.findOne('users', (u) => u.email === email);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(req.password, salt);
    const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const userRecord = {
      id: userId,
      email,
      passwordHash,
      salt,
      displayName: req.displayName.trim() || email.split('@')[0],
      organizationName: req.organizationName?.trim() || 'Independent Author',
      preferredLanguage: req.preferredLanguage || 'en',
      preferredColorProfile: req.preferredColorProfile || 'FOGRA39',
      timezone: req.timezone || 'UTC',
      role: 'owner' as UserRole,
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    };

    db.insert('users', userRecord);

    this.logAudit('auth.register', userId, email, {
      displayName: userRecord.displayName,
      organizationName: userRecord.organizationName,
    });

    const session = await this.createSession(userId);
    return { success: true, session };
  }

  /**
   * Authenticates user via email and password.
   */
  public async login(emailInput: string, passwordInput: string, ipAddress?: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    const email = emailInput.trim().toLowerCase();
    const rateKey = `${email}:${ipAddress || 'local'}`;

    if (this.isRateLimited(rateKey)) {
      return {
        success: false,
        error: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
      };
    }

    const user = db.findOne('users', (u) => u.email === email);
    if (!user) {
      this.recordFailedAttempt(rateKey);
      return { success: false, error: 'Invalid email or password.' };
    }

    const computedHash = this.hashPassword(passwordInput, user.salt);
    const expectedBuf = Buffer.from(user.passwordHash, 'hex');
    const computedBuf = Buffer.from(computedHash, 'hex');

    if (expectedBuf.length !== computedBuf.length || !crypto.timingSafeEqual(expectedBuf, computedBuf)) {
      this.recordFailedAttempt(rateKey);
      this.logAudit('auth.login_failed', user.id, email, { reason: 'bad_password' });
      return { success: false, error: 'Invalid email or password.' };
    }

    this.clearFailedAttempts(rateKey);
    const session = await this.createSession(user.id);

    this.logAudit('auth.login', user.id, email, { method: 'password' });
    return { success: true, session };
  }

  /**
   * Authenticates or creates account via OAuth (e.g. Google/GitHub).
   */
  public async loginWithOAuth(provider: 'google' | 'github', oauthId: string, emailInput: string, displayName: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    const email = emailInput.trim().toLowerCase();
    let user = db.findOne('users', (u) => u.email === email || (u.oauthProvider === provider && u.oauthId === oauthId));

    const now = new Date().toISOString();

    if (!user) {
      const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const dummySalt = this.generateSalt();
      const dummyHash = this.hashPassword(crypto.randomBytes(32).toString('hex'), dummySalt);

      user = {
        id: userId,
        email,
        passwordHash: dummyHash,
        salt: dummySalt,
        displayName: displayName || email.split('@')[0],
        organizationName: 'Independent Author',
        preferredLanguage: 'en',
        preferredColorProfile: 'FOGRA39',
        timezone: 'UTC',
        role: 'owner' as UserRole,
        isVerified: true,
        oauthProvider: provider,
        oauthId,
        createdAt: now,
        updatedAt: now,
      };

      db.insert('users', user);
      this.logAudit('auth.oauth_register', user.id, email, { provider });
    } else {
      // Link oauth if not linked
      if (!user.oauthProvider) {
        user = db.update('users', user.id, { oauthProvider: provider, oauthId, updatedAt: now })!;
      }
      this.logAudit('auth.oauth_login', user.id, email, { provider });
    }

    const session = await this.createSession(user.id);
    return { success: true, session };
  }

  /**
   * Creates a new session for a user.
   */
  public async createSession(userId: string): Promise<AuthSession> {
    const user = db.findById('users', userId);
    if (!user) throw new Error('User not found');

    const token = crypto.randomBytes(48).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();

    const sessionRecord = {
      id: `sess-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      userId,
      token,
      expiresAt,
      createdAt: now.toISOString(),
      lastActiveAt: now.toISOString(),
    };

    db.insert('sessions', sessionRecord);

    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      organizationName: user.organizationName,
      preferredLanguage: user.preferredLanguage,
      preferredColorProfile: user.preferredColorProfile,
      timezone: user.timezone,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      oauthProvider: user.oauthProvider,
      oauthId: user.oauthId,
    };

    return {
      user: userProfile,
      token,
      expiresAt,
      createdAt: sessionRecord.createdAt,
    };
  }

  /**
   * Validates a session token and returns the current user profile.
   */
  public async validateSession(token: string): Promise<UserProfile | null> {
    if (!token) return null;

    const session = db.findOne('sessions', (s) => s.token === token);
    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      db.delete('sessions', session.id);
      return null;
    }

    const user = db.findById('users', session.userId);
    if (!user) {
      db.delete('sessions', session.id);
      return null;
    }

    // Update lastActiveAt periodically
    db.update('sessions', session.id, { lastActiveAt: new Date().toISOString() });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      organizationName: user.organizationName,
      preferredLanguage: user.preferredLanguage,
      preferredColorProfile: user.preferredColorProfile,
      timezone: user.timezone,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      oauthProvider: user.oauthProvider,
      oauthId: user.oauthId,
    };
  }

  /**
   * Logs out a session.
   */
  public async logout(token: string): Promise<boolean> {
    const session = db.findOne('sessions', (s) => s.token === token);
    if (session) {
      const user = db.findById('users', session.userId);
      if (user) {
        this.logAudit('auth.logout', user.id, user.email, {});
      }
      db.delete('sessions', session.id);
      return true;
    }
    return false;
  }

  /**
   * Requests a password reset token.
   */
  public async requestPasswordReset(emailInput: string): Promise<{ success: boolean; resetToken?: string }> {
    const email = emailInput.trim().toLowerCase();
    const user = db.findOne('users', (u) => u.email === email);
    if (!user) {
      // Pretend success to avoid user enumeration
      return { success: true };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_SECONDS * 1000).toISOString();

    const record = {
      id: `pwd-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      userId: user.id,
      email: user.email,
      tokenHash,
      expiresAt,
    };

    db.insert('password_resets', record);
    this.logAudit('auth.password_reset_requested', user.id, user.email, {});

    return { success: true, resetToken: rawToken };
  }

  /**
   * Completes a password reset with a valid token.
   */
  public async resetPassword(rawToken: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = db.findOne('password_resets', (r) => r.tokenHash === tokenHash && !r.usedAt);

    if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
      return { success: false, error: 'Password reset token is invalid or has expired.' };
    }

    const user = db.findById('users', record.userId);
    if (!user) {
      return { success: false, error: 'Associated user account not found.' };
    }

    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(newPassword, salt);

    db.update('users', user.id, {
      passwordHash,
      salt,
      updatedAt: new Date().toISOString(),
    });

    db.update('password_resets', record.id, { usedAt: new Date().toISOString() });

    // Invalidate existing sessions for security
    const sessions = db.find('sessions', (s) => s.userId === user.id);
    for (const sess of sessions) {
      db.delete('sessions', sess.id);
    }

    this.logAudit('auth.password_reset_completed', user.id, user.email, {});
    return { success: true };
  }

  /**
   * Updates user account profile fields.
   */
  public async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const user = db.findById('users', userId);
    if (!user) return null;

    const allowedUpdates: any = {};
    if (updates.displayName !== undefined) allowedUpdates.displayName = updates.displayName.trim();
    if (updates.organizationName !== undefined) allowedUpdates.organizationName = updates.organizationName.trim();
    if (updates.preferredLanguage !== undefined) allowedUpdates.preferredLanguage = updates.preferredLanguage;
    if (updates.preferredColorProfile !== undefined) allowedUpdates.preferredColorProfile = updates.preferredColorProfile;
    if (updates.timezone !== undefined) allowedUpdates.timezone = updates.timezone;
    allowedUpdates.updatedAt = new Date().toISOString();

    const updated = db.update('users', userId, allowedUpdates);
    if (!updated) return null;

    this.logAudit('auth.profile_update', userId, user.email, allowedUpdates);

    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      organizationName: updated.organizationName,
      preferredLanguage: updated.preferredLanguage,
      preferredColorProfile: updated.preferredColorProfile,
      timezone: updated.timezone,
      role: updated.role,
      isVerified: updated.isVerified,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      oauthProvider: updated.oauthProvider,
      oauthId: updated.oauthId,
    };
  }

  /**
   * Deletes a user account and removes all associated sessions and sensitive records.
   */
  public async deleteAccount(userId: string): Promise<boolean> {
    const user = db.findById('users', userId);
    if (!user) return false;

    // Invalidate sessions
    const sessions = db.find('sessions', (s) => s.userId === userId);
    for (const sess of sessions) {
      db.delete('sessions', sess.id);
    }

    this.logAudit('auth.account_deleted', userId, user.email, {});
    db.delete('users', userId);
    return true;
  }

  /**
   * Exports full user account data package (GDPR compliance).
   */
  public async exportUserData(userId: string): Promise<Record<string, any> | null> {
    const user = db.findById('users', userId);
    if (!user) return null;

    const projects = db.find('projects', (p) => p.ownerId === userId);
    const auditLogs = db.find('audit_logs', (a) => a.userId === userId);
    const comments = db.find('comments', (c) => c.authorId === userId);

    return {
      profile: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        organizationName: user.organizationName,
        preferredLanguage: user.preferredLanguage,
        preferredColorProfile: user.preferredColorProfile,
        timezone: user.timezone,
        role: user.role,
        createdAt: user.createdAt,
      },
      projectsCount: projects.length,
      projects: projects.map((p) => ({
        id: p.id,
        title: p.data?.title,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      commentsCount: comments.length,
      auditLogsCount: auditLogs.length,
      exportedAt: new Date().toISOString(),
    };
  }
}

export const authService = new AuthService();
