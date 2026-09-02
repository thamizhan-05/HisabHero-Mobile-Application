import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Transaction from '../models/Transaction.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://thamizhan0510_db_user:Udaya%402005@hisabhero.mdfy1.mongodb.net/hisabhero?retryWrites=true&w=majority&appName=Hisabhero';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const testEmail = 'selva@hisabhero.com';
  const hashedPassword = await bcrypt.hash('StrongPass123!', 10);

  // Delete existing if any
  await User.deleteMany({ email: testEmail });

  const user = await User.create({
    fullName: 'Selvamanikandan',
    email: testEmail,
    password: hashedPassword,
    isVerified: true
  });
  console.log('Created test user:', user._id);

  // Create Personal Workspace
  const personalWs = await Workspace.create({
    name: 'My Personal Finance',
    type: 'personal',
    ownerId: user._id,
    currency: 'INR',
    isDefault: true
  });
  console.log('Created Personal Workspace:', personalWs._id);

  await WorkspaceMember.create({
    workspaceId: personalWs._id,
    userId: user._id,
    role: 'owner',
    status: 'active'
  });

  // Create Business Workspace
  const bizWs = await Workspace.create({
    name: 'Apex Traders Pvt Ltd',
    type: 'business',
    ownerId: user._id,
    joinCode: 'APEX-8899-HERO',
    currency: 'INR',
    businessType: 'Retail',
    industry: 'Trading & Distribution'
  });
  console.log('Created Business Workspace:', bizWs._id);

  await WorkspaceMember.create({
    workspaceId: bizWs._id,
    userId: user._id,
    role: 'owner',
    status: 'active'
  });

  // Seed sample transactions for Personal
  await Transaction.create([
    {
      workspaceId: personalWs._id,
      userId: user._id,
      workspaceType: 'personal',
      description: 'Consulting Retainer Income',
      amount: 75000,
      type: 'income',
      category: 'Revenue',
      date: new Date()
    },
    {
      workspaceId: personalWs._id,
      userId: user._id,
      workspaceType: 'personal',
      description: 'AWS Cloud Hosting',
      amount: 4500,
      type: 'expense',
      category: 'Technology',
      date: new Date()
    },
    {
      workspaceId: personalWs._id,
      userId: user._id,
      workspaceType: 'personal',
      description: 'Office Supplies',
      amount: 1850,
      type: 'expense',
      category: 'Office',
      date: new Date()
    }
  ]);

  console.log('Seeded transactions for Personal Workspace!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
