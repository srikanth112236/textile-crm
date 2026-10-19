'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
}

export function HeroBanner({
  title = 'Welcome to Our Store',
  subtitle = 'Discover amazing products at unbeatable prices',
  ctaText = 'Shop Now',
  ctaLink = '/products',
  imageUrl,
}: HeroBannerProps) {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg mb-8">
      {/* Background Image or Gradient */}
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href={ctaLink}>
              <Button size="lg" className="group">
                {ctaText}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

