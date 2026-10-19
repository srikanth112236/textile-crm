import { getElasticsearchClient } from '../config/elasticsearch';
import { Product, IProduct } from '../models/Product';

const PRODUCTS_INDEX = 'products';

/**
 * Create products index in Elasticsearch
 */
export const createProductsIndex = async (): Promise<void> => {
  const client = getElasticsearchClient();
  if (!client) return;

  try {
    const exists = await client.indices.exists({ index: PRODUCTS_INDEX });
    
    if (!exists) {
      await client.indices.create({
        index: PRODUCTS_INDEX,
        body: {
          mappings: {
            properties: {
              name: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              description: {
                type: 'text',
                analyzer: 'standard',
              },
              price: { type: 'float' },
              category: { type: 'keyword' },
              categoryName: { type: 'text' },
              status: { type: 'keyword' },
              sku: { type: 'keyword' },
              stock: { type: 'integer' },
              averageRating: { type: 'float' },
              createdAt: { type: 'date' },
            },
          },
        },
      });
      console.log(`✅ Elasticsearch index "${PRODUCTS_INDEX}" created`);
    }
  } catch (error: any) {
    console.error('Failed to create Elasticsearch index:', error.message);
  }
};

/**
 * Index a product in Elasticsearch
 */
export const indexProduct = async (product: IProduct): Promise<void> => {
  const client = getElasticsearchClient();
  if (!client) return;

  try {
    await createProductsIndex();

    // Get category name for search
    const categoryName = typeof product.category === 'object' && product.category !== null
      ? (product.category as any).name
      : undefined;

    await client.index({
      index: PRODUCTS_INDEX,
      id: product._id.toString(),
      body: {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category.toString(),
        categoryName,
        status: product.status,
        sku: product.sku,
        stock: product.stock,
        averageRating: product.averageRating || 0,
        createdAt: product.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Failed to index product:', error.message);
  }
};

/**
 * Update a product in Elasticsearch
 */
export const updateProductIndex = async (product: IProduct): Promise<void> => {
  const client = getElasticsearchClient();
  if (!client) return;

  try {
    // If product is inactive or discontinued, remove from index
    if (product.status === 'inactive' || product.status === 'discontinued') {
      await deleteProductIndex(product._id.toString());
      return;
    }

    await indexProduct(product);
  } catch (error: any) {
    console.error('Failed to update product index:', error.message);
  }
};

/**
 * Delete a product from Elasticsearch index
 */
export const deleteProductIndex = async (productId: string): Promise<void> => {
  const client = getElasticsearchClient();
  if (!client) return;

  try {
    await client.delete({
      index: PRODUCTS_INDEX,
      id: productId,
    }).catch(() => {
      // Ignore errors if document doesn't exist
    });
  } catch (error: any) {
    console.error('Failed to delete product from index:', error.message);
  }
};

/**
 * Search products using Elasticsearch
 */
export const searchProductsES = async (
  query: string,
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  } = {},
  page: number = 1,
  limit: number = 20
): Promise<{ products: any[]; total: number }> => {
  const client = getElasticsearchClient();
  
  // Fallback to MongoDB if Elasticsearch is not available
  if (!client) {
    return { products: [], total: 0 };
  }

  try {
    const skip = (page - 1) * limit;

    const mustClauses: any[] = [];

    // Text search
    if (query) {
      mustClauses.push({
        multi_match: {
          query,
          fields: ['name^3', 'description', 'categoryName'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    } else {
      // Match all if no query
      mustClauses.push({ match_all: {} });
    }

    // Filters
    if (filters.category) {
      mustClauses.push({ term: { category: filters.category } });
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const rangeFilter: any = {};
      if (filters.minPrice !== undefined) rangeFilter.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) rangeFilter.lte = filters.maxPrice;
      mustClauses.push({ range: { price: rangeFilter } });
    }

    if (filters.status) {
      mustClauses.push({ term: { status: filters.status } });
    } else {
      // Default: only active products
      mustClauses.push({ term: { status: 'active' } });
    }

    const searchBody: any = {
      query: {
        bool: {
          must: mustClauses,
        },
      },
      from: skip,
      size: limit,
      sort: [
        { _score: { order: 'desc' } },
        { createdAt: { order: 'desc' } },
      ],
    };

    const result = await client.search({
      index: PRODUCTS_INDEX,
      body: searchBody,
    });

    const products = result.body.hits.hits.map((hit: any) => ({
      _id: hit._id,
      ...hit._source,
    }));

    return {
      products,
      total: result.body.hits.total.value || 0,
    };
  } catch (error: any) {
    console.error('Elasticsearch search error:', error.message);
    return { products: [], total: 0 };
  }
};

/**
 * Get "more like this" recommendations
 */
export const getMoreLikeThis = async (
  productId: string,
  limit: number = 4
): Promise<any[]> => {
  const client = getElasticsearchClient();
  
  if (!client) {
    return [];
  }

  try {
    const result = await client.search({
      index: PRODUCTS_INDEX,
      body: {
        query: {
          more_like_this: {
            fields: ['name', 'description'],
            like: [{ _id: productId }],
            min_term_freq: 1,
            min_doc_freq: 1,
            max_query_terms: 12,
          },
        },
        size: limit,
      },
    });

    return result.body.hits.hits.map((hit: any) => ({
      _id: hit._id,
      ...hit._source,
    }));
  } catch (error: any) {
    console.error('More like this error:', error.message);
    return [];
  }
};

/**
 * Reindex all products (useful for initial setup or after schema changes)
 */
export const reindexAllProducts = async (): Promise<void> => {
  const client = getElasticsearchClient();
  if (!client) {
    console.warn('⚠️  Elasticsearch not available, skipping reindex');
    return;
  }

  try {
    console.log('🔄 Starting product reindexing...');
    const products = await Product.find({ status: 'active' }).populate('category', 'name');
    
    await createProductsIndex();

    // Bulk index products
    const body: any[] = [];
    for (const product of products) {
      body.push({ index: { _id: product._id.toString() } });
      const categoryName = typeof product.category === 'object' && product.category !== null
        ? (product.category as any).name
        : undefined;
      body.push({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category.toString(),
        categoryName,
        status: product.status,
        sku: product.sku,
        stock: product.stock,
        averageRating: product.averageRating || 0,
        createdAt: product.createdAt,
      });
    }

    if (body.length > 0) {
      await client.bulk({ index: PRODUCTS_INDEX, body });
      console.log(`✅ Reindexed ${products.length} products`);
    }
  } catch (error: any) {
    console.error('Failed to reindex products:', error.message);
  }
};

