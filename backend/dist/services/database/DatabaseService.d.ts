import { SupabaseClient } from '@supabase/supabase-js';
export interface DatabaseStats {
    connected: boolean;
    tables: string[];
    totalRecords: number;
    lastBackup?: Date;
    performance: {
        avgQueryTime: number;
        activeConnections: number;
        cacheHitRate: number;
    };
}
export declare class DatabaseService {
    private client;
    private isConnected;
    private stats;
    constructor();
    initialize(): Promise<void>;
    private testConnection;
    private initializeSchema;
    private tableExists;
    query<T>(table: string, options?: any): Promise<T[]>;
    insert<T>(table: string, data: T | T[]): Promise<T[]>;
    update<T>(table: string, id: string, data: Partial<T>): Promise<T[]>;
    delete(table: string, id: string): Promise<boolean>;
    upsert<T>(table: string, data: T | T[]): Promise<T[]>;
    executeSQL(sql: string): Promise<any>;
    getTableStats(table: string): Promise<any>;
    updateStats(): Promise<void>;
    backup(): Promise<boolean>;
    optimize(): Promise<boolean>;
    getStats(): DatabaseStats;
    getStatus(): string;
    getClient(): SupabaseClient;
    close(): Promise<void>;
}
//# sourceMappingURL=DatabaseService.d.ts.map