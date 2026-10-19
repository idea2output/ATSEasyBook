import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const MASTER_SIGNING_SECRET =
  process.env.STORAGE_SIGNING_SECRET || 'ats_easybook_master_signing_key_secret_2026';

export interface StoredAssetMetadata {
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  sha256: string;
}

export interface AssetValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
}

// In-browser mock storage map for client environment
const browserStorageMap = new Map<string, Buffer>();

export class AssetStorageService {
  private storageDir: string;

  constructor(customStorageDir?: string) {
    if (typeof window === 'undefined' && path && path.join) {
      this.storageDir = customStorageDir || path.join(process.cwd(), 'data', 'storage');
      if (fs && fs.existsSync && !fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } else {
      this.storageDir = '';
    }
  }

  /**
   * Inspects magic bytes at the beginning of the buffer to detect genuine file format.
   */
  public validateFileBuffer(
    buffer: Buffer,
    expectedCategory: 'image' | 'font' | 'pdf' | 'epub',
    filename: string
  ): AssetValidationResult {
    const ext = path && path.extname ? path.extname(filename).toLowerCase() : `.${filename.split('.').pop()?.toLowerCase() || ''}`;

    // Check for dangerous extensions
    const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.js', '.mjs', '.vbs', '.scr', '.pif', '.dll'];
    if (dangerousExts.includes(ext)) {
      return { valid: false, error: `Executable or script extension "${ext}" is strictly forbidden.` };
    }

    if (buffer.length === 0) {
      return { valid: false, error: 'File buffer is empty.' };
    }

    // Size limits
    const maxSizes: Record<string, number> = {
      image: 15 * 1024 * 1024, // 15MB
      font: 25 * 1024 * 1024,  // 25MB
      pdf: 100 * 1024 * 1024,  // 100MB
      epub: 50 * 1024 * 1024,  // 50MB
    };

    if (buffer.length > (maxSizes[expectedCategory] || 25 * 1024 * 1024)) {
      return {
        valid: false,
        error: `File size ${Math.round(buffer.length / 1024 / 1024)}MB exceeds the maximum allowed limit for ${expectedCategory}.`,
      };
    }

    // Magic byte checks
    if (expectedCategory === 'image') {
      // PNG: 89 50 4E 47
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        return { valid: true, detectedMime: 'image/png' };
      }
      // JPEG: FF D8 FF
      if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { valid: true, detectedMime: 'image/jpeg' };
      }
      // WebP: RIFF ... WEBP
      if (
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      ) {
        return { valid: true, detectedMime: 'image/webp' };
      }
      return {
        valid: false,
        error: 'Invalid image format: Must be a genuine PNG, JPEG, or WebP image.',
      };
    }

    if (expectedCategory === 'font') {
      // TrueType (00 01 00 00) or OpenType (4F 54 54 4F)
      const isTrueType = buffer[0] === 0x00 && buffer[1] === 0x01 && buffer[2] === 0x00 && buffer[3] === 0x00;
      const isOpenType = buffer.toString('ascii', 0, 4) === 'OTTO';
      // WOFF / WOFF2
      const isWoff = buffer.toString('ascii', 0, 4) === 'wOFF';
      const isWoff2 = buffer.toString('ascii', 0, 4) === 'wOF2';

      if (isTrueType || isOpenType || isWoff || isWoff2) {
        return { valid: true, detectedMime: isTrueType ? 'font/ttf' : 'font/otf' };
      }
      return {
        valid: false,
        error: 'Invalid font format: Must be a valid TrueType (TTF), OpenType (OTF), or WOFF font file.',
      };
    }

    if (expectedCategory === 'pdf') {
      // PDF: %PDF-
      if (buffer.toString('ascii', 0, 5) === '%PDF-') {
        return { valid: true, detectedMime: 'application/pdf' };
      }
      return { valid: false, error: 'Invalid PDF format: Missing %PDF- header.' };
    }

    if (expectedCategory === 'epub') {
      // EPUB is a ZIP archive containing mimetype file starting with PK
      if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
        return { valid: true, detectedMime: 'application/epub+zip' };
      }
      return { valid: false, error: 'Invalid EPUB format: Expected ZIP container.' };
    }

    return { valid: true };
  }

  /**
   * Saves a file into private object storage and returns asset metadata.
   */
  public async saveAsset(
    key: string,
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<StoredAssetMetadata> {
    const safeKey = key.replace(/[^a-zA-Z0-9_\-\.\/]/g, '_');
    const hash = crypto.createHash ? crypto.createHash('sha256').update(buffer).digest('hex') : 'hash';

    if (typeof window !== 'undefined' || !fs || !fs.promises) {
      browserStorageMap.set(safeKey, buffer);
      return {
        key: safeKey,
        filename,
        mimeType,
        sizeBytes: buffer.length,
        uploadedAt: new Date().toISOString(),
        sha256: hash,
      };
    }

    const targetPath = path.join(this.storageDir, safeKey);
    const parentDir = path.dirname(targetPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    await fs.promises.writeFile(targetPath, buffer);

    return {
      key: safeKey,
      filename,
      mimeType,
      sizeBytes: buffer.length,
      uploadedAt: new Date().toISOString(),
      sha256: hash,
    };
  }

  /**
   * Retrieves an asset from private object storage.
   */
  public async getAsset(key: string): Promise<Buffer | null> {
    const safeKey = key.replace(/[^a-zA-Z0-9_\-\.\/]/g, '_');
    if (typeof window !== 'undefined' || !fs || !fs.promises) {
      return browserStorageMap.get(safeKey) || null;
    }

    const targetPath = path.join(this.storageDir, safeKey);
    if (!fs.existsSync(targetPath)) {
      return null;
    }
    return fs.promises.readFile(targetPath);
  }

  /**
   * Deletes an asset from private object storage.
   */
  public async deleteAsset(key: string): Promise<boolean> {
    const safeKey = key.replace(/[^a-zA-Z0-9_\-\.\/]/g, '_');
    if (typeof window !== 'undefined' || !fs || !fs.promises) {
      return browserStorageMap.delete(safeKey);
    }

    const targetPath = path.join(this.storageDir, safeKey);
    if (!fs.existsSync(targetPath)) {
      return false;
    }
    await fs.promises.unlink(targetPath);
    return true;
  }

  /**
   * Generates a time-limited signed URL with HMAC-SHA256 signature.
   */
  public generateSignedUrl(key: string, expiresInSeconds: number = 3600): string {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${key}:${expires}`;
    const hmac = crypto.createHmac('sha256', MASTER_SIGNING_SECRET);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    return `/api/assets/download?key=${encodeURIComponent(key)}&expires=${expires}&signature=${signature}`;
  }

  /**
   * Verifies the authenticity and expiration of a signed download request.
   */
  public verifySignedUrl(key: string, signature: string, expiresStr: string): boolean {
    if (!key || !signature || !expiresStr) return false;

    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires)) return false;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now > expires) {
      return false; // Expired
    }

    // Verify cryptographic signature with constant-time equality
    const payload = `${key}:${expires}`;
    const hmac = crypto.createHmac('sha256', MASTER_SIGNING_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(signature, 'utf-8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }
}

export const assetStorage = new AssetStorageService();
