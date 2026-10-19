import { describe, it, expect, beforeEach } from 'vitest';
import { templateRepository } from './templateRepository';
import { CLASSIC_NOVEL_6X9, AVAILABLE_TEMPLATES } from './templateRegistry';
import { BookTemplate } from '@/types/book';

describe('templateRepository', () => {
  beforeEach(() => {
    // Clear mock or browser localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('lists all built-in templates by default', () => {
    const list = templateRepository.getAllTemplatesSync();
    expect(list.length).toBeGreaterThanOrEqual(6);
    expect(list.some((t) => t.id === 'classic-novel-6x9')).toBe(true);
    expect(list.some((t) => t.id === 'magazine-report-a4')).toBe(true);
  });

  it('prevents overwriting built-in templates directly', async () => {
    await expect(
      templateRepository.saveCustomTemplate({
        ...CLASSIC_NOVEL_6X9,
        name: 'Overwritten Classic',
      })
    ).rejects.toThrow('Built-in system templates are immutable');
  });

  it('saves and retrieves a custom template', async () => {
    const customTemplate: BookTemplate = {
      ...CLASSIC_NOVEL_6X9,
      id: 'custom-fantasy-novel',
      name: 'Fantasy Novel Deluxe',
      description: 'Deluxe fantasy format with warm ivory pages and decorative inset borders.',
      isCustom: true,
      suitability: ['Fantasy', 'Hardcover'],
      design: {
        backgroundColor: '#fdfbf7',
        borderEnabled: true,
        borderColor: '#854d0e',
      },
    };

    const saved = await templateRepository.saveCustomTemplate(customTemplate);
    expect(saved.isCustom).toBe(true);

    const retrieved = templateRepository.getTemplateById('custom-fantasy-novel');
    expect(retrieved.name).toBe('Fantasy Novel Deluxe');
    expect(retrieved.design?.backgroundColor).toBe('#fdfbf7');
    expect(retrieved.design?.borderEnabled).toBe(true);
  });

  it('duplicates an existing template to create a custom clone', async () => {
    const duplicated = await templateRepository.duplicateTemplate(
      'classic-novel-6x9',
      'My Custom Classic 6x9'
    );
    expect(duplicated.isCustom).toBe(true);
    expect(duplicated.name).toBe('My Custom Classic 6x9');
    expect(duplicated.id).not.toBe('classic-novel-6x9');

    const found = templateRepository.getTemplateById(duplicated.id);
    expect(found.id).toBe(duplicated.id);
  });

  it('safely deletes a custom template with fallback migration', async () => {
    const custom = await templateRepository.duplicateTemplate('digest-novel-5.5x8.5', 'Digest Special');
    expect(templateRepository.getTemplateById(custom.id).id).toBe(custom.id);

    const result = await templateRepository.deleteCustomTemplate(custom.id, 'classic-novel-6x9');
    expect(result).toBeDefined();

    // Now requesting the deleted template ID returns fallback default
    const fallback = templateRepository.getTemplateById(custom.id);
    expect(fallback.id).toBe('classic-novel-6x9');
  });

  it('prevents deleting built-in templates', async () => {
    await expect(
      templateRepository.deleteCustomTemplate('classic-novel-6x9')
    ).rejects.toThrow('Built-in system templates cannot be deleted');
  });

  describe('Phase 8 Governance, Archiving & RBAC', () => {
    it('archives and unarchives a custom template', async () => {
      const custom = await templateRepository.duplicateTemplate('classic-novel-6x9', 'Archivable Template');
      expect(custom.isArchived).toBeFalsy();

      const archived = await templateRepository.archiveTemplate(custom.id);
      expect(archived.isArchived).toBe(true);
      expect(archived.governance?.status).toBe('archived');

      // Sync active list should exclude archived by default
      const activeList = templateRepository.getAllTemplatesSync(false);
      expect(activeList.some((t) => t.id === custom.id)).toBe(false);

      // Including archived returns it
      const allList = templateRepository.getAllTemplatesSync(true);
      expect(allList.some((t) => t.id === custom.id)).toBe(true);

      // Unarchive
      const unarchived = await templateRepository.unarchiveTemplate(custom.id);
      expect(unarchived.isArchived).toBe(false);
      expect(unarchived.governance?.status).toBe('published');
    });

    it('enforces RBAC permissions for organization templates', () => {
      const orgTemplate: BookTemplate = {
        ...CLASSIC_NOVEL_6X9,
        id: 'org-tmpl-1',
        name: 'Official Press Template',
        isCustom: true,
        governance: {
          status: 'published',
          visibility: 'organization',
          organizationId: 'Acme Press',
          ownerId: 'admin-1',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const adminUser: any = {
        id: 'admin-1',
        displayName: 'Admin User',
        role: 'administrator',
        organizationName: 'Acme Press',
      };

      const editorUser: any = {
        id: 'editor-2',
        displayName: 'Editor User',
        role: 'editor',
        organizationName: 'Acme Press',
      };

      const viewerUser: any = {
        id: 'viewer-3',
        displayName: 'Viewer User',
        role: 'viewer',
        organizationName: 'Acme Press',
      };

      // Admin can edit
      expect(templateRepository.canEditTemplate(orgTemplate, adminUser)).toBe(true);
      // Editor cannot edit organization template
      expect(templateRepository.canEditTemplate(orgTemplate, editorUser)).toBe(false);
      // Viewer cannot edit
      expect(templateRepository.canEditTemplate(orgTemplate, viewerUser)).toBe(false);
    });

    it('detects material reflow impact between templates', () => {
      const oldTmpl = CLASSIC_NOVEL_6X9; // 6x9, 1-col
      const newTmplA4 = templateRepository.getTemplateById('magazine-report-a4'); // A4, 2-col

      const check = templateRepository.detectReflowImpact(oldTmpl, newTmplA4);
      expect(check.hasMaterialImpact).toBe(true);
      expect(check.differences.some((d) => d.includes('Trim size changes'))).toBe(true);
      expect(check.differences.some((d) => d.includes('2-column'))).toBe(true);
    });

    it('migrates raw or partial template schemas safely with full defaults', () => {
      const rawIncomplete = {
        id: 'tmpl-raw-123',
        name: 'Incomplete Template',
        pageWidthInches: 5.5,
      };

      const migrated = templateRepository.migrateTemplate(rawIncomplete);
      expect(migrated.id).toBe('tmpl-raw-123');
      expect(migrated.name).toBe('Incomplete Template');
      expect(migrated.pageWidthInches).toBe(5.5);
      expect(migrated.pageHeightInches).toBe(CLASSIC_NOVEL_6X9.pageHeightInches);
      expect(migrated.margins.insideInches).toBeGreaterThan(0);
      expect(migrated.layers).toEqual([]);
      expect(migrated.contentZones).toEqual([]);
      expect(migrated.governance).toBeDefined();
    });
  });
});
