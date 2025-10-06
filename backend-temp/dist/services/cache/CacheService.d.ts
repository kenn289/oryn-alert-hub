export declare class CacheService {
    private client;
    private isConnected;
    constructor();
    private setupEventHandlers;
    initialize(): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    flush(): Promise<boolean>;
    getStats(): Promise<any>;
    private parseRedisInfo;
    getStatus(): string;
    close(): Promise<void>;
}
//# sourceMappingURL=CacheService.d.ts.map