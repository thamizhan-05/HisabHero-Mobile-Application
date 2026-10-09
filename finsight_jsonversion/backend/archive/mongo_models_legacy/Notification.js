import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true, index: true },
  businessId: { type: String, ref: 'Business', index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: {
    type: String,
    enum: ['overdue_invoice', 'low_stock', 'runway_warning', 'approval_request', 'payroll_due', 'revenue_surge', 'system', 'approval', 'owner_request', 'join', 'join_request'],
    default: 'system',
    index: true,
  },
  read: { type: Boolean, default: false, index: true },
  targetScreen: { type: String, default: '' },
  data: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
