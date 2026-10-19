'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Eye, Search, Share2 } from 'lucide-react';
import Image from 'next/image';

interface MetadataPreviewProps {
  formData: {
    name: string;
    metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    images?: string[];
  };
  compact?: boolean;
}

export default function MetadataPreview({ formData, compact = false }: MetadataPreviewProps) {
  const metaTitle = formData.metaTitle || formData.name;
  const metaDescription = formData.metaDescription || '';
  const ogTitle = formData.ogTitle || formData.metaTitle || formData.name;
  const ogDescription = formData.ogDescription || formData.metaDescription || '';
  const ogImage = formData.ogImage || (formData.images && formData.images[0]) || '';

  const isValidUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '') return false;
    
    // Don't validate partial URLs (user is still typing)
    if (url.length < 10) return false;
    
    // Check for incomplete URLs (like "https://e" or "http://")
    if (url.match(/^https?:\/\/[^\/]+$/) && url.length < 15) return false;
    
    try {
      const urlObj = new URL(url);
      // Ensure it has a valid hostname
      return urlObj.hostname.length > 0 && !urlObj.hostname.includes(' ');
    } catch {
      // For relative paths, check if they're valid
      if (url.startsWith('/')) {
        return url.length > 1;
      }
      // For data URLs, validate format
      if (url.startsWith('data:')) {
        return url.includes(',');
      }
      return false;
    }
  };

  const getImageUrl = (url: string): string | null => {
    if (!url || typeof url !== 'string' || url.trim() === '') return null;
    
    // Don't process partial/invalid URLs
    if (!isValidUrl(url)) return null;
    
    // Handle data URLs
    if (url.startsWith('data:')) {
      return url;
    }
    
    // Handle upload paths (relative paths from our server)
    if (url.includes('/uploads/')) {
      // If it's already a frontend proxy URL, return as is
      if (url.startsWith('/api/images/uploads/')) {
        return url;
      }
      // If it's a full backend URL, convert to frontend proxy
      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const urlObj = new URL(url);
          if (urlObj.pathname.includes('/uploads/')) {
            return `/api/images${urlObj.pathname}`;
          }
        } catch {
          // Invalid URL, try to extract path
          const match = url.match(/\/uploads\/[^\/]+.*$/);
          if (match) {
            return `/api/images${match[0]}`;
          }
        }
      }
      // If it's a relative path starting with /uploads/, convert to frontend proxy
      if (url.startsWith('/uploads/')) {
        return `/api/images${url}`;
      }
      // If it includes /uploads/ but doesn't start with /, try to extract
      const path = url.split('/uploads/')[1];
      if (path && path.trim() !== '') {
        return `/api/images/uploads/${path}`;
      }
      return null;
    }
    
    // Handle absolute URLs (external or full backend URLs)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        // Only return if it's a complete, valid URL
        if (urlObj.hostname && urlObj.hostname.length > 0) {
          return url;
        }
        return null;
      } catch {
        return null;
      }
    }
    
    // Handle relative URLs (our own paths)
    if (url.startsWith('/')) {
      // If it's already /api/images, return as is
      if (url.startsWith('/api/images')) {
        return url;
      }
      return url;
    }
    
    return null;
  };

  const metaTitleLength = metaTitle?.length || 0;
  const metaDescLength = metaDescription?.length || 0;
  const titleStatus = metaTitleLength > 0 && metaTitleLength <= 60 ? 'good' : metaTitleLength > 60 ? 'warning' : 'empty';
  const descStatus = metaDescLength > 0 && metaDescLength <= 160 ? 'good' : metaDescLength > 160 ? 'warning' : 'empty';

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Search Engine Preview - Compact */}
        <Card className={`border-2 transition-all ${
          titleStatus === 'good' && descStatus === 'good' 
            ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20' 
            : 'border-border'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className={`h-4 w-4 ${
                  titleStatus === 'good' && descStatus === 'good' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-muted-foreground'
                }`} />
                <CardTitle className="text-base">Search Preview</CardTitle>
              </div>
              <Badge 
                variant={titleStatus === 'good' && descStatus === 'good' ? 'default' : 'secondary'} 
                className={`text-xs ${
                  titleStatus === 'good' && descStatus === 'good' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : ''
                }`}
              >
                {titleStatus === 'good' && descStatus === 'good' ? '✓ Ready' : '⚠ Needs Work'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border rounded-md p-3 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-xs text-muted-foreground font-medium">example.com</p>
                </div>
                <h3 className={`text-base font-medium line-clamp-1 transition-all ${
                  titleStatus === 'good' ? 'text-blue-600 dark:text-blue-400' : 
                  titleStatus === 'warning' ? 'text-orange-600 dark:text-orange-400' : 
                  'text-gray-400 dark:text-gray-500 italic'
                }`}>
                  {metaTitle || 'Enter a meta title...'}
                </h3>
                <p className={`text-sm line-clamp-2 transition-all ${
                  descStatus === 'good' ? 'text-gray-600 dark:text-gray-300' : 
                  descStatus === 'warning' ? 'text-orange-600 dark:text-orange-400' : 
                  'text-gray-400 dark:text-gray-500 italic'
                }`}>
                  {metaDescription || 'Enter a meta description...'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs px-1">
              <span className={`font-medium ${
                titleStatus === 'good' 
                  ? 'text-green-600 dark:text-green-400' 
                  : titleStatus === 'warning' 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-muted-foreground'
              }`}>
                Title: {metaTitleLength}/60
              </span>
              <span className={`font-medium ${
                descStatus === 'good' 
                  ? 'text-green-600 dark:text-green-400' 
                  : descStatus === 'warning' 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-muted-foreground'
              }`}>
                Desc: {metaDescLength}/160
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Preview - Compact */}
        <Card className={`border-2 transition-all ${
          ogImage && ogTitle 
            ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20' 
            : 'border-border'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className={`h-4 w-4 ${
                  ogImage && ogTitle 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-muted-foreground'
                }`} />
                <CardTitle className="text-base">Social Preview</CardTitle>
              </div>
              <Badge 
                variant={ogImage && ogTitle ? 'default' : 'secondary'} 
                className={`text-xs ${
                  ogImage && ogTitle 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : ''
                }`}
              >
                {ogImage && ogTitle ? '✓ Ready' : '⚠ No Image'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
              {ogImage && getImageUrl(ogImage) ? (
                <div className="aspect-video relative bg-muted">
                  {(() => {
                    const imageUrl = getImageUrl(ogImage)!;
                    // Use regular img tag for external URLs to avoid Next.js Image configuration issues
                    // Next.js Image is optimized for our own images, but external URLs need configuration
                    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                      return (
                        <img
                          src={imageUrl}
                          alt={ogTitle}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide broken images
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      );
                    }
                    // Use Next.js Image for our own images (relative paths, data URLs)
                    return (
                      <Image
                        src={imageUrl}
                        alt={ogTitle}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                        onError={() => {
                          // Image will be hidden by Next.js on error
                        }}
                      />
                    );
                  })()}
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-center space-y-2">
                    <Eye className="h-8 w-8 text-muted-foreground opacity-50 mx-auto" />
                    <p className="text-xs text-muted-foreground">Add OG image</p>
                  </div>
                </div>
              )}
              <div className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-300"></div>
                  <p className="text-xs text-muted-foreground font-medium">example.com</p>
                </div>
                <h3 className={`font-semibold text-sm line-clamp-2 transition-all ${
                  ogTitle ? 'text-foreground' : 'text-gray-400 dark:text-gray-500 italic'
                }`}>
                  {ogTitle || 'Enter OG title...'}
                </h3>
                <p className={`text-xs line-clamp-2 transition-all ${
                  ogDescription ? 'text-muted-foreground' : 'text-gray-400 dark:text-gray-500 italic'
                }`}>
                  {ogDescription || 'Enter OG description...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Engine Preview</CardTitle>
          <CardDescription>
            How your product will appear in search engine results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <p className="text-xs text-muted-foreground">example.com</p>
              </div>
              <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline line-clamp-1">
                {metaTitle || 'Product Title'}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {metaDescription || 'Product description will appear here...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media Preview</CardTitle>
          <CardDescription>
            How your product will appear when shared on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 max-w-md">
            {ogImage && getImageUrl(ogImage) ? (
              <div className="aspect-video relative bg-muted">
                {(() => {
                  const imageUrl = getImageUrl(ogImage)!;
                  // Use regular img tag for external URLs to avoid Next.js Image configuration issues
                  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    return (
                      <img
                        src={imageUrl}
                        alt={ogTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    );
                  }
                  // Use Next.js Image for our own images
                  return (
                    <Image
                      src={imageUrl}
                      alt={ogTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  );
                })()}
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center space-y-2">
                  <Eye className="h-8 w-8 text-muted-foreground opacity-50 mx-auto" />
                  <p className="text-xs text-muted-foreground">Add OG image</p>
                </div>
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-300"></div>
                <p className="text-xs text-muted-foreground">example.com</p>
              </div>
              <h3 className="font-semibold line-clamp-2">
                {ogTitle || 'Product Title'}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ogDescription || 'Product description will appear here...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metadata Details</CardTitle>
          <CardDescription>Current metadata configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Meta Title</Label>
            <p className="text-sm text-muted-foreground">
              {metaTitle || 'Not set (using product name)'}
            </p>
            <p className="text-xs text-muted-foreground">
              Length: {metaTitle?.length || 0} / 60 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Meta Description</Label>
            <p className="text-sm text-muted-foreground">
              {metaDescription || 'Not set'}
            </p>
            <p className="text-xs text-muted-foreground">
              Length: {metaDescription?.length || 0} / 160 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Open Graph Image</Label>
            <p className="text-sm text-muted-foreground">
              {ogImage ? 'Set' : 'Not set (using first product image)'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
