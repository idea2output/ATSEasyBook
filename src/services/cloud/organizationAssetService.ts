import crypto from 'crypto';
import { db } from './database';
import { ManagedFont, BookTemplate } from '@/types/book';
import { ProjectAccessContext } from './cloudProjectService';
import { hasPermission } from '@/types/auth';
import { authService } from './authService';
import { assetStorage } from './assetStorageService';

export interface OrgFontRecord extends ManagedFont {
  id: string;
  organizationId: string;
  createdBy: {
    userId: string;
    displayName: string;
  };
  createdAt: string;
}

export interface OrgTemplateRecord {
  id: string;
  organizationId: string;
  template: BookTemplate;
  createdBy: {
    userId: string;
    displayName: string;
  };
  createdAt: string;
}

export class OrganizationAssetService {
  /**
   * Asserts administrative permissions for organization assets.
   */
  private assertOrgAdmin(user: ProjectAccessContext, permission: 'ORG_MANAGE_FONTS' | 'ORG_MANAGE_TEMPLATES'): void {
    if (!hasPermission(user.globalRole, permission)) {
      throw new Error(`Unauthorized: Role "${user.globalRole}" cannot manage organization-level assets.`);
    }
  }

  /**
   * Adds a new managed font to the organization catalog.
   */
  public async addOrganizationFont(
    organizationId: string,
    fontBuffer: Buffer,
    fontMetadata: Omit<ManagedFont, 'id' | 'isSystemPreset'>,
    user: ProjectAccessContext
  ): Promise<OrgFontRecord> {
    this.assertOrgAdmin(user, 'ORG_MANAGE_FONTS');

    // 1. Validate font buffer
    const validation = assetStorage.validateFileBuffer(fontBuffer, 'font', `${fontMetadata.familyName}.${fontMetadata.format}`);
    if (!validation.valid) {
      throw new Error(`Font validation failed: ${validation.error}`);
    }

    const fontId = `org-font-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const storageKey = `orgs/${organizationId}/fonts/${fontId}.${fontMetadata.format}`;

    // 2. Save font binary to secure storage
    await assetStorage.saveAsset(
      storageKey,
      fontBuffer,
      `${fontMetadata.displayName}.${fontMetadata.format}`,
      fontMetadata.format === 'otf' ? 'font/otf' : 'font/ttf'
    );

    const now = new Date().toISOString();
    const record: OrgFontRecord = {
      ...fontMetadata,
      id: fontId,
      organizationId,
      isSystemPreset: false,
      canEmbedInPdf: true,
      createdBy: {
        userId: user.userId,
        displayName: user.displayName,
      },
      createdAt: now,
    };

    db.insert('org_fonts', record);

    authService.logAudit('org.font_added', user.userId, user.userEmail, {
      fontId,
      familyName: fontMetadata.familyName,
      organizationId,
    });

    return record;
  }

  /**
   * Lists all fonts available to an organization (combines presets + uploaded org fonts).
   */
  public async listOrganizationFonts(organizationId: string): Promise<OrgFontRecord[]> {
    return db.find<OrgFontRecord>('org_fonts', (f) => f.organizationId === organizationId || Boolean(f.isSystemPreset));
  }

  /**
   * Deletes an organization font.
   */
  public async deleteOrganizationFont(fontId: string, user: ProjectAccessContext): Promise<boolean> {
    this.assertOrgAdmin(user, 'ORG_MANAGE_FONTS');

    const font = db.findById<OrgFontRecord>('org_fonts', fontId);
    if (!font) return false;

    if (font.isSystemPreset) {
      throw new Error('System preset fonts cannot be deleted.');
    }

    db.delete('org_fonts', fontId);

    authService.logAudit('org.font_deleted', user.userId, user.userEmail, {
      fontId,
      familyName: font.familyName,
    });

    return true;
  }

  /**
   * Publishes a custom template to the organization catalog.
   */
  public async publishOrganizationTemplate(
    organizationId: string,
    template: BookTemplate,
    user: ProjectAccessContext
  ): Promise<OrgTemplateRecord> {
    this.assertOrgAdmin(user, 'ORG_MANAGE_TEMPLATES');

    const record: OrgTemplateRecord = {
      id: `org-tmpl-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      organizationId,
      template,
      createdBy: {
        userId: user.userId,
        displayName: user.displayName,
      },
      createdAt: new Date().toISOString(),
    };

    db.insert('org_templates', record);

    authService.logAudit('org.template_published', user.userId, user.userEmail, {
      templateId: template.id,
      name: template.name,
      organizationId,
    });

    return record;
  }

  /**
   * Lists all organization templates.
   */
  public async listOrganizationTemplates(organizationId: string): Promise<OrgTemplateRecord[]> {
    return db.find<OrgTemplateRecord>('org_templates', (t) => t.organizationId === organizationId);
  }
}

export const orgAssetService = new OrganizationAssetService();
