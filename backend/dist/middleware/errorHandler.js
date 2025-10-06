"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGracefulShutdown = exports.handleUncaughtException = exports.handleUnhandledRejection = exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.ExternalServiceError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.CustomError = void 0;
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
class CustomError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
class ValidationError extends CustomError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends CustomError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends CustomError {
    constructor(message = 'Access denied') {
        super(message, 403);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends CustomError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends CustomError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends CustomError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429);
    }
}
exports.RateLimitError = RateLimitError;
class ExternalServiceError extends CustomError {
    constructor(message = 'External service error') {
        super(message, 502);
    }
}
exports.ExternalServiceError = ExternalServiceError;
const errorHandler = (error, req, res, next) => {
    let { statusCode = 500, message } = error;
    logger_1.logger.error('Error occurred', {
        error: {
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode
        },
        request: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        }
    });
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
    }
    if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
    }
    if (error.name === 'MongoError' && error.message.includes('duplicate key')) {
        statusCode = 409;
        message = 'Resource already exists';
    }
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    if (error.message.includes('rate limit')) {
        statusCode = 429;
        message = 'Too many requests';
    }
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        statusCode = 502;
        message = 'External service unavailable';
    }
    if (config_1.config.NODE_ENV === 'production' && !error.isOperational) {
        message = 'Internal server error';
    }
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            path: req.url,
            method: req.method
        },
        ...(config_1.config.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.message
        })
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('Unhandled Promise Rejection', {
            reason: reason?.message || reason,
            stack: reason?.stack,
            promise
        });
        process.exit(1);
    });
};
exports.handleUnhandledRejection = handleUnhandledRejection;
const handleUncaughtException = () => {
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught Exception', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    });
};
exports.handleUncaughtException = handleUncaughtException;
const handleGracefulShutdown = (server) => {
    const shutdown = (signal) => {
        logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
        server.close(() => {
            logger_1.logger.info('Server closed successfully');
            process.exit(0);
        });
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};
exports.handleGracefulShutdown = handleGracefulShutdown;
exports.default = exports.errorHandler;
//# sourceMappingURL=errorHandler.js.map