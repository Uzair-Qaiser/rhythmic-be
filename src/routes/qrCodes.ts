import { Router } from 'express';
import {
  generateBulkQRCodes,
  getQRCodes,
  getQRCodeById,
  getQRCodeStats,
  deleteQRCode,
  bulkDeleteQRCodes,
  redeemQRCode
} from '../controllers/qrCodeController';
import { 
  authenticate, 
  requireSuperAdmin, 
  requirePortalUser,
  requireAnyUser 
} from '../middlewares/auth';
import { 
  validateQRCodeGeneration,
  validateQRCodeRedemption,
  validateBulkQRCodeDeletion
} from '../middlewares/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// QR code generation (admin and manufacturer only)
router.post('/generate', requirePortalUser, validateQRCodeGeneration, generateBulkQRCodes);

// QR code management (admin and manufacturer can view their own, admin can view all)
router.get('/', requirePortalUser, getQRCodes);
router.get('/stats', requirePortalUser, getQRCodeStats);
router.get('/:id', requirePortalUser, getQRCodeById);

// QR code deletion (admin and manufacturer can delete their own)
router.delete('/:id', requirePortalUser, deleteQRCode);
router.delete('/', requirePortalUser, validateBulkQRCodeDeletion, bulkDeleteQRCodes);

// QR code redemption (any authenticated user)
router.post('/redeem', requireAnyUser, validateQRCodeRedemption, redeemQRCode);

export default router;
