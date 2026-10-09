import mongoose from 'mongoose';

const JoinRequestSchema = new mongoose.Schema({
  workspaceId: { type: String, ref: 'Workspace', index: true },
  businessId: { type: String, ref: 'Business', index: true },
  userId: { type: String, ref: 'User', required: true, index: true },
  applicantName: { type: String, required: true },
  applicantEmail: { type: String, required: true },
  applicantPhone: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  userCreatedAt: { type: Date },
  respondedAt: { type: Date },
  respondedBy: { type: String, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('JoinRequest', JoinRequestSchema);
