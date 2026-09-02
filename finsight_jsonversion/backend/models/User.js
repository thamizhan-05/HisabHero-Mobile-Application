import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth signups
  accountType: { type: String, enum: ['personal', 'business'], default: 'personal' },
  companyName: { type: String },
  businessOwnerName: { type: String },
  dateOfBirth: { type: String },
  mobileNumber: { type: String },
  profilePhoto: { type: String },
  preferredLanguage: { type: String, default: 'en' },
  preferredCurrency: { type: String, default: 'INR' },
  phone: { type: String },
  gstNumber: { type: String },
  businessCategory: { type: String },
  companyAddress: { type: String },
  isVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  verificationCode: { type: String },

  verificationExpires: { type: Date },
  profileImage: { type: String },
  publicKey: { type: String },
  authProviders: [
    {
      provider: { type: String },
      providerId: { type: String }
    }
  ],
  defaultWorkspaceId: { type: String, ref: 'Workspace' },
  biometricEnabled: { type: Boolean, default: false },
  biometricVerifiedAt: { type: Date },
  activeSessions: [{
    sessionId: { type: String, required: true },
    deviceName: { type: String, default: 'Mobile Device' },
    platform: { type: String, default: 'Android' },
    lastActive: { type: Date, default: Date.now },
    ipAddress: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
