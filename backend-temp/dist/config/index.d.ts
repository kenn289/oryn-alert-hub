export declare const config: {
    NODE_ENV: string;
    PORT: number;
    HOST: string;
    CORS_ORIGINS: string[];
    DATABASE: {
        URL: string;
        HOST: string;
        PORT: number;
        NAME: string;
        USER: string;
        PASSWORD: string;
        SSL: boolean;
        POOL_SIZE: number;
        CONNECTION_TIMEOUT: number;
    };
    SUPABASE: {
        URL: string;
        ANON_KEY: string;
        SERVICE_ROLE_KEY: string;
    };
    REDIS: {
        URL: string;
        HOST: string;
        PORT: number;
        PASSWORD: string;
        DB: number;
        TTL: number;
    };
    JWT: {
        SECRET: string;
        EXPIRES_IN: string;
        REFRESH_EXPIRES_IN: string;
    };
    API_KEYS: {
        ALPHA_VANTAGE: string;
        POLYGON: string;
        IEX_CLOUD: string;
        OPENAI: string;
        YAHOO_FINANCE: string;
    };
    RATE_LIMITS: {
        GENERAL: {
            WINDOW_MS: number;
            MAX: number;
        };
        STOCK: {
            WINDOW_MS: number;
            MAX: number;
        };
        ML: {
            WINDOW_MS: number;
            MAX: number;
        };
        AUTH: {
            WINDOW_MS: number;
            MAX: number;
        };
    };
    ML: {
        MODEL_PATH: string;
        BATCH_SIZE: number;
        PREDICTION_CACHE_TTL: number;
        CONFIDENCE_THRESHOLD: number;
        MAX_PREDICTIONS_PER_USER: number;
    };
    STOCK: {
        CACHE_TTL: number;
        MAX_SYMBOLS_PER_REQUEST: number;
        TIMEOUT: number;
        RETRY_ATTEMPTS: number;
    };
    WEBSOCKET: {
        PING_TIMEOUT: number;
        PING_INTERVAL: number;
        MAX_CONNECTIONS: number;
    };
    CRON: {
        STOCK_UPDATE_INTERVAL: string;
        ML_TRAINING_INTERVAL: string;
        CLEANUP_INTERVAL: string;
    };
    MONITORING: {
        ENABLED: boolean;
        METRICS_PORT: number;
        HEALTH_CHECK_INTERVAL: number;
    };
    LOGGING: {
        LEVEL: string;
        FORMAT: string;
        FILE_PATH: string;
        MAX_SIZE: string;
        MAX_FILES: string;
    };
    SECURITY: {
        BCRYPT_ROUNDS: number;
        SESSION_SECRET: string;
        ENCRYPTION_KEY: string;
    };
    FEATURES: {
        ML_PREDICTIONS: boolean;
        REAL_TIME_UPDATES: boolean;
        ADVANCED_ANALYTICS: boolean;
        TEAM_COLLABORATION: boolean;
        API_DOCUMENTATION: boolean;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map