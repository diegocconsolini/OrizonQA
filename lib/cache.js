import { kv } from '@vercel/kv';
import { createClient } from 'redis';

/**
 * Cache connection strategy:
 * - Production (Vercel): Uses @vercel/kv (automatically configured)
 * - Local dev: Uses redis client with local Redis
 *
 * Environment variables:
 * - KV_REST_API_URL: Vercel KV endpoint (auto-populated on Vercel)
 * - KV_REST_API_TOKEN: Vercel KV token (auto-populated on Vercel)
 * - REDIS_URL: Local Redis connection string (e.g., redis://localhost:6379)
 */

let redisClient = null;
let isConnected = false;

// Initialize cache connection
async function getCache() {
  // On Vercel, use @vercel/kv
  if (process.env.VERCEL || process.env.KV_REST_API_URL) {
    return kv;
  }

  // Local development: use redis client
  if (!redisClient) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 2000,
        },
      });

      redisClient.on('error', (err) => {
        console.warn('Redis connection error (cache disabled):', err.message);
        isConnected = false;
      });

      redisClient.on('connect', () => {
        console.log('✓ Redis cache connected');
        isConnected = true;
      });

      await redisClient.connect();
    } catch (error) {
      console.warn('Redis not available, cache disabled:', error.message);
      return createMockCache();
    }
  }

  // Wrap redis client to match Vercel KV interface
  return {
    get: async (key) => {
      if (!isConnected) return null;
      try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.warn('Cache get error:', error.message);
        return null;
      }
    },
    set: async (key, value, opts = {}) => {
      if (!isConnected) return null;
      try {
        const serialized = JSON.stringify(value);
        if (opts.ex) {
          await redisClient.setEx(key, opts.ex, serialized);
        } else {
          await redisClient.set(key, serialized);
        }
        return 'OK';
      } catch (error) {
        console.warn('Cache set error:', error.message);
        return null;
      }
    },
    del: async (key) => {
      if (!isConnected) return 0;
      try {
        return await redisClient.del(key);
      } catch (error) {
        console.warn('Cache del error:', error.message);
        return 0;
      }
    },
    exists: async (key) => {
      if (!isConnected) return 0;
      try {
        return await redisClient.exists(key);
      } catch (error) {
        console.warn('Cache exists error:', error.message);
        return 0;
      }
    }
  };
}

// Mock cache for when Redis is unavailable
function createMockCache() {
  const mockStore = new Map();
  console.warn('Using in-memory cache (Redis unavailable)');

  return {
    get: async (key) => mockStore.get(key) || null,
    set: async (key, value, opts = {}) => {
      mockStore.set(key, value);
      if (opts.ex) {
        setTimeout(() => mockStore.delete(key), opts.ex * 1000);
      }
      return 'OK';
    },
    del: async (key) => {
      mockStore.delete(key);
      return 1;
    },
    exists: async (key) => mockStore.has(key) ? 1 : 0
  };
}

export const cache = await getCache();

/**
 * Cache GitHub repository data
 */
export async function cacheGitHubRepo(owner, repo, branch, data, ttl = 3600) {
  const key = `github:${owner}/${repo}:${branch}`;
  try {
    await cache.set(key, data, { ex: ttl });
    console.log(`✓ Cached GitHub repo: ${key}`);
    return true;
  } catch (error) {
    console.warn('Failed to cache GitHub repo:', error.message);
    return false;
  }
}

/**
 * Get cached GitHub repository data
 */
export async function getCachedGitHubRepo(owner, repo, branch) {
  const key = `github:${owner}/${repo}:${branch}`;
  try {
    const data = await cache.get(key);
    if (data) {
      console.log(`✓ Cache hit: ${key}`);
    }
    return data;
  } catch (error) {
    console.warn('Failed to get cached GitHub repo:', error.message);
    return null;
  }
}

/**
 * Cache analysis result
 */
export async function cacheAnalysis(contentHash, result, ttl = 7200) {
  const key = `analysis:${contentHash}`;
  try {
    await cache.set(key, result, { ex: ttl });
    console.log(`✓ Cached analysis: ${contentHash.substring(0, 8)}...`);
    return true;
  } catch (error) {
    console.warn('Failed to cache analysis:', error.message);
    return false;
  }
}

/**
 * Get cached analysis result
 */
export async function getCachedAnalysis(contentHash) {
  const key = `analysis:${contentHash}`;
  try {
    const data = await cache.get(key);
    if (data) {
      console.log(`✓ Cache hit: analysis ${contentHash.substring(0, 8)}...`);
    }
    return data;
  } catch (error) {
    console.warn('Failed to get cached analysis:', error.message);
    return null;
  }
}
