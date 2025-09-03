import { body } from 'express-validator';
import { UserType } from '../models/User';

// Registration validation
export const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('userType')
    .isIn(Object.values(UserType))
    .withMessage('Invalid user type'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
];

// Login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Profile update validation
export const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
];

// Password change validation
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Bulk delete manufacturers validation
export const validateBulkDeleteManufacturers = [
  body('manufacturerIds')
    .isArray({ min: 1 })
    .withMessage('manufacturerIds must be a non-empty array')
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('manufacturerIds must be an array');
      }
      
      if (value.length === 0) {
        throw new Error('manufacturerIds array cannot be empty');
      }
      
      // Check if all items are valid strings
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] !== 'string' || value[i].trim().length === 0) {
          throw new Error(`Invalid manufacturer ID at index ${i}`);
        }
      }
      
      return true;
    })
];

// QR code generation validation
export const validateQRCodeGeneration = [
  body('quantity')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Quantity must be between 1 and 10,000'),
  body('length')
    .optional()
    .isInt({ min: 8, max: 20 })
    .withMessage('Length must be between 8 and 20 characters'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

// QR code redemption validation
export const validateQRCodeRedemption = [
  body('code')
    .isString()
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('QR code must be between 8 and 20 characters')
    .matches(/^[a-f0-9]+$/i)
    .withMessage('QR code must contain only hexadecimal characters')
];

// Bulk QR code deletion validation
export const validateBulkQRCodeDeletion = [
  body('qrCodeIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('qrCodeIds must be a non-empty array')
    .custom((value) => {
      if (value && !Array.isArray(value)) {
        throw new Error('qrCodeIds must be an array');
      }
      
      if (value && value.length === 0) {
        throw new Error('qrCodeIds array cannot be empty');
      }
      
      if (value) {
        // Check if all items are valid ObjectId strings
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].trim().length === 0) {
            throw new Error(`Invalid QR code ID at index ${i}`);
          }
        }
      }
      
      return true;
    }),
  body('batchId')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('batchId must be a non-empty string')
];
