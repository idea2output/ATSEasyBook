import { BookProject, EditorMode } from '@/types/book';
import { parseManuscript } from '../formatting/manuscriptParser';
import { cloudProjectService, ProjectAccessContext } from '../cloud/cloudProjectService';
import { UserProfile } from '@/types/auth';

export interface IBookRepository {
  getAllBooks(): Promise<BookProject[]>;
  getBookById(id: string): Promise<BookProject | null>;
  saveBook(book: BookProject): Promise<BookProject>;
  saveBookSync(book: BookProject): BookProject;
  deleteBook(id: string): Promise<void>;
  createBook(
    title?: string,
    author?: string,
    templateId?: string,
    editorMode?: EditorMode
  ): Promise<BookProject>;
  getOrCreateSampleBook(): Promise<BookProject>;
}

const STORAGE_KEY = 'ats_easybook_projects_v1';
const AUTH_STORAGE_KEY = 'ats_auth_session_v1';

export const SAMPLE_MANUSCRIPT = `Chapter 1: The First Departure

The morning light broke through the fog of Eldridge Harbor like spilled gold over cold stone. Captain Charles Vance adjusted his coat against the damp salt air, eyes fixed upon the distant horizon where the sky met the open sea. For thirty years, this harbor had been his sanctuary, but today it was merely the threshold to the uncharted.

Behind him, the harbor men worked in synchronized cadence. Crates of cedar and smoked provisions were hoisted into the belly of the vessel. The ropes creaked beneath the strain, a familiar rhythm that was both warning and lullaby. Vance held in his pocket an unopened envelope bearing the royal wax seal—orders that would take him farther north than any naval chart had ever dared to map.

CHAPTER 2: INTO THE MIST

By nightfall, the lanterns of the shoreline had diminished into faint embers before vanishing entirely into the dark abyss. The ocean was black glass, reflecting neither stars nor moon through the thick marine ceiling.

"Keep the helm steady, Mr. Alden," Vance murmured, his voice cutting cleanly through the groaning of the timber. "Out here, even the compass remembers what it was taught to forget."

Alden nodded, his knuckles white upon the wheel. In the quiet between the crashing swells, every man aboard could feel it: the subtle shift in current that signaled they had crossed the boundary line. There was no turning back now.`;

