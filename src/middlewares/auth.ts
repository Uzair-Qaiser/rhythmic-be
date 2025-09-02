import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserType, IUser } from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JWTPayload {
  userId: string;
  userType: UserType;
  email: string;
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid token or user inactive.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Role-based authorization middleware
export const authorize = (...allowedUserTypes: UserType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    if (!allowedUserTypes.includes(req.user.userType)) {
      res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
      return;
    }

    next();
  };
};

// Specific role middlewares for convenience
export const requireAppUser = authorize(UserType.APP_USER);
export const requireSuperAdmin = authorize(UserType.SUPER_ADMIN);
export const requireManufacturer = authorize(UserType.MANUFACTURER);
export const requirePortalUser = authorize(UserType.SUPER_ADMIN, UserType.MANUFACTURER);
export const requireAnyUser = authorize(UserType.APP_USER, UserType.SUPER_ADMIN, UserType.MANUFACTURER);
