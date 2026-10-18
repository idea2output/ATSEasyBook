import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  getDefaultCrop,
  sanitizeCrop,
  createDefaultPlacement,
  isImageInUse,
  getEffectiveAspectRatio,
} from './imageService';
import { BookImage, ImagePlacement } from '@/types/book';

describe('imageService', () => {
  describe('validateImageFile', () => {
    it('accepts valid PNG, JPEG, and WebP images within 10 MB limit', () => {
      expect(validateImageFile({ type: 'image/png', size: 1024 * 1024 }).valid).toBe(true);
      expect(validateImageFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 }).valid).toBe(true);
      expect(validateImageFile({ type: 'image/jpg', size: 500 * 1024 }).valid).toBe(true);
      expect(validateImageFile({ type: 'image/webp', size: 2 * 1024 * 1024 }).valid).toBe(true);
    });

    it('rejects unsupported file mime types', () => {
      const res = validateImageFile({ type: 'application/pdf', size: 1024 });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Unsupported file format');

      const gifRes = validateImageFile({ type: 'image/gif', size: 1024 });
      expect(gifRes.valid).toBe(false);

      const svgRes = validateImageFile({ type: 'image/svg+xml', size: 1024 });
      expect(svgRes.valid).toBe(false);
    });

    it('rejects file sizes exceeding 10 MB limit', () => {
      const oversizeFile = { type: 'image/png', size: 11 * 1024 * 1024 };
      const res = validateImageFile(oversizeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds maximum limit of 10 MB');
    });

    it('handles missing or empty files safely', () => {
      expect(validateImageFile(null as any).valid).toBe(false);
    });
  });

  describe('crop normalization and defaults', () => {
    it('provides standard default crop of full image', () => {
      const defaultCrop = getDefaultCrop();
      expect(defaultCrop).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    });

    it('clamps crop values within safe 0 to 1 bounds', () => {
      const clamped = sanitizeCrop({ x: -0.5, y: 1.5, width: 2, height: -0.1 });
      expect(clamped.x).toBe(0);
      expect(clamped.y).toBe(0.95);
      expect(clamped.width).toBe(1);
      expect(clamped.height).toBe(0.05);
    });

    it('calculates effective aspect ratio accounting for crop dimensions', () => {
      const mockImage: BookImage = {
        id: 'test-img',
        filename: 'landscape.jpg',
        mimeType: 'image/jpeg',
        width: 1200,
        height: 600, // natural aspect 2.0
        fileSize: 10000,
        createdAt: '2026-10-18T00:00:00Z',
        dataUrl: 'data:image/jpeg;base64,...',
        altText: 'Landscape',
      };

      // Full view: aspect 2.0
      expect(getEffectiveAspectRatio(mockImage, getDefaultCrop())).toBe(2.0);

      // Cropped to 50% width and 100% height: 600x600 -> aspect 1.0 (square)
      const squareCrop = { x: 0, y: 0, width: 0.5, height: 1 };
      expect(getEffectiveAspectRatio(mockImage, squareCrop)).toBe(1.0);
    });
  });

  describe('createDefaultPlacement & isImageInUse', () => {
    it('creates placement with proper defaults for inline, full-width, and float-right', () => {
      const inline = createDefaultPlacement('img-1', 'block-5', 'inline');
      expect(inline.imageId).toBe('img-1');
      expect(inline.blockId).toBe('block-5');
      expect(inline.mode).toBe('inline');
      expect(inline.widthPercent).toBe(100);
      expect(inline.aspectRatioLocked).toBe(true);

      const floatRight = createDefaultPlacement('img-1', 'block-5', 'float-right');
      expect(floatRight.mode).toBe('float-right');
      expect(floatRight.widthPercent).toBe(45);
    });

    it('correctly tracks whether an image is in active use across placements', () => {
      const placements: ImagePlacement[] = [
        createDefaultPlacement('img-1', 'block-1'),
        createDefaultPlacement('img-2', 'block-2'),
      ];

      expect(isImageInUse('img-1', placements)).toBe(true);
      expect(isImageInUse('img-2', placements)).toBe(true);
      expect(isImageInUse('img-3', placements)).toBe(false);
    });
  });
});
