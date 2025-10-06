"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const logger_1 = require("../../utils/logger");
class WebSocketService {
    constructor(io) {
        this.connectedClients = new Map();
        this.subscriptions = new Map();
        this.isInitialized = false;
        this.io = io;
    }
    async initialize() {
        try {
            logger_1.logger.info('🔌 Initializing WebSocket Service...');
            this.setupEventHandlers();
            this.isInitialized = true;
            logger_1.logger.info('✅ WebSocket Service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize WebSocket Service:', error);
            throw error;
        }
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger_1.logger.info(`Client connected: ${socket.id}`);
            this.connectedClients.set(socket.id, socket);
            socket.on('subscribe', (symbol) => {
                this.subscribeToSymbol(socket.id, symbol);
                logger_1.logger.info(`Client ${socket.id} subscribed to ${symbol}`);
            });
            socket.on('unsubscribe', (symbol) => {
                this.unsubscribeFromSymbol(socket.id, symbol);
                logger_1.logger.info(`Client ${socket.id} unsubscribed from ${symbol}`);
            });
            socket.on('disconnect', () => {
                this.handleDisconnect(socket.id);
                logger_1.logger.info(`Client disconnected: ${socket.id}`);
            });
        });
    }
    subscribeToSymbol(clientId, symbol) {
        if (!this.subscriptions.has(symbol)) {
            this.subscriptions.set(symbol, new Set());
        }
        this.subscriptions.get(symbol).add(clientId);
    }
    unsubscribeFromSymbol(clientId, symbol) {
        const subscribers = this.subscriptions.get(symbol);
        if (subscribers) {
            subscribers.delete(clientId);
            if (subscribers.size === 0) {
                this.subscriptions.delete(symbol);
            }
        }
    }
    handleDisconnect(clientId) {
        this.connectedClients.delete(clientId);
        for (const [symbol, subscribers] of this.subscriptions.entries()) {
            subscribers.delete(clientId);
            if (subscribers.size === 0) {
                this.subscriptions.delete(symbol);
            }
        }
    }
    async broadcastStockUpdate(symbol, data) {
        try {
            const subscribers = this.subscriptions.get(symbol);
            if (subscribers && subscribers.size > 0) {
                this.io.emit('stock_update', { symbol, data });
                logger_1.logger.info(`Broadcasted stock update for ${symbol} to ${subscribers.size} clients`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error broadcasting stock update:', error);
        }
    }
    async broadcastMLPrediction(symbol, prediction) {
        try {
            const subscribers = this.subscriptions.get(symbol);
            if (subscribers && subscribers.size > 0) {
                this.io.emit('ml_prediction', { symbol, prediction });
                logger_1.logger.info(`Broadcasted ML prediction for ${symbol} to ${subscribers.size} clients`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error broadcasting ML prediction:', error);
        }
    }
    getConnectionCount() {
        return this.connectedClients.size;
    }
    getSubscriptionCount() {
        return this.subscriptions.size;
    }
    getStatus() {
        return this.isInitialized ? 'connected' : 'disconnected';
    }
    async close() {
        logger_1.logger.info('🔌 Closing WebSocket Service...');
        this.connectedClients.clear();
        this.subscriptions.clear();
        this.isInitialized = false;
        logger_1.logger.info('✅ WebSocket Service closed');
    }
}
exports.WebSocketService = WebSocketService;
//# sourceMappingURL=WebSocketService.js.map