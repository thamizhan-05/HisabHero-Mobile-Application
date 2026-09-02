import mongoose from 'mongoose';

const BusinessCalendarEventSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true },
  allDay: { type: Boolean, default: true },
  eventType: {
    type: String,
    enum: ['invoice_due', 'bill_due', 'payroll_due', 'project_deadline', 'approval_deadline', 'recurring_expense', 'custom'],
    default: 'custom',
    index: true,
  },
  relatedRecordId: { type: String },
  relatedRecordType: { type: String },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'completed', 'overdue', 'cancelled'], default: 'pending' },
  reminderMinutesBefore: { type: Number, default: 1440 }, // 24 hours default
  createdBy: { type: String, ref: 'User', required: true },
  updatedBy: { type: String, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('BusinessCalendarEvent', BusinessCalendarEventSchema);
