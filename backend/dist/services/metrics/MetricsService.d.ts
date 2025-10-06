export declare class MetricsService {
    private isInitialized;
    private metrics;
    initialize(): Promise<void>;
    incrementCounter(metric: string, value?: number): void;
    setGauge(metric: string, value: number): void;
    recordResponseTime(time: number): void;
    getMetrics(): Record<string, number>;
    getMetric(metric: string): number;
    getStatus(): string;
    close(): Promise<void>;
}
//# sourceMappingURL=MetricsService.d.ts.map