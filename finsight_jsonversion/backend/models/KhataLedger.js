import mongoose from 'mongoose';

const KhataLedgerSchema = new mongoose.Schema({
  workspaceId: {
    type: String,
    required: true,
    index: true
  },
  partyName: {
    type: String,
    required: true,
    trim: true
  },
  partyType: {
    type: String,
    enum: ['customer', 'vendor'],
    default: 'customer'
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  vpa: {
    type: String,
    trim: true,
    default: 'hisabhero@upi'
  },
  netBalance: {
    type: Number,
    default: 0 // positive = party owes us (you'll receive), negative = we owe party (you'll pay)
  },
  currency: {
    type: String,
    default: 'INR'
  },
  entries: [{
    type: {
      type: String,
      enum: ['credit', 'debit'], // credit = gave credit/sold (receivable increases), debit = received payment/paid (receivable decreases)
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    note: String,
    invoiceId: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  lastReminderSentAt: Date
}, { timestamps: true });

KhataLedgerSchema.index({ workspaceId: 1, partyName: 1 });

const KhataLedger = mongoose.models.KhataLedger || mongoose.model('KhataLedger', KhataLedgerSchema);
export default KhataLedger;
