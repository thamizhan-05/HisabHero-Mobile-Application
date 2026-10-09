import mongoose from 'mongoose';

const WorkspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, ref: 'Workspace', required: true, index: true },
    userId: { type: String, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'accountant', 'employee', 'viewer'],
      default: 'owner',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'rejected', 'inactive', 'revoked'],
      default: 'active',
    },
    joinedAt: { type: Date, default: Date.now },
    invitedBy: { type: String, ref: 'User' },
    message: { type: String, default: '' },
  },
  { timestamps: true }
);

WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
WorkspaceMemberSchema.index({ workspaceId: 1, status: 1 });

export default mongoose.model('WorkspaceMember', WorkspaceMemberSchema);

