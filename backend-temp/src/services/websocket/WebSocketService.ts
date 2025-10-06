import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../../utils/logger';

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, any> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();
  private isInitialized = false;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('🔌 Initializing WebSocket Service...');
      
      this.setupEventHandlers();
      
      this.isInitialized = true;
      logger.info('✅ WebSocket Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize WebSocket Service:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);
      
      socket.on('subscribe', (symbol: string) => {
        this.subscribeToSymbol(socket.id, symbol);
        logger.info(`Client ${socket.id} subscribed to ${symbol}`);
      });

      socket.on('unsubscribe', (symbol: string) => {
        this.unsubscribeFromSymbol(socket.id, symbol);
        logger.info(`Client ${socket.id} unsubscribed from ${symbol}`);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket.id);
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private subscribeToSymbol(clientId: string, symbol: string): void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol)!.add(clientId);
  }

  private unsubscribeFromSymbol(clientId: string, symbol: string): void {
    const subscribers = this.subscriptions.get(symbol);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(symbol);
      }
    }
  }

  private handleDisconnect(clientId: string): void {
    this.connectedClients.delete(clientId);
    
    // Remove client from all subscriptions
    for (const [symbol, subscribers] of this.subscriptions.entries()) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(symbol);
      }
    }
  }

  public async broadcastStockUpdate(symbol: string, data: any): Promise<void> {
    try {
      const subscribers = this.subscriptions.get(symbol);
      if (subscribers && subscribers.size > 0) {
        this.io.emit('stock_update', { symbol, data });
        logger.info(`Broadcasted stock update for ${symbol} to ${subscribers.size} clients`);
      }
    } catch (error) {
      logger.error('Error broadcasting stock update:', error);
    }
  }

  public async broadcastMLPrediction(symbol: string, prediction: any): Promise<void> {
    try {
      const subscribers = this.subscriptions.get(symbol);
      if (subscribers && subscribers.size > 0) {
        this.io.emit('ml_prediction', { symbol, prediction });
        logger.info(`Broadcasted ML prediction for ${symbol} to ${subscribers.size} clients`);
      }
    } catch (error) {
      logger.error('Error broadcasting ML prediction:', error);
    }
  }

  public getConnectionCount(): number {
    return this.connectedClients.size;
  }

  public getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  public getStatus(): string {
    return this.isInitialized ? 'connected' : 'disconnected';
  }

  public async close(): Promise<void> {
    logger.info('🔌 Closing WebSocket Service...');
    this.connectedClients.clear();
    this.subscriptions.clear();
    this.isInitialized = false;
    logger.info('✅ WebSocket Service closed');
  }
}
