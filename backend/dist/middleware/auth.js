"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePlan = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
                message: 'Please provide a valid access token'
            });
        }
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.JWT.SECRET);
            req.user = {
                id: decoded.userId || decoded.id,
                email: decoded.email,
                plan: decoded.plan || 'free'
            };
            next();
        }
        catch (jwtError) {
            logger_1.logger.warn('Invalid JWT token:', jwtError);
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'Token is invalid or expired'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: 'Internal server error'
        });
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = undefined;
            return next();
        }
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.JWT.SECRET);
            req.user = {
                id: decoded.userId || decoded.id,
                email: decoded.email,
                plan: decoded.plan || 'free'
            };
        }
        catch (jwtError) {
            req.user = undefined;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Optional auth middleware error:', error);
        req.user = undefined;
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const requirePlan = (requiredPlan) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'Please log in to access this feature'
            });
        }
        const planHierarchy = ['free', 'pro', 'master'];
        const userPlanIndex = planHierarchy.indexOf(req.user.plan);
        const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);
        if (userPlanIndex < requiredPlanIndex) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient plan',
                message: `This feature requires a ${requiredPlan} plan or higher`,
                currentPlan: req.user.plan,
                requiredPlan
            });
        }
        next();
    };
};
exports.requirePlan = requirePlan;
//# sourceMappingURL=auth.js.map