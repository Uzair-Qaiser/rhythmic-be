import crypto from 'crypto';
import QRCode from '../models/QRCode';

/**
 * Generate a unique random QR code
 * @param length - Length of the QR code (default: 12)
 * @returns Promise<string> - Unique QR code
 */
export const generateUniqueQRCode = async (length: number = 12): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops
  
  while (attempts < maxAttempts) {
    // Generate random number
    const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
    const code = randomBytes.toString('hex').substring(0, length);
    
    // Check if code already exists
    const existingCode = await QRCode.findOne({ code });
    if (!existingCode) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique QR code after maximum attempts');
};

/**
 * Generate multiple unique QR codes
 * @param count - Number of QR codes to generate
 * @param length - Length of each QR code (default: 12)
 * @returns Promise<string[]> - Array of unique QR codes
 */
export const generateMultipleUniqueQRCodes = async (count: number, length: number = 12): Promise<string[]> => {
  const codes: string[] = [];
  const batchSize = 100; // Process in batches for better performance
  
  for (let i = 0; i < count; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, count - i);
    const batchPromises = Array.from({ length: currentBatchSize }, () => 
      generateUniqueQRCode(length)
    );
    
    const batchCodes = await Promise.all(batchPromises);
    codes.push(...batchCodes);
  }
  
  return codes;
};

/**
 * Generate a batch ID for grouping QR codes
 * @returns string - Unique batch ID
 */
export const generateBatchId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `batch_${timestamp}_${random}`;
};

/**
 * Validate QR code format
 * @param code - QR code to validate
 * @returns boolean - Whether the code is valid
 */
export const isValidQRCode = (code: string): boolean => {
  return /^[a-f0-9]{8,20}$/i.test(code);
};
