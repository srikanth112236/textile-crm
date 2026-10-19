'use client';

import { useState, useEffect, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageFile: File) => void;
  aspectRatio?: number;
}

export type AspectRatioPreset = 'free' | '1:1' | '16:9' | '4:3' | '3:2';

const ASPECT_RATIO_PRESETS: Record<AspectRatioPreset, number | undefined> = {
  'free': undefined,
  '1:1': 1,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
};

const ASPECT_RATIO_LABELS: Record<AspectRatioPreset, string> = {
  'free': 'Free Form',
  '1:1': 'Square (1:1)',
  '16:9': 'Widescreen (16:9)',
  '4:3': 'Standard (4:3)',
  '3:2': 'Photo (3:2)',
};

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined
): Crop {
  if (!aspect) {
    // Free form - center a 90% crop
    return {
      unit: '%',
      x: 5,
      y: 5,
      width: 90,
      height: 90,
    };
  }

  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
  aspectRatio: initialAspectRatio = 1,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatioPreset, setAspectRatioPreset] = useState<AspectRatioPreset>('1:1');
  const [currentAspectRatio, setCurrentAspectRatio] = useState<number | undefined>(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imgRef.current || !imageSrc) return;

    const { width, height } = imgRef.current;
    const aspect = currentAspectRatio || initialAspectRatio;
    setCrop(centerAspectCrop(width, height, aspect));
  }, [imageSrc, currentAspectRatio, initialAspectRatio]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const aspect = currentAspectRatio || initialAspectRatio;
    setCrop(centerAspectCrop(width, height, aspect));
  }

  function handleAspectRatioChange(preset: AspectRatioPreset) {
    setAspectRatioPreset(preset);
    const aspect = ASPECT_RATIO_PRESETS[preset];
    setCurrentAspectRatio(aspect);
    
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  async function onCropClick() {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return;

    setIsProcessing(true);

    try {
      const image = imgRef.current;
      const canvas = canvasRef.current;
      const crop = completedCrop;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const pixelRatio = window.devicePixelRatio;
      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob');
        }
        const file = new File([blob], 'cropped-image.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onCropComplete(file);
        setIsProcessing(false);
        onClose();
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsProcessing(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Crop & Edit Image</DialogTitle>
          <DialogDescription>
            Adjust the crop area, select an aspect ratio preset, and click &quot;Crop&quot; to apply
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aspect Ratio Preset Selector */}
          <div className="space-y-2">
            <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
            <Select
              value={aspectRatioPreset}
              onValueChange={(value) => handleAspectRatioChange(value as AspectRatioPreset)}
            >
              <SelectTrigger id="aspect-ratio" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASPECT_RATIO_LABELS).map(([preset, label]) => (
                  <SelectItem key={preset} value={preset}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose a preset aspect ratio or use Free Form for custom cropping
            </p>
          </div>

          {/* Crop Area */}
          {imageSrc && (
            <div className="flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={currentAspectRatio}
                minWidth={50}
                minHeight={50}
                locked={!!currentAspectRatio}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageSrc}
                  style={{ maxHeight: '60vh', maxWidth: '100%' }}
                  onLoad={onImageLoad}
                  className="rounded-lg"
                />
              </ReactCrop>
            </div>
          )}

          <canvas
            ref={canvasRef}
            style={{
              display: 'none',
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={onCropClick} disabled={isProcessing || !completedCrop}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Crop & Apply'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
