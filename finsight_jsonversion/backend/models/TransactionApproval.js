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
  rejectedBy: { type: String, ref: 'User' },
  rejectionReason: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('TransactionApproval', TransactionApprovalSchema);
