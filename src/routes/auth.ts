import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
} from '../controllers/authController';
import {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange
} from '../middlewares/validation';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Public routes (no authentication required)
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes (authentication required)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validateProfileUpdate, updateProfile);
router.put('/change-password', authenticate, validatePasswordChange, changePassword);
router.post('/logout', authenticate, logout);

export default router;
