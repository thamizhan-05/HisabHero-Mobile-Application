import mongoose from 'mongoose';

const InvitationSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business', required: true },
  invitedEmail: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['owner', 'partner', 'accountant', 'manager', 'employee', 'viewer'], 
    required: true 
  },
  invitedBy: { type: String, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expirationDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'], 
    default: 'pending' 
  }
}, { timestamps: true });

export default mongoose.model('Invitation', InvitationSchema);
