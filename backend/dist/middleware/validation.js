"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validators = exports.validateFilter = exports.validateSort = exports.validateTimeframe = exports.validateMarket = exports.validateCurrency = exports.validateDate = exports.validateSearch = exports.validateMLPrediction = exports.validateSubscription = exports.validateSupportTicket = exports.validateAlert = exports.validateWatchlistItem = exports.validatePortfolioItem = exports.validateUserId = exports.validatePagination = exports.validateRange = exports.validateSymbols = exports.validateSymbol = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};
exports.validateRequest = validateRequest;
exports.validateSymbol = [
    (0, express_validator_1.param)('symbol')
        .isString()
        .isLength({ min: 1, max: 10 })
        .matches(/^[A-Z0-9.-]+$/)
        .withMessage('Invalid stock symbol format'),
    exports.validateRequest
];
exports.validateSymbols = [
    (0, express_validator_1.param)('symbols')
        .isString()
        .isLength({ min: 1, max: 500 })
        .matches(/^[A-Z0-9.\-,]+$/)
        .withMessage('Invalid symbols format'),
    exports.validateRequest
];
exports.validateRange = [
    (0, express_validator_1.query)('range')
        .optional()
        .isIn(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'])
        .withMessage('Invalid range parameter'),
    exports.validateRequest
];
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    exports.validateRequest
];
exports.validateUserId = [
    (0, express_validator_1.param)('userId')
        .isUUID()
        .withMessage('Invalid user ID format'),
    exports.validateRequest
];
exports.validatePortfolioItem = [
    (0, express_validator_1.body)('ticker')
        .isString()
        .isLength({ min: 1, max: 10 })
        .matches(/^[A-Z0-9.-]+$/)
        .withMessage('Invalid ticker format'),
    (0, express_validator_1.body)('shares')
        .isFloat({ min: 0.000001 })
        .withMessage('Shares must be a positive number'),
    (0, express_validator_1.body)('avgPrice')
        .isFloat({ min: 0 })
        .withMessage('Average price must be a positive number'),
    exports.validateRequest
];
exports.validateWatchlistItem = [
    (0, express_validator_1.body)('ticker')
        .isString()
        .isLength({ min: 1, max: 10 })
        .matches(/^[A-Z0-9.-]+$/)
        .withMessage('Invalid ticker format'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),
    exports.validateRequest
];
exports.validateAlert = [
    (0, express_validator_1.body)('ticker')
        .isString()
        .isLength({ min: 1, max: 10 })
        .matches(/^[A-Z0-9.-]+$/)
        .withMessage('Invalid ticker format'),
    (0, express_validator_1.body)('condition')
        .isIn(['above', 'below', 'equals'])
        .withMessage('Condition must be above, below, or equals'),
    (0, express_validator_1.body)('targetPrice')
        .isFloat({ min: 0 })
        .withMessage('Target price must be a positive number'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    exports.validateRequest
];
exports.validateSupportTicket = [
    (0, express_validator_1.body)('subject')
        .isString()
        .isLength({ min: 1, max: 200 })
        .withMessage('Subject must be between 1 and 200 characters'),
    (0, express_validator_1.body)('description')
        .isString()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Description must be between 1 and 2000 characters'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be low, medium, high, or urgent'),
    (0, express_validator_1.body)('category')
        .optional()
        .isIn(['technical', 'billing', 'feature_request', 'bug_report', 'general'])
        .withMessage('Invalid category'),
    exports.validateRequest
];
exports.validateSubscription = [
    (0, express_validator_1.body)('plan')
        .isIn(['free', 'pro', 'team'])
        .withMessage('Plan must be free, pro, or team'),
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .isString()
        .withMessage('Payment method must be a string'),
    exports.validateRequest
];
exports.validateMLPrediction = [
    (0, express_validator_1.body)('symbols')
        .isArray({ min: 1, max: 20 })
        .withMessage('Symbols must be an array with 1-20 items'),
    (0, express_validator_1.body)('symbols.*')
        .isString()
        .isLength({ min: 1, max: 10 })
        .matches(/^[A-Z0-9.-]+$/)
        .withMessage('Each symbol must be valid'),
    exports.validateRequest
];
exports.validateSearch = [
    (0, express_validator_1.query)('q')
        .isString()
        .isLength({ min: 2, max: 100 })
        .withMessage('Search query must be between 2 and 100 characters'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    exports.validateRequest
];
exports.validateDate = [
    (0, express_validator_1.query)('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be in ISO 8601 format'),
    exports.validateRequest
];
exports.validateCurrency = [
    (0, express_validator_1.query)('currency')
        .optional()
        .isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'])
        .withMessage('Invalid currency code'),
    exports.validateRequest
];
exports.validateMarket = [
    (0, express_validator_1.query)('market')
        .optional()
        .isIn(['US', 'IN', 'GB', 'JP', 'AU', 'CA', 'EU'])
        .withMessage('Invalid market code'),
    exports.validateRequest
];
exports.validateTimeframe = [
    (0, express_validator_1.query)('timeframe')
        .optional()
        .isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'])
        .withMessage('Invalid timeframe'),
    exports.validateRequest
];
exports.validateSort = [
    (0, express_validator_1.query)('sort')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort must be asc or desc'),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isString()
        .withMessage('SortBy must be a string'),
    exports.validateRequest
];
exports.validateFilter = [
    (0, express_validator_1.query)('filter')
        .optional()
        .isString()
        .withMessage('Filter must be a string'),
    exports.validateRequest
];
exports.validators = {
    validateSymbol: exports.validateSymbol,
    validateSymbols: exports.validateSymbols,
    validateRange: exports.validateRange,
    validatePagination: exports.validatePagination,
    validateUserId: exports.validateUserId,
    validatePortfolioItem: exports.validatePortfolioItem,
    validateWatchlistItem: exports.validateWatchlistItem,
    validateAlert: exports.validateAlert,
    validateSupportTicket: exports.validateSupportTicket,
    validateSubscription: exports.validateSubscription,
    validateMLPrediction: exports.validateMLPrediction,
    validateSearch: exports.validateSearch,
    validateDate: exports.validateDate,
    validateCurrency: exports.validateCurrency,
    validateMarket: exports.validateMarket,
    validateTimeframe: exports.validateTimeframe,
    validateSort: exports.validateSort,
    validateFilter: exports.validateFilter
};
//# sourceMappingURL=validation.js.map