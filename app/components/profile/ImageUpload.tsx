'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

// Helper to check if URL is a data URL
const isDataURL = (url: string): boolean => {
  return url.startsWith('data:');
};

// Helper to decode HTML-encoded URLs (works on both client and server)
const decodeUrl = (url: string): string => {
  if (!url) return '';
  
  // First, decode common HTML entities
  let decoded = url
    .replace(/&amp;#x2F;/g, '/')  // &amp;#x2F; -> /
    .replace(/&#x2F;/g, '/')       // &#x2F; -> /
    .replace(/&amp;/g, '&')        // &amp; -> &
    .replace(/&lt;/g, '<')         // &lt; -> <
    .replace(/&gt;/g, '>')         // &gt; -> >
    .replace(/&quot;/g, '"')       // &quot; -> "
    .replace(/&#39;/g, "'");       // &#39; -> '
  
  // If we're on the client, use DOM API for more complex decoding
  if (typeof window !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = decoded;
      decoded = textarea.value;
    } catch (e) {
      // If DOM API fails, use the regex-decoded version
    }
  }
  
  return decoded;
};

// Helper to convert backend URL to Next.js proxy URL
const getImageUrl = (url: string): string => {
  if (!url) return '';
  
  // Decode HTML-encoded URL first
  let decodedUrl = url;
  try {
    decodedUrl = decodeUrl(url);
  } catch (e) {
    // If decoding fails, try direct decode
    decodedUrl = url.replace(/&amp;#x2F;/g, '/').replace(/&amp;/g, '&');
  }
  
  if (isDataURL(decodedUrl)) {
    return decodedUrl;
  }
  
  // If it's a backend URL, proxy it through Next.js API
  if (decodedUrl.includes('/uploads/')) {
    const path = decodedUrl.split('/uploads/')[1];
    // Clean up any remaining encoded characters in the path
    const cleanPath = path.replace(/&amp;#x2F;/g, '/').replace(/&amp;/g, '&');
    return `/api/images/uploads/${cleanPath}`;
  }
  
  return decodedUrl;
};

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  maxSizeMB?: number;
}

export default function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  
  // Update preview when currentImageUrl changes
  useEffect(() => {
    if (currentImageUrl) {
      // Decode HTML-encoded URL if needed
      let decodedUrl = currentImageUrl;
      try {
        // Try to decode HTML entities
        decodedUrl = currentImageUrl.replace(/&amp;#x2F;/g, '/').replace(/&amp;/g, '&');
      } catch (e) {
        // If decoding fails, use original
        decodedUrl = currentImageUrl;
      }
      setPreview(decodedUrl);
    }
  }, [currentImageUrl]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to backend via Next.js API route
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      if (data.imageUrl) {
        // Update preview to use server URL instead of data URL
        setPreview(data.imageUrl);
        onImageUploaded(data.imageUrl);
        setError(null);
      } else {
        throw new Error('No image URL returned from server');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageUploaded('');
  };

  return (
    <div className="space-y-2">
      <Label>Profile Picture</Label>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary relative">
              {isDataURL(preview) ? (
                // Use regular img tag for data URLs (preview)
                <img
                  src={preview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                // Use Next.js Image for server URLs (proxied through Next.js API)
                <Image
                  src={getImageUrl(preview)}
                  alt="Avatar preview"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              )}
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed flex items-center justify-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {preview ? 'Change Image' : 'Upload Image'}
              </>
            )}
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, GIF. Max size: {maxSizeMB}MB
      </p>
    </div>
  );
}

