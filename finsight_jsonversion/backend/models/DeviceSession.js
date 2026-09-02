import mongoose from 'mongoose';

const DeviceSessionSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true, index: true },
  deviceId: { type: String, index: true },
  deviceName: { type: String, default: 'Mobile Device' },
  deviceInfo: { type: String, default: '' },
  platform: { type: String, default: 'Android' },
  ipAddress: { type: String, default: '127.0.0.1' },
  userAgent: { type: String, default: '' },
  tokenHash: { type: String, required: false },
  isPrimary: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'pending'], default: 'active', index: true },
  lastActiveAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

export default mongoose.models.DeviceSession || mongoose.model('DeviceSession', DeviceSessionSchema);
