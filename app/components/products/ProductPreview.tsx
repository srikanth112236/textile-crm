'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, Box } from 'lucide-react';
import Image from 'next/image';

interface ProductPreviewProps {
  formData: {
    name: string;
    description: string;
    price: number;
    stock: number;
    status: string;
    images?: (string | { url: string; altText?: string })[];
  };
}

export default function ProductPreview({ formData }: ProductPreviewProps) {
  const { name, description, price, stock, status, images } = formData;

  // Get first image URL
  const getFirstImageUrl = (): string | null => {
    if (!images || images.length === 0) return null;
    
    const firstImage = images[0];
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
      return firstImage.url;
    }
    return null;
  };

  const imageUrl = getFirstImageUrl();
  
  // Decode HTML entities that might have been encoded
  const decodeHtmlEntities = (str: string): string => {
    if (!str) return str;
    // Decode common HTML entities (handle multiple encodings)
    let decoded = str;
    // Decode multiple times in case of double/triple encoding
    for (let i = 0; i < 5; i++) {
      const prev = decoded;
      decoded = decoded
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x2F;/g, '/')
        .replace(/&#39;/g, "'")
        .replace(/&amp;amp;/g, '&')
        .replace(/&amp;#x2F;/g, '/');
      // Stop if no more changes
      if (prev === decoded) break;
    }
    return decoded;
  };

  // Convert image URL to display format
  const getDisplayImageUrl = (url: string): string => {
    if (!url) return '';
    
    // First, decode any HTML entities
    let cleanUrl = decodeHtmlEntities(url);
    
    // Handle data URLs
    if (cleanUrl.startsWith('data:')) {
      return cleanUrl;
    }
    
    // Handle upload paths - convert to frontend proxy URL
    if (cleanUrl.includes('/uploads/')) {
      // If it's already a frontend proxy URL, return as is
      if (cleanUrl.startsWith('/api/images/uploads/')) {
        return cleanUrl;
      }
      // If it's a full backend URL, convert to frontend proxy
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        try {
          const urlObj = new URL(cleanUrl);
          if (urlObj.pathname.includes('/uploads/')) {
            return `/api/images${urlObj.pathname}`;
          }
        } catch {
          // Invalid URL, try to extract path
          const match = cleanUrl.match(/\/uploads\/[^\/]+.*$/);
          if (match) {
            return `/api/images${match[0]}`;
          }
        }
      }
      // If it's a relative path starting with /uploads/, convert to frontend proxy
      if (cleanUrl.startsWith('/uploads/')) {
        return `/api/images${cleanUrl}`;
      }
      // Extract path after /uploads/
      const path = cleanUrl.split('/uploads/')[1];
      if (path) {
        return `/api/images/uploads/${path}`;
      }
    }
    
    // Handle absolute URLs (external)
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    
    // Handle relative URLs
    if (cleanUrl.startsWith('/')) {
      if (cleanUrl.startsWith('/api/images')) {
        return cleanUrl;
      }
      return cleanUrl;
    }
    
    return cleanUrl;
  };

  const displayImageUrl = imageUrl ? getDisplayImageUrl(imageUrl) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'discontinued':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card className="overflow-hidden border-2">
      <div className="relative">
        {/* Product Image */}
        {displayImageUrl ? (
          <div className="aspect-square relative bg-muted w-full">
            {displayImageUrl.startsWith('http://') || displayImageUrl.startsWith('https://') ? (
              <img
                src={displayImageUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Image
                src={displayImageUrl}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            )}
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground opacity-50" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge className={getStatusColor(status)}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Product Name */}
        <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]">
          {name || 'Product Name'}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {description || 'Product description will appear here...'}
        </p>

        {/* Price and Stock */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold text-primary">
              ${price ? price.toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Box className="h-4 w-4" />
            <span>{stock || 0} in stock</span>
          </div>
        </div>

        {/* Action Buttons Placeholder */}
        <div className="flex gap-2 pt-2">
          <button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            disabled
          >
            Add to Cart
          </button>
          <button
            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
            disabled
          >
            View
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

