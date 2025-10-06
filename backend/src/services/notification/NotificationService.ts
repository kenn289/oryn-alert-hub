import { DatabaseService } from '../database/DatabaseService';
import { logger } from '../../utils/logger';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export class NotificationService {
  private databaseService: DatabaseService;
  private isInitialized = false;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('🔔 Initializing Notification Service...');
      this.isInitialized = true;
      logger.info('✅ Notification Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Notification Service:', error);
      throw error;
    }
  }

  public async getNotifications(userId: string): Promise<Notification[]> {
    if (!this.isInitialized) {
      throw new Error('Notification Service not initialized');
    }

    try {
      const notifications = await this.databaseService.query('notifications', {
        match: { user_id: userId },
        order: { created_at: 'desc' },
        limit: 50
      });

      return notifications.map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: new Date(n.created_at)
      }));
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      return [];
    }
  }

  public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await this.databaseService.update('notifications', notificationId, {
        read: true
      });
      return true;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      return false;
    }
  }

  public async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string
  ): Promise<Notification | null> {
    try {
      const result = await this.databaseService.insert('notifications', {
        user_id: userId,
        type,
        title,
        message,
        read: false
      });

      if (result.length > 0) {
        return {
          id: result[0].id,
          userId: result[0].user_id,
          type: result[0].type,
          title: result[0].title,
          message: result[0].message,
          read: result[0].read,
          createdAt: new Date(result[0].created_at)
        };
      }

      return null;
    } catch (error) {
      logger.error('Error creating notification:', error);
      return null;
    }
  }

  public getStatus(): string {
    return this.isInitialized ? 'initialized' : 'not initialized';
  }

  public async close(): Promise<void> {
    logger.info('🔔 Closing Notification Service...');
    this.isInitialized = false;
    logger.info('✅ Notification Service closed');
  }
}
