import { BookTemplate } from '@/types/book';
import { AVAILABLE_TEMPLATES, CLASSIC_NOVEL_6X9 } from './templateRegistry';
import { bookRepository } from '../storage/bookRepository';

const CUSTOM_TEMPLATES_STORAGE_KEY = 'ats_easybook_custom_templates_v1';

export class TemplateRepository {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private getStoredCustomTemplates(): BookTemplate[] {
    if (!this.isBrowser()) return [];
    try {
      const data = window.localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Failed to parse custom templates from localStorage', err);
      return [];
    }
  }

  private saveStoredCustomTemplates(templates: BookTemplate[]): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch (err) {
      console.error('Failed to write custom templates to localStorage', err);
    }
  }

  /**
   * Returns all available templates: built-in immutable templates plus user-saved custom templates.
   */
  getAllTemplatesSync(): BookTemplate[] {
    const custom = this.getStoredCustomTemplates();
    return [...AVAILABLE_TEMPLATES, ...custom];
  }

  async getAllTemplates(): Promise<BookTemplate[]> {
    return this.getAllTemplatesSync();
  }

  /**
   * Retrieves a template by ID (custom first, then built-in, falling back to Classic Novel 6x9).
   */
  getTemplateById(id: string): BookTemplate {
    const all = this.getAllTemplatesSync();
    const found = all.find((t) => t.id === id);
    return found || CLASSIC_NOVEL_6X9;
  }

  /**
   * Saves or updates a custom template. Built-in templates cannot be modified directly.
   */
  async saveCustomTemplate(template: BookTemplate): Promise<BookTemplate> {
    const isBuiltIn = AVAILABLE_TEMPLATES.some((t) => t.id === template.id);
    if (isBuiltIn) {
      throw new Error('Built-in system templates are immutable and cannot be overwritten. Duplicate it to customize.');
    }

    const custom = this.getStoredCustomTemplates();
    const prepared: BookTemplate = {
      ...template,
      isCustom: true,
    };

    const index = custom.findIndex((t) => t.id === template.id);
    if (index >= 0) {
      custom[index] = prepared;
    } else {
      custom.push(prepared);
    }

    this.saveStoredCustomTemplates(custom);
    return prepared;
  }

  /**
   * Duplicates any template (built-in or custom) to create a new editable custom template.
   */
  async duplicateTemplate(sourceTemplateId: string, newName?: string): Promise<BookTemplate> {
    const source = this.getTemplateById(sourceTemplateId);
    const newId = `custom-tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cloned: BookTemplate = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: newName || `${source.name} (Copy)`,
      description: `Customized layout based on ${source.name}.`,
      isCustom: true,
    };

    const custom = this.getStoredCustomTemplates();
    custom.push(cloned);
    this.saveStoredCustomTemplates(custom);
    return cloned;
  }

  /**
   * Checks if any existing book projects use the given template ID.
   */
  async getProjectsUsingTemplate(templateId: string): Promise<string[]> {
    const books = await bookRepository.getAllBooks();
    return books.filter((b) => b.templateId === templateId).map((b) => b.id);
  }

  /**
   * Deletes a custom template. If the template is still in use, a fallback template must be specified.
   */
  async deleteCustomTemplate(
    templateId: string,
    fallbackTemplateId: string = 'classic-novel-6x9'
  ): Promise<{ affectedBookCount: number }> {
    const isBuiltIn = AVAILABLE_TEMPLATES.some((t) => t.id === templateId);
    if (isBuiltIn) {
      throw new Error('Built-in system templates cannot be deleted.');
    }

    const inUseBookIds = await this.getProjectsUsingTemplate(templateId);
    if (inUseBookIds.length > 0) {
      if (!fallbackTemplateId || fallbackTemplateId === templateId) {
        throw new Error(
          `Template is in use by ${inUseBookIds.length} book project(s). A valid fallback template is required.`
        );
      }
      // Migrate affected books to fallback template
      const books = await bookRepository.getAllBooks();
      for (const book of books) {
        if (book.templateId === templateId) {
          book.templateId = fallbackTemplateId;
          await bookRepository.saveBook(book);
        }
      }
    }

    const custom = this.getStoredCustomTemplates();
    const filtered = custom.filter((t) => t.id !== templateId);
    this.saveStoredCustomTemplates(filtered);

    return { affectedBookCount: inUseBookIds.length };
  }
}

export const templateRepository = new TemplateRepository();
