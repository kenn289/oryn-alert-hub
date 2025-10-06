import winston from 'winston';
export declare const logger: winston.Logger;
export declare const morganStream: {
    write: (message: string) => void;
};
export declare const logRequest: (req: any, res: any, next: any) => void;
export declare const logError: (error: Error, context?: any) => void;
export declare const logPerformance: (operation: string, duration: number, metadata?: any) => void;
export declare const logSecurity: (event: string, details: any) => void;
export declare const logBusiness: (event: string, data: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map