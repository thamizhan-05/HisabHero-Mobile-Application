import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  workspaceId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  documentType: { 
    type: String, 
    enum: ['bank_statement', 'credit_card', 'expense_report', 'invoice', 'receipt', 'financial_report'],
    default: 'bank_statement'
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'needs_review', 'approved', 'partially_approved', 'confirmed', 'failed'],
    default: 'processing'
  },

  summary: {
    totalCount: { type: Number, default: 0 },
    inflow: { type: Number, default: 0 },
    outflow: { type: Number, default: 0 },
    netCashFlow: { type: Number, default: 0 },
    highConfidenceCount: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 }
  },
  extractedTransactions: [{
    tempId: { type: String, required: true },
    date: { type: String, required: true },
    description: { type: String, required: true },
    merchantName: { type: String },
    category: { type: String, default: 'Other' },
    type: { type: String, enum: ['income', 'expense'], default: 'expense' },
    amount: { type: Number, required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number },
    referenceNumber: { type: String },
    confidenceScore: { type: Number, default: 0.95 },
    needsReview: { type: Boolean, default: false },
    isDuplicate: { type: Boolean, default: false },
    approved: { type: Boolean, default: true }
  }],
  errorMessage: { type: String }
}, { timestamps: true });

export default mongoose.model('Document', DocumentSchema);
