"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = exports.RateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
class RateLimitMiddleware {
    static createStockRateLimit() {
        return (0, express_rate_limit_1.default)({
            windowMs: config_1.config.RATE_LIMITS.STOCK.WINDOW_MS,
            max: config_1.config.RATE_LIMITS.STOCK.MAX,
            message: {
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many stock data requests. Please try again later.',
                retryAfter: Math.ceil(config_1.config.RATE_LIMITS.STOCK.WINDOW_MS / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
    }
    static createMLRateLimit() {
        return (0, express_rate_limit_1.default)({
            windowMs: config_1.config.RATE_LIMITS.ML.WINDOW_MS,
            max: config_1.config.RATE_LIMITS.ML.MAX,
            message: {
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many ML prediction requests. Please try again later.',
                retryAfter: Math.ceil(config_1.config.RATE_LIMITS.ML.WINDOW_MS / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
    }
    static createAuthRateLimit() {
        return (0, express_rate_limit_1.default)({
            windowMs: config_1.config.RATE_LIMITS.AUTH.WINDOW_MS,
            max: config_1.config.RATE_LIMITS.AUTH.MAX,
            message: {
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many authentication attempts. Please try again later.',
                retryAfter: Math.ceil(config_1.config.RATE_LIMITS.AUTH.WINDOW_MS / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
    }
    static createGeneralRateLimit() {
        return (0, express_rate_limit_1.default)({
            windowMs: config_1.config.RATE_LIMITS.GENERAL.WINDOW_MS,
            max: config_1.config.RATE_LIMITS.GENERAL.MAX,
            message: {
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil(config_1.config.RATE_LIMITS.GENERAL.WINDOW_MS / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
    }
}
exports.RateLimitMiddleware = RateLimitMiddleware;
exports.rateLimitMiddleware = RateLimitMiddleware;
//# sourceMappingURL=rateLimit.js.map