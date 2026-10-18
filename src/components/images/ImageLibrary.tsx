'use client';

import React, { useState, useRef } from 'react';
import { BookImage, ImagePlacement, ManuscriptBlock } from '@/types/book';
import {
  createBookImageFromFile,
  validateImageFile,
  isImageInUse,
  createDefaultPlacement,
} from '@/services/images/imageService';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Loader2,
  FileText,
  Info,
  Maximize2,
} from 'lucide-react';

interface ImageLibraryProps {
  images: BookImage[];
  placements: ImagePlacement[];
  blocks: ManuscriptBlock[];
  onAddImage: (image: BookImage) => void;
  onUpdateImage: (imageId: string, updates: Partial<BookImage>) => void;
  onDeleteImage: (imageId: string) => void;
  onInsertPlacement: (placement: ImagePlacement) => void;
}

export const ImageLibrary: React.FC<ImageLibraryProps> = ({
  images,
  placements,
  blocks,
  onAddImage,
  onUpdateImage,
  onDeleteImage,
  onInsertPlacement,
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Deletion modal state
  const [imageToDelete, setImageToDelete] = useState<{ image: BookImage; inUseCount: number } | null>(null);

  // Quick insertion state
  const [insertModalImage, setInsertModalImage] = useState<BookImage | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string>(blocks[0]?.id || '');
  const [selectedMode, setSelectedMode] = useState<'inline' | 'full-width' | 'float-right'>('inline');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      const file = files[0];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file.');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const newImage = await createBookImageFromFile(file);
      onAddImage(newImage);
      setUploadSuccess(`Successfully uploaded "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process image upload.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartDelete = (image: BookImage) => {
    const inUseCount = placements.filter((p) => p.imageId === image.id).length;
    setImageToDelete({ image, inUseCount });
  };

  const handleConfirmDelete = () => {
    if (!imageToDelete) return;
    onDeleteImage(imageToDelete.image.id);
    setImageToDelete(null);
  };

  const handleOpenInsertModal = (image: BookImage) => {
    setInsertModalImage(image);
    if (blocks.length > 0 && !selectedBlockId) {
      setSelectedBlockId(blocks[0].id);
    }
  };

  const handleConfirmInsert = () => {
    const targetBlockId = selectedBlockId || (blocks.length > 0 ? blocks[0].id : '');
    if (!insertModalImage || !targetBlockId) return;
    const placement = createDefaultPlacement(insertModalImage.id, targetBlockId, selectedMode);
    if (insertModalImage.caption) {
      placement.caption = insertModalImage.caption;
    }
    onInsertPlacement(placement);
    setInsertModalImage(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header & Upload Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <span>Image Library ({images.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            PNG, JPEG, WebP up to 10 MB. Images are stored with your project and can be anchored to any manuscript block.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="image-library-upload-input"
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="Upload Image File"
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Feedback Banners */}
      {uploadError && (
        <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-rose-600 font-semibold hover:text-rose-800 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <button
            onClick={() => setUploadSuccess(null)}
            className="text-emerald-600 font-semibold hover:text-emerald-800 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Image Grid / Empty State */}
      <div className="flex-1 overflow-y-auto p-4">
        {images.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Images Uploaded</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Upload chapter illustrations, portraits, maps, or ornaments to anchor them inside your book layout.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select File</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((img) => {
              const inUseCount = placements.filter((p) => p.imageId === img.id).length;
              return (
                <div
                  key={img.id}
                  data-testid={`image-card-${img.id}`}
                  className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail preview */}
                    <div className="relative aspect-video w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center group">
                      <img
                        src={img.dataUrl}
                        alt={img.altText || img.filename}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 left-2 flex items-center space-x-1">
                        {inUseCount > 0 ? (
                          <span className="px-2 py-0.5 bg-indigo-600/90 text-white text-[10px] font-semibold rounded-full shadow-xs">
                            Placed ({inUseCount})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-800/80 text-white text-[10px] font-semibold rounded-full shadow-xs">
                            Unplaced
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="mt-2.5 space-y-1">
                      <p className="text-xs font-bold text-slate-900 truncate" title={img.filename}>
                        {img.filename}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        <span>{img.width} × {img.height} px</span>
                        <span>•</span>
                        <span>{(img.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span className="uppercase">{img.mimeType.split('/')[1]}</span>
                      </div>
                    </div>

                    {/* Alt text field */}
                    <div className="mt-2.5">
                      <label
                        htmlFor={`alt-text-${img.id}`}
                        className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5"
                      >
                        Alt Text (Required for accessibility)
                      </label>
                      <input
                        id={`alt-text-${img.id}`}
                        type="text"
                        value={img.altText || ''}
                        onChange={(e) => onUpdateImage(img.id, { altText: e.target.value })}
                        placeholder="Describe the image..."
                        className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded font-normal text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Caption field */}
                    <div className="mt-2">
                      <label
                        htmlFor={`caption-${img.id}`}
                        className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5"
                      >
                        Default Caption (Optional)
                      </label>
                      <input
                        id={`caption-${img.id}`}
                        type="text"
                        value={img.caption || ''}
                        onChange={(e) => onUpdateImage(img.id, { caption: e.target.value })}
                        placeholder="Figure caption..."
                        className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded font-normal text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleStartDelete(img)}
                      aria-label={`Delete image ${img.filename}`}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenInsertModal(img)}
                      aria-label={`Place ${img.filename} into manuscript`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Place in Book</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {imageToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-img-dialog-title"
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200"
          >
            <h3 id="delete-img-dialog-title" className="text-base font-bold text-slate-900">
              Delete Image?
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-800">&ldquo;{imageToDelete.image.filename}&rdquo;</span>?
            </p>

            {imageToDelete.inUseCount > 0 ? (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <p className="font-semibold flex items-center space-x-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Warning: Image is in active use</span>
                </p>
                <p>
                  This image is currently placed in <span className="font-bold">{imageToDelete.inUseCount}</span> location(s) in your book. Deleting it will safely remove all placements without breaking the text layout.
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setImageToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Delete Image {imageToDelete.inUseCount > 0 ? '& Placements' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Insert Modal */}
      {insertModalImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="insert-img-dialog-title"
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4"
          >
            <h3 id="insert-img-dialog-title" className="text-base font-bold text-slate-900">
              Place Image into Book
            </h3>

            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-16 h-12 bg-white rounded border border-slate-200 overflow-hidden shrink-0">
                <img
                  src={insertModalImage.dataUrl}
                  alt={insertModalImage.altText}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{insertModalImage.filename}</p>
                <p className="text-[11px] text-slate-500">{insertModalImage.width} × {insertModalImage.height} px</p>
              </div>
            </div>

            {/* Block Anchor Selector */}
            <div>
              <label htmlFor="anchor-block-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Insert after manuscript block:
              </label>
              {blocks.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  No manuscript blocks found. Please type or format manuscript text first.
                </p>
              ) : (
                <select
                  id="anchor-block-select"
                  value={selectedBlockId}
                  onChange={(e) => setSelectedBlockId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {blocks.map((block, idx) => (
                    <option key={block.id} value={block.id}>
                      Block #{idx + 1} ({block.type === 'chapter-heading' ? 'Heading' : 'Paragraph'}):{' '}
                      {block.text.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Placement Mode Selector */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1">Placement Mode:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMode('inline')}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    selectedMode === 'inline'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">Inline</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Between paragraphs, full text width</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('full-width')}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    selectedMode === 'full-width'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">Full-width</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Spans margins, text above/below</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('float-right')}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    selectedMode === 'float-right'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">Float Right</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Placed on right, text wraps left</p>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setInsertModalImage(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmInsert}
                disabled={blocks.length === 0}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                Insert Placement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
