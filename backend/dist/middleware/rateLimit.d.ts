export declare class RateLimitMiddleware {
    static createStockRateLimit(): import("express-rate-limit").RateLimitRequestHandler;
    static createMLRateLimit(): import("express-rate-limit").RateLimitRequestHandler;
    static createAuthRateLimit(): import("express-rate-limit").RateLimitRequestHandler;
    static createGeneralRateLimit(): import("express-rate-limit").RateLimitRequestHandler;
}
export declare const rateLimitMiddleware: typeof RateLimitMiddleware;
//# sourceMappingURL=rateLimit.d.ts.map