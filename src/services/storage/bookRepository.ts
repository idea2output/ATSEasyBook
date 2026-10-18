import { BookProject } from '@/types/book';
import { parseManuscript } from '../formatting/manuscriptParser';

export interface IBookRepository {
  getAllBooks(): Promise<BookProject[]>;
  getBookById(id: string): Promise<BookProject | null>;
  saveBook(book: BookProject): Promise<BookProject>;
  saveBookSync(book: BookProject): BookProject;
  deleteBook(id: string): Promise<void>;
  createBook(title?: string): Promise<BookProject>;
  getOrCreateSampleBook(): Promise<BookProject>;
}

const STORAGE_KEY = 'ats_easybook_projects_v1';

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

  private getStoredBooks(): BookProject[] {
    if (!this.isBrowser()) return [];
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const rawBooks = JSON.parse(data) as any[];
      // Safe backward compatibility migration: default missing Phase 2 & Phase 3 fields
      return rawBooks.map((b) => ({
        ...b,
        author: b.author || '',
        images: Array.isArray(b.images) ? b.images : [],
        placements: Array.isArray(b.placements) ? b.placements : [],
        typography: b.typography || {},
        exportOptions: b.exportOptions || { includeBleed: false, includeCropMarks: false, acknowledgedWarnings: false },
        formattedBlocks: Array.isArray(b.formattedBlocks)
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

  private saveStoredBooks(books: BookProject[]): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (err) {
      console.error('Failed to write books to localStorage', err);
    }
  }

  async getAllBooks(): Promise<BookProject[]> {
    const books = this.getStoredBooks();
    // Sort by updatedAt descending
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
      images: Array.isArray(book.images) ? book.images : [],
      placements: Array.isArray(book.placements) ? book.placements : [],
      typography: book.typography || {},
      exportOptions: book.exportOptions || { includeBleed: false, includeCropMarks: false, acknowledgedWarnings: false },
      updatedAt: new Date().toISOString(),
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

  async createBook(title: string = 'Untitled Manuscript', author: string = 'Anonymous'): Promise<BookProject> {
    const now = new Date().toISOString();
    const id = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newBook: BookProject = {
      id,
      title: title || 'Untitled Manuscript',
      author: author || 'Anonymous',
      rawManuscript: '',
      templateId: 'classic-novel-6x9',
      formattedBlocks: [],
      images: [],
      placements: [],
      typography: {},
      exportOptions: { includeBleed: false, includeCropMarks: false, acknowledgedWarnings: false },
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
      formattedBlocks: parseManuscript(SAMPLE_MANUSCRIPT),
      images: [],
      placements: [],
      typography: {},
      exportOptions: { includeBleed: false, includeCropMarks: false, acknowledgedWarnings: false },
      isSample: true,
      createdAt: now,
      updatedAt: now,
    };

    books.unshift(sampleBook);
    this.saveStoredBooks(books);
    return sampleBook;
  }
}

export const bookRepository = new LocalStorageBookRepository();