export class LocalStorageBookRepository implements IBookRepository {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  public getStoredBooks(): BookProject[] {
    if (!this.isBrowser()) return [];
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const rawBooks = JSON.parse(data) as any[];
      // Safe backward compatibility migration: default missing Phase 2, 3, 4, 5 & 6 fields
      return rawBooks.map((b) => ({
        ...b,
        author: b.author || '',
        editorMode: (b.editorMode as EditorMode) || 'beginner',
        design: b.design || {},
        customFonts: Array.isArray(b.customFonts) ? b.customFonts : [],
        images: Array.isArray(b.images) ? b.images : [],
        placements: Array.isArray(b.placements) ? b.placements : [],
        typography: b.typography || {},
        exportOptions: b.exportOptions || { includeBleed: false, includeCropMarks: false, acknowledgedWarnings: false },
        storageBackend: 'local' as const,
        formattedBlocks: Array.isArray(b.formattedBlocks) && b.formattedBlocks.length > 0
          ? b.formattedBlocks
          : parseManuscript(b.rawManuscript || ''),
      })) as BookProject[];
    } catch (err) {
      console.error('Failed to parse books from localStorage', err);
      return [];
    }
  }

  getStorageUsage(): { usedBytes: number; quotaBytes: number; usedPercent: number; isNearQuota: boolean } {
    if (!this.isBrowser()) return { usedBytes: 0, quotaBytes: 5242880, usedPercent: 0, isNearQuota: false };
    try {
      const data = window.localStorage.getItem(STORAGE_KEY) || '';
      const usedBytes = new Blob([data]).size;
      const quotaBytes = 5 * 1024 * 1024; // typical 5MB default browser localStorage quota
      const usedPercent = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
      return {
        usedBytes,
        quotaBytes,
        usedPercent,
        isNearQuota: usedPercent > 70,
      };
    } catch {
      return { usedBytes: 0, quotaBytes: 5242880, usedPercent: 0, isNearQuota: false };
    }
  }

  public saveStoredBooks(books: BookProject[]): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (err) {
      console.error('Failed to write books to localStorage', err);
    }
  }

  async getAllBooks(): Promise<BookProject[]> {
    const books = this.getStoredBooks();
    return books.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getBookById(id: string): Promise<BookProject | null> {
    const books = this.getStoredBooks();
    const found = books.find((b) => b.id === id);
    return found || null;
  }

  saveBookSync(book: BookProject): BookProject {
    const books = this.getStoredBooks();
    const updatedBook: BookProject = {
      ...book,
      author: book.author || '',
      editorMode: (book.editorMode as EditorMode) || 'beginner',
      design: book.design || {},
      customFonts: Array.isArray(book.customFonts) ? book.customFonts : [],
      images: Array.isArray(book.images) ? book.images : [],
      placements: Array.isArray(book.placements) ? book.placements : [],
      typography: book.typography || {},
      exportOptions: book.exportOptions || { includeBleed: false, includeCropMarks: false, acknowledgedWarnings: false },
      updatedAt: new Date().toISOString(),
      storageBackend: 'local',
      formattedBlocks: parseManuscript(book.rawManuscript || ''),
    };

    const index = books.findIndex((b) => b.id === book.id);
    if (index >= 0) {
      books[index] = updatedBook;
    } else {
      books.unshift(updatedBook);
    }

    this.saveStoredBooks(books);
    return updatedBook;
  }

  async saveBook(book: BookProject): Promise<BookProject> {
    return this.saveBookSync(book);
  }

  async deleteBook(id: string): Promise<void> {
    const books = this.getStoredBooks();
    const filtered = books.filter((b) => b.id !== id);
    this.saveStoredBooks(filtered);
  }

  async createBook(
    title?: string,
    author?: string,
    templateId?: string,
    editorMode?: EditorMode
  ): Promise<BookProject> {
    const now = new Date().toISOString();
    const id = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newBook: BookProject = {
      id,
      title: title || 'Untitled Manuscript',
      author: author || 'Anonymous',
      rawManuscript: '',
      templateId: templateId || 'classic-novel-6x9',
      editorMode: editorMode || 'beginner',
      design: {},
      customFonts: [],
      formattedBlocks: [],
      images: [],
      placements: [],
      typography: {},
      exportOptions: { includeBleed: false, includeCropMarks: false, acknowledgedWarnings: false },
      storageBackend: 'local',
      createdAt: now,
      updatedAt: now,
    };

    const books = this.getStoredBooks();
    books.unshift(newBook);
    this.saveStoredBooks(books);

    return newBook;
  }

  async getOrCreateSampleBook(): Promise<BookProject> {
    const books = this.getStoredBooks();
    const existing = books.find(
      (b) => b.isSample || b.title === 'The Eldridge Voyage (Sample Novel)'
    );
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const sampleBook: BookProject = {
      id: `sample-eldridge-voyage`,
      title: 'The Eldridge Voyage (Sample Novel)',
      author: 'Amjad Vance',
      rawManuscript: SAMPLE_MANUSCRIPT,
      templateId: 'classic-novel-6x9',
      editorMode: 'beginner',
      design: {},
      customFonts: [],
      formattedBlocks: parseManuscript(SAMPLE_MANUSCRIPT),
      images: [],
      placements: [],
      typography: {},
      exportOptions: { includeBleed: false, includeCropMarks: false, acknowledgedWarnings: false },
      isSample: true,
      storageBackend: 'local',
      createdAt: now,
      updatedAt: now,
    };

    books.unshift(sampleBook);
    this.saveStoredBooks(books);
    return sampleBook;
  }
}

export class CloudBookRepository implements IBookRepository {
  private userContext: ProjectAccessContext;

  constructor(userContext: ProjectAccessContext) {
    this.userContext = userContext;
  }

  public setUserContext(userContext: ProjectAccessContext): void {
    this.userContext = userContext;
  }

  async getAllBooks(): Promise<BookProject[]> {
    return cloudProjectService.listProjectsForUser(this.userContext);
  }

  async getBookById(id: string): Promise<BookProject | null> {
    return cloudProjectService.getProjectById(id, this.userContext);
  }

  async saveBook(book: BookProject): Promise<BookProject> {
    const existing = await cloudProjectService.getProjectById(book.id, this.userContext);
    if (existing) {
      const existingRev = existing.revision ?? 1;
      const expectedRev = (book.revision && book.revision >= existingRev) ? book.revision : existing.revision;
      const saved = await cloudProjectService.updateProject(book.id, book, this.userContext, expectedRev);
      book.revision = saved.revision;
      return saved;
    }
    const created = await cloudProjectService.createProject(book, this.userContext);
    book.revision = created.revision;
    return created;
  }

  saveBookSync(book: BookProject): BookProject {
    // For sync calls, fire async and update revision on resolution
    this.saveBook(book).then((saved) => {
      book.revision = saved.revision;
    }).catch((err) => console.error('Cloud save failed:', err));
    return { ...book, storageBackend: 'cloud', updatedAt: new Date().toISOString() };
  }

