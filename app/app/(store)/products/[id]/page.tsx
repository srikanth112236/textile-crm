import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';
import { productsApi } from '@/lib/api/products';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

// cache() dedupes the two awaits below (generateMetadata + page) into ONE
// backend call per navigation — previously every PDP did 2 sequential fetches.
const getCachedProduct = cache(async (id: string) => {
  try {
    const response = await productsApi.getProduct(id);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
});

async function getProduct(id: string) {
  return getCachedProduct(id);
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const metaTitle = product.metadata?.metaTitle || product.name;
  const rawDescription = product.metadata?.metaDescription || product.description || '';
  const metaDescription =
    rawDescription.length > 160
      ? `${rawDescription.slice(0, 157).trimEnd()}...`
      : rawDescription;
  const ogImage = product.metadata?.ogImage || (product.images && product.images.length > 0
    ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)
    : '');

  const imageUrl = ogImage.includes('/uploads/') ? `${process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com'}${ogImage}` : ogImage;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: product.metadata?.metaKeywords?.join(', '),
    openGraph: {
      title: product.metadata?.ogTitle || metaTitle,
      description: product.metadata?.ogDescription || metaDescription,
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
      type: 'website',
    },
    twitter: {
      card: (product.metadata?.twitterCard as 'summary' | 'summary_large_image') || 'summary_large_image',
      title: product.metadata?.ogTitle || metaTitle,
      description: product.metadata?.ogDescription || metaDescription,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: product.metadata?.canonicalUrl || `/products/${id}`,
    },
  };
}

export default async function ProductDetailPage(props: ProductDetailPageProps) {
  const { id } = await props.params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // Structured data for SEO
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3001';
  const absoluteImage = (img: string) => (img.startsWith('http') ? img : `${siteUrl}${img.startsWith('/') ? '' : '/'}${img}`);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product._id,
    url: `${siteUrl}/products/${product._id}`,
    brand: { '@type': 'Brand', name: 'Mentoos' },
    image: product.images?.map(img => absoluteImage(typeof img === 'string' ? img : img.url)) || [],
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/products/${product._id}`,
    },
    aggregateRating: product.averageRating && product.totalReviews ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.totalReviews,
    } : undefined,
  };

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteUrl}/products` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${siteUrl}/products/${product._id}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([structuredData, breadcrumbData]) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}

