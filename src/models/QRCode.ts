import mongoose, { Document, Schema, Types } from 'mongoose';

export enum QRCodeStatus {
  UNREDEEMED = 'unredeemed',
  REDEEMED = 'redeemed'
}

export interface IQRCode extends Document {
  _id: Types.ObjectId;
  code: string; // Unique random number
  status: QRCodeStatus;
  generatedBy: Types.ObjectId; // Reference to User (admin/manufacturer)
  batchId: string; // For grouping bulk generated QR codes
  quantity: number; // Total quantity in this batch
  batchNumber: number; // Sequential number within the batch
  isActive: boolean;
  redeemedAt?: Date;
  redeemedBy?: Types.ObjectId; // Reference to User who redeemed
  metadata?: Record<string, any>; // For additional data
  createdAt: Date;
  updatedAt: Date;
}

const qrCodeSchema = new Schema<IQRCode>({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true, // For fast lookups
    minlength: [8, 'QR code must be at least 8 characters'],
    maxlength: [20, 'QR code cannot exceed 20 characters']
  },
  status: {
    type: String,
    enum: Object.values(QRCodeStatus),
    default: QRCodeStatus.UNREDEEMED,
    index: true // For fast status filtering
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  batchId: {
    type: String,
    required: true,
    index: true // For batch operations
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  batchNumber: {
    type: Number,
    required: true,
    min: [1, 'Batch number must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  redeemedAt: {
    type: Date,
    index: true
  },
  redeemedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for common query patterns
qrCodeSchema.index({ batchId: 1, batchNumber: 1 });
qrCodeSchema.index({ generatedBy: 1, createdAt: -1 });
qrCodeSchema.index({ status: 1, isActive: 1 });
qrCodeSchema.index({ code: 1, status: 1 });

// Ensure code uniqueness
qrCodeSchema.index({ code: 1 }, { unique: true });

export default mongoose.model<IQRCode>('QRCode', qrCodeSchema);
