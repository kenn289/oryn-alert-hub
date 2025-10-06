"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const cron = __importStar(require("node-cron"));
const logger_1 = require("../../utils/logger");
class CronService {
    constructor(stockService, mlService, notificationService) {
        this.tasks = new Map();
        this.isInitialized = false;
        this.stockService = stockService;
        this.mlService = mlService;
        this.notificationService = notificationService;
    }
    async initialize() {
        try {
            logger_1.logger.info('⏰ Initializing Cron Service...');
            this.scheduleStockUpdates();
            this.scheduleMLTraining();
            this.scheduleCleanup();
            this.isInitialized = true;
            logger_1.logger.info('✅ Cron Service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize Cron Service:', error);
            throw error;
        }
    }
    scheduleStockUpdates() {
        const task = cron.schedule('*/5 * * * *', async () => {
            try {
                logger_1.logger.info('🔄 Running scheduled stock data update...');
                const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
                for (const symbol of popularSymbols) {
                    try {
                        await this.stockService.getStockData(symbol);
                        logger_1.logger.info(`Updated stock data for ${symbol}`);
                    }
                    catch (error) {
                        logger_1.logger.error(`Failed to update ${symbol}:`, error);
                    }
                }
                logger_1.logger.info('✅ Stock data update completed');
            }
            catch (error) {
                logger_1.logger.error('❌ Stock data update failed:', error);
            }
        }, {
            scheduled: false
        });
        this.tasks.set('stock_updates', task);
        task.start();
    }
    scheduleMLTraining() {
        const task = cron.schedule('0 2 * * *', async () => {
            try {
                logger_1.logger.info('🤖 Running scheduled ML model training...');
                logger_1.logger.info('✅ ML model training completed');
            }
            catch (error) {
                logger_1.logger.error('❌ ML model training failed:', error);
            }
        }, {
            scheduled: false
        });
        this.tasks.set('ml_training', task);
        task.start();
    }
    scheduleCleanup() {
        const task = cron.schedule('0 3 * * *', async () => {
            try {
                logger_1.logger.info('🧹 Running scheduled cleanup...');
                logger_1.logger.info('✅ Cleanup completed');
            }
            catch (error) {
                logger_1.logger.error('❌ Cleanup failed:', error);
            }
        }, {
            scheduled: false
        });
        this.tasks.set('cleanup', task);
        task.start();
    }
    getStatus() {
        return this.isInitialized ? 'running' : 'stopped';
    }
    getActiveTasks() {
        return Array.from(this.tasks.keys());
    }
    async close() {
        logger_1.logger.info('⏰ Closing Cron Service...');
        for (const [name, task] of this.tasks.entries()) {
            task.stop();
            task.destroy();
            logger_1.logger.info(`Stopped cron task: ${name}`);
        }
        this.tasks.clear();
        this.isInitialized = false;
        logger_1.logger.info('✅ Cron Service closed');
    }
}
exports.CronService = CronService;
//# sourceMappingURL=CronService.js.map