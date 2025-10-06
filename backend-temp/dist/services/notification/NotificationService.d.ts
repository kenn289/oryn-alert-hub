import { DatabaseService } from '../database/DatabaseService';
export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
}
export declare class NotificationService {
    private databaseService;
    private isInitialized;
    constructor(databaseService: DatabaseService);
    initialize(): Promise<void>;
    getNotifications(userId: string): Promise<Notification[]>;
    markAsRead(notificationId: string, userId: string): Promise<boolean>;
    createNotification(userId: string, type: string, title: string, message: string): Promise<Notification | null>;
    getStatus(): string;
    close(): Promise<void>;
}
//# sourceMappingURL=NotificationService.d.ts.map