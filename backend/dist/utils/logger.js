"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logBusiness = exports.logSecurity = exports.logPerformance = exports.logError = exports.logRequest = exports.morganStream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config");
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: config_1.config.LOGGING.LEVEL,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'oryn-backend' },
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
        }),
        // File transport for errors
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // File transport for all logs
        new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ],
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: 'logs/exceptions.log' })
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston_1.default.transports.File({ filename: 'logs/rejections.log' })
    ]
});
// Create a stream for Morgan HTTP logging
exports.morganStream = {
    write: (message) => {
        exports.logger.info(message.trim());
    }
};
// Logging utility functions
const logRequest = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, url, ip } = req;
        const { statusCode } = res;
        exports.logger.info('HTTP Request', {
            method,
            url,
            ip,
            statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent')
        });
    });
    next();
};
exports.logRequest = logRequest;
const logError = (error, context) => {
    exports.logger.error('Application Error', {
        error: error.message,
        stack: error.stack,
        context
    });
};
exports.logError = logError;
const logPerformance = (operation, duration, metadata) => {
    exports.logger.info('Performance Metric', {
        operation,
        duration: `${duration}ms`,
        metadata
    });
};
exports.logPerformance = logPerformance;
const logSecurity = (event, details) => {
    exports.logger.warn('Security Event', {
        event,
        details,
        timestamp: new Date().toISOString()
    });
};
exports.logSecurity = logSecurity;
const logBusiness = (event, data) => {
    exports.logger.info('Business Event', {
        event,
        data,
        timestamp: new Date().toISOString()
    });
};
exports.logBusiness = logBusiness;
exports.default = exports.logger;
