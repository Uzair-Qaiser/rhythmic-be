import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import QRCode, { QRCodeStatus } from '../models/QRCode';
import { 
  generateMultipleUniqueQRCodes, 
  generateBatchId, 
  isValidQRCode 
} from '../utils/qrCodeGenerator';

// Generate bulk QR codes (admin/manufacturer only)
export const generateBulkQRCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { quantity, length = 12, metadata = {} } = req.body;
    const generatedBy = req.user!._id;

    if (quantity > 10000) {
      res.status(400).json({ message: 'Cannot generate more than 10,000 QR codes at once' });
      return;
    }

    // Generate unique batch ID
    const batchId = generateBatchId();
    
    // Generate unique QR codes
    const codes = await generateMultipleUniqueQRCodes(quantity, length);
    
    // Prepare QR code documents for bulk insertion
    const qrCodeDocs = codes.map((code, index) => ({
      code,
      generatedBy,
      batchId,
      quantity,
      batchNumber: index + 1,
      metadata
    }));

    // Bulk insert for better performance
    const result = await QRCode.insertMany(qrCodeDocs, { 
      ordered: false, // Continue on errors
      lean: true 
    });

    res.status(201).json({
      message: `${result.length} QR codes generated successfully`,
      batchId,
      quantity: result.length,
      codes: result.map(doc => doc.code),
      metadata: {
        generatedAt: new Date(),
        generatedBy: req.user!.email,
        batchId
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get QR codes with pagination and filtering
export const getQRCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      batchId, 
      search,
      generatedBy 
    } = req.query;
    
    const query: any = {};
    
    // Filter by status
    if (status && Object.values(QRCodeStatus).includes(status as QRCodeStatus)) {
      query.status = status;
    }
    
    // Filter by batch ID
    if (batchId) {
      query.batchId = batchId;
    }
    
    // Filter by generator
    if (generatedBy) {
      query.generatedBy = generatedBy;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { batchId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // If user is manufacturer, only show their QR codes
    if (req.user!.userType === 'manufacturer') {
      query.generatedBy = req.user!._id;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const qrCodes = await QRCode.find(query)
      .populate('generatedBy', 'email firstName lastName')
      .populate('redeemedBy', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
    
    const total = await QRCode.countDocuments(query);
    
    res.json({
      qrCodes,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalQRCodes: total,
        qrCodesPerPage: Number(limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get QR code by ID
export const getQRCodeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const qrCode = await QRCode.findById(id)
      .populate('generatedBy', 'email firstName lastName')
      .populate('redeemedBy', 'email firstName lastName');
    
    if (!qrCode) {
      res.status(404).json({ message: 'QR code not found.' });
      return;
    }
    
    // Check if user has access to this QR code
    if (req.user!.userType === 'manufacturer' && 
        qrCode.generatedBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    
    res.json({ qrCode });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get QR code statistics
export const getQRCodeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const query: any = {};
    
    // If user is manufacturer, only show their stats
    if (req.user!.userType === 'manufacturer') {
      query.generatedBy = req.user!._id;
    }
    
    const stats = await QRCode.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalQRCodes = await QRCode.countDocuments(query);
    const unredeemedCount = await QRCode.countDocuments({ ...query, status: QRCodeStatus.UNREDEEMED });
    const redeemedCount = await QRCode.countDocuments({ ...query, status: QRCodeStatus.REDEEMED });
    
    // Get batch statistics
    const batchStats = await QRCode.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$batchId',
          count: { $sum: 1 },
          quantity: { $first: '$quantity' },
          createdAt: { $first: '$createdAt' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      totalQRCodes,
      unredeemedCount,
      redeemedCount,
      byStatus: stats,
      recentBatches: batchStats
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete single QR code
export const deleteQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const qrCode = await QRCode.findById(id);
    if (!qrCode) {
      res.status(404).json({ message: 'QR code not found.' });
      return;
    }
    
    // Check if user has access to delete this QR code
    if (req.user!.userType === 'manufacturer' && 
        qrCode.generatedBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }
    
    await QRCode.findByIdAndDelete(id);
    
    res.json({ 
      message: 'QR code deleted successfully',
      deletedQRCode: {
        id: qrCode._id,
        code: qrCode.code,
        batchId: qrCode.batchId
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk delete QR codes
export const bulkDeleteQRCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { qrCodeIds, batchId } = req.body;
    
    if (!qrCodeIds && !batchId) {
      res.status(400).json({ message: 'Either qrCodeIds or batchId must be provided.' });
      return;
    }
    
    let query: any = {};
    
    if (batchId) {
      query.batchId = batchId;
    } else if (Array.isArray(qrCodeIds) && qrCodeIds.length > 0) {
      query._id = { $in: qrCodeIds };
    } else {
      res.status(400).json({ message: 'Invalid qrCodeIds or batchId.' });
      return;
    }
    
    // If user is manufacturer, only allow deletion of their QR codes
    if (req.user!.userType === 'manufacturer') {
      query.generatedBy = req.user!._id;
    }
    
    // Find QR codes to be deleted
    const qrCodes = await QRCode.find(query);
    
    if (qrCodes.length === 0) {
      res.status(404).json({ message: 'No QR codes found to delete.' });
      return;
    }
    
    // Delete QR codes
    const result = await QRCode.deleteMany(query);
    
    res.json({
      message: `${result.deletedCount} QR code(s) deleted successfully`,
      deletedCount: result.deletedCount,
      deletedQRCodes: qrCodes.map(qr => ({
        id: qr._id,
        code: qr.code,
        batchId: qr.batchId
      }))
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Redeem QR code
export const redeemQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    
    if (!code || !isValidQRCode(code)) {
      res.status(400).json({ message: 'Invalid QR code format.' });
      return;
    }
    
    const qrCode = await QRCode.findOne({ code, status: QRCodeStatus.UNREDEEMED });
    
    if (!qrCode) {
      res.status(404).json({ message: 'QR code not found or already redeemed.' });
      return;
    }
    
    // Update QR code status
    qrCode.status = QRCodeStatus.REDEEMED;
    qrCode.redeemedAt = new Date();
    qrCode.redeemedBy = req.user!._id;
    
    await qrCode.save();
    
    res.json({
      message: 'QR code redeemed successfully',
      qrCode: {
        id: qrCode._id,
        code: qrCode.code,
        batchId: qrCode.batchId,
        redeemedAt: qrCode.redeemedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
