import { Pool } from 'pg';
import Redis from 'redis';
import { promisify } from 'util';

// PostgreSQL connection pool configuration
export const pgPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis client configuration
export const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000,
    keepAlive: 5000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  }
});

// Promisify Redis methods
export const redisGet = promisify(redisClient.get).bind(redisClient);
export const redisSet = promisify(redisClient.set).bind(redisClient);

// Cache middleware
export const cacheMiddleware = (duration: number) => {
  return async (req: any, res: any, next: any) => {
    const key = `cache:${req.originalUrl || req.url}`;
    try {
      const cachedResponse = await redisGet(key);
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }
      res.sendResponse = res.json;
      res.json = (body: any) => {
        redisSet(key, JSON.stringify(body), 'EX', duration);
        res.sendResponse(body);
      };
      next();
    } catch (error) {
      console.error('Redis cache error:', error);
      next();
    }
  };
};

// Database health check
export const checkDatabaseConnection = async () => {
  try {
    const client = await pgPool.connect();
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
  try {
    await redisClient.ping();
    console.log('Redis connection successful');
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    return false;
  }
};

// Initialize connections
export const initializeDatabaseConnections = async () => {
  await checkDatabaseConnection();
  await checkRedisConnection();
  
  pgPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });
}; 