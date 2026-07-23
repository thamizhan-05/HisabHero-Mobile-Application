import mongoose from 'mongoose';

const UploadSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User' },
  businessId: { type: String, ref: 'Business', default: null },
  uploadId: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  uploadedAt: { type: String, default: () => new Date().toISOString() },
  rowCount: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model('Upload', UploadSchema);
