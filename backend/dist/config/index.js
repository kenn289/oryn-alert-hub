"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    HOST: process.env.HOST || 'localhost',
    CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    DATABASE: {
        URL: process.env.DATABASE_URL || '',
        HOST: process.env.DB_HOST || 'localhost',
        PORT: parseInt(process.env.DB_PORT || '5432', 10),
        NAME: process.env.DB_NAME || 'oryn',
        USER: process.env.DB_USER || 'postgres',
        PASSWORD: process.env.DB_PASSWORD || '',
        SSL: process.env.DB_SSL === 'true',
        POOL_SIZE: parseInt(process.env.DB_POOL_SIZE || '10', 10),
        CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
    },
    SUPABASE: {
        URL: process.env.SUPABASE_URL || '',
        ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
        SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    REDIS: {
        URL: process.env.REDIS_URL || 'redis://localhost:6379',
        HOST: process.env.REDIS_HOST || 'localhost',
        PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
        PASSWORD: process.env.REDIS_PASSWORD || '',
        DB: parseInt(process.env.REDIS_DB || '0', 10),
        TTL: parseInt(process.env.REDIS_TTL || '3600', 10),
    },
    JWT: {
        SECRET: process.env.JWT_SECRET || 'your-secret-key',
        EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
        REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    API_KEYS: {
        ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_API_KEY || '',
        POLYGON: process.env.POLYGON_API_KEY || '',
        IEX_CLOUD: process.env.IEX_CLOUD_API_KEY || '',
        OPENAI: process.env.OPENAI_API_KEY || '',
        YAHOO_FINANCE: process.env.YAHOO_FINANCE_API_KEY || '',
    },
    RATE_LIMITS: {
        GENERAL: {
            WINDOW_MS: 15 * 60 * 1000,
            MAX: 100,
        },
        STOCK: {
            WINDOW_MS: 60 * 1000,
            MAX: 30,
        },
        ML: {
            WINDOW_MS: 60 * 1000,
            MAX: 10,
        },
        AUTH: {
            WINDOW_MS: 15 * 60 * 1000,
            MAX: 5,
        },
    },
    ML: {
        MODEL_PATH: process.env.ML_MODEL_PATH || './models',
        BATCH_SIZE: parseInt(process.env.ML_BATCH_SIZE || '32', 10),
        PREDICTION_CACHE_TTL: parseInt(process.env.ML_CACHE_TTL || '300', 10),
        CONFIDENCE_THRESHOLD: parseFloat(process.env.ML_CONFIDENCE_THRESHOLD || '0.7'),
        MAX_PREDICTIONS_PER_USER: parseInt(process.env.ML_MAX_PREDICTIONS || '100', 10),
    },
    STOCK: {
        CACHE_TTL: parseInt(process.env.STOCK_CACHE_TTL || '60', 10),
        MAX_SYMBOLS_PER_REQUEST: parseInt(process.env.STOCK_MAX_SYMBOLS || '50', 10),
        TIMEOUT: parseInt(process.env.STOCK_TIMEOUT || '10000', 10),
        RETRY_ATTEMPTS: parseInt(process.env.STOCK_RETRY_ATTEMPTS || '3', 10),
    },
    WEBSOCKET: {
        PING_TIMEOUT: parseInt(process.env.WS_PING_TIMEOUT || '60000', 10),
        PING_INTERVAL: parseInt(process.env.WS_PING_INTERVAL || '25000', 10),
        MAX_CONNECTIONS: parseInt(process.env.WS_MAX_CONNECTIONS || '1000', 10),
    },
    CRON: {
        STOCK_UPDATE_INTERVAL: process.env.CRON_STOCK_UPDATE || '*/5 * * * *',
        ML_TRAINING_INTERVAL: process.env.CRON_ML_TRAINING || '0 2 * * *',
        CLEANUP_INTERVAL: process.env.CRON_CLEANUP || '0 3 * * *',
    },
    MONITORING: {
        ENABLED: process.env.MONITORING_ENABLED === 'true',
        METRICS_PORT: parseInt(process.env.METRICS_PORT || '9090', 10),
        HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
    },
    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'info',
        FORMAT: process.env.LOG_FORMAT || 'json',
        FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log',
        MAX_SIZE: process.env.LOG_MAX_SIZE || '10m',
        MAX_FILES: process.env.LOG_MAX_FILES || '5',
    },
    SECURITY: {
        BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
        SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-encryption-key',
    },
    FEATURES: {
        ML_PREDICTIONS: process.env.FEATURE_ML_PREDICTIONS === 'true',
        REAL_TIME_UPDATES: process.env.FEATURE_REAL_TIME === 'true',
        ADVANCED_ANALYTICS: process.env.FEATURE_ANALYTICS === 'true',
        TEAM_COLLABORATION: process.env.FEATURE_TEAM === 'true',
        API_DOCUMENTATION: process.env.FEATURE_API_DOCS === 'true',
    },
};
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET',
];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
}
exports.default = exports.config;
//# sourceMappingURL=index.js.map