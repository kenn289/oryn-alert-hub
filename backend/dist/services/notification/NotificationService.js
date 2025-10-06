"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const logger_1 = require("../../utils/logger");
class NotificationService {
    constructor(databaseService) {
        this.isInitialized = false;
        this.databaseService = databaseService;
    }
    async initialize() {
        try {
            logger_1.logger.info('🔔 Initializing Notification Service...');
            this.isInitialized = true;
            logger_1.logger.info('✅ Notification Service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize Notification Service:', error);
            throw error;
        }
    }
    async getNotifications(userId) {
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
        }
        catch (error) {
            logger_1.logger.error('Error fetching notifications:', error);
            return [];
        }
    }
    async markAsRead(notificationId, userId) {
        try {
            await this.databaseService.update('notifications', notificationId, {
                read: true
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error marking notification as read:', error);
            return false;
        }
    }
    async createNotification(userId, type, title, message) {
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
        }
        catch (error) {
            logger_1.logger.error('Error creating notification:', error);
            return null;
        }
    }
    getStatus() {
        return this.isInitialized ? 'initialized' : 'not initialized';
    }
    async close() {
        logger_1.logger.info('🔔 Closing Notification Service...');
        this.isInitialized = false;
        logger_1.logger.info('✅ Notification Service closed');
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map