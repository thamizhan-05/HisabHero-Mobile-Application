import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true, index: true },
  businessId: { type: String, ref: 'Business' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['approval', 'owner_request', 'join', 'announcement', 'system'], default: 'system' },
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
