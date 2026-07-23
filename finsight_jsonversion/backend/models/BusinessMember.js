import mongoose from 'mongoose';

const BusinessMemberSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business', required: true },
  userId: { type: String, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['owner', 'partner', 'accountant', 'manager', 'employee', 'viewer'], 
    default: 'viewer' 
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
  invitedBy: { type: String, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('BusinessMember', BusinessMemberSchema);
