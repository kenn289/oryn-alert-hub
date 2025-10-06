import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/auth/login - User login
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

    // In a real implementation, you would validate against a database
    // For now, we'll use a simple mock authentication
    if (email === 'test@example.com' && password === 'password') {
      const token = jwt.sign(
        { 
          userId: 'user-123',
          email: email,
          plan: 'pro'
        },
        config.JWT.SECRET,
        { expiresIn: config.JWT.EXPIRES_IN }
      );

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
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

// POST /api/auth/register - User registration
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

    // In a real implementation, you would:
    // 1. Validate email format
    // 2. Check if user already exists
    // 3. Hash the password
    // 4. Save to database

    const hashedPassword = await bcrypt.hash(password, config.SECURITY.BCRYPT_ROUNDS);
    
    // Mock user creation
    const userId = 'user-' + Date.now();
    
    const token = jwt.sign(
      { 
        userId: userId,
        email: email,
        plan: 'free'
      },
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN }
    );

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
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// POST /api/auth/refresh - Refresh token
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

    // In a real implementation, you would validate the refresh token
    // For now, we'll return a new access token
    const token = jwt.sign(
      { 
        userId: 'user-123',
        email: 'test@example.com',
        plan: 'pro'
      },
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: error.message
    });
  }
});

export default router;
