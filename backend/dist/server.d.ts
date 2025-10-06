declare class Server {
    private app;
    private server;
    private io;
    private databaseService;
    private cacheService;
    private mlService;
    private stockService;
    private notificationService;
    private websocketService;
    private metricsService;
    private cronService;
    constructor();
    private initializeServices;
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    start(): Promise<void>;
    private shutdown;
}
export default Server;
//# sourceMappingURL=server.d.ts.map