'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  X, 
  Loader2, 
  Check, 
  ImageIcon, 
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VariantImageUploadProps {
  variantSku: string;
  variantImages: string[];
  productImages: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

// Helper to get display URL
const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('blob:')) return url;
  if (url.includes('/uploads/')) {
    if (url.startsWith('/api/images')) return url;
    const path = url.split('/uploads/')[1];
    return `/api/images/uploads/${path}`;
  }
  return url;
};

// Sortable Image Item
interface SortableImageProps {
  id: string;
  url: string;
  index: number;
  isFirst: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

function SortableVariantImage({
  id,
  url,
  index,
  isFirst,
  canMoveUp,
  canMoveDown,
  onRemove,
  onMoveUp,
  onMoveDown,
  isUploading,
  uploadProgress,
}: SortableImageProps) {
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

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hidden sm:block"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Image Thumbnail */}
      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
        <Image
          src={getImageUrl(url)}
          alt={`Variant image ${index + 1}`}
          fill
          className="object-cover"
          sizes="64px"
        />
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-4 w-4 animate-spin text-white mx-auto" />
              {uploadProgress !== undefined && (
                <span className="text-[10px] text-white">{uploadProgress}%</span>
              )}
            </div>
          </div>
        )}
        {isFirst && (
          <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-br">
            Main
          </div>
        )}
      </div>

      {/* Image Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">Image {index + 1}</p>
        <p className="text-xs text-muted-foreground truncate">{url.split('/').pop()}</p>
      </div>

      {/* Mobile Move Buttons */}
      <div className="flex flex-col gap-1 sm:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveUp}
          disabled={!canMoveUp}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveDown}
          disabled={!canMoveDown}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function VariantImageUpload({
  variantSku,
  variantImages,
  productImages,
  onImagesChange,
  maxImages = 5,
  maxSizeMB = 2,
}: VariantImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Compress image before upload
  const compressImage = useCallback(async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      return file;
    }
  }, [maxSizeMB]);

  // Handle file upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - variantImages.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed per variant`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    const newImageUrls: string[] = [];
    const totalFiles = filesToProcess.length;

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files');
        continue;
      }

      try {
        // Compress
        setUploadProgress(Math.round(((i * 2) / (totalFiles * 2)) * 100));
        const compressedFile = await compressImage(file);

        // Upload
        setUploadProgress(Math.round(((i * 2 + 1) / (totalFiles * 2)) * 100));
        const formData = new FormData();
        formData.append('image', compressedFile);

        const response = await fetch('/api/upload/product', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        newImageUrls.push(data.imageUrl);
      } catch (err: any) {
        setError(err.message || 'Failed to upload image');
      }
    }

    setUploadProgress(100);

    if (newImageUrls.length > 0) {
      onImagesChange([...variantImages, ...newImageUrls]);
    }

    setUploading(false);
    setUploadProgress(0);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add from product images
  const toggleProductImage = (imageUrl: string) => {
    if (variantImages.includes(imageUrl)) {
      // Remove
      onImagesChange(variantImages.filter((img) => img !== imageUrl));
    } else {
      // Add (if under limit)
      if (variantImages.length < maxImages) {
        onImagesChange([...variantImages, imageUrl]);
      } else {
        setError(`Maximum ${maxImages} images allowed per variant`);
      }
    }
  };

  // Remove image
  const handleRemove = (index: number) => {
    onImagesChange(variantImages.filter((_, i) => i !== index));
  };

  // Move image up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = arrayMove(variantImages, index, index - 1);
    onImagesChange(newImages);
  };

  // Move image down
  const handleMoveDown = (index: number) => {
    if (index === variantImages.length - 1) return;
    const newImages = arrayMove(variantImages, index, index + 1);
    onImagesChange(newImages);
  };

  // Drag and drop reorder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = variantImages.findIndex((_, idx) => `variant-img-${idx}` === active.id);
      const newIndex = variantImages.findIndex((_, idx) => `variant-img-${idx}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newImages = arrayMove(variantImages, oldIndex, newIndex);
        onImagesChange(newImages);
      }
    }
  };

  const imageItems = variantImages.map((url, idx) => ({
    id: `variant-img-${idx}`,
    url,
    index: idx,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Variant Images</Label>
          <p className="text-sm text-muted-foreground">
            SKU: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{variantSku}</code>
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {variantImages.length}/{maxImages}
        </span>
      </div>

      {/* Current Variant Images */}
      {variantImages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Current Images (drag to reorder)</Label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={imageItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {imageItems.map((item, index) => (
                  <SortableVariantImage
                    key={item.id}
                    id={item.id}
                    url={item.url}
                    index={item.index}
                    isFirst={index === 0}
                    canMoveUp={index > 0}
                    canMoveDown={index < variantImages.length - 1}
                    onRemove={() => handleRemove(index)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {variantImages.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed rounded-lg">
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No images assigned to this variant</p>
          <p className="text-xs text-muted-foreground">Upload new images or select from product images below</p>
        </div>
      )}

      {/* Add Images */}
      {variantImages.length < maxImages && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </TabsTrigger>
            <TabsTrigger value="select">
              <ImageIcon className="h-4 w-4 mr-2" />
              From Product
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id={`variant-image-upload-${variantSku}`}
                disabled={uploading}
              />
              
              <div 
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer 
                  transition-colors hover:border-primary hover:bg-primary/5
                  ${uploading ? 'pointer-events-none opacity-50' : ''}
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </p>
                    <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload images</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, GIF, WebP • Max {maxSizeMB}MB each
                    </p>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="select" className="mt-4">
            {productImages.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Click to add/remove product images for this variant
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {productImages.map((img, idx) => {
                    const isSelected = variantImages.includes(img);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleProductImage(img)}
                        className={`
                          relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer
                          transition-all hover:ring-2 hover:ring-primary/50
                          ${isSelected 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-transparent hover:border-muted-foreground/30'
                          }
                        `}
                      >
                        <Image
                          src={getImageUrl(img)}
                          alt={`Product image ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border rounded-lg bg-muted/30">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No product images available</p>
                <p className="text-xs text-muted-foreground">Add images to the main product first</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <X className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        First image will be shown when this variant is selected. 
        {variantImages.length === 0 && ' If no images are set, product images will be used.'}
      </p>
    </div>
  );
}

