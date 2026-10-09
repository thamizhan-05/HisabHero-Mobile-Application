import mongoose from 'mongoose';

const OTPVerificationSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User' },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
  pendingUserData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// TTL Index on expiresAt automatically purges expired OTP documents from MongoDB
OTPVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OTPVerificationSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model('OTPVerification', OTPVerificationSchema);

