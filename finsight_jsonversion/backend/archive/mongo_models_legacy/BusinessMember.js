import mongoose from 'mongoose';

const BusinessMemberSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business', required: true, index: true },
  userId: { type: String, ref: 'User', required: true, index: true },
  role: {
    type: String,
    // OWNER: Full control. ADMIN: Manage members, approve transactions.
    // ACCOUNTANT: View+manage financials. EMPLOYEE: Submit own expenses only.
    // VIEWER: Read-only access.
    enum: ['owner', 'admin', 'accountant', 'employee', 'viewer'],
    default: 'employee'
  },
  status: { type: String, enum: ['active', 'pending', 'rejected', 'inactive'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
  invitedBy: { type: String, ref: 'User' },
  assignedRole: { type: String, default: '' }, // Role assigned at time of approval
}, { timestamps: true });

BusinessMemberSchema.index({ businessId: 1, userId: 1 }, { unique: true });
BusinessMemberSchema.index({ businessId: 1, status: 1 });

export default mongoose.model('BusinessMember', BusinessMemberSchema);

