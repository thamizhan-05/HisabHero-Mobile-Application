import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  workspaceId: { type: String, ref: 'Workspace', index: true },
  workspaceType: { type: String, enum: ['personal', 'business'] },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  type: { type: String, enum: ['customer', 'supplier', 'both'], default: 'customer' },
  businessId: { type: String, ref: 'Business', default: null },
  userId: { type: String, ref: 'User' },
  createdBy: { type: String, ref: 'User' },
  balance: { type: Number, default: 0 }
}, { timestamps: true });

ContactSchema.index({ workspaceId: 1, createdAt: -1 });
ContactSchema.index({ workspaceId: 1, name: 1 });
export default mongoose.model('Contact', ContactSchema);
