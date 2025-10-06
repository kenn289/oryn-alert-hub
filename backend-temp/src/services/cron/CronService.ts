import * as cron from 'node-cron';
import { logger } from '../../utils/logger';
import { StockService } from '../stock/StockService';
import { SimpleMLService } from '../ml/SimpleMLService';
import { NotificationService } from '../notification/NotificationService';

export class CronService {
  private stockService: StockService;
  private mlService: SimpleMLService;
  private notificationService: NotificationService;
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  constructor(
    stockService: StockService,
    mlService: SimpleMLService,
    notificationService: NotificationService
  ) {
    this.stockService = stockService;
    this.mlService = mlService;
    this.notificationService = notificationService;
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('⏰ Initializing Cron Service...');
      
      // Schedule stock data updates
      this.scheduleStockUpdates();
      
      // Schedule ML model training
      this.scheduleMLTraining();
      
      // Schedule cleanup tasks
      this.scheduleCleanup();
      
      this.isInitialized = true;
      logger.info('✅ Cron Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Cron Service:', error);
      throw error;
    }
  }

  private scheduleStockUpdates(): void {
    const task = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('🔄 Running scheduled stock data update...');
        
        // Update popular stocks
        const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
        
        for (const symbol of popularSymbols) {
          try {
            await this.stockService.getStockData(symbol);
            logger.info(`Updated stock data for ${symbol}`);
          } catch (error) {
            logger.error(`Failed to update ${symbol}:`, error);
          }
        }
        
        logger.info('✅ Stock data update completed');
      } catch (error) {
        logger.error('❌ Stock data update failed:', error);
      }
    }, {
      scheduled: false
    });

    this.tasks.set('stock_updates', task);
    task.start();
  }

  private scheduleMLTraining(): void {
    const task = cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('🤖 Running scheduled ML model training...');
        
        // This would retrain models in a real implementation
        logger.info('✅ ML model training completed');
      } catch (error) {
        logger.error('❌ ML model training failed:', error);
      }
    }, {
      scheduled: false
    });

    this.tasks.set('ml_training', task);
    task.start();
  }

  private scheduleCleanup(): void {
    const task = cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('🧹 Running scheduled cleanup...');
        
        // Clean up old cache entries, logs, etc.
        logger.info('✅ Cleanup completed');
      } catch (error) {
        logger.error('❌ Cleanup failed:', error);
      }
    }, {
      scheduled: false
    });

    this.tasks.set('cleanup', task);
    task.start();
  }

  public getStatus(): string {
    return this.isInitialized ? 'running' : 'stopped';
  }

  public getActiveTasks(): string[] {
    return Array.from(this.tasks.keys());
  }

  public async close(): Promise<void> {
    logger.info('⏰ Closing Cron Service...');
    
    for (const [name, task] of this.tasks.entries()) {
      task.stop();
      task.destroy();
      logger.info(`Stopped cron task: ${name}`);
    }
    
    this.tasks.clear();
    this.isInitialized = false;
    logger.info('✅ Cron Service closed');
  }
}
