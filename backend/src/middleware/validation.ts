import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// Validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Stock symbol validation
export const validateSymbol = [
  param('symbol')
    .isString()
    .isLength({ min: 1, max: 10 })
    .matches(/^[A-Z0-9.-]+$/)
    .withMessage('Invalid stock symbol format'),
  validateRequest
];

// Multiple symbols validation
export const validateSymbols = [
  param('symbols')
    .isString()
    .isLength({ min: 1, max: 500 })
    .matches(/^[A-Z0-9.-,]+$/)
    .withMessage('Invalid symbols format'),
  validateRequest
];

// Date range validation
export const validateRange = [
  query('range')
    .optional()
    .isIn(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'])
    .withMessage('Invalid range parameter'),
  validateRequest
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validateRequest
];

// User ID validation
export const validateUserId = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format'),
  validateRequest
];

// Portfolio item validation
export const validatePortfolioItem = [
  body('ticker')
    .isString()
    .isLength({ min: 1, max: 10 })
    .matches(/^[A-Z0-9.-]+$/)
    .withMessage('Invalid ticker format'),
  body('shares')
    .isFloat({ min: 0.000001 })
    .withMessage('Shares must be a positive number'),
  body('avgPrice')
    .isFloat({ min: 0 })
    .withMessage('Average price must be a positive number'),
  validateRequest
];

// Watchlist item validation
export const validateWatchlistItem = [
  body('ticker')
    .isString()
    .isLength({ min: 1, max: 10 })
    .matches(/^[A-Z0-9.-]+$/)
    .withMessage('Invalid ticker format'),
  body('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  validateRequest
];

// Alert validation
export const validateAlert = [
  body('ticker')
    .isString()
    .isLength({ min: 1, max: 10 })
    .matches(/^[A-Z0-9.-]+$/)
    .withMessage('Invalid ticker format'),
  body('condition')
    .isIn(['above', 'below', 'equals'])
    .withMessage('Condition must be above, below, or equals'),
  body('targetPrice')
    .isFloat({ min: 0 })
    .withMessage('Target price must be a positive number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  validateRequest
];

// Support ticket validation
export const validateSupportTicket = [
  body('subject')
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  body('description')
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('category')
    .optional()
    .isIn(['technical', 'billing', 'feature_request', 'bug_report', 'general'])
    .withMessage('Invalid category'),
  validateRequest
];

// Subscription validation
export const validateSubscription = [
  body('plan')
    .isIn(['free', 'pro', 'team'])
    .withMessage('Plan must be free, pro, or team'),
  body('paymentMethod')
    .optional()
    .isString()
    .withMessage('Payment method must be a string'),
  validateRequest
];

// ML prediction validation
export const validateMLPrediction = [
  body('symbols')
    .isArray({ min: 1, max: 20 })
    .withMessage('Symbols must be an array with 1-20 items'),
  body('symbols.*')
    .isString()
    .isLength({ min: 1, max: 10 })
    .matches(/^[A-Z0-9.-]+$/)
    .withMessage('Each symbol must be valid'),
  validateRequest
];

// Search validation
export const validateSearch = [
  query('q')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validateRequest
];

// Date validation
export const validateDate = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO 8601 format'),
  validateRequest
];

// Currency validation
export const validateCurrency = [
  query('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'])
    .withMessage('Invalid currency code'),
  validateRequest
];

// Market validation
export const validateMarket = [
  query('market')
    .optional()
    .isIn(['US', 'IN', 'GB', 'JP', 'AU', 'CA', 'EU'])
    .withMessage('Invalid market code'),
  validateRequest
];

// Timeframe validation
export const validateTimeframe = [
  query('timeframe')
    .optional()
    .isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'])
    .withMessage('Invalid timeframe'),
  validateRequest
];

// Sort validation
export const validateSort = [
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort must be asc or desc'),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('SortBy must be a string'),
  validateRequest
];

// Filter validation
export const validateFilter = [
  query('filter')
    .optional()
    .isString()
    .withMessage('Filter must be a string'),
  validateRequest
];

// Export all validators
export const validators = {
  validateSymbol,
  validateSymbols,
  validateRange,
  validatePagination,
  validateUserId,
  validatePortfolioItem,
  validateWatchlistItem,
  validateAlert,
  validateSupportTicket,
  validateSubscription,
  validateMLPrediction,
  validateSearch,
  validateDate,
  validateCurrency,
  validateMarket,
  validateTimeframe,
  validateSort,
  validateFilter
};
