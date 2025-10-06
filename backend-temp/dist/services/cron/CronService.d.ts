import { StockService } from '../stock/StockService';
import { SimpleMLService } from '../ml/SimpleMLService';
import { NotificationService } from '../notification/NotificationService';
export declare class CronService {
    private stockService;
    private mlService;
    private notificationService;
    private tasks;
    private isInitialized;
    constructor(stockService: StockService, mlService: SimpleMLService, notificationService: NotificationService);
    initialize(): Promise<void>;
    private scheduleStockUpdates;
    private scheduleMLTraining;
    private scheduleCleanup;
    getStatus(): string;
    getActiveTasks(): string[];
    close(): Promise<void>;
}
//# sourceMappingURL=CronService.d.ts.map