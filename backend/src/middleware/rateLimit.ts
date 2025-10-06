import rateLimit from 'express-rate-limit';
import { config } from '../config';

export class RateLimitMiddleware {
  static createStockRateLimit() {
    return rateLimit({
      windowMs: config.RATE_LIMITS.STOCK.WINDOW_MS,
      max: config.RATE_LIMITS.STOCK.MAX,
      message: {
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many stock data requests. Please try again later.',
        retryAfter: Math.ceil(config.RATE_LIMITS.STOCK.WINDOW_MS / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  static createMLRateLimit() {
    return rateLimit({
      windowMs: config.RATE_LIMITS.ML.WINDOW_MS,
      max: config.RATE_LIMITS.ML.MAX,
      message: {
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many ML prediction requests. Please try again later.',
        retryAfter: Math.ceil(config.RATE_LIMITS.ML.WINDOW_MS / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  static createAuthRateLimit() {
    return rateLimit({
      windowMs: config.RATE_LIMITS.AUTH.WINDOW_MS,
      max: config.RATE_LIMITS.AUTH.MAX,
      message: {
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil(config.RATE_LIMITS.AUTH.WINDOW_MS / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  static createGeneralRateLimit() {
    return rateLimit({
      windowMs: config.RATE_LIMITS.GENERAL.WINDOW_MS,
      max: config.RATE_LIMITS.GENERAL.MAX,
      message: {
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(config.RATE_LIMITS.GENERAL.WINDOW_MS / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}

export const rateLimitMiddleware = RateLimitMiddleware;
