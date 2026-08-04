import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  accountCode: String,
  accountName: String,
  debit: {
    type: Number,
    default: 0,
  },
  credit: {
    type: Number,
    default: 0,
  },
  memo: String,
});

const journalEntrySchema = new mongoose.Schema(
  {
    workspaceId: {
      type: String,
      required: true,
      index: true,
    },
    entryNumber: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      default: '',
    },
    lines: [lineItemSchema],
    totalDebit: {
      type: Number,
      required: true,
    },
    totalCredit: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Posted', 'Voided'],
      default: 'Posted',
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.JournalEntry || mongoose.model('JournalEntry', journalEntrySchema);
