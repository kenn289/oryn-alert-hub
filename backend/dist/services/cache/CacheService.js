"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = require("redis");
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
class CacheService {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: config_1.config.REDIS.URL,
            password: config_1.config.REDIS.PASSWORD,
            database: config_1.config.REDIS.DB,
            socket: {
                connectTimeout: 10000,
                lazyConnect: true
            }
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger_1.logger.info('🔗 Redis connecting...');
        });
        this.client.on('ready', () => {
            logger_1.logger.info('✅ Redis connected and ready');
            this.isConnected = true;
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('❌ Redis error:', error);
            this.isConnected = false;
        });
        this.client.on('end', () => {
            logger_1.logger.info('🔌 Redis connection ended');
            this.isConnected = false;
        });
        this.client.on('reconnecting', () => {
            logger_1.logger.info('🔄 Redis reconnecting...');
        });
    }
    async initialize() {
        try {
            logger_1.logger.info('💾 Initializing Cache Service...');
            await this.client.connect();
            await this.client.ping();
            logger_1.logger.info('✅ Cache Service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize Cache Service:', error);
            throw error;
        }
    }
    async get(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Cache not connected, skipping get operation');
                return null;
            }
            const value = await this.client.get(key);
            if (!value) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Cache not connected, skipping set operation');
                return false;
            }
            const serializedValue = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, serializedValue);
            }
            else {
                await this.client.set(key, serializedValue);
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }
    async del(key) {
        try {
            if (!this.isConnected) {
                logger_1.logger.warn('Cache not connected, skipping delete operation');
                return false;
            }
            const result = await this.client.del(key);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }
    async exists(key) {
        try {
            if (!this.isConnected) {
                return false;
            }
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }
    async expire(key, ttlSeconds) {
        try {
            if (!this.isConnected) {
                return false;
            }
            const result = await this.client.expire(key, ttlSeconds);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Cache expire error for key ${key}:`, error);
            return false;
        }
    }
    async ttl(key) {
        try {
            if (!this.isConnected) {
                return -1;
            }
            return await this.client.ttl(key);
        }
        catch (error) {
            logger_1.logger.error(`Cache TTL error for key ${key}:`, error);
            return -1;
        }
    }
    async keys(pattern) {
        try {
            if (!this.isConnected) {
                return [];
            }
            return await this.client.keys(pattern);
        }
        catch (error) {
            logger_1.logger.error(`Cache keys error for pattern ${pattern}:`, error);
            return [];
        }
    }
    async flush() {
        try {
            if (!this.isConnected) {
                return false;
            }
            await this.client.flushDb();
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache flush error:', error);
            return false;
        }
    }
    async getStats() {
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
        }
        catch (error) {
            logger_1.logger.error('Cache stats error:', error);
            return {
                connected: false,
                status: 'error',
                error: error.message
            };
        }
    }
    parseRedisInfo(info) {
        const lines = info.split('\r\n');
        const result = {};
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                result[key] = value;
            }
        }
        return result;
    }
    getStatus() {
        return this.isConnected ? 'connected' : 'disconnected';
    }
    async close() {
        try {
            if (this.isConnected) {
                await this.client.quit();
                logger_1.logger.info('✅ Cache Service closed');
            }
        }
        catch (error) {
            logger_1.logger.error('Error closing Cache Service:', error);
        }
    }
}
exports.CacheService = CacheService;
//# sourceMappingURL=CacheService.js.map