import { BookImage, ImagePlacement, NormalizedCrop, PlacementMode } from '@/types/book';

export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file type and size.
 */
export function validateImageFile(file: { type: string; size: number; name?: string }): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  const normalizedType = file.type ? file.type.toLowerCase() : '';
  const isAllowedType = ALLOWED_IMAGE_MIME_TYPES.includes(normalizedType);

  if (!isAllowedType) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Supported formats are PNG, JPEG, and WebP.`,
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum limit of 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Default normalized full-view crop (0 to 1).
 */
export function getDefaultCrop(): NormalizedCrop {
  return {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  };
}

/**
 * Clamps and sanitizes normalized crop values.
 */
export function sanitizeCrop(crop: Partial<NormalizedCrop>): NormalizedCrop {
  let x = Math.max(0, Math.min(0.95, Number(crop.x ?? 0)));
  let y = Math.max(0, Math.min(0.95, Number(crop.y ?? 0)));
  let width = Math.max(0.05, Math.min(1 - x, Number(crop.width ?? 1)));
  let height = Math.max(0.05, Math.min(1 - y, Number(crop.height ?? 1)));

  // Precision rounding
  x = Math.round(x * 1000) / 1000;
  y = Math.round(y * 1000) / 1000;
  width = Math.round(width * 1000) / 1000;
  height = Math.round(height * 1000) / 1000;

  return { x, y, width, height };
}

/**
 * Creates default ImagePlacement anchored to a manuscript block.
 */
export function createDefaultPlacement(
  imageId: string,
  blockId: string,
  mode: PlacementMode = 'inline'
): ImagePlacement {
  const id = `placement-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const defaultWidth = mode === 'float-right' ? 45 : 100;

  return {
    id,
    imageId,
    blockId,
    mode,
    widthPercent: defaultWidth,
    aspectRatioLocked: true,
    crop: getDefaultCrop(),
  };
}

/**
 * Checks whether an image is currently referenced in any book placement.
 */
export function isImageInUse(imageId: string, placements: ImagePlacement[]): boolean {
  if (!placements || placements.length === 0) return false;
  return placements.some((p) => p.imageId === imageId);
}

/**
 * Reads browser File into base64 data URL and extracts pixel width and height.
 */
export async function createBookImageFromFile(file: File, altText?: string): Promise<BookImage> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to inspect image dimensions.'));
    img.src = dataUrl;
  });

  const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fallbackAlt = altText || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  return {
    id,
    filename: file.name,
    mimeType: file.type,
    width,
    height,
    fileSize: file.size,
    createdAt: new Date().toISOString(),
    dataUrl,
    altText: fallbackAlt,
  };
}

/**
 * Calculates effective aspect ratio (width / height) accounting for crop.
 */
export function getEffectiveAspectRatio(image: BookImage, crop: NormalizedCrop): number {
  const croppedWidth = image.width * crop.width;
  const croppedHeight = image.height * crop.height;
  if (croppedHeight <= 0) return 1;
  return croppedWidth / croppedHeight;
}
