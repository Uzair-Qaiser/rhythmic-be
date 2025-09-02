import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserType,
  deleteUser,
  getUserStats,
  getAppUsers,
  getManufacturers,
  createManufacturer
} from '../controllers/userController';
import { authenticate, requireSuperAdmin, requirePortalUser } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Super admin only routes
router.get('/app-users', requireSuperAdmin, getAppUsers); // Get only app users
router.get('/manufacturers', requireSuperAdmin, getManufacturers); // Get only manufacturers
router.post('/manufacturers', requireSuperAdmin, createManufacturer); // Create manufacturer
router.get('/stats', requireSuperAdmin, getUserStats);
router.put('/:id/status', requireSuperAdmin, updateUserStatus);
router.put('/:id/type', requireSuperAdmin, updateUserType);
router.delete('/:id', requireSuperAdmin, deleteUser);

// Portal users (super admin and manufacturer) can access
router.get('/:id', requirePortalUser, getUserById);

export default router;