  async deleteBook(id: string): Promise<void> {
    await cloudProjectService.deleteProject(id, this.userContext);
  }

  async createBook(
    title?: string,
    author?: string,
    templateId?: string,
    editorMode?: EditorMode
  ): Promise<BookProject> {
    const now = new Date().toISOString();
    const id = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newBook: BookProject = {
      id,
      title: title || 'Untitled Manuscript',
      author: author || 'Anonymous',
      rawManuscript: '',
      templateId: templateId || 'classic-novel-6x9',
      editorMode: editorMode || 'beginner',
      design: {},
      customFonts: [],
      formattedBlocks: [],
      images: [],
      placements: [],
      typography: {},
      exportOptions: { includeBleed: false, includeCropMarks: false, acknowledgedWarnings: false },
      createdAt: now,
      updatedAt: now,
    };

    return cloudProjectService.createProject(newBook, this.userContext);
  }

  async getOrCreateSampleBook(): Promise<BookProject> {
    const list = await cloudProjectService.listProjectsForUser(this.userContext);
    const existing = list.find((b) => b.isSample || b.title === 'The Eldridge Voyage (Sample Novel)');
    if (existing) return existing;

    const now = new Date().toISOString();
    const sampleBook: BookProject = {
      id: `sample-eldridge-voyage`,
      title: 'The Eldridge Voyage (Sample Novel)',
      author: 'Amjad Vance',
      rawManuscript: SAMPLE_MANUSCRIPT,
      templateId: 'classic-novel-6x9',
      editorMode: 'beginner',
      design: {},
      customFonts: [],
      formattedBlocks: parseManuscript(SAMPLE_MANUSCRIPT),
      images: [],
      placements: [],
      typography: {},
      exportOptions: { includeBleed: false, includeCropMarks: false, acknowledgedWarnings: false },
      isSample: true,
      createdAt: now,
      updatedAt: now,
    };

    return cloudProjectService.createProject(sampleBook, this.userContext);
  }
}

/**
 * Unified Repository Manager that seamlessly switches between Cloud and Local repositories.
 */
export class UnifiedBookRepositoryManager implements IBookRepository {
  private localRepo: LocalStorageBookRepository;
  private currentUser: ProjectAccessContext | null = null;
  private cloudRepo: CloudBookRepository | null = null;

  constructor() {
    this.localRepo = new LocalStorageBookRepository();
    this.initUserFromStorage();
  }

  private initUserFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          if (session?.user) {
            this.setAuthenticatedUser(session.user);
          }
        }
      } catch (err) {
        console.warn('Failed to load session from storage', err);
      }
    }
  }

  public setAuthenticatedUser(user: UserProfile | null): void {
    if (user) {
      this.currentUser = {
        userId: user.id,
        userEmail: user.email,
        displayName: user.displayName,
        globalRole: user.role,
      };
      if (this.cloudRepo) {
        this.cloudRepo.setUserContext(this.currentUser);
      } else {
        this.cloudRepo = new CloudBookRepository(this.currentUser);
      }
    } else {
      this.currentUser = null;
      this.cloudRepo = null;
    }
  }

  public getActiveUser(): ProjectAccessContext | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public getLocalRepository(): LocalStorageBookRepository {
    return this.localRepo;
  }

  public getCloudRepository(): CloudBookRepository | null {
    return this.cloudRepo;
  }

  private getActiveRepo(): IBookRepository {
    if (this.cloudRepo && this.currentUser) {
      return this.cloudRepo;
    }
    return this.localRepo;
  }

  async getAllBooks(): Promise<BookProject[]> {
    return this.getActiveRepo().getAllBooks();
  }

  async getBookById(id: string): Promise<BookProject | null> {
    // If not found in active repo, check local repo as fallback
    const book = await this.getActiveRepo().getBookById(id);
    if (book) return book;
    if (this.cloudRepo) {
      return this.localRepo.getBookById(id);
    }
    return null;
  }

  async saveBook(book: BookProject): Promise<BookProject> {
    return this.getActiveRepo().saveBook(book);
  }

  saveBookSync(book: BookProject): BookProject {
    return this.getActiveRepo().saveBookSync(book);
  }

  async deleteBook(id: string): Promise<void> {
    await this.getActiveRepo().deleteBook(id);
  }

  async createBook(
    title?: string,
    author?: string,
    templateId?: string,
    editorMode?: EditorMode
  ): Promise<BookProject> {
    return this.getActiveRepo().createBook(title, author, templateId, editorMode);
  }

  async getOrCreateSampleBook(): Promise<BookProject> {
    return this.getActiveRepo().getOrCreateSampleBook();
  }
}

export const bookRepository = new UnifiedBookRepositoryManager();
