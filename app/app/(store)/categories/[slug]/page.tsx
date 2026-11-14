import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, cache } from 'react';
import { CategoryProductsClient } from '@/components/products/CategoryProductsClient';
import { categoriesApi, findCategoryBySlug } from '@/lib/api/categories';
import { productsApi } from '@/lib/api/products';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    minPrice?: string;
    maxPrice?: string;
    size?: string;
    color?: string;
  }>;
}

const getCategory = cache(async (slug: string) => {
  try {
    const categories = await categoriesApi.getCategories();
    const category = findCategoryBySlug(categories.data || [], slug);
    return category || null;
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return null;
  }
});

async function getCategoryProducts(
  category: NonNullable<Awaited<ReturnType<typeof getCategory>>>,
  searchParams: Awaited<CategoryPageProps['searchParams']>
) {
  try {
    const filters = {
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: 20,
      category: category._id,
      status: 'active', // Only show active products
      sort: searchParams.sort || 'createdAt',
      order: searchParams.order || 'desc',
      minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
      size: searchParams.size,
      color: searchParams.color,
    };

    return await productsApi.getProducts(filters);
  } catch (error) {
    console.error('Failed to fetch category products:', error);
    return {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    };
  }
}

function CategoryListingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="hidden lg:block lg:col-span-1 h-[520px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

async function CategoryListing({
  category,
  searchParams,
}: {
  category: NonNullable<Awaited<ReturnType<typeof getCategory>>>;
  searchParams: Awaited<CategoryPageProps['searchParams']>;
}) {
  const response = await getCategoryProducts(category, searchParams);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3001';

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${siteUrl}/categories` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${siteUrl}/categories/${category.slug}` },
    ],
  };

  const itemListData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} at Mentoos`,
    numberOfItems: response.data.length,
    itemListElement: response.data.slice(0, 20).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: `${siteUrl}/products/${product._id}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbData, itemListData]) }}
      />
      <p className="text-muted-foreground mb-6">
        {response.pagination.total > 0
          ? `${response.pagination.total} product${response.pagination.total === 1 ? '' : 's'} in this category`
          : 'No products in this category'}
      </p>
      <CategoryProductsClient
        category={category}
        initialProducts={response.data}
        initialPagination={response.pagination}
        searchParams={searchParams}
      />
    </>
  );
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} | Mentoos`,
    description:
      (category as any).description ||
      `Shop ${category.name} at Mentoos. Explore new arrivals, bestsellers and everyday essentials with easy size, colour and price filters.`,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: {
      title: `${category.name} | Mentoos`,
      description:
        (category as any).description ||
        `Shop ${category.name} at Mentoos. Explore new arrivals, bestsellers and everyday essentials.`,
      type: 'website',
      url: `/categories/${slug}`,
    },
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
      </div>

      <Suspense fallback={<CategoryListingSkeleton />}>
        <CategoryListing category={category} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

