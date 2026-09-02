import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  workspaceId: { type: String, ref: 'Workspace', index: true },
  workspaceType: { type: String, enum: ['personal', 'business'] },
  userId: { type: String, ref: 'User', index: true },
  businessId: { type: String, ref: 'Business', default: null, index: true },
  createdBy: { type: String, ref: 'User' },
  uploadId: { type: String, default: '' },
  sourceDocumentId: { type: String, ref: 'Document' },
  date: { type: String, required: true }, // YYYY-MM-DD
  description: { type: String, required: true },
  category: { type: String, default: 'Other' },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], default: 'expense' },
  merchant: { type: String },
  paymentMethod: { type: String },
  receiptUrl: { type: String },
  taxAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'pending_approval', 'high_value_pending', 'approved', 'rejected', 'reimbursed', 'reversed'], 
    default: 'approved' 
  },
  highValueReview: { type: Boolean, default: false },
  approvedBy: { type: String, ref: 'User' },
  approvalDate: { type: Date },
  approvalNotes: { type: String },
  reversedBy: { type: String, ref: 'User' },
  reversalReason: { type: String },
  reversedAt: { type: Date },
  originalAmount: { type: Number },
  originalCurrency: { type: String },
  exchangeRate: { type: Number },
  signature: { type: String },
  vectorClock: { type: Map, of: Number, default: {} },
}, { timestamps: true });

TransactionSchema.index({ workspaceId: 1, date: -1 });
TransactionSchema.index({ workspaceId: 1, createdAt: -1 });
TransactionSchema.index({ businessId: 1, date: -1 });
TransactionSchema.index({ userId: 1, date: -1 });

export default mongoose.model('Transaction', TransactionSchema);
