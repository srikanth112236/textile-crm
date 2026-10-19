import { Client } from '@elastic/elasticsearch';

let esClient: Client | null = null;

/**
 * Initialize Elasticsearch client
 * Gracefully degrades if Elasticsearch is not available
 */
export const initializeElasticsearch = (): Client | null => {
  if (esClient) {
    return esClient;
  }

  const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  const esEnabled = process.env.ELASTICSEARCH_ENABLED !== 'false';

  if (!esEnabled) {
    console.warn('⚠️  Elasticsearch is disabled via ELASTICSEARCH_ENABLED=false');
    return null;
  }

  try {
    esClient = new Client({
      node: esUrl,
      requestTimeout: 30010,
      maxRetries: 3,
      // For development, skip TLS verification
      ...(process.env.NODE_ENV === 'development' && {
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    });

    // Test connection
    esClient.ping()
      .then(() => {
        console.log('✅ Elasticsearch connected successfully');
      })
      .catch(() => {
        console.warn('⚠️  Elasticsearch connection failed. Search will use MongoDB text search.');
        console.warn('   To enable Elasticsearch, start Docker: docker compose up -d');
        esClient = null;
      });

    return esClient;
  } catch (error: any) {
    console.warn('⚠️  Elasticsearch initialization failed:', error.message);
    console.warn('   Search will use MongoDB text search as fallback.');
    esClient = null;
    return null;
  }
};

/**
 * Get Elasticsearch client (returns null if not available)
 */
export const getElasticsearchClient = (): Client | null => {
  if (!esClient) {
    return initializeElasticsearch();
  }
  return esClient;
};

/**
 * Check if Elasticsearch is available
 */
export const isElasticsearchAvailable = (): boolean => {
  return esClient !== null && esClient !== undefined;
};

export default esClient;

