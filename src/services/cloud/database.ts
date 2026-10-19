import fs from 'fs';
import path from 'path';

export interface DatabaseRecord {
  id: string;
  [key: string]: any;
}

export interface CollectionData<T extends DatabaseRecord = DatabaseRecord> {
  [id: string]: T;
}

export interface DatabaseData {
  users: CollectionData;
  sessions: CollectionData;
  projects: CollectionData;
  project_members: CollectionData;
  project_invitations: CollectionData;
  comments: CollectionData;
  versions: CollectionData;
  export_jobs: CollectionData;
  print_orders: CollectionData;
  org_fonts: CollectionData;
  org_templates: CollectionData;
  audit_logs: CollectionData;
  password_resets: CollectionData;
  preflight_jobs: CollectionData;
  preflight_profiles: CollectionData;
}

const DEFAULT_DB_DATA: DatabaseData = {
  users: {},
  sessions: {},
  projects: {},
  project_members: {},
  project_invitations: {},
  comments: {},
  versions: {},
  export_jobs: {},
  print_orders: {},
  org_fonts: {},
  org_templates: {},
  audit_logs: {},
  password_resets: {},
  preflight_jobs: {},
  preflight_profiles: {},
};

export class EmbeddedDatabase {
  private dataDir: string;
  private dbPath: string;
  private data: DatabaseData;
  private isLoaded: boolean = false;
  private isWriting: boolean = false;

  constructor(customDataDir?: string) {
    if (typeof window === 'undefined' && path && path.join) {
      this.dataDir = customDataDir || path.join(process.cwd(), 'data');
      this.dbPath = path.join(this.dataDir, 'easybook_production.json');
    } else {
      this.dataDir = '';
      this.dbPath = '';
    }
    this.data = JSON.parse(JSON.stringify(DEFAULT_DB_DATA));
  }

  private ensureLoaded(): void {
    if (this.isLoaded) return;
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('ats_easybook_cloud_db');
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          this.data = { ...DEFAULT_DB_DATA, ...parsed };
        } else {
          this.data = JSON.parse(JSON.stringify(DEFAULT_DB_DATA));
        }
      } catch (err) {
        console.warn('[DB] Failed reading from localStorage:', err);
        this.data = JSON.parse(JSON.stringify(DEFAULT_DB_DATA));
      }
      this.isLoaded = true;
      return;
    }

    try {
      if (fs && fs.existsSync) {
        if (!fs.existsSync(this.dataDir)) {
          fs.mkdirSync(this.dataDir, { recursive: true });
        }

        if (fs.existsSync(this.dbPath)) {
          const raw = fs.readFileSync(this.dbPath, 'utf-8');
          if (raw.trim()) {
            const parsed = JSON.parse(raw);
            this.data = { ...DEFAULT_DB_DATA, ...parsed };
          } else {
            this.data = JSON.parse(JSON.stringify(DEFAULT_DB_DATA));
          }
        } else {
          this.data = JSON.parse(JSON.stringify(DEFAULT_DB_DATA));
          this.persistSync();
        }
      }
    } catch (err) {
      console.error('[DB] Failed to load database file, initializing empty store:', err);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DB_DATA));
    }
    this.isLoaded = true;
  }

  private persistSync(): void {
    if (this.isWriting) return;
    this.isWriting = true;
    try {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('ats_easybook_cloud_db', JSON.stringify(this.data));
        } catch (err) {
          console.warn('[DB] Failed writing to localStorage:', err);
        }
        return;
      }

      if (fs && fs.writeFileSync) {
        if (!fs.existsSync(this.dataDir)) {
          fs.mkdirSync(this.dataDir, { recursive: true });
        }
        const tmpPath = `${this.dbPath}.tmp-${Date.now()}`;
        fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
        fs.renameSync(tmpPath, this.dbPath);
      }
    } catch (err) {
      console.error('[DB] Error persisting database atomically:', err);
    } finally {
      this.isWriting = false;
    }
  }

  public getCollection<T extends DatabaseRecord>(collectionName: keyof DatabaseData): CollectionData<T> {
    this.ensureLoaded();
    if (!this.data[collectionName]) {
      this.data[collectionName] = {};
    }
    return this.data[collectionName] as CollectionData<T>;
  }

  public findById<T extends DatabaseRecord>(collectionName: keyof DatabaseData, id: string): T | null {
    const col = this.getCollection<T>(collectionName);
    return col[id] ? JSON.parse(JSON.stringify(col[id])) : null;
  }

  public find<T extends DatabaseRecord>(
    collectionName: keyof DatabaseData,
    predicate: (item: T) => boolean
  ): T[] {
    const col = this.getCollection<T>(collectionName);
    return Object.values(col)
      .filter(predicate)
      .map((item) => JSON.parse(JSON.stringify(item)));
  }

  public findOne<T extends DatabaseRecord>(
    collectionName: keyof DatabaseData,
    predicate: (item: T) => boolean
  ): T | null {
    const col = this.getCollection<T>(collectionName);
    const item = Object.values(col).find(predicate);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public insert<T extends DatabaseRecord>(collectionName: keyof DatabaseData, record: T): T {
    this.ensureLoaded();
    const col = this.getCollection<T>(collectionName);
    col[record.id] = JSON.parse(JSON.stringify(record));
    this.persistSync();
    return JSON.parse(JSON.stringify(col[record.id]));
  }

  public update<T extends DatabaseRecord>(
    collectionName: keyof DatabaseData,
    id: string,
    updates: Partial<T>
  ): T | null {
    this.ensureLoaded();
    const col = this.getCollection<T>(collectionName);
    if (!col[id]) return null;
    col[id] = { ...col[id], ...updates, id };
    this.persistSync();
    return JSON.parse(JSON.stringify(col[id]));
  }

  public delete(collectionName: keyof DatabaseData, id: string): boolean {
    this.ensureLoaded();
    const col = this.getCollection(collectionName);
    if (!col[id]) return false;
    delete col[id];
    this.persistSync();
    return true;
  }

  public clearAll(): void {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DB_DATA));
    this.persistSync();
  }
}

// Singleton database instance
export const db = new EmbeddedDatabase();
