import mongoose from 'mongoose';

const OwnerRequestSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business', required: true, index: true },
  userId: { type: String, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  respondedBy: { type: String, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('OwnerRequest', OwnerRequestSchema);
