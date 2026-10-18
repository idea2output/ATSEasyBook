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
});
