import mongoose from 'mongoose';

const TransactionApprovalSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business', required: true, index: true },
  transactionId: { type: String, ref: 'Transaction' },
  requestType: { type: String, enum: ['add_income', 'add_expense', 'update_transaction', 'delete_transaction'], required: true },
  submittedBy: { type: String, ref: 'User', required: true },
  submittedByName: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  requiredApprovers: [{ type: String, ref: 'User' }],
  approvedBy: [{ type: String, ref: 'User' }],
  approvalLogs: [{
    userId: { type: String, ref: 'User' },
    userName: { type: String },
    timestamp: { type: Date, default: Date.now },
    biometricVerified: { type: Boolean, default: false }
  }],
  rejectedBy: { type: String, ref: 'User' },
  rejectionReason: { type: String },
  rejectionDetails: {
    rejectedBy: { type: String, ref: 'User' },
    rejectedByName: { type: String },
    reason: { type: String },
    timestamp: { type: Date },
    biometricVerified: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('TransactionApproval', TransactionApprovalSchema);
