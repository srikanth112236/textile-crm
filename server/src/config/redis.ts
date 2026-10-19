import Redis from 'ioredis';

// Create Redis client with connection retry logic
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    // Limit retry attempts to avoid infinite loops
    if (times > 5) {
      // Stop retrying after 5 attempts
      return null;
    }
    const delay = Math.min(times * 100, 1000);
    return delay;
  },
  // Disable offline queue to fail fast when disconnected
  enableOfflineQueue: false,
  // Lazy connect - don't connect immediately
  lazyConnect: true,
  // Max retries per command
  maxRetriesPerRequest: null,
});

// Track connection status
let isRedisConnected = false;

// Handle connection events
redisClient.on('connect', () => {
  isRedisConnected = true;
  console.log('✅ Redis connected successfully');
});

// Only log first error to avoid spam
let errorLogged = false;
redisClient.on('error', (_error) => {
  isRedisConnected = false;
  if (!errorLogged) {
    console.warn('⚠️  Redis connection failed. Starting without Redis cache.');
    console.warn('   To enable Redis, start Docker: docker compose up -d');
    errorLogged = true;
  }
});

redisClient.on('close', () => {
  isRedisConnected = false;
});

// Attempt to connect (will fail gracefully if Redis is not available)
// This is non-blocking for development
redisClient.connect().catch(() => {
  // Connection failed silently - Redis is optional for basic functionality
  // The app will work without Redis, just without caching
  isRedisConnected = false;
});

/**
 * Helper function to safely use Redis operations
 * Returns false if Redis is not connected (graceful degradation)
 */
export const safeRedisOperation = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | false> => {
  if (!isRedisConnected || redisClient.status !== 'ready') {
    return fallback ?? false;
  }

  try {
    return await operation();
  } catch (error: any) {
    // If Redis operation fails, log but don't crash
    if (error.message !== 'Connection is closed.') {
      console.warn('⚠️  Redis operation failed:', error.message);
    }
    isRedisConnected = false;
    return fallback ?? false;
  }
};

export default redisClient;

