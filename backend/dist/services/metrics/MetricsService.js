"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const logger_1 = require("../../utils/logger");
class MetricsService {
    constructor() {
        this.isInitialized = false;
        this.metrics = new Map();
    }
    async initialize() {
        try {
            logger_1.logger.info('📊 Initializing Metrics Service...');
            this.metrics.set('requests_total', 0);
            this.metrics.set('requests_success', 0);
            this.metrics.set('requests_error', 0);
            this.metrics.set('response_time_avg', 0);
            this.metrics.set('active_connections', 0);
            this.isInitialized = true;
            logger_1.logger.info('✅ Metrics Service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize Metrics Service:', error);
            throw error;
        }
    }
    incrementCounter(metric, value = 1) {
        if (!this.isInitialized)
            return;
        const current = this.metrics.get(metric) || 0;
        this.metrics.set(metric, current + value);
    }
    setGauge(metric, value) {
        if (!this.isInitialized)
            return;
        this.metrics.set(metric, value);
    }
    recordResponseTime(time) {
        if (!this.isInitialized)
            return;
        const current = this.metrics.get('response_time_avg') || 0;
        const total = this.metrics.get('requests_total') || 0;
        const newAvg = (current * total + time) / (total + 1);
        this.metrics.set('response_time_avg', newAvg);
    }
    getMetrics() {
        const result = {};
        for (const [key, value] of this.metrics.entries()) {
            result[key] = value;
        }
        return result;
    }
    getMetric(metric) {
        return this.metrics.get(metric) || 0;
    }
    getStatus() {
        return this.isInitialized ? 'initialized' : 'not initialized';
    }
    async close() {
        logger_1.logger.info('📊 Closing Metrics Service...');
        this.metrics.clear();
        this.isInitialized = false;
        logger_1.logger.info('✅ Metrics Service closed');
    }
}
exports.MetricsService = MetricsService;
//# sourceMappingURL=MetricsService.js.map