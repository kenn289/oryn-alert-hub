import { logger } from '../../utils/logger';

export class MetricsService {
  private isInitialized = false;
  private metrics: Map<string, number> = new Map();

  public async initialize(): Promise<void> {
    try {
      logger.info('📊 Initializing Metrics Service...');
      
      // Initialize default metrics
      this.metrics.set('requests_total', 0);
      this.metrics.set('requests_success', 0);
      this.metrics.set('requests_error', 0);
      this.metrics.set('response_time_avg', 0);
      this.metrics.set('active_connections', 0);
      
      this.isInitialized = true;
      logger.info('✅ Metrics Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Metrics Service:', error);
      throw error;
    }
  }

  public incrementCounter(metric: string, value: number = 1): void {
    if (!this.isInitialized) return;
    
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  public setGauge(metric: string, value: number): void {
    if (!this.isInitialized) return;
    
    this.metrics.set(metric, value);
  }

  public recordResponseTime(time: number): void {
    if (!this.isInitialized) return;
    
    const current = this.metrics.get('response_time_avg') || 0;
    const total = this.metrics.get('requests_total') || 0;
    
    // Simple moving average
    const newAvg = (current * total + time) / (total + 1);
    this.metrics.set('response_time_avg', newAvg);
  }

  public getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value;
    }
    return result;
  }

  public getMetric(metric: string): number {
    return this.metrics.get(metric) || 0;
  }

  public getStatus(): string {
    return this.isInitialized ? 'initialized' : 'not initialized';
  }

  public async close(): Promise<void> {
    logger.info('📊 Closing Metrics Service...');
    this.metrics.clear();
    this.isInitialized = false;
    logger.info('✅ Metrics Service closed');
  }
}
