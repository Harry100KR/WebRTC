import { Pool } from 'pg';
import { createClient } from 'redis';
import NodeCache from 'node-cache';
import { config } from 'dotenv';

config();

// PostgreSQL connection pool configuration
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Export for use in other files
export default pool;

// Fallback in-memory cache for development
const memoryCache = new NodeCache({
  stdTTL: 600, // 10 minutes default TTL
  checkperiod: 120,
});

// Redis client configuration
let redisClient: any = null;
const useRedis = process.env.USE_REDIS === 'true';

if (useRedis) {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 10000,
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
    }
  });

  // Connect to Redis
  redisClient.connect().catch((err: Error) => {
    console.warn('Redis connection failed, falling back to in-memory cache:', err.message);
    redisClient = null;
  });
}

// Cache middleware
export const cacheMiddleware = (duration: number) => {
  return async (req: any, res: any, next: any) => {
    const key = `cache:${req.originalUrl || req.url}`;
    try {
      let cachedResponse: string | null = null;
      
      if (redisClient) {
        // Try Redis first
        const redisResponse = await redisClient.get(key);
        cachedResponse = redisResponse || null;
      } else {
        // Fallback to memory cache
        const memoryResponse = memoryCache.get<string>(key);
        cachedResponse = memoryResponse || null;
      }

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      res.sendResponse = res.json;
      res.json = (body: any) => {
        const stringifiedBody = JSON.stringify(body);
        if (redisClient) {
          redisClient.set(key, stringifiedBody, { EX: duration }).catch(console.error);
        } else {
          memoryCache.set(key, stringifiedBody, duration);
        }
        res.sendResponse(body);
      };
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};

// Database health check
export const checkDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// Redis health check
export const checkRedisConnection = async () => {
  if (!useRedis) {
    console.log('Redis is disabled, using in-memory cache');
    return true;
  }
  
  try {
    if (redisClient) {
      await redisClient.ping();
      console.log('Redis connection successful');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Redis connection error:', error);
    return false;
  }
};

// Initialize connections
export const initializeDatabaseConnections = async () => {
  await checkDatabaseConnection();
  await checkRedisConnection();
  
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
  
  if (redisClient) {
    redisClient.on('error', (err: Error) => {
      console.error('Redis Client Error', err);
    });
  }
}; 