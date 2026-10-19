import { BookTemplate, TemplateGovernance } from '@/types/book';
import { UserProfile, hasPermission } from '@/types/auth';
import { AVAILABLE_TEMPLATES, CLASSIC_NOVEL_6X9, CUSTOM_PAGE_DEFAULT } from './templateRegistry';
import { bookRepository } from '../storage/bookRepository';

const CUSTOM_TEMPLATES_STORAGE_KEY = 'ats_easybook_custom_templates_v1';

export interface ReflowImpactCheck {
  hasMaterialImpact: boolean;
  differences: string[];
}

export class TemplateRepository {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  /**
   * Sanitizes and migrates any stored template object to ensure full schema integrity.
   */
  migrateTemplate(raw: any): BookTemplate {
    if (!raw || typeof raw !== 'object') {
      return { ...CLASSIC_NOVEL_6X9 };
    }

    const base = CLASSIC_NOVEL_6X9;
    const migrated: BookTemplate = {
      id: String(raw.id || `custom-tmpl-${Date.now()}`),
      name: String(raw.name || 'Untitled Custom Template'),
      category: raw.category || 'fiction',
      description: String(raw.description || ''),
      suitability: raw.suitability || ['Custom'],
      isCustom: true,
      isArchived: Boolean(raw.isArchived || raw.governance?.status === 'archived'),
      pageWidthInches: Number(raw.pageWidthInches) || base.pageWidthInches,
      pageHeightInches: Number(raw.pageHeightInches) || base.pageHeightInches,
      bleedInches: Number(raw.bleedInches ?? base.bleedInches),
      safeAreaInches: Number(raw.safeAreaInches ?? base.safeAreaInches),
      margins: {
        top: raw.margins?.top || `${raw.margins?.topInches ?? base.margins.topInches}in`,
        bottom: raw.margins?.bottom || `${raw.margins?.bottomInches ?? base.margins.bottomInches}in`,
        inside: raw.margins?.inside || `${raw.margins?.insideInches ?? base.margins.insideInches}in`,
        outside: raw.margins?.outside || `${raw.margins?.outsideInches ?? base.margins.outsideInches}in`,
        gutter: raw.margins?.gutter || `${raw.margins?.gutterInches ?? base.margins.gutterInches}in`,
        topInches: Number(raw.margins?.topInches ?? base.margins.topInches),
        bottomInches: Number(raw.margins?.bottomInches ?? base.margins.bottomInches),
        insideInches: Number(raw.margins?.insideInches ?? base.margins.insideInches),
        outsideInches: Number(raw.margins?.outsideInches ?? base.margins.outsideInches),
        gutterInches: Number(raw.margins?.gutterInches ?? base.margins.gutterInches),
      },
      columns: {
        count: raw.columns?.count === 2 ? 2 : 1,
        gap: raw.columns?.gap || `${raw.columns?.gapInches ?? base.columns.gapInches}in`,
        gapInches: Number(raw.columns?.gapInches ?? base.columns.gapInches),
      },
      typography: {
        fontFamily: raw.typography?.fontFamily || base.typography.fontFamily,
        bodyFontSizePt: Number(raw.typography?.bodyFontSizePt ?? base.typography.bodyFontSizePt),
        bodyLineHeight: Number(raw.typography?.bodyLineHeight ?? base.typography.bodyLineHeight),
        chapterHeadingFontSizePt: Number(raw.typography?.chapterHeadingFontSizePt ?? base.typography.chapterHeadingFontSizePt),
        chapterHeadingLineHeight: Number(raw.typography?.chapterHeadingLineHeight ?? base.typography.chapterHeadingLineHeight),
        paragraphIndentInches: Number(raw.typography?.paragraphIndentInches ?? base.typography.paragraphIndentInches),
        paragraphSpacingPt: Number(raw.typography?.paragraphSpacingPt ?? base.typography.paragraphSpacingPt),
        textAlign: raw.typography?.textAlign || base.typography.textAlign,
        headingStyle: {
          fontFamily: raw.typography?.headingStyle?.fontFamily || base.typography.headingStyle.fontFamily,
          fontSizePt: Number(raw.typography?.headingStyle?.fontSizePt ?? base.typography.headingStyle.fontSizePt),
          alignment: raw.typography?.headingStyle?.alignment || base.typography.headingStyle.alignment,
          textTransform: raw.typography?.headingStyle?.textTransform || base.typography.headingStyle.textTransform,
          spaceBeforePt: Number(raw.typography?.headingStyle?.spaceBeforePt ?? base.typography.headingStyle.spaceBeforePt),
          spaceAfterPt: Number(raw.typography?.headingStyle?.spaceAfterPt ?? base.typography.headingStyle.spaceAfterPt),
        },
      },
      headersFooters: {
        showRunningHeaders: raw.headersFooters?.showRunningHeaders ?? base.headersFooters.showRunningHeaders,
        showPageNumbers: raw.headersFooters?.showPageNumbers ?? base.headersFooters.showPageNumbers,
        pageNumberPosition: raw.headersFooters?.pageNumberPosition || base.headersFooters.pageNumberPosition,
        runningHeaderFormat: raw.headersFooters?.runningHeaderFormat || base.headersFooters.runningHeaderFormat,
      },
      imageConstraints: {
        maxInlineWidthPercent: Number(raw.imageConstraints?.maxInlineWidthPercent ?? base.imageConstraints.maxInlineWidthPercent),
        maxFloatWidthPercent: Number(raw.imageConstraints?.maxFloatWidthPercent ?? base.imageConstraints.maxFloatWidthPercent),
        minDpi: Number(raw.imageConstraints?.minDpi ?? base.imageConstraints.minDpi),
      },
      linesPerPage: Number(raw.linesPerPage ?? base.linesPerPage),
      charsPerLine: Number(raw.charsPerLine ?? base.charsPerLine),
      design: raw.design || {},
      layers: Array.isArray(raw.layers) ? raw.layers : [],
      contentZones: Array.isArray(raw.contentZones) ? raw.contentZones : [],
      governance: raw.governance || {
        status: raw.isArchived ? 'archived' : 'draft',
        visibility: 'private',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      unit: raw.unit || 'in',
    };

    return migrated;
  }

  private getStoredCustomTemplates(): BookTemplate[] {
    if (!this.isBrowser()) return [];
    try {
      const data = window.localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => this.migrateTemplate(item));
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
  getAllTemplatesSync(includeArchived: boolean = false): BookTemplate[] {
    const custom = this.getStoredCustomTemplates();
    const activeCustom = includeArchived ? custom : custom.filter((t) => !t.isArchived);
    return [...AVAILABLE_TEMPLATES, ...activeCustom];
  }

  async getAllTemplates(includeArchived: boolean = false): Promise<BookTemplate[]> {
    return this.getAllTemplatesSync(includeArchived);
  }

  /**
   * Filters templates based on the user's role and organization memberships.
   */
  getTemplatesForUser(userProfile?: UserProfile | null, includeArchived: boolean = false): BookTemplate[] {
    const all = this.getAllTemplatesSync(includeArchived);
    if (!userProfile) {
      // Unauthenticated: built-in templates and locally saved private templates
      return all.filter((t) => !t.governance || t.governance.visibility === 'private' || !t.isCustom);
    }

    const isAdmin = userProfile.role === 'administrator' || userProfile.role === 'owner';

    return all.filter((tmpl) => {
      // 1. Built-in templates are always visible
      if (!tmpl.isCustom) return true;

      const gov = tmpl.governance;
      if (!gov) return true;

      // 2. Creator or Owner can always see their own
      if (gov.ownerId === userProfile.id) return true;

      // 3. Organization-level visibility
      if (gov.visibility === 'organization') {
        return !gov.organizationId || gov.organizationId === userProfile.organizationName;
      }

      // 4. Admin-only templates
      if (gov.visibility === 'admin-only') {
        return isAdmin;
      }

      // 5. Private templates belong only to their owner
      if (gov.visibility === 'private') {
        return gov.ownerId === userProfile.id;
      }

      return false;
    });
  }

  /**
   * Checks whether a user has permission to modify or delete a given template.
   */
  canEditTemplate(template: BookTemplate, userProfile?: UserProfile | null): boolean {
    // Built-in templates are completely immutable
    if (!template.isCustom || AVAILABLE_TEMPLATES.some((t) => t.id === template.id)) {
      return false;
    }

    // Unauthenticated user can only edit local private templates with no cloud ownerId
    if (!userProfile) {
      return !template.governance?.ownerId;
    }

    const isAdmin = userProfile.role === 'administrator' || userProfile.role === 'owner';
    const gov = template.governance;

    // Organization administrators can manage all organization templates
    if (isAdmin && (gov?.visibility === 'organization' || gov?.visibility === 'admin-only')) {
      return true;
    }

    // Owner can edit their own templates
    if (gov?.ownerId === userProfile.id) {
      return true;
    }

    // If template has no owner assigned (local-first legacy), allow current user
    if (!gov?.ownerId) {
      return true;
    }

    return false;
  }

  /**
   * Retrieves a template by ID (custom first, then built-in, falling back to Classic Novel 6x9).
   */
  getTemplateById(id: string): BookTemplate {
    if (id === 'custom-page-template') {
      return CUSTOM_PAGE_DEFAULT;
    }
    const all = this.getAllTemplatesSync(true); // check archived too so existing books can render
    const found = all.find((t) => t.id === id);
    return found || CLASSIC_NOVEL_6X9;
  }

  /**
   * Saves or updates a custom template. Built-in templates cannot be modified directly.
   */
  async saveCustomTemplate(
    template: BookTemplate,
    userProfile?: UserProfile | null
  ): Promise<BookTemplate> {
    const isBuiltIn = AVAILABLE_TEMPLATES.some((t) => t.id === template.id);
    if (isBuiltIn) {
      throw new Error('Built-in system templates are immutable and cannot be overwritten. Duplicate it to customize.');
    }

    const custom = this.getStoredCustomTemplates();
    const existingIndex = custom.findIndex((t) => t.id === template.id);

    if (existingIndex >= 0) {
      const existing = custom[existingIndex];
      if (!this.canEditTemplate(existing, userProfile)) {
        throw new Error('You do not have permission to modify this template.');
      }
    }

    const currentGov = template.governance || {
      status: 'draft',
      visibility: 'private',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedGov: TemplateGovernance = {
      ...currentGov,
      ownerId: currentGov.ownerId || userProfile?.id,
      organizationId: currentGov.organizationId || userProfile?.organizationName,
      authorName: currentGov.authorName || userProfile?.displayName,
      version: existingIndex >= 0 ? (currentGov.version || 1) + 1 : 1,
      updatedAt: new Date().toISOString(),
    };

    const prepared: BookTemplate = {
      ...this.migrateTemplate(template),
      isCustom: true,
      governance: updatedGov,
    };

    if (existingIndex >= 0) {
      custom[existingIndex] = prepared;
    } else {
      custom.push(prepared);
    }

    this.saveStoredCustomTemplates(custom);
    return prepared;
  }

  /**
   * Duplicates any template (built-in or custom) to create a new editable custom template.
   */
  async duplicateTemplate(
    sourceTemplateId: string,
    newName?: string,
    userProfile?: UserProfile | null
  ): Promise<BookTemplate> {
    const source = this.getTemplateById(sourceTemplateId);
    const newId = `custom-tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cloned: BookTemplate = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: newName || `${source.name} (Copy)`,
      description: `Customized layout based on ${source.name}.`,
      isCustom: true,
      isArchived: false,
      governance: {
        status: 'draft',
        visibility: 'private',
        version: 1,
        ownerId: userProfile?.id,
        organizationId: userProfile?.organizationName,
        authorName: userProfile?.displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    const custom = this.getStoredCustomTemplates();
    custom.push(cloned);
    this.saveStoredCustomTemplates(custom);
    return cloned;
  }

  /**
   * Archives a custom template so it no longer appears in general selection but remains available
   * for existing books that reference it.
   */
  async archiveTemplate(templateId: string, userProfile?: UserProfile | null): Promise<BookTemplate> {
    const template = this.getTemplateById(templateId);
    if (!this.canEditTemplate(template, userProfile)) {
      throw new Error('You do not have permission to archive this template.');
    }

    const updated: BookTemplate = {
      ...template,
      isArchived: true,
      governance: {
        ...(template.governance || {
          status: 'draft',
          visibility: 'private',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        status: 'archived',
        updatedAt: new Date().toISOString(),
      },
    };

    return this.saveCustomTemplate(updated, userProfile);
  }

  /**
   * Unarchives a previously archived custom template.
   */
  async unarchiveTemplate(templateId: string, userProfile?: UserProfile | null): Promise<BookTemplate> {
    const template = this.getTemplateById(templateId);
    if (!this.canEditTemplate(template, userProfile)) {
      throw new Error('You do not have permission to unarchive this template.');
    }

    const updated: BookTemplate = {
      ...template,
      isArchived: false,
      governance: {
        ...(template.governance || {
          status: 'draft',
          visibility: 'private',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        status: 'published',
        updatedAt: new Date().toISOString(),
      },
    };

    return this.saveCustomTemplate(updated, userProfile);
  }

  /**
   * Checks if any existing book projects use the given template ID.
   */
  async getProjectsUsingTemplate(templateId: string): Promise<string[]> {
    try {
      const books = await bookRepository.getAllBooks();
      return books.filter((b) => b.templateId === templateId).map((b) => b.id);
    } catch {
      return [];
    }
  }

  /**
   * Deletes a custom template. If the template is still in use by any books,
   * it is safely archived instead to ensure existing books are never broken.
   */
  async deleteCustomTemplate(
    templateId: string,
    fallbackTemplateId: string = 'classic-novel-6x9',
    userProfile?: UserProfile | null
  ): Promise<{ affectedBookCount: number; wasArchivedInstead: boolean }> {
    const isBuiltIn = AVAILABLE_TEMPLATES.some((t) => t.id === templateId);
    if (isBuiltIn) {
      throw new Error('Built-in system templates cannot be deleted.');
    }

    const template = this.getTemplateById(templateId);
    if (!this.canEditTemplate(template, userProfile)) {
      throw new Error('You do not have permission to delete this template.');
    }

    const inUseBookIds = await this.getProjectsUsingTemplate(templateId);
    if (inUseBookIds.length > 0) {
      // Safety rule: Never break existing books. Archive instead of hard delete!
      await this.archiveTemplate(templateId, userProfile);
      return { affectedBookCount: inUseBookIds.length, wasArchivedInstead: true };
    }

    const custom = this.getStoredCustomTemplates();
    const filtered = custom.filter((t) => t.id !== templateId);
    this.saveStoredCustomTemplates(filtered);

    return { affectedBookCount: 0, wasArchivedInstead: false };
  }

  /**
   * Evaluates differences between two templates to warn about material reflow impact.
   */
  detectReflowImpact(oldTmpl: BookTemplate, newTmpl: BookTemplate): ReflowImpactCheck {
    const differences: string[] = [];

    // Trim size change
    if (
      Math.abs(oldTmpl.pageWidthInches - newTmpl.pageWidthInches) > 0.05 ||
      Math.abs(oldTmpl.pageHeightInches - newTmpl.pageHeightInches) > 0.05
    ) {
      differences.push(
        `Trim size changes from ${oldTmpl.pageWidthInches}" × ${oldTmpl.pageHeightInches}" to ${newTmpl.pageWidthInches}" × ${newTmpl.pageHeightInches}".`
      );
    }

    // Column count change
    if (oldTmpl.columns.count !== newTmpl.columns.count) {
      differences.push(
        `Layout changes from ${oldTmpl.columns.count}-column to ${newTmpl.columns.count}-column.`
      );
    }

    // Margins change
    const oldMarginX = oldTmpl.margins.insideInches + oldTmpl.margins.outsideInches;
    const newMarginX = newTmpl.margins.insideInches + newTmpl.margins.outsideInches;
    if (Math.abs(oldMarginX - newMarginX) > 0.15) {
      differences.push('Horizontal margins differ significantly, altering line length.');
    }

    // Font size change
    if (Math.abs(oldTmpl.typography.bodyFontSizePt - newTmpl.typography.bodyFontSizePt) >= 1) {
      differences.push(
        `Body font size changes from ${oldTmpl.typography.bodyFontSizePt}pt to ${newTmpl.typography.bodyFontSizePt}pt.`
      );
    }

    return {
      hasMaterialImpact: differences.length > 0,
      differences,
    };
  }
}

export const templateRepository = new TemplateRepository();
