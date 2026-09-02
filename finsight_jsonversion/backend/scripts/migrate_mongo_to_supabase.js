/**
 * ==============================================================================
 * HISABHERO DATA MIGRATION: MongoDB Atlas -> Supabase PostgreSQL
 * ==============================================================================
 * This script exports all active data from MongoDB Atlas (Users, Workspaces,
 * Transactions, Accounts, Invoices, Khata) and cleanly loads it into Supabase.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { supabase } from '../db/supabaseClient.js';

// Mongoose Models
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import JournalEntry from '../models/JournalEntry.js';
import Invoice from '../models/Invoice.js';
import KhataLedger from '../models/KhataLedger.js';
import Document from '../models/Document.js';

dotenv.config();

// Helper to map MongoDB ObjectId to deterministic UUID or string
const idMap = new Map();
function toUuid(objectId) {
  if (!objectId) return null;
  const str = objectId.toString();
  if (idMap.has(str)) return idMap.get(str);
  
  // Format 24-char hex MongoDB ObjectId into standard 32-char UUID
  const padded = str.padStart(32, '0');
  const uuid = `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20, 32)}`;
  idMap.set(str, uuid);
  return uuid;
}

async function runMigration() {
  console.log('🚀 Starting HisabHero MongoDB -> Supabase Migration...');

  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI missing in .env');
  }
  await mongoose.connect(mongoUri);
  console.log('📡 Connected to MongoDB Atlas successfully.');

  // 2. Migrate Users
  const users = await User.find({}).lean();
  console.log(`👤 Found ${users.length} users in MongoDB.`);
  const validUserIds = new Set();
  for (const u of users) {
    const userUuid = toUuid(u._id);
    const { error } = await supabase.from('users').upsert({
      id: userUuid,
      email: u.email.toLowerCase().trim(),
      full_name: u.fullName || u.name || 'User',
      password: u.password,
      role: u.role || 'user',
      account_type: u.accountType || 'personal',
      is_verified: u.isVerified ?? true,
      email_verified: u.emailVerified ?? true,
      auth_providers: u.authProviders || [],
      created_at: u.createdAt || new Date()
    });
    if (error) {
      console.error(`❌ User insert error for ${u.email}:`, error.message);
    } else {
      validUserIds.add(userUuid);
    }
  }
  console.log(`✅ ${validUserIds.size} users migrated.`);

  // 3. Migrate Workspaces
  const workspaces = await Workspace.find({}).lean();
  console.log(`🏢 Found ${workspaces.length} workspaces in MongoDB.`);
  const validWorkspaceIds = new Set();
  for (const w of workspaces) {
    const wsUuid = toUuid(w._id);
    const ownerUuid = toUuid(w.ownerId);
    const validOwner = validUserIds.has(ownerUuid) ? ownerUuid : null;

    const { error } = await supabase.from('workspaces').upsert({
      id: wsUuid,
      name: w.name,
      type: w.type || 'personal',
      owner_id: validOwner,
      business_name: w.businessName,
      industry: w.industry,
      currency: w.currency || 'INR',
      join_code: w.joinCode,
      cash_balance: w.cashBalance || 0,
      settings: w.settings || {},
      created_at: w.createdAt || new Date()
    });
    if (error) {
      console.error(`❌ Workspace insert error for ${w.name}:`, error.message);
    } else {
      validWorkspaceIds.add(wsUuid);
    }
  }
  console.log(`✅ ${validWorkspaceIds.size} workspaces migrated.`);

  // 4. Migrate Workspace Members
  const members = await WorkspaceMember.find({}).lean();
  for (const m of members) {
    const wsUuid = toUuid(m.workspaceId);
    const userUuid = toUuid(m.userId);
    if (wsUuid && userUuid && validWorkspaceIds.has(wsUuid) && validUserIds.has(userUuid)) {
      await supabase.from('workspace_members').upsert({
        id: toUuid(m._id),
        workspace_id: wsUuid,
        user_id: userUuid,
        role: m.role || 'employee',
        joined_at: m.joinedAt || new Date()
      });
    }
  }

  // 5. Migrate Transactions
  const txs = await Transaction.find({}).lean();
  console.log(`💳 Found ${txs.length} transactions in MongoDB.`);
  let txCount = 0;
  for (const tx of txs) {
    const wsUuid = toUuid(tx.workspaceId);
    if (!wsUuid || !validWorkspaceIds.has(wsUuid)) continue;
    const userUuid = toUuid(tx.userId);
    const validUser = validUserIds.has(userUuid) ? userUuid : null;

    const { error } = await supabase.from('transactions').upsert({
      id: toUuid(tx._id),
      workspace_id: wsUuid,
      user_id: validUser,
      type: tx.type,
      category: tx.category || 'General',
      amount: tx.amount,
      description: tx.description,
      merchant: tx.merchant,
      date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      payment_method: tx.paymentMethod || 'Cash',
      source: tx.source || 'Manual',
      tax_rate: tx.taxRate || 0,
      tax_amount: tx.taxAmount || 0,
      is_verified: tx.isVerified ?? true,
      merkle_hash: tx.merkleHash,
      previous_hash: tx.previousHash,
      metadata: tx.metadata || {},
      created_at: tx.createdAt || new Date()
    });
    if (error) {
      console.error(`❌ Transaction insert error:`, error.message);
    } else {
      txCount++;
    }
  }
  console.log(`✅ ${txCount} transactions migrated.`);

  // 6. Migrate Invoices
  const invoices = await Invoice.find({}).lean();
  console.log(`🧾 Found ${invoices.length} invoices in MongoDB.`);
  for (const inv of invoices) {
    const wsUuid = toUuid(inv.workspaceId);
    if (!wsUuid) continue;
    await supabase.from('invoices').upsert({
      id: toUuid(inv._id),
      workspace_id: wsUuid,
      invoice_number: inv.invoiceNumber || `INV-${Date.now()}`,
      customer_name: inv.customerName || 'Customer',
      customer_email: inv.customerEmail,
      customer_gstin: inv.customerGstin,
      date: inv.date ? new Date(inv.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      due_date: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      items: inv.items || [],
      subtotal: inv.subtotal || 0,
      cgst: inv.cgst || 0,
      sgst: inv.sgst || 0,
      igst: inv.igst || 0,
      total_amount: inv.totalAmount || 0,
      paid_amount: inv.paidAmount || 0,
      status: inv.status || 'unpaid',
      notes: inv.notes,
      created_at: inv.createdAt || new Date()
    });
  }

  // 7. Migrate Khata Ledgers
  const khatas = await KhataLedger.find({}).lean();
  for (const k of khatas) {
    const wsUuid = toUuid(k.workspaceId);
    if (!wsUuid) continue;
    await supabase.from('khata_ledgers').upsert({
      id: toUuid(k._id),
      workspace_id: wsUuid,
      party_name: k.partyName || 'Party',
      party_type: k.partyType || 'customer',
      phone: k.phone,
      current_balance: k.currentBalance || 0,
      credit_limit: k.creditLimit || 0,
      entries: k.entries || [],
      last_reminded_at: k.lastRemindedAt,
      created_at: k.createdAt || new Date()
    });
  }

  // 8. Migrate Chart of Accounts
  const accounts = await Account.find({}).lean();
  for (const acc of accounts) {
    const wsUuid = toUuid(acc.workspaceId);
    if (!wsUuid) continue;
    await supabase.from('accounts').upsert({
      id: toUuid(acc._id),
      workspace_id: wsUuid,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      sub_category: acc.subCategory,
      balance: acc.balance || 0,
      currency: acc.currency || 'INR',
      is_system: acc.isSystem || false,
      created_at: acc.createdAt || new Date()
    });
  }

  console.log('🎉 Full Migration Completed Successfully!');
  await mongoose.disconnect();
}

runMigration().catch(err => {
  console.error('💥 Migration Error:', err);
  process.exit(1);
});
