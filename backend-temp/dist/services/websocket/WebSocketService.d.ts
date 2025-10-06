import { Server as SocketIOServer } from 'socket.io';
export declare class WebSocketService {
    private io;
    private connectedClients;
    private subscriptions;
    private isInitialized;
    constructor(io: SocketIOServer);
    initialize(): Promise<void>;
    private setupEventHandlers;
    private subscribeToSymbol;
    private unsubscribeFromSymbol;
    private handleDisconnect;
    broadcastStockUpdate(symbol: string, data: any): Promise<void>;
    broadcastMLPrediction(symbol: string, prediction: any): Promise<void>;
    getConnectionCount(): number;
    getSubscriptionCount(): number;
    getStatus(): string;
    close(): Promise<void>;
}
//# sourceMappingURL=WebSocketService.d.ts.map