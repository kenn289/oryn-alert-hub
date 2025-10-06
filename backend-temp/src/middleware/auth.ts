import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    plan: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, config.JWT.SECRET) as any;
      
      req.user = {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        plan: decoded.plan || 'free'
      };
      
      next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError);
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Internal server error'
    });
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = undefined;
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.JWT.SECRET) as any;
      
      req.user = {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        plan: decoded.plan || 'free'
      };
    } catch (jwtError) {
      req.user = undefined;
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    req.user = undefined;
    next();
  }
};

export const requirePlan = (requiredPlan: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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
