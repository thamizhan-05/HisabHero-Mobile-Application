import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth signups
  companyName: { type: String },
  isVerified: { type: Boolean, default: false },
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
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
