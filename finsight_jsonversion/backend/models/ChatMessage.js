import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business', required: true, index: true },
  senderId: { type: String, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  receiverId: { type: String, ref: 'User', default: null, index: true }, // null = Workspace Group Chat
  message: { type: String, required: true },
  attachments: [{ type: String }],
  readBy: [{ type: String, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('ChatMessage', ChatMessageSchema);
