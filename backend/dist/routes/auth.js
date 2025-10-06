"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing credentials',
                message: 'Email and password are required'
            });
        }
        if (email === 'test@example.com' && password === 'password') {
            const token = jsonwebtoken_1.default.sign({
                userId: 'user-123',
                email: email,
                plan: 'pro'
            }, config_1.config.JWT.SECRET, { expiresIn: config_1.config.JWT.EXPIRES_IN });
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: 'user-123',
                        email: email,
                        plan: 'pro'
                    }
                }
            });
        }
        else {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: error.message
        });
    }
});
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Email, password, and name are required'
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, config_1.config.SECURITY.BCRYPT_ROUNDS);
        const userId = 'user-' + Date.now();
        const token = jsonwebtoken_1.default.sign({
            userId: userId,
            email: email,
            plan: 'free'
        }, config_1.config.JWT.SECRET, { expiresIn: config_1.config.JWT.EXPIRES_IN });
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: userId,
                    email: email,
                    name: name,
                    plan: 'free'
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            message: error.message
        });
    }
});
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token required',
                message: 'Please provide a refresh token'
            });
        }
        const token = jsonwebtoken_1.default.sign({
            userId: 'user-123',
            email: 'test@example.com',
            plan: 'pro'
        }, config_1.config.JWT.SECRET, { expiresIn: config_1.config.JWT.EXPIRES_IN });
        res.json({
            success: true,
            data: {
                token
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Token refresh failed',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map