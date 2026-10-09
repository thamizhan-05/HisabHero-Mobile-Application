import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  workspaceId: { type: String, ref: 'Workspace', index: true },
  workspaceType: { type: String, enum: ['personal', 'business'] },
  businessId: { type: String, ref: 'Business', index: true },
  userId: { type: String, ref: 'User', required: true }, // Actor
  actorName: { type: String, default: '' },              // Actor full name
  action: { type: String, required: true },              // e.g. "join_request_approved", "transaction_approved"
  entityType: { type: String, required: true },          // e.g. "JoinRequest", "Transaction", "Member"
  entityId: { type: String },                            // ID of the affected entity
  targetUserId: { type: String, ref: 'User' },           // Affected user (if applicable)
  amount: { type: Number },                              // Amount in ₹ (if applicable)
  result: { type: String, enum: ['success', 'failure', 'pending'], default: 'success' },
  approverId: { type: String, ref: 'User' },             // Who approved (if applicable)
  approverName: { type: String },
  approvalTime: { type: Date },                          // When approval happened
  biometricVerified: { type: Boolean, default: false },
  sequenceIndex: { type: Number, default: 0 },
  previousBlockHash: { type: String, default: '0000000000000000000000000000000000000000000000000000000000000000' },
  blockHash: { type: String, default: () => Math.random().toString(36).substring(2) + Date.now().toString(36) },
  metadata: { type: mongoose.Schema.Types.Mixed },       // Extra context
}, { timestamps: true });

AuditLogSchema.index({ businessId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });


AuditLogSchema.index({ workspaceId: 1, createdAt: -1 });
export default mongoose.model('AuditLog', AuditLogSchema);
