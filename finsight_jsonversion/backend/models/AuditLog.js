import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business' },
  userId: { type: String, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. "create_transaction", "invite_user", "change_role"
  entityType: { type: String, required: true }, // e.g. "Transaction", "Invitation", "Member"
  entityId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.model('AuditLog', AuditLogSchema);
