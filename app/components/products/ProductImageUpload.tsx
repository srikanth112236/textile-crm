'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2, GripVertical, ChevronUp, ChevronDown, Crop } from 'lucide-react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ImageCropModal from './ImageCropModal';

export interface ImageWithMetadata {
  url: string;
  altText?: string;
}

interface ProductImageUploadProps {
  images: string[] | ImageWithMetadata[];
  onImagesChange: (images: string[] | ImageWithMetadata[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  supportAltText?: boolean;
}

interface SortableImageItemProps {
  id: string;
  image: ImageWithMetadata;
  index: number;
  isMain: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove: () => void;
  onReplace: () => void;
  onCrop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAltTextChange?: (altText: string) => void;
  error?: string;
  compressionProgress?: number;
  uploadProgress?: number;
  isUploading?: boolean;
  isCompressing?: boolean;
}

function SortableImageItem({
  id,
  image,
  index,
  isMain,
  canMoveUp,
  canMoveDown,
  onRemove,
  onReplace,
  onCrop,
  onMoveUp,
  onMoveDown,
  onAltTextChange,
  error,
  compressionProgress,
  uploadProgress,
  isUploading,
  isCompressing,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.includes('/uploads/')) {
      const path = url.split('/uploads/')[1];
      return `/api/images/uploads/${path}`;
    }
    return url;
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div className="relative group">
        <div className="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted relative">
          <Image
            src={getImageUrl(image.url)}
            alt={image.altText || `Product image ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          
          {/* Progress Overlay */}
          {(isCompressing || isUploading) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center space-y-2 text-white">
                {isCompressing && (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-xs">Compressing... {compressionProgress ? `${compressionProgress}%` : ''}</p>
                  </>
                )}
                {isUploading && !isCompressing && (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-xs">Uploading... {uploadProgress ? `${uploadProgress}%` : ''}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Drag handle - Desktop */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded cursor-grab active:cursor-grabbing transition-colors hidden md:block"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Main badge */}
          {isMain && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
              Main
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={onCrop}
              aria-label="Crop image"
              title="Crop image"
            >
              <Crop className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={onRemove}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Move buttons */}
        <div className="md:hidden flex gap-2 justify-center mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Alt text input */}
        {onAltTextChange && (
          <div className="space-y-1">
            <Input
              type="text"
              placeholder={`Alt text for image ${index + 1} (optional)`}
              value={image.altText || ''}
              onChange={(e) => onAltTextChange(e.target.value)}
              className="text-sm"
              aria-label={`Alt text for image ${index + 1}`}
            />
            <p className="text-xs text-muted-foreground">
              Helps with accessibility and SEO
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}

export default function ProductImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizeMB = 2,
  supportAltText = true,
}: ProductImageUploadProps) {
  // Normalize images to ImageWithMetadata format
  const normalizedImages: ImageWithMetadata[] = images.map((img) => {
    if (typeof img === 'string') {
      return { url: img };
    }
    // Handle both IProductImage format and ImageWithMetadata
    if (typeof img === 'object' && img !== null) {
      if ('url' in img) {
        return { url: img.url, altText: 'altText' in img ? img.altText : undefined };
      }
    }
    return { url: String(img) };
  });

  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [compressing, setCompressing] = useState<Record<number, boolean>>({});
  const [compressionProgress, setCompressionProgress] = useState<Record<number, number>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ file: File; index?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const compressImage = useCallback(async (file: File, index: number): Promise<File> => {
    setCompressing((prev) => ({ ...prev, [index]: true }));
    setCompressionProgress((prev) => ({ ...prev, [index]: 10 }));

    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    };

    try {
      // Simulate progress (browser-image-compression doesn't provide progress callbacks)
      setCompressionProgress((prev) => ({ ...prev, [index]: 50 }));
      
      const compressedFile = await imageCompression(file, options);
      
      setCompressionProgress((prev) => ({ ...prev, [index]: 100 }));
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      return file;
    } finally {
      setCompressing((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
      // Clear progress after a short delay
      setTimeout(() => {
        setCompressionProgress((prev) => {
          const newState = { ...prev };
          delete newState[index];
          return newState;
        });
      }, 500);
    }
  }, [maxSizeMB]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const newImages: ImageWithMetadata[] = [];

    // Validate max images before processing
    if (normalizedImages.length + filesArray.length > maxImages) {
      setErrors((prev) => ({
        ...prev,
        [Date.now()]: `Maximum ${maxImages} images allowed. You can upload ${maxImages - normalizedImages.length} more.`,
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // For single file, offer crop option
    if (filesArray.length === 1 && index === undefined) {
      const file = filesArray[0];
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        setImageToCrop({ file, index });
        setCropModalOpen(true);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }

    // Process multiple files or replace
    for (let fileIndex = 0; fileIndex < filesArray.length; fileIndex++) {
      const file = filesArray[fileIndex];
      const currentIndex = index !== undefined ? index : normalizedImages.length + fileIndex;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, [currentIndex]: 'Please select an image file' }));
        continue;
      }

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[currentIndex];
        return newErrors;
      });

      await processAndUploadFile(file, currentIndex, index !== undefined);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processAndUploadFile = async (file: File, index: number, isReplace: boolean) => {
    try {
      // Compress image (this function handles compression state)
      const compressedFile = await compressImage(file, index);

      // Validate compressed file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (compressedFile.size > maxSizeBytes) {
        throw new Error(`Compressed image size (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB) still exceeds ${maxSizeMB}MB limit`);
      }

      setUploading((prev) => ({ ...prev, [index]: true }));
      setUploadProgress((prev) => ({ ...prev, [index]: 0 }));

      const formData = new FormData();
      formData.append('image', compressedFile);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress((prev) => ({ ...prev, [index]: percentComplete }));
        }
      });

      const imageUrl = await new Promise<string>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.imageUrl);
            } catch (err) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'Failed to upload image'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', '/api/upload/product');
        xhr.send(formData);
      });

      const newImage: ImageWithMetadata = { url: imageUrl };

      if (isReplace) {
        const updatedImages = [...normalizedImages];
        updatedImages[index] = newImage;
        onImagesChange(supportAltText ? updatedImages : updatedImages.map((img) => img.url));
      } else {
        const updatedImages = [...normalizedImages, newImage];
        onImagesChange(supportAltText ? updatedImages : updatedImages.map((img) => img.url));
      }
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [index]: err.message || 'Failed to upload image' }));
    } finally {
      setUploading((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
      setUploadProgress((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (!imageToCrop) return;

    const index = imageToCrop.index !== undefined ? imageToCrop.index : normalizedImages.length;
    await processAndUploadFile(croppedFile, index, imageToCrop.index !== undefined);
    setImageToCrop(null);
  };

  const handleRemove = (index: number) => {
    const updatedImages = normalizedImages.filter((_, i) => i !== index);
    onImagesChange(supportAltText ? updatedImages : updatedImages.map((img) => img.url));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = arrayMove(normalizedImages, index, index - 1);
    onImagesChange(supportAltText ? newImages : newImages.map((img) => img.url));
  };

  const handleMoveDown = (index: number) => {
    if (index === normalizedImages.length - 1) return;
    const newImages = arrayMove(normalizedImages, index, index + 1);
    onImagesChange(supportAltText ? newImages : newImages.map((img) => img.url));
  };

  const handleAltTextChange = (index: number, altText: string) => {
    const updatedImages = [...normalizedImages];
    updatedImages[index] = { ...updatedImages[index], altText };
    onImagesChange(supportAltText ? updatedImages : updatedImages.map((img) => img.url));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = normalizedImages.findIndex((_, idx) => `image-${idx}` === active.id);
      const newIndex = normalizedImages.findIndex((_, idx) => `image-${idx}` === over.id);

      const newImages = arrayMove(normalizedImages, oldIndex, newIndex);
      onImagesChange(supportAltText ? newImages : newImages.map((img) => img.url));
    }
  };

  const imageItems = normalizedImages.map((img, idx) => ({
    id: `image-${idx}`,
    image: img,
    index: idx,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Product Images *</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Upload up to {maxImages} images. First image will be the main product image. Drag to reorder on desktop, or use buttons on mobile.
        </p>
      </div>

      {/* Image Grid with Drag and Drop */}
      {normalizedImages.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={imageItems.map(item => item.id)}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageItems.map((item, index) => (
                <SortableImageItem
                  key={item.id}
                  id={item.id}
                  image={item.image}
                  index={item.index}
                  isMain={index === 0}
                  canMoveUp={index > 0}
                  canMoveDown={index < normalizedImages.length - 1}
                  onRemove={() => handleRemove(index)}
                  onReplace={() => {
                    fileInputRef.current?.click();
                    fileInputRef.current?.setAttribute('data-replace-index', index.toString());
                  }}
                  onCrop={() => {
                    // For existing images, we'd need to download them first
                    // For now, just trigger replace
                    fileInputRef.current?.click();
                    fileInputRef.current?.setAttribute('data-crop-index', index.toString());
                  }}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  onAltTextChange={supportAltText ? (altText) => handleAltTextChange(index, altText) : undefined}
                  error={errors[index]}
                  compressionProgress={compressionProgress[index]}
                  uploadProgress={uploadProgress[index]}
                  isUploading={uploading[index]}
                  isCompressing={compressing[index]}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload Button */}
      {normalizedImages.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={normalizedImages.length === 0}
            onChange={(e) => {
              const replaceIndex = fileInputRef.current?.getAttribute('data-replace-index');
              const cropIndex = fileInputRef.current?.getAttribute('data-crop-index');
              handleFileSelect(e, replaceIndex || cropIndex ? parseInt(replaceIndex || cropIndex || '0') : undefined);
              fileInputRef.current?.removeAttribute('data-replace-index');
              fileInputRef.current?.removeAttribute('data-crop-index');
            }}
            className="hidden"
            id="product-image-upload"
            disabled={Object.values(uploading).some(Boolean) || Object.values(compressing).some(Boolean)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={Object.values(uploading).some(Boolean) || Object.values(compressing).some(Boolean)}
          >
            {(Object.values(uploading).some(Boolean) || Object.values(compressing).some(Boolean)) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {normalizedImages.length === 0 ? 'Upload Images' : `Add More Images (${maxImages - normalizedImages.length} remaining)`}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          imageSrc={URL.createObjectURL(imageToCrop.file)}
          isOpen={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setImageToCrop(null);
            if (imageToCrop.file) {
              URL.revokeObjectURL(URL.createObjectURL(imageToCrop.file));
            }
          }}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}

      <p className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, GIF, WebP. Images will be automatically compressed. Max size: {maxSizeMB}MB per image after compression.
      </p>
    </div>
  );
}
