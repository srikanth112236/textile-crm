import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CategoryProductsClient } from '@/components/products/CategoryProductsClient';
import { categoriesApi } from '@/lib/api/categories';
import { productsApi } from '@/lib/api/products';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }>;
}

async function getCategory(slug: string) {
  try {
    const categories = await categoriesApi.getCategories();
    const category = categories.data.find((cat) => cat.slug === slug);
    return category || null;
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return null;
  }
}

async function getCategoryProducts(slug: string, searchParams: Awaited<CategoryPageProps['searchParams']>) {
  try {
    const category = await getCategory(slug);
    if (!category) {
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

    const filters = {
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: 20,
      category: category._id,
      status: 'active', // Only show active products
      sort: searchParams.sort || 'createdAt',
      order: searchParams.order || 'desc',
    };

    const response = await productsApi.getProducts(filters);
    return { response, category };
  } catch (error) {
    console.error('Failed to fetch category products:', error);
    return {
      response: {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      },
      category: null,
    };
  }
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
    title: `${category.name} | E-Commerce Platform`,
    description: `Browse ${category.name} products in our catalog`,
    openGraph: {
      title: `${category.name} | E-Commerce Platform`,
      description: `Browse ${category.name} products in our catalog`,
      type: 'website',
    },
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const { response, category } = await getCategoryProducts(slug, searchParams);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
        <p className="text-muted-foreground">
          {response.pagination.total > 0
            ? `${response.pagination.total} product${response.pagination.total === 1 ? '' : 's'} in this category`
            : 'No products in this category'}
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading products...</div>}>
        <CategoryProductsClient
          category={category}
          initialProducts={response.data}
          initialPagination={response.pagination}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

