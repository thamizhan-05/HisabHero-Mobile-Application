import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

function hashPasswordPBKDF2(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
  return `210000:${salt}:${hash}`;
}

async function createCleanUser() {
  await mongoose.connect(process.env.MONGODB_URI);

  const User = mongoose.model('User', new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: { type: String, default: 'owner' },
    isVerified: { type: Boolean, default: true },
    activeWorkspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }
  }, { strict: false }));

  const Workspace = mongoose.model('Workspace', new mongoose.Schema({
    name: String,
    type: { type: String, default: 'personal' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinCode: String,
    settings: Object
  }, { strict: false }));

  const userId = new mongoose.Types.ObjectId();
  const wsId = new mongoose.Types.ObjectId();

  const ws = await Workspace.create({
    _id: wsId,
    name: "Selva's Personal Finance",
    type: 'personal',
    ownerId: userId,
    joinCode: 'HERO-WS-SELVA1',
    settings: {
      currency: 'INR',
      currencySymbol: '₹',
      startingBalance: 0
    }
  });

  const user = await User.create({
    _id: userId,
    fullName: 'Selva',
    email: 'selvathevar10042005@gmail.com',
    passwordHash: hashPasswordPBKDF2('Stvr2005$'),
    role: 'owner',
    isVerified: true,
    activeWorkspace: wsId
  });

  console.log(`✅ Fresh verified account ready: ${user.email} (Workspace: ${ws.name}, ID: ${wsId})`);
  await mongoose.disconnect();
}

createCleanUser().catch(console.error);
