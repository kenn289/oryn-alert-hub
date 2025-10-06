import { createClient, RedisClientType } from 'redis';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class CacheService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: config.REDIS.URL,
      password: config.REDIS.PASSWORD,
      database: config.REDIS.DB,
      socket: {
        connectTimeout: 10000,
        lazyConnect: true
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('🔗 Redis connecting...');
    });

    this.client.on('ready', () => {
      logger.info('✅ Redis connected and ready');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('❌ Redis error:', error);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.info('🔌 Redis connection ended');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('💾 Initializing Cache Service...');
      
      await this.client.connect();
      
      // Test connection
      await this.client.ping();
      
      logger.info('✅ Cache Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Cache Service:', error);
      throw error;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        logger.warn('Cache not connected, skipping get operation');
        return null;
      }

      const value = await this.client.get(key);
      
      if (!value) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Cache not connected, skipping set operation');
        return false;
      }

      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        logger.warn('Cache not connected, skipping delete operation');
        return false;
      }

      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return -1;
      }

      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Cache keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  public async flush(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.client.flushDb();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  public async getStats(): Promise<any> {
    try {
      if (!this.isConnected) {
        return {
          connected: false,
          status: 'disconnected'
        };
      }

      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: true,
        status: 'connected',
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace)
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return {
        connected: false,
        status: 'error',
        error: error.message
      };
    }
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }

  public getStatus(): string {
    return this.isConnected ? 'connected' : 'disconnected';
  }

  public async close(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.quit();
        logger.info('✅ Cache Service closed');
      }
    } catch (error) {
      logger.error('Error closing Cache Service:', error);
    }
  }
}
