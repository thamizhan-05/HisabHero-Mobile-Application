import mongoose from 'mongoose';

const UploadSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true },
  workspaceId: { type: String, required: true, index: true },
  businessId: { type: String, ref: 'Business', default: null },
  uploadId: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  fileType: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  storageUrl: { type: String },
  status: { type: String, enum: ['pending', 'processed', 'error'], default: 'processed' },
  uploadedAt: { type: String, default: () => new Date().toISOString() },
  rowCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Upload', UploadSchema);
