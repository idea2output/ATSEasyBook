import { BookProject } from '@/types/book';
import { parseManuscript } from '../formatting/manuscriptParser';

export interface IBookRepository {
  getAllBooks(): Promise<BookProject[]>;
  getBookById(id: string): Promise<BookProject | null>;
  saveBook(book: BookProject): Promise<BookProject>;
  deleteBook(id: string): Promise<void>;
  createBook(title?: string): Promise<BookProject>;
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
      return JSON.parse(data) as BookProject[];
    } catch (err) {
      console.error('Failed to parse books from localStorage', err);
      return [];
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

  async saveBook(book: BookProject): Promise<BookProject> {
    const books = this.getStoredBooks();
    const updatedBook: BookProject = {
      ...book,
      updatedAt: new Date().toISOString(),
      formattedBlocks: parseManuscript(book.rawManuscript),
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

  async deleteBook(id: string): Promise<void> {
    const books = this.getStoredBooks();
    const filtered = books.filter((b) => b.id !== id);
    this.saveStoredBooks(filtered);
  }

  async createBook(title: string = 'Untitled Manuscript', withSample: boolean = false): Promise<BookProject> {
    const now = new Date().toISOString();
    const id = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const manuscript = withSample ? SAMPLE_MANUSCRIPT : '';

    const newBook: BookProject = {
      id,
      title: title || 'Untitled Manuscript',
      rawManuscript: manuscript,
      templateId: 'classic-novel-6x9',
      formattedBlocks: parseManuscript(manuscript),
      createdAt: now,
      updatedAt: now,
    };

    const books = this.getStoredBooks();
    books.unshift(newBook);
    this.saveStoredBooks(books);

    return newBook;
  }
}

export const bookRepository = new LocalStorageBookRepository();
