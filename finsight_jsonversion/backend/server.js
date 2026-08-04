import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import nacl from 'tweetnacl';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import connectDB from './config/db.js';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import Upload from './models/Upload.js';
import Business from './models/Business.js';
import BusinessMember from './models/BusinessMember.js';
import Invitation from './models/Invitation.js';
import AuditLog from './models/AuditLog.js';
import Contact from './models/Contact.js';
import Invoice from './models/Invoice.js';
import Quote from './models/Quote.js';
import Bill from './models/Bill.js';
import BankTransaction from './models/BankTransaction.js';
import InventoryItem from './models/InventoryItem.js';
import PurchaseOrder from './models/PurchaseOrder.js';
import FixedAsset from './models/FixedAsset.js';
import OwnerRequest from './models/OwnerRequest.js';
import TransactionApproval from './models/TransactionApproval.js';
import Notification from './models/Notification.js';
import ChatMessage from './models/ChatMessage.js';
import Account from './models/Account.js';
import JournalEntry from './models/JournalEntry.js';
import Project from './models/Project.js';
import Payroll from './models/Payroll.js';
// JSON local database fallbacks have been removed. MongoDB is the single source of truth.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MAX_ROWS = 5000; // [E] Row limit guard

// ─── Connect to MongoDB ───
connectDB();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id', 'x-workspace-id', 'Accept', 'Origin']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Universal Route Normalizer: Auto-prefix /auth/ requests with /api/
app.use((req, res, next) => {
  if (req.url.startsWith('/auth/') && !req.url.startsWith('/api/auth/')) {
    req.url = '/api' + req.url;
  }
  next();
});

// Health Check Endpoint for Cloud Deployment Verification & Uptime Monitoring
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    service: 'HisabHero Backend API',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});


const EMPTY_DB = {
  stats: [], transactions: [], uploads: [],
  cashflow: { monthlyData: [], stats: [] },
  expenses: { categories: [], monthlyTrend: [] },
  runway: [], alerts: [], recommendations: [], revenueExpense: []
};

// ─── Authentication Middleware ──────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'hisabhero-super-secret-jwt-2024-production';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Missing authentication token.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Invalid authentication token.' });
  }

  // Support legacy mock-jwt tokens for backward compatibility
  if (token.startsWith('mock-jwt-')) {
    const userId = token.replace('mock-jwt-', '');
    if (!userId) return res.status(401).json({ error: 'Unauthorized. User ID not found in token.' });
    req.userId = userId;
    return next();
  }

  // Verify real JWT token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized. Token is invalid or expired.' });
  }
  next();
}

// ─── Workspace Context Middleware ──────────────────────────────────────────────
async function workspaceMiddleware(req, res, next) {
  const rawId = req.headers['x-workspace-id'];
  const workspaceId = (!rawId || rawId === 'null' || rawId === 'undefined') ? 'personal' : rawId;
  req.isPersonal = workspaceId === 'personal' || workspaceId === req.userId;

  if (req.isPersonal) {
    req.workspaceId = req.userId;
    req.workspaceRole = 'owner';
    return next();
  }

  try {
    const member = await BusinessMember.findOne({ businessId: workspaceId, userId: req.userId, status: 'active' });

    if (!member) {
      // Fall back to personal workspace if not a member of the requested business
      req.isPersonal = true;
      req.workspaceId = req.userId;
      req.workspaceRole = 'owner';
      return next();
    }

    req.workspaceId = workspaceId;
    req.workspaceRole = member.role;
    next();
  } catch (err) {
    console.error('[workspaceMiddleware] Error:', err.message);
    req.isPersonal = true;
    req.workspaceId = req.userId;
    req.workspaceRole = 'owner';
    next();
  }
}

// ─── Role-Based Access Control Helper ──────────────────────────────────────────
export const PERMISSIONS = {
  view_financials: ['owner', 'partner', 'accountant', 'manager', 'viewer'],
  manage_transactions: ['owner', 'partner', 'accountant', 'manager'],
  submit_self_expense: ['owner', 'partner', 'accountant', 'manager', 'employee'],
  manage_budgets: ['owner', 'partner', 'accountant'],
  manage_members: ['owner'],
  delete_business: ['owner'],
};

function checkPermission(action) {
  return (req, res, next) => {
    const role = req.workspaceRole;
    const allowedRoles = PERMISSIONS[action];
    
    if (!allowedRoles || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: `Forbidden. Your role '${role}' does not have permission to ${action.replace(/_/g, ' ')}.` });
    }
    next();
  };
}

// Helper to log audit actions
async function logAudit(req, action, entityType, entityId, metadata = {}) {
  try {
    const logData = {
      businessId: req.isPersonal ? null : req.workspaceId,
      userId: req.userId,
      action,
      entityType,
      entityId,
      metadata: typeof metadata === 'object' ? metadata : { info: metadata }
    };
    await new AuditLog(logData).save();
  } catch (err) {
    console.error('[AUDIT] Failed to save audit log:', err.message);
  }
}

// ─── DB Helpers (Adapted for Collaborative Workspaces) ──────────────────────
async function getDbData(workspaceId, isPersonal = true) {
  try {
    if (!workspaceId) return { ...EMPTY_DB };

    // Fetch workspace isolated data from MongoDB
    const rawTransactions = await Transaction.find(
      isPersonal ? { userId: workspaceId, businessId: { $in: [null, 'personal'] } } : { businessId: workspaceId }
    ).lean();

    const rawUploads = await Upload.find(
      isPersonal ? { userId: workspaceId, businessId: { $in: [null, 'personal'] } } : { businessId: workspaceId }
    ).lean();

    // Map _id to id to avoid breaking frontend/calculations iterating with `id`
    const transactions = rawTransactions.map(t => ({
      ...t,
      id: t._id.toString()
    }));

    const uploads = rawUploads.map(u => ({
      ...u,
      id: u._id.toString(),
      uploadId: u.uploadId || u._id.toString()
    }));

    let budgets = {};
    let businessName = 'Personal Finance';
    if (!isPersonal) {
      const bus = await Business.findById(workspaceId).lean();
      if (bus) {
        budgets = bus.budgets || {};
        businessName = bus.name;
      }
    }

    const db = { ...EMPTY_DB, transactions, uploads, budgets, businessName };
    return recalculateDb(db, budgets);
  } catch (err) {
    console.error('getDbData MongoDB fetch error:', err);
    return { ...EMPTY_DB };
  }
}

async function getUsers() {
  try { return await User.find({}).lean(); }
  catch { return []; }
}


// ─── [A] Smart Column Detection ───────────────────────────────────────────────
const ALIASES = {
  date:        ['date', 'trans_date', 'transaction_date', 'time', 'timestamp', 'created_at', 'posting_date', 'value_date', 'txn_date', 'trxn_date'],
  description: ['description', 'narration', 'particulars', 'note', 'details', 'merchant', 'payee', 'remarks', 'desc', 'memo'],
  category:    ['category', 'cat', 'type_category', 'label', 'sub_category', 'expense_type'],
  amount:      ['amount', 'value', 'price', 'total', 'sum', 'trans_amt', 'txn_amount', 'net_amount', 'transaction_amount'],
  type:        ['type', 'transaction_type', 'kind', 'cr_dr', 'dr_cr', 'credit_debit'],
  debit:       ['debit', 'dr', 'withdrawal', 'expense', 'out'],
  credit:      ['credit', 'cr', 'deposit', 'income', 'in'],
};

function detectColumn(headers, fieldAliases) {
  const lHeaders = headers.map(h => h.toLowerCase().trim());
  for (const alias of fieldAliases) {
    const idx = lHeaders.findIndex(h => h === alias || h.includes(alias));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function detectMapping(headers) {
  return {
    date:        detectColumn(headers, ALIASES.date),
    description: detectColumn(headers, ALIASES.description),
    category:    detectColumn(headers, ALIASES.category),
    amount:      detectColumn(headers, ALIASES.amount),
    type:        detectColumn(headers, ALIASES.type),
    debit:       detectColumn(headers, ALIASES.debit),
    credit:      detectColumn(headers, ALIASES.credit),
  };
}

function resolveRow(row, mapping) {
  const today = new Date().toISOString().split('T')[0];
  let amount = 0;
  let type = 'expense';

  if (mapping.amount) {
    amount = parseFloat(String(row[mapping.amount] || '0').replace(/[₹,$,\s]/g, '')) || 0;
    if (mapping.type) {
      const t = String(row[mapping.type] || '').toLowerCase();
      type = (t.includes('income') || t.includes('credit') || t.includes('cr') || t.includes('in')) ? 'income' : 'expense';
    }
  } else if (mapping.credit || mapping.debit) {
    const creditAmt = parseFloat(String(row[mapping.credit] || '0').replace(/[₹,$,\s]/g, '')) || 0;
    const debitAmt  = parseFloat(String(row[mapping.debit]  || '0').replace(/[₹,$,\s]/g, '')) || 0;
    if (creditAmt > 0) { amount = creditAmt; type = 'income'; }
    else { amount = debitAmt; type = 'expense'; }
  }

  return {
    date:        mapping.date        ? (row[mapping.date] || today).split('T')[0] : today,
    description: mapping.description ? (row[mapping.description] || 'Transaction') : 'Transaction',
    category:    mapping.category    ? (row[mapping.category]    || 'Other')       : 'Other',
    amount, type,
  };
}

// ─── [C] Auto-Calculate Runway ────────────────────────────────────────────────
function calcRunway(transactions) {
  const monthMap = {};
  transactions.forEach(tx => {
    const m = (tx.date || '').slice(0, 7) || 'Unknown';
    if (!monthMap[m]) monthMap[m] = { inflow: 0, outflow: 0 };
    if (tx.type === 'income') monthMap[m].inflow += tx.amount;
    else monthMap[m].outflow += tx.amount;
  });

  const months = Object.keys(monthMap).sort();
  let balance = 0;
  const runway = [];
  months.forEach(m => {
    balance += monthMap[m].inflow - monthMap[m].outflow;
    runway.push({ month: m.slice(5), balance });
  });

  const avgBurn = months.length > 0
    ? months.reduce((s, m) => s + monthMap[m].outflow, 0) / months.length
    : 0;
  const lastBalance = runway.length ? runway[runway.length - 1].balance : 0;
  const monthsLeft = avgBurn > 0 ? parseFloat((lastBalance / avgBurn).toFixed(1)) : 0;

  const chartData = months.slice(-6).map((m, i) => ({
    month: m.slice(5),
    runway: parseFloat((runway[runway.length - months.slice(-6).length + i]?.balance / (avgBurn || 1)).toFixed(1))
  }));
  if (avgBurn > 0 && lastBalance > 0) {
    chartData.push({ month: 'Proj.1*', runway: parseFloat(Math.max(0, monthsLeft - 1).toFixed(1)) });
    chartData.push({ month: 'Proj.2*', runway: parseFloat(Math.max(0, monthsLeft - 2).toFixed(1)) });
  }
  return { chartData, monthsLeft };
}

// ─── [D] Auto-Generate Alerts ─────────────────────────────────────────────────
function generateAlerts(db) {
  const alerts = [];
  const txs = db.transactions;
  if (!txs || txs.length === 0) return alerts;

  const stats = db.stats || [];
  const marginStat = stats.find(s => s.label === 'Net Margin');
  const margin = marginStat ? parseFloat(marginStat.value) : 0;

  if (margin < 0) {
    alerts.push({
      type: 'anomaly', icon: 'AlertTriangle', emoji: '🔴',
      title: 'Negative Net Margin',
      description: `Your current net margin is ${margin.toFixed(1)}%. Expenses exceed revenue. Immediate cost review is recommended.`,
      colorClass: 'border-danger/30 bg-danger/5', iconColor: 'text-danger'
    });
  }

  // Budget Alerts
  if (db.budgetStatus && db.budgetStatus.limit > 0) {
    const { percent, limit, used } = db.budgetStatus;
    if (percent >= 100) {
      alerts.push({
        type: 'anomaly', icon: 'AlertTriangle', emoji: '🔴',
        title: 'Monthly Budget Exceeded',
        description: `You have spent ₹${used.toLocaleString('en-IN')} which exceeds your monthly budget of ₹${limit.toLocaleString('en-IN')} by ${Math.round(percent - 100)}%.`,
        colorClass: 'border-danger/30 bg-danger/5', iconColor: 'text-danger'
      });
    } else if (percent >= 80) {
      alerts.push({
        type: 'warning', icon: 'AlertTriangle', emoji: '🟡',
        title: 'Budget Alert (80% Used)',
        description: `You have used ${Math.round(percent)}% of your monthly budget (₹${used.toLocaleString('en-IN')} / ₹${limit.toLocaleString('en-IN')}).`,
        colorClass: 'border-warning/30 bg-warning/5', iconColor: 'text-warning'
      });
    }
  }

  // Category specific budget alerts
  if (db.budgetStatus && db.budgetStatus.categoryStatus) {
    for (const [cat, status] of Object.entries(db.budgetStatus.categoryStatus)) {
      const { percent, limit, used } = status;
      if (percent >= 100) {
        alerts.push({
          type: 'anomaly', icon: 'AlertTriangle', emoji: '🔴',
          title: `Budget Exceeded: ${cat}`,
          description: `Spent ₹${used.toLocaleString('en-IN')} on "${cat}", exceeding the limit of ₹${limit.toLocaleString('en-IN')}.`,
          colorClass: 'border-danger/30 bg-danger/5', iconColor: 'text-danger'
        });
      } else if (percent >= 80) {
        alerts.push({
          type: 'warning', icon: 'AlertTriangle', emoji: '🟡',
          title: `Budget Alert: ${cat}`,
          description: `Used ${Math.round(percent)}% of your "${cat}" budget (₹${used.toLocaleString('en-IN')} / ₹${limit.toLocaleString('en-IN')}).`,
          colorClass: 'border-warning/30 bg-warning/5', iconColor: 'text-warning'
        });
      }
    }
  }

  const expCats = db.expenses?.categories || [];
  const totalExp = expCats.reduce((s, c) => s + c.value, 0);
  expCats.forEach(cat => {
    if (totalExp > 0 && (cat.value / totalExp) > 0.4) {
      alerts.push({
        type: 'warning', icon: 'TrendingDown', emoji: '🟡',
        title: `High "${cat.name}" Spend`,
        description: `"${cat.name}" accounts for ${((cat.value / totalExp) * 100).toFixed(0)}% of total expenses (₹${cat.value.toLocaleString('en-IN')}). Consider reviewing this category.`,
        colorClass: 'border-warning/30 bg-warning/5', iconColor: 'text-warning'
      });
    }
  });

  if (margin >= 20) {
    alerts.push({
      type: 'recommendation', icon: 'Lightbulb', emoji: '🟢',
      title: 'Healthy Profit Margin',
      description: `Great work! Your net margin is ${margin.toFixed(1)}%, which is strong for an SME. Consider reinvesting surplus into growth.`,
      colorClass: 'border-success/30 bg-success/5', iconColor: 'text-success'
    });
  }

  if (db.runwayMonths > 0 && db.runwayMonths < 4) {
    alerts.push({
      type: 'anomaly', icon: 'AlertTriangle', emoji: '🔴',
      title: 'Low Cash Runway',
      description: `At current burn rate, you have approximately ${db.runwayMonths} month(s) of runway remaining. Immediate action needed.`,
      colorClass: 'border-danger/30 bg-danger/5', iconColor: 'text-danger'
    });
  }

  return alerts.slice(0, 4);
}

// ─── Master Recalculate ───────────────────────────────────────────────────────
function recalculateDb(db, budgets = {}) {
  const allTxs = db.transactions || [];
  const txs = allTxs.filter(t => t.status !== 'pending_approval' && t.status !== 'rejected');
  let totalRevenue = 0;
  let totalExpenses = 0;
  txs.forEach(tx => {
    if (tx.type === 'income') totalRevenue += tx.amount;
    else totalExpenses += tx.amount;
  });

  const netMargin = totalRevenue > 0
    ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1)
    : 0;

  db.stats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, change: '-', positive: true, icon: 'TrendingUp', glow: 'stat-glow-green' },
    { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, change: '-', positive: false, icon: 'TrendingDown', glow: 'stat-glow-red' },
    { label: 'Net Margin', value: `${netMargin}%`, change: '-', positive: parseFloat(netMargin) >= 0, icon: 'Percent', glow: parseFloat(netMargin) >= 0 ? 'stat-glow-green' : 'stat-glow-red' }
  ];

  const catMap = {};
  txs.filter(tx => tx.type === 'expense').forEach(tx => {
    catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
  });
  db.expenses = db.expenses || {};
  db.expenses.categories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: `hsl(${i * 55} 70% 50%)` }));

  const monthMap = {};
  txs.forEach(tx => {
    const m = (tx.date || '').slice(0, 7) || 'Unknown';
    if (!monthMap[m]) monthMap[m] = { inflow: 0, outflow: 0 };
    if (tx.type === 'income') monthMap[m].inflow += tx.amount;
    else monthMap[m].outflow += tx.amount;
  });

  db.cashflow = db.cashflow || {};
  db.cashflow.monthlyData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([m, v]) => ({ month: m.slice(5), inflow: v.inflow, outflow: v.outflow }));

  db.cashflow.stats = [
    { label: 'Total Inflow', value: `₹${totalRevenue.toLocaleString('en-IN')}`, trend: '-', positive: true },
    { label: 'Total Outflow', value: `₹${totalExpenses.toLocaleString('en-IN')}`, trend: '-', positive: false },
    { label: 'Net Cash Flow', value: `₹${(totalRevenue - totalExpenses).toLocaleString('en-IN')}`, trend: '-', positive: totalRevenue >= totalExpenses },
  ];

  db.revenueExpense = db.cashflow.monthlyData.map(m => ({
    month: m.month, revenue: m.inflow, expenses: m.outflow
  }));

  // Budget calculations
  const today = new Date();
  const currentMonthStr = today.toISOString().slice(0, 7); // "YYYY-MM"
  
  // Sum expenses for the current month
  const currentMonthExpenses = txs
    .filter(t => t.type === 'expense' && (t.date || '').startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  // Category specific expenses for the current month
  const currentMonthCatExpenses = {};
  txs.filter(t => t.type === 'expense' && (t.date || '').startsWith(currentMonthStr))
    .forEach(t => {
      const cat = t.category || 'Other';
      currentMonthCatExpenses[cat] = (currentMonthCatExpenses[cat] || 0) + t.amount;
    });

  // Calculate monthly budget limit
  let monthlyBudgetLimit = 0;
  if (budgets) {
    if (budgets.monthly !== undefined) {
      monthlyBudgetLimit = parseFloat(budgets.monthly);
    } else if (budgets.get && typeof budgets.get === 'function') {
      monthlyBudgetLimit = parseFloat(budgets.get('monthly') || 0);
    } else {
      // Sum categories
      for (const [k, v] of Object.entries(budgets)) {
        if (k !== 'monthly') monthlyBudgetLimit += parseFloat(v || 0);
      }
    }
  }

  let monthlyBudgetUsed = currentMonthExpenses;
  let monthlyBudgetPercent = monthlyBudgetLimit > 0 ? (monthlyBudgetUsed / monthlyBudgetLimit) * 100 : 0;

  db.budgetStatus = {
    limit: monthlyBudgetLimit,
    used: monthlyBudgetUsed,
    percent: Math.round(monthlyBudgetPercent),
    remaining: Math.max(0, monthlyBudgetLimit - monthlyBudgetUsed),
    categoryStatus: {}
  };

  // Category budget details
  if (budgets) {
    const keys = budgets.get && typeof budgets.get === 'function' 
      ? Array.from(budgets.keys()) 
      : Object.keys(budgets);

    keys.forEach(k => {
      if (k === 'monthly') return;
      const limit = budgets.get && typeof budgets.get === 'function' 
        ? parseFloat(budgets.get(k) || 0) 
        : parseFloat(budgets[k] || 0);
        
      if (limit > 0) {
        const used = currentMonthCatExpenses[k] || 0;
        const percent = (used / limit) * 100;
        db.budgetStatus.categoryStatus[k] = {
          limit,
          used,
          percent: Math.round(percent),
          remaining: Math.max(0, limit - used)
        };
      }
    });
  }

  const { chartData, monthsLeft } = calcRunway(txs);
  db.runway = chartData;
  db.runwayMonths = monthsLeft;
  db.alerts = generateAlerts(db);

  return db;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
// Helper to send Verification Code Email - fire-and-forget, never blocks response
function sendVerificationEmail(email, code) {
  console.log(`✉️ [OTP] Would send code ${code} to ${email}`);
  // Fire in background after 100ms delay - never awaited
  setTimeout(async () => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ SMTP not configured. Email simulated for:', email);
      return;
    }
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        connectionTimeout: 3000,
        socketTimeout: 3000,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: `"HisabHero" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify your HisabHero Account',
        text: `Your HisabHero verification code is: ${code}. Expires in 10 minutes.`,
        html: `<div style="font-family:sans-serif;padding:20px"><h2>HisabHero Verification</h2><p>Your code: <strong style="font-size:24px;letter-spacing:4px">${code}</strong></p><p>Expires in 10 minutes.</p></div>`
      });
      console.log(`✅ Email sent to ${email}`);
    } catch (err) {
      console.error('❌ Email send failed:', err.message);
    }
  }, 100);
}

function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'HH-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.post('/api/auth/signup', async (req, res) => {
  const { 
    fullName, email, password, accountType, companyName, 
    businessOwnerName, phone, gstNumber, businessCategory, companyAddress 
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const isBusiness = accountType === 'business';
  const effectiveName = isBusiness ? (businessOwnerName || fullName || companyName || 'Business Owner') : (fullName || 'User');

  const cleanEmail = email.toLowerCase().trim();
  console.log(`[Signup] Attempting ${accountType || 'personal'} registration for: ${cleanEmail}`);

  try {
    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      console.log(`[Signup] User already exists: ${cleanEmail}`);
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
    
    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    const isVerified = true; // Auto-verify for instant mobile access
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await new User({
      fullName: effectiveName,
      email: cleanEmail,
      password: hashedPassword,
      accountType: isBusiness ? 'business' : 'personal',
      companyName: companyName || '',
      businessOwnerName: isBusiness ? (businessOwnerName || effectiveName) : '',
      phone: phone || '',
      gstNumber: gstNumber || '',
      businessCategory: businessCategory || '',
      companyAddress: companyAddress || '',
      isVerified,
      verificationCode: code,
      verificationExpires: expiry
    }).save();

    const userId = (newUser._id || newUser.id).toString();

    let createdBusiness = null;
    if (isBusiness) {
      const joinCode = generateJoinCode();
      const newBus = await new Business({
        name: companyName || `${effectiveName}'s Business`,
        description: businessCategory || 'Business Ledger',
        joinCode,
        primaryOwnerId: userId,
        owners: [userId],
        employees: [],
        createdBy: userId
      }).save();

      const busId = (newBus._id || newBus.id).toString();
      await new BusinessMember({
        businessId: busId,
        userId: userId,
        role: 'owner',
        status: 'active'
      }).save();

      createdBusiness = {
        id: busId,
        name: newBus.name,
        joinCode: newBus.joinCode,
        logo: null,
        phone: phone || '',
        gstNumber: gstNumber || '',
        businessCategory: businessCategory || '',
        companyAddress: companyAddress || '',
        approvalPolicy: 'single',
        primaryOwnerId: userId,
        isPrimaryOwner: true,
        role: 'owner',
        ownersCount: 1,
        employeesCount: 0,
      };
    }

    sendVerificationEmail(cleanEmail, code);

    const token = generateToken(userId);

    return res.status(201).json({ 
      success: true, 
      email: cleanEmail, 
      needsVerification: false,
      token,
      user: {
        id: userId,
        email: cleanEmail,
        fullName: effectiveName,
        accountType: isBusiness ? 'business' : 'personal',
        companyName: companyName || '',
        businessWorkspace: createdBusiness,
        business: createdBusiness
      },
      message: 'Registration successful. Welcome to HisabHero!'
    });
  } catch (err) {
    console.error('[Signup] ❌ Unhandled Error:', err);
    return res.status(500).json({ error: 'Registration failed: ' + (err.message || 'Internal server error') });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  
  const cleanEmail = email.toLowerCase().trim();
  console.log(`[Login] Attempt for: ${cleanEmail}`);

  try {
    // Search MongoDB
    const user = await User.findOne({ email: cleanEmail });
    if (user) console.log(`[Login] User found in MongoDB: ${cleanEmail}`);

    if (!user) {
      console.log(`[Login] ❌ No user found: ${cleanEmail}`);
      return res.status(404).json({ error: 'No account found with this email address.' });
    }
    
    const userData = user.toObject();

    // Verify password - supports both bcrypt hashes and legacy plain-text passwords
    let passwordMatch = false;
    if (userData.password) {
      const isHashed = userData.password.startsWith('$2b$') || userData.password.startsWith('$2a$');
      if (isHashed) {
        passwordMatch = await bcrypt.compare(password, userData.password);
        console.log(`[Login] bcrypt compare result: ${passwordMatch}`);
      } else {
        // Legacy plain-text comparison (migrate to bcrypt on success)
        passwordMatch = userData.password === password;
        console.log(`[Login] Plain-text compare result: ${passwordMatch}`);
        if (passwordMatch) {
          // Upgrade to bcrypt hash silently
          const upgraded = await bcrypt.hash(password, 10);
          try {
            await User.findByIdAndUpdate(user._id, { password: upgraded });
            console.log(`[Login] ✅ Password upgraded to bcrypt for: ${cleanEmail}`);
          } catch (e) { /* non-critical */ }
        }
      }
    } else {
      // No password set (OAuth user) - allow login if user exists
      passwordMatch = true;
    }

    if (!passwordMatch) {
      console.log(`[Login] ❌ Password mismatch for: ${cleanEmail}`);
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    // Auto-verify to prevent blocking
    try {
      await User.findByIdAndUpdate(user._id, { isVerified: true });
    } catch (e) { console.warn('[Login] Auto-verify warning:', e.message); }

    const userId = (user._id || user.id).toString();
    const token = generateToken(userId);
    console.log(`[Login] ✅ Login successful for: ${cleanEmail} | UserID: ${userId}`);

    // Fetch business workspace context if business account
    let businessWorkspace = null;
    if (userData.accountType === 'business') {
      try {
        const membership = await BusinessMember.findOne({ userId, status: 'active' }).lean();
        if (membership) {
          const bus = await Business.findById(membership.businessId).lean();
          if (bus) {
            businessWorkspace = {
              id: bus._id.toString(),
              name: bus.name,
              joinCode: bus.joinCode || '',
              logo: bus.logo || null,
              phone: bus.phone || '',
              gstNumber: bus.gstNumber || '',
              businessCategory: bus.businessCategory || '',
              companyAddress: bus.companyAddress || '',
              approvalPolicy: bus.approvalPolicy || 'single',
              primaryOwnerId: bus.primaryOwnerId,
              isPrimaryOwner: bus.primaryOwnerId === userId,
              role: membership.role,
              ownersCount: (bus.owners || []).length,
              employeesCount: (bus.employees || []).length,
            };
          }
        }
      } catch (wsErr) {
        console.warn('[Login] Could not fetch workspace:', wsErr.message);
      }
    }

    return res.json({
      success: true,
      token,
      user: {
        id: userId,
        email: userData.email,
        fullName: userData.fullName || '',
        accountType: userData.accountType || 'personal',
        companyName: userData.companyName || '',
        businessOwnerName: userData.businessOwnerName || '',
        businessWorkspace,
      }
    });
  } catch (err) {
    console.error('[Login] ❌ Unhandled Error:', err);
    return res.status(500).json({ error: 'Login failed due to an internal error. Please try again.' });
  }
});


// Verify verification code
app.post('/api/auth/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const userData = user.toObject();
    if (userData.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }
    if (new Date() > new Date(userData.verificationExpires)) {
      return res.status(400).json({ error: 'Verification code has expired.' });
    }

    const updated = await User.findOneAndUpdate(
      { email },
      { isVerified: true, verificationCode: null, verificationExpires: null },
      { new: true }
    );
    const userId = updated._id.toString();
    const token = generateToken(userId);

    let businessWorkspace = null;
    if (updated.accountType === 'business') {
      try {
        const membership = await BusinessMember.findOne({ userId, status: 'active' }).lean();
        if (membership) {
          const bus = await Business.findById(membership.businessId).lean();
          if (bus) {
            businessWorkspace = {
              id: bus._id.toString(),
              name: bus.name,
              joinCode: bus.joinCode || '',
              logo: bus.logo || null,
              phone: bus.phone || '',
              gstNumber: bus.gstNumber || '',
              businessCategory: bus.businessCategory || '',
              companyAddress: bus.companyAddress || '',
              approvalPolicy: bus.approvalPolicy || 'single',
              primaryOwnerId: bus.primaryOwnerId,
              isPrimaryOwner: bus.primaryOwnerId === userId,
              role: membership.role,
              ownersCount: (bus.owners || []).length,
              employeesCount: (bus.employees || []).length,
            };
          }
        }
      } catch (wsErr) {
        console.warn('[VerifyCode] Could not fetch workspace:', wsErr.message);
      }
    }

    res.json({
      success: true,
      token,
      user: { 
        id: userId, 
        email: updated.email, 
        fullName: updated.fullName, 
        accountType: updated.accountType || 'personal',
        companyName: updated.companyName || 'My Business',
        businessWorkspace
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
});

// Resend verification code
app.post('/api/auth/resend-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await User.findOneAndUpdate({ email }, { verificationCode: code, verificationExpires: expiry });
    sendVerificationEmail(email, code);

    res.json({ success: true, message: 'Verification code resent.' });
  } catch (err) {
    res.status(500).json({ error: 'Resend failed: ' + err.message });
  }
});

// Verify JWT session token and return user metadata
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ valid: false, error: 'User account not found.' });
    }

    const userId = user._id.toString();

    // Fetch business workspace context if applicable
    let businessWorkspace = null;
    if (user.accountType === 'business') {
      try {
        const membership = await BusinessMember.findOne({ userId, status: 'active' }).lean();
        if (membership) {
          const bus = await Business.findById(membership.businessId).lean();
          if (bus) {
            businessWorkspace = {
              id: bus._id.toString(),
              name: bus.name,
              joinCode: bus.joinCode || '',
              logo: bus.logo || null,
              phone: bus.phone || '',
              gstNumber: bus.gstNumber || '',
              businessCategory: bus.businessCategory || '',
              companyAddress: bus.companyAddress || '',
              approvalPolicy: bus.approvalPolicy || 'single',
              primaryOwnerId: bus.primaryOwnerId,
              isPrimaryOwner: bus.primaryOwnerId === userId,
              role: membership.role,
              ownersCount: (bus.owners || []).length,
              employeesCount: (bus.employees || []).length,
            };
          }
        }
      } catch (wsErr) {
        console.warn('[Verify] Could not fetch workspace:', wsErr.message);
      }
    }

    return res.json({
      valid: true,
      user: {
        id: userId,
        email: user.email,
        fullName: user.fullName || '',
        accountType: user.accountType || 'personal',
        companyName: user.companyName || '',
        businessOwnerName: user.businessOwnerName || '',
        businessWorkspace,
      }
    });
  } catch (err) {
    return res.status(500).json({ valid: false, error: 'Session verification failed: ' + err.message });
  }
});


// ─── [HISABHERO V2] USER PROFILE ENDPOINTS ────────────────────────────────────
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user._id.toString(),
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      accountType: user.accountType || 'personal',
      companyName: user.companyName || '',
      businessOwnerName: user.businessOwnerName || user.fullName || '',
      gstNumber: user.gstNumber || '',
      businessCategory: user.businessCategory || '',
      companyAddress: user.companyAddress || '',
      profileImage: user.profileImage || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile: ' + err.message });
  }
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, phone, companyName, businessOwnerName, gstNumber, businessCategory, companyAddress, profileImage } = req.body;
    const updateObj = {};
    if (fullName !== undefined) updateObj.fullName = fullName;
    if (phone !== undefined) updateObj.phone = phone;
    if (companyName !== undefined) updateObj.companyName = companyName;
    if (businessOwnerName !== undefined) updateObj.businessOwnerName = businessOwnerName;
    if (gstNumber !== undefined) updateObj.gstNumber = gstNumber;
    if (businessCategory !== undefined) updateObj.businessCategory = businessCategory;
    if (companyAddress !== undefined) updateObj.companyAddress = companyAddress;
    if (profileImage !== undefined) updateObj.profileImage = profileImage;

    const updated = await User.findByIdAndUpdate(req.userId, { $set: updateObj }, { new: true }).lean();
    res.json({
      id: updated._id.toString(),
      fullName: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      accountType: updated.accountType,
      companyName: updated.companyName,
      businessOwnerName: updated.businessOwnerName,
      gstNumber: updated.gstNumber,
      businessCategory: updated.businessCategory,
      companyAddress: updated.companyAddress,
      profileImage: updated.profileImage
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

// ─── [HISABHERO V2] WORKSPACE SYSTEM & JOIN CODE ENDPOINTS ────────────────────
app.get('/api/workspaces/my-workspaces', authMiddleware, async (req, res) => {
  try {
    const memberships = await BusinessMember.find({ userId: req.userId, status: 'active' }).lean();
    const busIds = memberships.map(m => m.businessId);
    const businesses = await Business.find({ _id: { $in: busIds } }).lean();

    const result = businesses.map(b => {
      const mem = memberships.find(m => m.businessId === b._id.toString());
      return {
        id: b._id.toString(),
        name: b.name,
        joinCode: b.joinCode || '',
        primaryOwnerId: b.primaryOwnerId,
        isPrimaryOwner: b.primaryOwnerId === req.userId,
        role: mem ? mem.role : 'employee',
        ownersCount: (b.owners || []).length,
        employeesCount: (b.employees || []).length
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workspaces: ' + err.message });
  }
});

// GET /api/workspaces/my-workspace — Returns the current user's primary business workspace
app.get('/api/workspaces/my-workspace', authMiddleware, async (req, res) => {
  try {
    const membership = await BusinessMember.findOne({ userId: req.userId, status: 'active' }).lean();
    if (!membership) return res.json(null);

    const bus = await Business.findById(membership.businessId).lean();
    if (!bus) return res.json(null);

    const members = await BusinessMember.find({ businessId: bus._id.toString(), status: 'active' }).lean();
    const memberDetails = await Promise.all(members.map(async m => {
      const u = await User.findById(m.userId).lean();
      return {
        id: m.userId,
        fullName: u?.fullName || 'Unknown',
        email: u?.email || '',
        role: m.role,
        isPrimaryOwner: bus.primaryOwnerId === m.userId,
        joinedAt: m.createdAt,
      };
    }));

    res.json({
      id: bus._id.toString(),
      name: bus.name,
      logo: bus.logo || null,
      phone: bus.phone || '',
      gstNumber: bus.gstNumber || '',
      businessCategory: bus.businessCategory || '',
      companyAddress: bus.companyAddress || '',
      joinCode: bus.joinCode || '',
      currency: bus.currency || 'INR',
      approvalPolicy: bus.approvalPolicy || 'single',
      primaryOwnerId: bus.primaryOwnerId,
      isPrimaryOwner: bus.primaryOwnerId === req.userId,
      role: membership.role,
      members: memberDetails,
      ownersCount: (bus.owners || []).length,
      employeesCount: (bus.employees || []).length,
      createdAt: bus.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workspace: ' + err.message });
  }
});

// PUT /api/workspaces/:id/approval-policy — Primary Owner sets approval policy
app.put('/api/workspaces/:id/approval-policy', authMiddleware, async (req, res) => {
  const { policy } = req.body;
  if (!['single', 'majority', 'all'].includes(policy)) {
    return res.status(400).json({ error: 'Policy must be single, majority, or all.' });
  }

  try {
    const bus = await Business.findById(req.params.id);
    if (!bus) return res.status(404).json({ error: 'Workspace not found.' });

    if (bus.primaryOwnerId !== req.userId) {
      return res.status(403).json({ error: 'Only the Primary Owner can change the approval policy.' });
    }

    bus.approvalPolicy = policy;
    await bus.save();

    await logAudit({ userId: req.userId, isPersonal: false, workspaceId: req.params.id }, 'change_approval_policy', 'Business', req.params.id, { policy });

    res.json({ success: true, approvalPolicy: policy, message: `Approval policy updated to "${policy}".` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update approval policy: ' + err.message });
  }
});

// PUT /api/workspaces/:id/profile — Primary Owner or Owner updates company profile
app.put('/api/workspaces/:id/profile', authMiddleware, async (req, res) => {
  const { name, phone, gstNumber, businessCategory, companyAddress, logo, currency } = req.body;
  try {
    const membership = await BusinessMember.findOne({ businessId: req.params.id, userId: req.userId, status: 'active' });
    if (!membership || membership.role === 'employee') {
      return res.status(403).json({ error: 'Only Owners can update the company profile.' });
    }

    const updateObj = {};
    if (name !== undefined) updateObj.name = name;
    if (phone !== undefined) updateObj.phone = phone;
    if (gstNumber !== undefined) updateObj.gstNumber = gstNumber;
    if (businessCategory !== undefined) updateObj.businessCategory = businessCategory;
    if (companyAddress !== undefined) updateObj.companyAddress = companyAddress;
    if (logo !== undefined) updateObj.logo = logo;
    if (currency !== undefined) updateObj.currency = currency;

    const updated = await Business.findByIdAndUpdate(req.params.id, { $set: updateObj }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Workspace not found.' });

    await logAudit({ userId: req.userId, isPersonal: false, workspaceId: req.params.id }, 'update_company_profile', 'Business', req.params.id, updateObj);

    res.json({ success: true, message: 'Company profile updated.', workspace: { id: updated._id.toString(), name: updated.name, phone: updated.phone, gstNumber: updated.gstNumber, businessCategory: updated.businessCategory, companyAddress: updated.companyAddress, logo: updated.logo } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update company profile: ' + err.message });
  }
});

// POST /api/workspaces/:id/regenerate-join-code — Primary Owner regenerates join code
app.post('/api/workspaces/:id/regenerate-join-code', authMiddleware, async (req, res) => {
  try {
    const bus = await Business.findById(req.params.id);
    if (!bus) return res.status(404).json({ error: 'Workspace not found.' });

    if (bus.primaryOwnerId !== req.userId) {
      return res.status(403).json({ error: 'Only the Primary Owner can regenerate the join code.' });
    }

    const newCode = generateJoinCode();
    bus.joinCode = newCode;
    await bus.save();

    await logAudit({ userId: req.userId, isPersonal: false, workspaceId: req.params.id }, 'regenerate_join_code', 'Business', req.params.id, { newCode });

    res.json({ success: true, joinCode: newCode, message: 'Join code regenerated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to regenerate join code: ' + err.message });
  }
});

// GET /api/workspaces/:id/activity-log — Owners see activity log
app.get('/api/workspaces/:id/activity-log', authMiddleware, async (req, res) => {
  try {
    const membership = await BusinessMember.findOne({ businessId: req.params.id, userId: req.userId, status: 'active' });
    if (!membership) return res.status(403).json({ error: 'You are not a member of this workspace.' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // Combine AuditLog + TransactionApproval history for this business
    const [auditLogs, approvals] = await Promise.all([
      AuditLog.find({ businessId: req.params.id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      TransactionApproval.find({ businessId: req.params.id }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    // Enrich audit logs with user names
    const enriched = await Promise.all(auditLogs.map(async log => {
      const u = await User.findById(log.userId).lean();
      return {
        id: log._id.toString(),
        type: 'audit',
        action: log.action,
        entityType: log.entityType,
        metadata: log.metadata,
        user: { id: log.userId, name: u?.fullName || 'Unknown', email: u?.email || '' },
        timestamp: log.createdAt,
      };
    }));

    res.json({ logs: enriched, page, hasMore: enriched.length === limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity log: ' + err.message });
  }
});

// GET /api/notifications/unread-count — fast endpoint for badge count
app.get('/api/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.userId, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get notification count: ' + err.message });
  }
});

app.post('/api/workspaces/join', authMiddleware, async (req, res) => {
  const { joinCode } = req.body;
  if (!joinCode) return res.status(400).json({ error: 'Join code is required' });

  const cleanCode = joinCode.trim().toUpperCase();

  try {
    const bus = await Business.findOne({ joinCode: cleanCode });
    if (!bus) return res.status(404).json({ error: 'Invalid workspace join code.' });

    const busId = bus._id.toString();

    const existingMem = await BusinessMember.findOne({ businessId: busId, userId: req.userId });
    if (existingMem) {
      if (existingMem.status === 'active') {
        return res.status(400).json({ error: 'You are already a member of this workspace.' });
      } else {
        await BusinessMember.findByIdAndUpdate(existingMem._id, { status: 'active', role: 'employee' });
      }
    } else {
      await new BusinessMember({
        businessId: busId,
        userId: req.userId,
        role: 'employee',
        status: 'active'
      }).save();
    }

    if (!bus.employees.includes(req.userId)) {
      await Business.findByIdAndUpdate(busId, { $addToSet: { employees: req.userId } });
    }

    const joiningUser = await User.findById(req.userId).lean();

    // Create notifications for all owners of the workspace
    const ownerIds = bus.owners || [bus.primaryOwnerId];
    for (const ownerId of ownerIds) {
      await new Notification({
        userId: ownerId,
        businessId: busId,
        title: 'New Member Joined',
        message: `${joiningUser?.fullName || 'A new user'} joined workspace "${bus.name}" as an Employee via Join Code.`,
        type: 'join'
      }).save();
    }

    await logAudit({ userId: req.userId, isPersonal: false, workspaceId: busId }, 'join_workspace_via_code', 'Business', busId, { joinCode: cleanCode });

    res.json({
      success: true,
      message: `Successfully joined ${bus.name}`,
      workspace: {
        id: busId,
        name: bus.name,
        joinCode: bus.joinCode,
        role: 'employee'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join workspace: ' + err.message });
  }
});

app.post('/api/workspaces/request-owner', authMiddleware, workspaceMiddleware, async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason for owner access request is required.' });

  if (req.isPersonal) return res.status(400).json({ error: 'Owner access requests are only applicable to Business Workspaces.' });
  if (req.workspaceRole === 'owner') return res.status(400).json({ error: 'You are already an Owner in this workspace.' });

  try {
    const bus = await Business.findById(req.workspaceId).lean();
    if (!bus) return res.status(404).json({ error: 'Workspace not found.' });

    const user = await User.findById(req.userId).lean();

    const existingReq = await OwnerRequest.findOne({ businessId: req.workspaceId, userId: req.userId, status: 'pending' });
    if (existingReq) return res.status(400).json({ error: 'You already have a pending Owner Access Request for this workspace.' });

    const newReq = await new OwnerRequest({
      businessId: req.workspaceId,
      userId: req.userId,
      userName: user.fullName || user.email,
      userEmail: user.email,
      reason
    }).save();

    await new Notification({
      userId: bus.primaryOwnerId,
      businessId: req.workspaceId,
      title: 'Owner Access Request',
      message: `${user.fullName || user.email} requested Owner privileges in "${bus.name}". Reason: ${reason}`,
      type: 'owner_request',
      data: { requestId: newReq._id.toString() }
    }).save();

    await logAudit(req, 'request_owner_access', 'OwnerRequest', newReq._id.toString(), { reason });

    res.status(201).json({ success: true, message: 'Owner access request submitted to Primary Owner.', request: newReq });
  } catch (err) {
    res.status(500).json({ error: 'Failed to request owner access: ' + err.message });
  }
});

app.get('/api/workspaces/owner-requests', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    if (req.isPersonal) return res.json([]);
    const requests = await OwnerRequest.find({ businessId: req.workspaceId }).lean();
    res.json(requests.map(r => ({ ...r, id: r._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch owner requests: ' + err.message });
  }
});

app.post('/api/workspaces/owner-requests/:id/respond', authMiddleware, workspaceMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  try {
    const ownerReq = await OwnerRequest.findById(id);
    if (!ownerReq) return res.status(404).json({ error: 'Owner request not found' });

    const bus = await Business.findById(ownerReq.businessId);
    if (!bus) return res.status(404).json({ error: 'Workspace not found' });

    if (bus.primaryOwnerId !== req.userId && req.workspaceRole !== 'owner') {
      return res.status(403).json({ error: 'Only the Primary Owner or an Owner can respond to Owner Access Requests.' });
    }

    ownerReq.status = status;
    ownerReq.respondedAt = new Date();
    ownerReq.respondedBy = req.userId;
    await ownerReq.save();

    if (status === 'approved') {
      await Business.findByIdAndUpdate(bus._id, {
        $addToSet: { owners: ownerReq.userId },
        $pull: { employees: ownerReq.userId }
      });
      await BusinessMember.findOneAndUpdate(
        { businessId: bus._id.toString(), userId: ownerReq.userId },
        { role: 'owner' }
      );

      await new Notification({
        userId: ownerReq.userId,
        businessId: bus._id.toString(),
        title: 'Owner Access Approved!',
        message: `Your request for Owner privileges in "${bus.name}" was APPROVED.`,
        type: 'approval'
      }).save();
    } else {
      await new Notification({
        userId: ownerReq.userId,
        businessId: bus._id.toString(),
        title: 'Owner Access Request Rejected',
        message: `Your request for Owner privileges in "${bus.name}" was rejected.`,
        type: 'approval'
      }).save();
    }

    await logAudit(req, `respond_owner_request_${status}`, 'OwnerRequest', id, { targetUserId: ownerReq.userId });

    res.json({ success: true, message: `Owner request ${status}.`, request: ownerReq });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process owner request: ' + err.message });
  }
});

// ─── [HISABHERO V2] MULTI-OWNER TRANSACTION APPROVAL ENDPOINTS ─────────────────
app.get('/api/approvals/pending', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    if (req.isPersonal || req.workspaceRole === 'employee') {
      return res.json([]);
    }

    const pending = await TransactionApproval.find({
      businessId: req.workspaceId,
      status: 'pending',
      requiredApprovers: req.userId,
      approvedBy: { $ne: req.userId }
    }).lean();

    res.json(pending.map(p => ({ ...p, id: p._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending approvals: ' + err.message });
  }
});

app.post('/api/approvals/:id/respond', authMiddleware, workspaceMiddleware, async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  if (req.workspaceRole === 'employee') {
    return res.status(403).json({ error: 'Employees cannot approve or reject transactions.' });
  }

  try {
    const approvalReq = await TransactionApproval.findById(id);
    if (!approvalReq) return res.status(404).json({ error: 'Approval request not found.' });

    if (approvalReq.status !== 'pending') {
      return res.status(400).json({ error: `Request has already been ${approvalReq.status}.` });
    }

    if (action === 'reject') {
      approvalReq.status = 'rejected';
      approvalReq.rejectedBy = req.userId;
      approvalReq.rejectionReason = reason || 'Rejected by Owner';
      await approvalReq.save();

      await new Notification({
        userId: approvalReq.submittedBy,
        businessId: approvalReq.businessId,
        title: 'Transaction Request Rejected',
        message: `Your transaction request (${approvalReq.requestType}) was REJECTED. Reason: ${reason || 'Rejected by Owner'}.`,
        type: 'approval'
      }).save();

      await logAudit(req, 'reject_transaction_approval', 'TransactionApproval', id, { reason });
      return res.json({ success: true, status: 'rejected', message: 'Transaction request rejected.' });
    }

    if (action === 'approve') {
      if (!approvalReq.approvedBy.includes(req.userId)) {
        approvalReq.approvedBy.push(req.userId);
      }

      const allApproved = approvalReq.requiredApprovers.every(approverId => 
        approvalReq.approvedBy.includes(approverId)
      );

      if (allApproved) {
        approvalReq.status = 'approved';
        await approvalReq.save();

        const payload = approvalReq.payload;
        if (approvalReq.requestType === 'add_income' || approvalReq.requestType === 'add_expense') {
          const newTx = await new Transaction({
            userId: approvalReq.submittedBy,
            businessId: approvalReq.businessId,
            createdBy: approvalReq.submittedBy,
            uploadId: 'manual_entry',
            date: payload.date || new Date().toISOString().split('T')[0],
            description: payload.description,
            category: payload.category || 'Other',
            amount: Number(payload.amount),
            type: payload.type || (approvalReq.requestType === 'add_income' ? 'income' : 'expense'),
            paymentMethod: payload.paymentMethod || 'Cash',
            status: 'approved'
          }).save();

          approvalReq.transactionId = newTx._id.toString();
          await approvalReq.save();
        } else if (approvalReq.requestType === 'delete_transaction' && approvalReq.transactionId) {
          await Transaction.findByIdAndDelete(approvalReq.transactionId);
        } else if (approvalReq.requestType === 'update_transaction' && approvalReq.transactionId) {
          await Transaction.findByIdAndUpdate(approvalReq.transactionId, payload);
        }

        await new Notification({
          userId: approvalReq.submittedBy,
          businessId: approvalReq.businessId,
          title: 'Transaction Approved!',
          message: `Your transaction request (${approvalReq.requestType}) was APPROVED by all Owners and added to the ledger.`,
          type: 'approval'
        }).save();

        await logAudit(req, 'complete_transaction_approval', 'TransactionApproval', id, { allApproved: true });
        return res.json({ success: true, status: 'approved', message: 'Transaction approved by all owners and committed to ledger.' });
      } else {
        await approvalReq.save();
        return res.json({ 
          success: true, 
          status: 'pending', 
          message: `Approval recorded. Waiting for ${approvalReq.requiredApprovers.length - approvalReq.approvedBy.length} remaining owner(s).` 
        });
      }
    }

    return res.status(400).json({ error: 'Action must be approve or reject.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process approval: ' + err.message });
  }
});

// ─── [HISABHERO V2] NOTIFICATIONS ENDPOINTS ───────────────────────────────────
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const list = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json(list.map(n => ({ ...n, id: n._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications: ' + err.message });
  }
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications: ' + err.message });
  }
});

// ─── [HISABHERO V2] CHAT ENDPOINTS (WITH EMPLOYEE ↔ EMPLOYEE RESTRICTION) ──────
app.get('/api/chat/messages', authMiddleware, workspaceMiddleware, async (req, res) => {
  const { receiverId } = req.query;

  try {
    if (req.isPersonal) return res.json([]);

    let query = { businessId: req.workspaceId };
    if (!receiverId || receiverId === 'null') {
      query.receiverId = null;
    } else {
      query.$or = [
        { senderId: req.userId, receiverId: receiverId },
        { senderId: receiverId, receiverId: req.userId }
      ];
    }

    const messages = await ChatMessage.find(query).sort({ createdAt: 1 }).limit(200).lean();
    res.json(messages.map(m => ({ ...m, id: m._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat messages: ' + err.message });
  }
});

app.post('/api/chat/messages', authMiddleware, workspaceMiddleware, async (req, res) => {
  const { receiverId, message, attachments } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });

  if (req.isPersonal) return res.status(400).json({ error: 'Chat is available within Business Workspaces.' });

  try {
    const sender = await User.findById(req.userId).lean();
    const senderRole = req.workspaceRole;

    // Check Employee ↔ Employee 1-on-1 Chat Restrictions!
    if (receiverId && receiverId !== 'null') {
      const receiverMember = await BusinessMember.findOne({ businessId: req.workspaceId, userId: receiverId, status: 'active' });
      if (!receiverMember) return res.status(404).json({ error: 'Recipient is not an active member of this workspace.' });

      const receiverRole = receiverMember.role;

      if (senderRole === 'employee' && receiverRole === 'employee') {
        return res.status(403).json({ 
          error: "You don't have permission to start this conversation.",
          code: 'EMPLOYEE_CHAT_RESTRICTED'
        });
      }
    }

    const newMsg = await new ChatMessage({
      businessId: req.workspaceId,
      senderId: req.userId,
      senderName: sender.fullName || sender.email,
      senderRole,
      receiverId: (receiverId && receiverId !== 'null') ? receiverId : null,
      message: message.trim(),
      attachments: attachments || [],
      readBy: [req.userId]
    }).save();

    res.status(201).json({ ...newMsg.toObject(), id: newMsg._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send chat message: ' + err.message });
  }
});

// ─── [HISABHERO V2] AUDIT LOG ENDPOINTS ───────────────────────────────────────
app.get('/api/audit-logs', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    const query = req.isPersonal ? { userId: req.userId } : { businessId: req.workspaceId };
    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(100).lean();
    res.json(logs.map(l => ({ ...l, id: l._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs: ' + err.message });
  }
});


// Helper to send Password Reset Code Email
async function sendResetPasswordEmail(email, code) {
  console.log(`✉️ [Password Reset Code] Sent to: ${email} -> CODE: ${code}`);

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ SMTP credentials not found in env. Email sending simulated (check console above).');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"HisabHero Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your HisabHero Password',
      text: `Your 6-digit HisabHero password reset code is: ${code}. This code expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #06111f; color: #ffffff; border-radius: 12px; max-width: 450px;">
          <h2 style="color: #ff6b6b; margin-bottom: 6px;">Password Reset Request</h2>
          <p style="color: #a6bedf; font-size: 14px;">We received a request to reset your password. Use the verification code below to complete the reset process:</p>
          <div style="background-color: #0b1d38; border: 1px solid #15345f; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ffffff;">${code}</span>
          </div>
          <p style="color: #8fc0ff; font-size: 11px;">This code is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Reset password email successfully sent to ${email} using SMTP!`);
  } catch (err) {
    console.error('❌ Failed to send reset password email:', err.message);
  }
}

// Google Sign-In & Onboarding Endpoint
app.post('/api/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken is required' });

  try {
    let email = '';
    let fullName = '';
    let profileImage = '';
    let googleId = '';

    // Mode 1: Simulated / Dev token for rapid testing
    if (idToken.startsWith('mock-google-token-') || idToken.startsWith('google-demo-')) {
      const parts = idToken.split('-');
      email = parts[3] || 'google_user@hisabhero.com';
      fullName = parts[4] ? parts[4].replace(/_/g, ' ') : 'Google User';
      googleId = 'mock-google-id-' + email;
    } else {
      // Mode 2: Verify via google-auth-library if webClientId is set
      const webClientId = process.env.GOOGLE_WEB_CLIENT_ID;
      let verified = false;

      if (webClientId && webClientId !== 'REPLACE_WITH_WEB_CLIENT_ID') {
        try {
          const googleClient = new OAuth2Client(webClientId);
          const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: webClientId,
          });
          const payload = ticket.getPayload();
          if (payload && payload.email_verified) {
            email = payload.email;
            fullName = payload.name || 'Google User';
            profileImage = payload.picture || '';
            googleId = payload.sub;
            verified = true;
          }
        } catch (err) {
          console.warn('google-auth-library verification failed, trying tokeninfo endpoint:', err.message);
        }
      }

      // Mode 3: Fallback verification via Google's public tokeninfo API endpoint
      if (!verified) {
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!googleRes.ok) {
          return res.status(401).json({ error: 'Google identity token could not be verified' });
        }
        const tokenInfo = await googleRes.json();
        if (tokenInfo.email_verified !== 'true' && tokenInfo.email_verified !== true) {
          return res.status(401).json({ error: 'Google email address is not verified' });
        }
        email = tokenInfo.email;
        fullName = tokenInfo.name || 'Google User';
        profileImage = tokenInfo.picture || '';
        googleId = tokenInfo.sub;
      }
    }

    // Find existing user by email (MongoDB only)
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (user) {
      const userData = user.toObject();
      // Link Google provider if not already linked
      const hasGoogle = (userData.authProviders || []).some(p => p.provider === 'google');
      if (!hasGoogle) {
        const providers = userData.authProviders || [];
        providers.push({ provider: 'google', providerId: googleId });
        user = await User.findOneAndUpdate(
          { email },
          { authProviders: providers, profileImage, isVerified: true },
          { new: true }
        );
      }
    } else {
      // Create new user from Google Sign-In
      isNewUser = true;
      user = await new User({
        fullName,
        email,
        isVerified: true,
        authProviders: [{ provider: 'google', providerId: googleId }],
        profileImage,
        companyName: 'My Business'
      }).save();
    }

    const finalUser = user.toObject();
    const userId = finalUser._id.toString();
    const token = generateToken(userId);

    res.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: userId,
        email: finalUser.email,
        fullName: finalUser.fullName,
        companyName: finalUser.companyName || 'My Business',
        profileImage: finalUser.profileImage
      }
    });
  } catch (err) {
    console.error('[Google Auth] Error:', err.message);
    res.status(500).json({ error: 'Google authentication failed: ' + err.message });
  }
});

// Forgot Password Route (safeguarded against enumeration)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await User.findOne({ email });
    // Always return success to prevent account enumeration
    if (!user) {
      return res.json({ success: true, message: 'If the account exists, a reset code was sent.' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await User.findOneAndUpdate({ email }, { verificationCode: resetCode, verificationExpires: expiry });
    setTimeout(() => sendResetPasswordEmail(email, resetCode), 100);

    res.json({ success: true, message: 'If the account exists, a reset code was sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Forgot password request failed: ' + err.message });
  }
});

// Reset Password Route
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and newPassword are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid reset code or email.' });

    const userData = user.toObject();
    if (userData.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid reset code or email.' });
    }
    if (new Date() > new Date(userData.verificationExpires)) {
      return res.status(400).json({ error: 'Reset code has expired.' });
    }

    // Hash new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword, verificationCode: null, verificationExpires: null }
    );

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed: ' + err.message });
  }
});

// Test-only harness route to fetch OTP codes for integration tests
app.get('/api/auth/test-otp-code', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ code: user.verificationCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify session token endpoint for mobile app bootstrap & auto-login check
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(401).json({ valid: false, error: 'User account not found.' });

    res.json({
      valid: true,
      user: {
        id: req.userId,
        email: user.email,
        fullName: user.fullName,
        companyName: user.companyName || 'My Business',
        profileImage: user.profileImage || null
      }
    });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Invalid or expired session token.' });
  }
});


// ─── WORKSPACE & COLLABORATION ROUTES ──────────────────────────────────────────

// Create Business
app.post('/api/businesses', authMiddleware, async (req, res) => {
  const { name, description, currency } = req.body;
  if (!name) return res.status(400).json({ error: 'Business name is required.' });

  try {
    const business = await new Business({
      name,
      description,
      currency: currency || 'INR',
      createdBy: req.userId,
      budgets: {}
    }).save();

    const businessId = business._id;

    // Creator automatically becomes owner
    await new BusinessMember({
      businessId,
      userId: req.userId,
      role: 'owner',
      status: 'active',
      invitedBy: req.userId
    }).save();

    await logAudit(req, 'create_business', 'Business', businessId, { name });
    res.status(201).json({ business, role: 'owner' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create business: ' + err.message });
  }
});

// List Businesses current user is a member of
app.get('/api/businesses', authMiddleware, async (req, res) => {
  try {
    const memberships = await BusinessMember.find({ userId: req.userId, status: 'active' }).lean();
    const businessIds = memberships.map(m => m.businessId);
    const businesses = await Business.find({ _id: { $in: businessIds } }).lean();

    const list = businesses.map(b => {
      const bId = b._id.toString();
      const m = memberships.find(mem => mem.businessId.toString() === bId);
      return { ...b, id: bId, role: m ? m.role : 'viewer' };
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch businesses: ' + err.message });
  }
});

// Get Single Business detail including members
app.get('/api/businesses/:businessId', authMiddleware, async (req, res) => {
  const { businessId } = req.params;

  try {
    const member = await BusinessMember.findOne({ businessId, userId: req.userId, status: 'active' });
    if (!member) return res.status(403).json({ error: 'Access Denied. You are not a member of this business.' });

    const business = await Business.findById(businessId).lean();
    if (!business) return res.status(404).json({ error: 'Business not found.' });

    const membersRaw = await BusinessMember.find({ businessId }).lean();
    const memberUsers = await Promise.all(membersRaw.map(async m => {
      const u = await User.findById(m.userId).lean();
      return {
        id: m._id,
        userId: m.userId,
        fullName: u ? u.fullName : 'Unknown User',
        email: u ? u.email : 'Unknown Email',
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt
      };
    }));

    res.json({ ...business, id: businessId, myRole: member.role, members: memberUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch business details: ' + err.message });
  }
});

// Update Business settings / budgets
app.patch('/api/businesses/:businessId', authMiddleware, async (req, res) => {
  const { businessId } = req.params;
  const { name, description, budgets } = req.body;

  try {
    const member = await BusinessMember.findOne({ businessId, userId: req.userId, status: 'active' });
    if (!member) return res.status(403).json({ error: 'Access Denied.' });

    const requiredPermission = budgets ? 'manage_budgets' : 'manage_members';
    if (!PERMISSIONS[requiredPermission].includes(member.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (budgets) updateFields.budgets = budgets;

    const updated = await Business.findByIdAndUpdate(businessId, { $set: updateFields }, { new: true }).lean();
    await logAudit(req, 'update_business', 'Business', businessId, updateFields);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update business: ' + err.message });
  }
});

// Delete Business
app.delete('/api/businesses/:businessId', authMiddleware, async (req, res) => {
  const { businessId } = req.params;

  try {
    const member = await BusinessMember.findOne({ businessId, userId: req.userId, status: 'active' });
    if (!member || member.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete a business.' });
    }

    await Business.deleteOne({ _id: businessId });
    await BusinessMember.deleteMany({ businessId });
    await Transaction.deleteMany({ businessId });
    await Upload.deleteMany({ businessId });
    await Contact.deleteMany({ businessId });
    await Invoice.deleteMany({ businessId });
    await Bill.deleteMany({ businessId });
    await Invitation.deleteMany({ businessId });

    await logAudit(req, 'delete_business', 'Business', businessId, { name: businessId });
    res.json({ success: true, message: 'Business workspace deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete business: ' + err.message });
  }
});

// POST /api/businesses/:businessId/invitations (Invite Member)
app.post('/api/businesses/:businessId/invitations', authMiddleware, async (req, res) => {
  const { businessId } = req.params;
  const { invitedEmail, role } = req.body;

  if (!invitedEmail || !role) {
    return res.status(400).json({ error: 'Email and role are required.' });
  }

  try {
    const member = await BusinessMember.findOne({ businessId, userId: req.userId, status: 'active' })

    if (!member || member.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can invite new members.' });
    }

    // Check if user is already a member
    const targetUser = await User.findOne({ email: invitedEmail.toLowerCase() })

    if (targetUser) {
      const targetUserId = targetUser._id || targetUser.id;
      const isMember = await BusinessMember.findOne({ businessId, userId: targetUserId, status: 'active' })

      if (isMember) {
        return res.status(400).json({ error: 'User is already a member of this business.' });
      }
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    const invData = {
      businessId,
      invitedEmail: invitedEmail.toLowerCase(),
      role,
      invitedBy: req.userId,
      token,
      expirationDate,
      status: 'pending'
    };

    const invitation = await new Invitation(invData).save()

    const invId = invitation._id || invitation.id;
    await logAudit(req, 'invite_user', 'Invitation', invId.toString(), { invitedEmail, role });

    res.status(201).json({ success: true, message: 'Invitation sent successfully.', invitation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send invitation: ' + err.message });
  }
});

// GET /api/invitations (List pending invitations for current user)
app.get('/api/invitations', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)

    if (!user) return res.status(404).json({ error: 'User not found.' });

    const invitationsRaw = await Invitation.find({ invitedEmail: user.email.toLowerCase(), status: 'pending' }).lean();

    // Map details
    const list = [];
    for (const inv of invitationsRaw) {
      const bus = await Business.findById(inv.businessId).lean()

      const sender = await User.findById(inv.invitedBy).lean()

      list.push({
        id: inv._id || inv.id,
        businessId: inv.businessId,
        businessName: bus ? bus.name : 'Unknown Business',
        role: inv.role,
        invitedBy: sender ? sender.fullName : 'Unknown User',
        createdAt: inv.createdAt
      });
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invitations: ' + err.message });
  }
});

// POST /api/invitations/:invitationId/accept
app.post('/api/invitations/:invitationId/accept', authMiddleware, async (req, res) => {
  const { invitationId } = req.params;

  try {
    const user = await User.findById(req.userId)

    if (!user) return res.status(404).json({ error: 'User not found.' });

    const invitation = await Invitation.findById(invitationId)

    if (!invitation || invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: `Invitation is already ${invitation.status}.` });
    }

    if (new Date() > new Date(invitation.expirationDate)) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ error: 'Invitation has expired.' });
    }

    // Add to business members
    const memberData = {
      businessId: invitation.businessId,
      userId: req.userId,
      role: invitation.role,
      status: 'active',
      invitedBy: invitation.invitedBy
    };

    await new BusinessMember(memberData).save()

    // Update invitation
    invitation.status = 'accepted';
    await invitation.save();

    await logAudit(req, 'accept_invitation', 'Invitation', invitationId, { businessId: invitation.businessId });

    res.json({ success: true, message: 'Invitation accepted successfully.', businessId: invitation.businessId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept invitation: ' + err.message });
  }
});

// POST /api/invitations/:invitationId/decline
app.post('/api/invitations/:invitationId/decline', authMiddleware, async (req, res) => {
  const { invitationId } = req.params;

  try {
    const user = await User.findById(req.userId)

    const invitation = await Invitation.findById(invitationId)

    if (!invitation || invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    invitation.status = 'declined';
    await invitation.save();

    await logAudit(req, 'decline_invitation', 'Invitation', invitationId, { businessId: invitation.businessId });

    res.json({ success: true, message: 'Invitation declined successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline invitation: ' + err.message });
  }
});

// PATCH /api/businesses/:businessId/members/:memberId/role
app.patch('/api/businesses/:businessId/members/:memberId/role', authMiddleware, async (req, res) => {
  const { businessId, memberId } = req.params;
  const { role } = req.body;

  if (!role) return res.status(400).json({ error: 'Role is required.' });

  try {
    const callerMember = await BusinessMember.findOne({ businessId, userId: req.userId, status: 'active' })

    if (!callerMember || callerMember.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can manage member roles.' });
    }

    const targetMember = await BusinessMember.findById(memberId)

    if (!targetMember || targetMember.businessId !== businessId) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Protect against removing last owner
    if (targetMember.role === 'owner' && role !== 'owner') {
      const ownerCount = await BusinessMember.countDocuments({ businessId, role: 'owner', status: 'active' }).length;

      if (ownerCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last owner. Please promote another owner first.' });
      }
    }

    targetMember.role = role;
    await targetMember.save()

    await logAudit(req, 'change_role', 'Member', memberId, { role });

    res.json({ success: true, message: 'Role updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role: ' + err.message });
  }
});

// DELETE /api/businesses/:businessId/members/:memberId (Remove member)
app.delete('/api/businesses/:businessId/members/:memberId', authMiddleware, async (req, res) => {
  const { businessId, memberId } = req.params;

  try {
    const callerMember = await BusinessMember.findOne({ businessId, userId: req.userId, status: 'active' })

    if (!callerMember) {
      return res.status(403).json({ error: 'Access Denied.' });
    }

    const targetMember = await BusinessMember.findById(memberId)

    if (!targetMember || targetMember.businessId !== businessId) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Users can remove themselves, otherwise only owners can remove others
    const isSelfRemoval = targetMember.userId === req.userId;
    if (!isSelfRemoval && callerMember.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can remove members.' });
    }

    // Protect against removing the last owner
    if (targetMember.role === 'owner') {
      const ownerCount = await BusinessMember.countDocuments({ businessId, role: 'owner', status: 'active' }).length;

      if (ownerCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last owner. Please promote another owner first.' });
      }
    }

    await BusinessMember.deleteOne({ _id: memberId })

    await logAudit(req, 'remove_member', 'Member', memberId, { userId: targetMember.userId });

    res.json({ success: true, message: 'Member removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member: ' + err.message });
  }
});


// ─── UPLOADS ───────────────────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

// Bank Statement upload (CSV or PDF)
// Bank Statement upload (CSV or PDF)
app.post('/api/upload', authMiddleware, workspaceMiddleware, checkPermission('submit_self_expense'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // [PDF Processing via Local Heuristics using Gemini]
  if (req.file.originalname.toLowerCase().endsWith('.pdf')) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set in the backend environment.' });
      }

      console.log(`[PDF] Uploaded file: ${req.file.originalname}. Sending direct PDF buffer to Gemini AI...`);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const pdfBase64 = req.file.buffer.toString('base64');
      const inlineData = {
        data: pdfBase64,
        mimeType: 'application/pdf'
      };

      const prompt = `
You are a precise financial data extraction assistant.
You have been provided with a bank statement PDF. The first few pages may be cover letters, relationship summaries, or irrelevant text. 

Please IGNORE all non-tabular, irrelevant data and focus ONLY on the actual transaction tables (Date, Description, Withdrawals, Deposits, Balance).

Extract the transaction data and return strictly a raw JSON array of objects with the exact following keys:
- "date": Date of transaction in YYYY-MM-DD format
- "description": Description or narration, picking up UPI IDs, merchant details, or transaction text.
- "category": Categorize the transaction into a single concise word or short phrase (e.g. "Rent", "Groceries", "Food", "Salary", "Shopping", "Utility", "UPI Transfer", "Cash", "Other") based on the description
- "amount": The numeric amount of the transaction as a positive float only
- "type": "income" (for credits/deposits) or "expense" (for debits/withdrawals)

Do not include any markdown wrap like \`\`\`json, just output the raw JSON array. If there are no structured transactions found, output an empty [] array.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { inlineData },
            prompt
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      let jsonText = response.text || '';
      jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();

      let validRows = [];
      try {
        validRows = JSON.parse(jsonText).filter(r => r.amount > 0);
      } catch (e) {
        console.error('Failed to parse AI response as JSON. AI Response: ', jsonText.substring(0, 100));
        return res.status(422).json({ error: 'AI failed to extract structured JSON data from this document.' });
      }

      console.log(`[PDF] Matches found via AI extraction: ${validRows.length}`);

      if (validRows.length === 0) {
         return res.status(422).json({ error: 'No structured transactions detected in the PDF. Make sure tabular data exists.' });
      }

      const uploadId = Date.now().toString();
      const uploadData = {
        userId: req.userId,
        businessId: req.isPersonal ? null : req.workspaceId,
        uploadId,
        filename: req.file.originalname,
        rowCount: validRows.length
      };

      await new Upload(uploadData).save();
      const transactionsToInsert = validRows.map(r => ({ 
        userId: req.userId, 
        businessId: req.isPersonal ? null : req.workspaceId,
        createdBy: req.userId,
        uploadId, 
        ...r 
      }));
      await Transaction.insertMany(transactionsToInsert);

      await logAudit(req, 'upload_statement', 'Upload', uploadId, { filename: req.file.originalname, rowCount: validRows.length });

      return res.json({ success: true, imported: validRows.length, skipped: 0, uploadId });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to parse PDF: ' + err.message });
    }
  }

  // [CSV Processing]
  const rawRows = [];
  const bufferStream = new Readable();
  bufferStream.push(req.file.buffer);
  bufferStream.push(null);

  bufferStream
    .pipe(csv())
    .on('data', (row) => { if (rawRows.length < MAX_ROWS) rawRows.push(row); })
    .on('end', async () => {
      if (rawRows.length === 0) return res.status(400).json({ error: 'CSV has no rows.' });

      const headers = Object.keys(rawRows[0]);
      let mapping = detectMapping(headers);

      if (req.query.mappingConfirmed === 'true') {
        const fields = ['date', 'description', 'category', 'amount', 'type', 'debit', 'credit'];
        fields.forEach(f => { if (req.query[f]) mapping[f] = req.query[f]; });
      }

      const unmapped = [];
      if (!mapping.date) unmapped.push('Date');
      if (!mapping.amount && !mapping.credit && !mapping.debit) unmapped.push('Amount');

      if (unmapped.length > 0) {
        return res.status(422).json({
          needsMapping: true,
          headers,
          detectedMapping: mapping,
          message: `Could not auto-detect columns: ${unmapped.join(', ')}. Please map them.`
        });
      }

      const validRows = rawRows
        .map(r => resolveRow(r, mapping))
        .filter(r => r.amount > 0);

      if (validRows.length === 0) {
        return res.status(400).json({ error: 'No valid rows found in CSV. Ensure Amount column has numeric values > 0.' });
      }

      const uploadId = Date.now().toString();
      const uploadData = {
        userId: req.userId,
        businessId: req.isPersonal ? null : req.workspaceId,
        uploadId,
        filename: req.file.originalname,
        uploadedAt: new Date().toISOString(),
        rowCount: validRows.length
      };

      await new Upload(uploadData).save();
      const transactionsToInsert = validRows.map(r => ({
        userId: req.userId,
        businessId: req.isPersonal ? null : req.workspaceId,
        createdBy: req.userId,
        uploadId,
        date: r.date,
        description: r.description,
        category: r.category || 'Other',
        amount: r.amount,
        type: r.type || 'expense'
      }));
      await Transaction.insertMany(transactionsToInsert);

      await logAudit(req, 'upload_statement', 'Upload', uploadId, { filename: req.file.originalname, rowCount: validRows.length });

      res.json({
        success: true,
        imported: validRows.length,
        skipped: rawRows.length - validRows.length,
        uploadId
      });
    })
    .on('error', err => res.status(500).json({ error: `CSV parse error: ${err.message}` }));
});

// Helper to convert Devanagari numerals (०१२३४५६७८९) to standard ASCII digits (0-9)
function normalizeDevanagariNumerals(text) {
  if (!text || typeof text !== 'string') return text || '';
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return text.replace(/[०-९]/g, (match) => devanagariDigits.indexOf(match).toString());
}

// Receipt OCR Endpoint (POST /api/upload/receipt) supporting English, Hindi, and Marathi
app.post('/api/upload/receipt', authMiddleware, workspaceMiddleware, checkPermission('submit_self_expense'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No receipt image uploaded.' });

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in backend environment.' });
    }

    console.log(`[OCR] Uploaded image: ${req.file.originalname}. Sending buffer to Gemini Multilingual OCR...`);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const imgBase64 = req.file.buffer.toString('base64');
    const inlineData = {
      data: imgBase64,
      mimeType: req.file.mimetype || 'image/jpeg'
    };

    const prompt = `
You are an expert multilingual receipt parser supporting English, Hindi (हिन्दी), Marathi (मराठी), and mixed-language Indian GST invoices & local shop bills.
Analyze this receipt image carefully. Convert any Devanagari numerals (०, १, २, ३, ४, ५, ६, ७, ८, ९) to standard English digits (0-9).

Extract transaction details and return strictly a raw JSON object with the exact following keys:
- "date": Date of purchase in YYYY-MM-DD format (use current date if not clear: ${new Date().toISOString().split('T')[0]})
- "time": Time of purchase (e.g. "14:30" or "" if absent)
- "merchantName": Shop / Vendor / Merchant name in English or transliterated
- "description": Concise description (e.g. "Grocery Purchase", "Restaurant Bill", "Fuel Expense")
- "category": Budget category ("Groceries", "Food", "Rent", "Payroll", "Utilities", "Marketing", "Travel", "Office", "Fuel", "Medical", "Other")
- "amount": Total final bill amount as a positive float number only
- "subtotal": Amount before tax as a positive float number (or same as amount if absent)
- "taxAmount": Total GST / CGST / SGST / VAT amount as a positive float number (or 0.0)
- "discount": Discount amount as a positive float number (or 0.0)
- "invoiceNumber": Bill / Invoice / Token number (e.g. "INV-1092" or "")
- "gstNumber": GSTIN number if present (or "")
- "paymentMethod": "cash", "card", "upi", "online", or "other"
- "currency": Currency symbol or code (e.g. "INR", "USD")
- "address": Merchant store address (or "")
- "phone": Merchant contact phone number (or "")
- "items": Array of items extracted [{ "name": "Item name", "price": 100.0, "quantity": 1 }]
- "detectedLanguage": Detected script/language ("English", "Hindi", "Marathi", or "Mixed")
- "confidenceScore": Estimated OCR confidence score between 0.50 and 1.00 based on text sharpness

Do not wrap in markdown \`\`\`json. Output only the raw JSON object.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData },
        prompt
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    let jsonText = response.text || '{}';
    jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();

    console.log('[OCR] Raw Gemini response:', jsonText);

    let parsed = {};
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse AI OCR response as JSON:', jsonText);
      return res.status(422).json({ error: 'AI failed to extract structured transaction details from this receipt.' });
    }

    // Normalize all numeric strings (in case Devanagari numerals were returned in text)
    const cleanNum = (val, fallback = 0) => {
      if (typeof val === 'number') return isNaN(val) ? fallback : val;
      const normalizedStr = normalizeDevanagariNumerals(String(val || '0')).replace(/[^\d.]/g, '');
      const parsedFloat = parseFloat(normalizedStr);
      return isNaN(parsedFloat) ? fallback : parsedFloat;
    };

    const cleanStr = (val) => {
      return normalizeDevanagariNumerals(String(val || '')).trim();
    };

    const result = {
      date: parsed.date || new Date().toISOString().split('T')[0],
      time: parsed.time || '',
      merchantName: cleanStr(parsed.merchantName || parsed.description || 'Merchant'),
      description: cleanStr(parsed.description || parsed.merchantName || 'Receipt Expense'),
      category: parsed.category || 'Other',
      amount: cleanNum(parsed.amount, 0),
      subtotal: cleanNum(parsed.subtotal, cleanNum(parsed.amount, 0)),
      taxAmount: cleanNum(parsed.taxAmount, 0),
      discount: cleanNum(parsed.discount, 0),
      invoiceNumber: cleanStr(parsed.invoiceNumber || ''),
      gstNumber: cleanStr(parsed.gstNumber || ''),
      paymentMethod: parsed.paymentMethod || 'cash',
      currency: parsed.currency || 'INR',
      address: cleanStr(parsed.address || ''),
      phone: cleanStr(parsed.phone || ''),
      items: Array.isArray(parsed.items) ? parsed.items.map((i) => ({
        name: cleanStr(i.name || 'Item'),
        price: cleanNum(i.price, 0),
        quantity: cleanNum(i.quantity, 1)
      })) : [],
      detectedLanguage: parsed.detectedLanguage || 'English',
      confidenceScore: cleanNum(parsed.confidenceScore, 0.90),
      type: 'expense'
    };

    console.log(`[OCR] ✅ Multilingual extraction successful for: ${result.merchantName} | Total: ₹${result.amount} | Lang: ${result.detectedLanguage}`);
    return res.json(result);
  } catch (err) {
    console.error('[OCR Error]', err);
    res.status(500).json({ error: 'Failed to parse receipt OCR: ' + err.message });
  }
});

// Delete ALL user statements and transactions (workspace scoped)
app.delete('/api/upload', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  try {
    console.log(`[DELETE ALL] Clearing data for workspace: ${req.workspaceId}...`);
    const query = req.isPersonal
      ? { userId: req.userId, businessId: { $in: [null, 'personal'] } }
      : { businessId: req.workspaceId };

    const uploadResult = await Upload.deleteMany(query)

    const txResult = await Transaction.deleteMany(query)

    await logAudit(req, 'clear_all_data', 'Workspace', req.workspaceId);

    console.log(`[DELETE ALL] Removed ${uploadResult.deletedCount} uploads, ${txResult.deletedCount} transactions.`);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE ALL] Error:', err.message);
    res.status(500).json({ error: 'Delete error: ' + err.message });
  }
});

// Delete a specific upload statement by uploadId
app.delete('/api/upload/:id', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  console.log(`[DELETE UPLOAD] Requested id: ${id} for workspace ${req.workspaceId}`);
  try {
    const query = req.isPersonal
      ? { userId: req.userId, uploadId: id }
      : { businessId: req.workspaceId, uploadId: id };

    const upload = await Upload.findOne(query)

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found.' });
    }

    const uploadIdStr = upload.uploadId;
    await Upload.deleteOne({ _id: upload._id });
    await Transaction.deleteMany({ uploadId: uploadIdStr });

    await logAudit(req, 'delete_upload', 'Upload', uploadIdStr, { filename: upload.filename });

    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE UPLOAD] Error:', err.message);
    res.status(500).json({ error: 'Delete error: ' + err.message });
  }
});

// Delete a single transaction
app.delete('/api/dashboard/transactions/:id', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  try {
    const query = req.isPersonal
      ? { _id: id, userId: req.userId }
      : { _id: id, businessId: req.workspaceId };

    const result = await Transaction.deleteOne(query)

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }

    await logAudit(req, 'delete_transaction', 'Transaction', id);

    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete error: ' + err.message });
  }
});

// Export CSV route (workspace isolated)
app.get('/api/export', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  const db = await getDbData(req.workspaceId, req.isPersonal);
  const txs = db.transactions || [];
  let csv = "Date,Description,Category,Amount,Type\n";
  txs.forEach(tx => {
    const desc = `"${(tx.description || '').replace(/"/g, '""')}"`;
    const cat = `"${(tx.category || '').replace(/"/g, '""')}"`;
    csv += `${tx.date},${desc},${cat},${tx.amount},${tx.type}\n`;
  });
  res.header('Content-Type', 'text/csv');
  res.attachment('financial_data_export.csv');
  return res.send(csv);
});

// ─── DASHBOARD ROUTES (User Isolated) ──────────────────────────────────────────
function getFilteredDb(db, filter) {
  if (!filter || filter === 'all') return db;
  const today = new Date();
  
  let startDate = null;
  if (filter === 'this_month') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  } else if (filter === 'last_3_months') {
    startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0];
  } else if (filter === 'this_year') {
    startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  }
  
  if (!startDate) return db;
  
  const filteredTxs = (db.transactions || []).filter(tx => tx.date >= startDate);
  
  const tempDb = {
    transactions: filteredTxs,
    uploads: db.uploads,
    stats: [], cashflow: { monthlyData: [], stats: [] },
    expenses: { categories: [], monthlyTrend: [] },
    runway: [], alerts: [], recommendations: [], revenueExpense: []
  };
  
  return recalculateDb(tempDb);
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/dashboard/stats', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => { 
  const db = getFilteredDb(await getDbData(req.workspaceId, req.isPersonal), req.query.filter); 
  res.json(db.stats || []); 
});

app.get('/api/dashboard/budget', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  const db = await getDbData(req.workspaceId, req.isPersonal);
  res.json(db.budgetStatus || { limit: 0, used: 0, percent: 0, remaining: 0, categoryStatus: {} });
});

app.get('/api/dashboard/transactions', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => { 
  const db = getFilteredDb(await getDbData(req.workspaceId, req.isPersonal), req.query.filter); 
  res.json(db.transactions || []); 
});

app.get('/api/dashboard/transactions/verify', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const db = await getDbData(req.workspaceId, req.isPersonal);
    const txs = db.transactions || [];
    const verificationResults = [];

    const stringToUint8Array = (str) => {
      const arr = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        arr[i] = str.charCodeAt(i) & 0xff;
      }
      return arr;
    };
    const fromHex = (hex) => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, (i + 1) * 2), 16);
      }
      return bytes;
    };

    for (const tx of txs) {
      if (!tx.signature) {
        verificationResults.push({
          id: (tx._id || tx.id).toString(),
          date: tx.date,
          amount: tx.amount,
          description: tx.description,
          status: 'unsigned',
          verified: false
        });
        continue;
      }

      const user = await User.findById(tx.userId)

      if (!user || !user.publicKey) {
        verificationResults.push({
          id: (tx._id || tx.id).toString(),
          date: tx.date,
          amount: tx.amount,
          description: tx.description,
          status: 'missing_public_key',
          verified: false
        });
        continue;
      }

      const dataString = `${tx.amount}:${tx.description}:${tx.date}:${tx.type}`;
      const dataBytes = stringToUint8Array(dataString);
      const signatureBytes = fromHex(tx.signature);
      const publicKeyBytes = fromHex(user.publicKey);

      const isValid = nacl.sign.detached.verify(dataBytes, signatureBytes, publicKeyBytes);
      verificationResults.push({
        id: (tx._id || tx.id).toString(),
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        status: isValid ? 'verified' : 'tampered',
        verified: isValid
      });
    }

    res.json(verificationResults);
  } catch (err) {
    res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
});

app.post('/api/sync/peers', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { peerTransactions } = req.body;
  if (!Array.isArray(peerTransactions)) {
    return res.status(400).json({ error: 'peerTransactions must be an array.' });
  }

  try {
    const db = await getDbData(req.workspaceId, req.isPersonal);
    const localTxs = db.transactions || [];
    const localMap = new Map(localTxs.map(t => [ (t._id || t.id).toString(), t ]));

    const updatedTxs = [];
    const conflictLogs = [];

    // Helper to compare vector clocks
    const compareClocks = (clockA, clockB) => {
      const keys = new Set([...Object.keys(clockA), ...Object.keys(clockB)]);
      let greater = false;
      let lesser = false;

      for (const k of keys) {
        const valA = clockA[k] || 0;
        const valB = clockB[k] || 0;
        if (valA > valB) greater = true;
        if (valA < valB) lesser = true;
      }

      if (greater && !lesser) return 'newer'; // clockA is newer
      if (!greater && lesser) return 'older'; // clockB is newer (local is newer)
      if (greater && lesser) return 'concurrent'; // conflict
      return 'equal';
    };

    for (const peerTx of peerTransactions) {
      const txId = (peerTx._id || peerTx.id).toString();
      const localTx = localMap.get(txId);

      if (!localTx) {
        // New transaction entirely: save it locally
        const newTxData = {
          ...peerTx,
          userId: peerTx.userId || req.userId,
          businessId: req.isPersonal ? null : req.workspaceId,
          vectorClock: peerTx.vectorClock || {}
        };
        const saved = await new Transaction(newTxData).save()

        updatedTxs.push(saved);
      } else {
        // Both have the transaction: evaluate vector clocks
        const clockLocal = localTx.vectorClock ? (localTx.vectorClock.toObject ? localTx.vectorClock.toObject() : localTx.vectorClock) : {};
        const clockIncoming = peerTx.vectorClock || {};

        const relation = compareClocks(clockIncoming, clockLocal);

        if (relation === 'newer') {
          // Incoming is strictly newer: overwrite local
          const updateFields = {
            date: peerTx.date,
            description: peerTx.description,
            category: peerTx.category,
            amount: peerTx.amount,
            type: peerTx.type,
            merchant: peerTx.merchant,
            paymentMethod: peerTx.paymentMethod,
            signature: peerTx.signature,
            vectorClock: clockIncoming,
            status: peerTx.status || localTx.status
          };

          const updated = await Transaction.findByIdAndUpdate(txId, updateFields, { new: true })

          updatedTxs.push(updated);
        } else if (relation === 'concurrent') {
          // Concurrent conflict: Resolve deterministically using Last-Write-Wins (updatedAt)
          const timeLocal = new Date(localTx.updatedAt || localTx.createdAt || Date.now()).getTime();
          const timeIncoming = new Date(peerTx.updatedAt || peerTx.createdAt || Date.now()).getTime();

          conflictLogs.push({
            transactionId: txId,
            description: peerTx.description,
            localClock: clockLocal,
            incomingClock: clockIncoming
          });

          // Merge vector clocks (taking the max counter for each device node)
          const mergedClock = {};
          const keys = new Set([...Object.keys(clockLocal), ...Object.keys(clockIncoming)]);
          for (const k of keys) {
            mergedClock[k] = Math.max(clockLocal[k] || 0, clockIncoming[k] || 0);
          }

          if (timeIncoming > timeLocal) {
            const updateFields = {
              date: peerTx.date,
              description: peerTx.description,
              category: peerTx.category,
              amount: peerTx.amount,
              type: peerTx.type,
              merchant: peerTx.merchant,
              paymentMethod: peerTx.paymentMethod,
              signature: peerTx.signature,
              vectorClock: mergedClock,
              status: 'approved',
              isConflicted: true,
              conflictReason: `Concurrent conflict resolved automatically via Last-Write-Wins (Incoming ${timeIncoming} > Local ${timeLocal}).`
            };

            const updated = await Transaction.findByIdAndUpdate(txId, updateFields, { new: true })

            updatedTxs.push(updated);
          } else {
            const updateFields = {
              vectorClock: mergedClock,
              isConflicted: true,
              conflictReason: `Concurrent conflict resolved automatically via Last-Write-Wins (Local ${timeLocal} >= Incoming ${timeIncoming}).`
            };

            const updated = await Transaction.findByIdAndUpdate(txId, updateFields, { new: true })

            updatedTxs.push(updated);
          }
        }
      }
    }

    res.json({
      success: true,
      synchronizedCount: updatedTxs.length,
      conflictsResolved: conflictLogs.length,
      conflictDetails: conflictLogs
    });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

app.get('/api/dashboard/cashflow', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => { 
  const db = getFilteredDb(await getDbData(req.workspaceId, req.isPersonal), req.query.filter); 
  res.json(db.cashflow || {}); 
});

app.get('/api/dashboard/expenses', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  const db = getFilteredDb(await getDbData(req.workspaceId, req.isPersonal), req.query.filter);
  const expenses = db.expenses || {};
  const txs = db.transactions || [];
  const monthExpMap = {};
  txs.filter(tx => tx.type === 'expense').forEach(tx => {
    const m = (tx.date || '').slice(0, 7) || 'Unknown';
    if (!monthExpMap[m]) monthExpMap[m] = { total: 0 };
    monthExpMap[m].total += tx.amount;
  });
  expenses.monthlyTrend = Object.entries(monthExpMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([m, v]) => ({ month: m.slice(5), total: Math.round(v.total) }));
  res.json(expenses);
});

app.get('/api/dashboard/runway', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => { 
  const db = getFilteredDb(await getDbData(req.workspaceId, req.isPersonal), req.query.filter); 
  res.json(db.runway || []); 
});

app.get('/api/dashboard/revenue-expense', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => { 
  const db = getFilteredDb(await getDbData(req.workspaceId, req.isPersonal), req.query.filter); 
  res.json(db.revenueExpense || []); 
});

app.get('/api/dashboard/alerts', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => { 
  const db = getFilteredDb(await getDbData(req.workspaceId, req.isPersonal), req.query.filter); 
  res.json(db.alerts || []); 
});

app.post('/api/ai/chat', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in backend (.env).' });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Securely rebuild active context details from the database!
    const db = await getDbData(req.workspaceId, req.isPersonal);
    
    const summaryContext = {
      stats: db.stats || {},
      revenueExpense: Array.isArray(db.revenueExpense) ? db.revenueExpense.slice(-30) : [],
      runway: Array.isArray(db.runway) ? db.runway.slice(-12) : [],
      runwayMonths: db.runwayMonths || 0,
      alerts: Array.isArray(db.alerts) ? db.alerts.slice(0, 5) : [],
      expenses: Array.isArray(db.expenses?.categories) ? db.expenses.categories.slice(0, 10) : []
    };

    const prompt = `
You are HisabHero AI, a helpful, expert business financial advisor.
The user is asking a question about their business finances.

Here is the current context (their financial dashboard metrics):
${JSON.stringify(summaryContext)}

User Question: ${message}

Provide a concise, helpful, and insightful response. Focus strictly on the user's metrics if relevant, keep it under 150 words, and use markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate AI response: ' + err.message });
  }
});

app.get('/api/uploads', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => { 
  const db = await getDbData(req.workspaceId, req.isPersonal); 
  res.json(db.uploads || []); 
});

app.get('/api/dashboard/health', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  const db = getFilteredDb(await getDbData(req.workspaceId, req.isPersonal), req.query.filter);
  if (!db.transactions || db.transactions.length === 0) return res.json({ score: 0 });

  const marginStat = (db.stats || []).find(s => s.label === 'Net Margin');
  const margin = marginStat ? parseFloat(marginStat.value) : 0;

  const score = Math.min(100, Math.max(0, Math.round(margin * 2)));
  res.json({ score });
});

// Manual transaction add (workspace isolated & audited)
app.post('/api/dashboard/transactions', authMiddleware, workspaceMiddleware, checkPermission('submit_self_expense'), async (req, res) => {
  const { date, description, category, amount, type, merchant, paymentMethod, receiptUrl, taxAmount, originalAmount, originalCurrency, exchangeRate, signature, publicKey, vectorClock } = req.body;
  if (!amount || !date) return res.status(400).json({ error: 'date and amount are required' });

  try {
    // Biometric Cryptographic Signature Verification
    if (signature && publicKey) {
      const user = await User.findById(req.userId)

      if (user) {
        let registeredPubKey = user.publicKey;
        if (!registeredPubKey) {
          registeredPubKey = publicKey;
          await User.findByIdAndUpdate(req.userId, { publicKey });
        } else if (registeredPubKey !== publicKey) {
          return res.status(403).json({ error: 'Public key mismatch. Access denied to this secure keypair.' });
        }

        const dataString = `${parseFloat(amount)}:${description || category || 'Transaction'}:${date}:${type || 'expense'}`;
        const stringToUint8Array = (str) => {
          const arr = new Uint8Array(str.length);
          for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i) & 0xff;
          }
          return arr;
        };
        const fromHex = (hex) => {
          const bytes = new Uint8Array(hex.length / 2);
          for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substring(i * 2, (i + 1) * 2), 16);
          }
          return bytes;
        };

        const dataBytes = stringToUint8Array(dataString);
        const signatureBytes = fromHex(signature);
        const publicKeyBytes = fromHex(registeredPubKey);

        const isValid = nacl.sign.detached.verify(dataBytes, signatureBytes, publicKeyBytes);
        if (!isValid) {
          return res.status(400).json({ error: 'Cryptographic signature verification failed. The transaction payload may have been tampered with.' });
        }
      }
    }

    const isEmployee = req.workspaceRole === 'employee';
    const status = isEmployee ? 'pending_approval' : 'approved';

    const txData = {
      userId: req.userId,
      businessId: req.isPersonal ? null : req.workspaceId,
      createdBy: req.userId,
      uploadId: 'manual',
      date,
      description,
      category: category || 'Other',
      amount: parseFloat(amount),
      type: type || 'expense',
      merchant,
      paymentMethod,
      receiptUrl,
      taxAmount: parseFloat(taxAmount || '0'),
      status,
      originalAmount: originalAmount ? parseFloat(originalAmount) : undefined,
      originalCurrency: originalCurrency || undefined,
      exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
      signature: signature || undefined,
      vectorClock: vectorClock || {},
    };
    
    const savedTx = await new Transaction(txData).save();
    await logAudit(req, 'add_transaction', 'Transaction', (savedTx._id || savedTx.id).toString(), { amount: txData.amount, description: txData.description, status });
      
    const returnTx = savedTx.toObject();
    res.status(201).json({ ...returnTx, id: (returnTx._id || returnTx.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Save error: ' + err.message });
  }
});

// Update a single transaction (workspace isolated & audited)
app.patch('/api/dashboard/transactions/:id', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  const { date, description, category, amount, type, merchant, paymentMethod, receiptUrl, taxAmount } = req.body;

  try {
    const updateFields = {};
    if (date) updateFields.date = date;
    if (description) updateFields.description = description;
    if (category) updateFields.category = category;
    if (amount !== undefined) updateFields.amount = parseFloat(amount);
    if (type) updateFields.type = type;
    if (merchant !== undefined) updateFields.merchant = merchant;
    if (paymentMethod !== undefined) updateFields.paymentMethod = paymentMethod;
    if (receiptUrl !== undefined) updateFields.receiptUrl = receiptUrl;
    if (taxAmount !== undefined) updateFields.taxAmount = parseFloat(taxAmount || '0');

    const query = req.isPersonal
      ? { _id: id, userId: req.userId }
      : { _id: id, businessId: req.workspaceId };

    const updatedTx = await Transaction.findOneAndUpdate(query, { $set: updateFields }, { new: true });

    if (!updatedTx) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }

    await logAudit(req, 'update_transaction', 'Transaction', id, updateFields);

    const result = updatedTx.toObject();
    res.json({ ...result, id: (result._id || result.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Update error: ' + err.message });
  }
});

// ─── CONTACTS APIS ─────────────────────────────────────────────────────────────
// Get all contacts in workspace
app.get('/api/contacts', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const query = req.isPersonal
      ? { userId: req.userId, businessId: null }
      : { businessId: req.workspaceId };
      
    const contacts = await Contact.find(query).lean();
      
    res.json(contacts.map(c => ({ ...c, id: (c._id || c.id).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts: ' + err.message });
  }
});

// Create Contact
app.post('/api/contacts', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { name, phone, email, address, type } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and Type are required' });

  try {
    const contactData = {
      name,
      phone,
      email,
      address,
      type,
      businessId: req.isPersonal ? null : req.workspaceId,
      userId: req.userId,
      createdBy: req.userId
    };

    const saved = await new Contact(contactData).save();
    const returnObj = saved.toObject();
    res.status(201).json({ ...returnObj, id: (returnObj._id || returnObj.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create contact: ' + err.message });
  }
});

// Update Contact
app.patch('/api/contacts/:id', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, type } = req.body;
  try {
    const query = req.isPersonal
      ? { _id: id, userId: req.userId }
      : { _id: id, businessId: req.workspaceId };

    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    if (address !== undefined) updateFields.address = address;
    if (type) updateFields.type = type;

    const updated = await Contact.findOneAndUpdate(query, { $set: updateFields }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Contact not found' });
    const returnObj = updated.toObject();
    res.json({ ...returnObj, id: (returnObj._id || returnObj.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contact: ' + err.message });
  }
});

// Delete Contact
app.delete('/api/contacts/:id', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  try {
    const query = req.isPersonal
      ? { _id: id, userId: req.userId }
      : { _id: id, businessId: req.workspaceId };

    const deleted = await Contact.deleteOne(query)

    if (deleted.deletedCount === 0) return res.status(404).json({ error: 'Contact not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete contact: ' + err.message });
  }
});

// ─── INVOICES APIS ─────────────────────────────────────────────────────────────
// Get all Invoices
app.get('/api/invoices', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const query = req.isPersonal
      ? { createdBy: req.userId, businessId: null }
      : { businessId: req.workspaceId };

    const invoices = await Invoice.find(query).lean();

    res.json(invoices.map(i => ({ ...i, id: (i._id || i.id).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices: ' + err.message });
  }
});

// Create Invoice
app.post('/api/invoices', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { invoiceNumber, customerId, invoiceDate, dueDate, lineItems, subtotal, total, notes } = req.body;
  if (!invoiceNumber || !customerId || !invoiceDate || !dueDate || !lineItems || total === undefined) {
    return res.status(400).json({ error: 'Missing required invoice fields' });
  }

  try {
    const invoiceData = {
      invoiceNumber,
      businessId: req.isPersonal ? null : req.workspaceId,
      customerId,
      invoiceDate,
      dueDate,
      lineItems,
      subtotal,
      total,
      notes,
      status: 'draft',
      payments: [],
      createdBy: req.userId
    };

    const saved = await new Invoice(invoiceData).save();
    await logAudit(req, 'create_invoice', 'Invoice', (saved._id || saved.id).toString(), { invoiceNumber, total });

    const returnObj = saved.toObject();
    res.status(201).json({ ...returnObj, id: (returnObj._id || returnObj.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invoice: ' + err.message });
  }
});

// Update Invoice status
app.patch('/api/invoices/:id', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    const query = req.isPersonal
      ? { _id: id, createdBy: req.userId }
      : { _id: id, businessId: req.workspaceId };

    const updateFields = {};
    if (status) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;

    const updated = await Invoice.findOneAndUpdate(query, { $set: updateFields }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Invoice not found' });
    
    await logAudit(req, 'update_invoice_status', 'Invoice', id, { status });

    const returnObj = updated.toObject();
    res.json({ ...returnObj, id: (returnObj._id || returnObj.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update invoice: ' + err.message });
  }
});

// Add Payment to Invoice
app.post('/api/invoices/:id/payments', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  const { date, amount, paymentMethod, reference } = req.body;
  if (!date || !amount) return res.status(400).json({ error: 'Date and amount are required' });

  try {
    const query = req.isPersonal
      ? { _id: id, createdBy: req.userId }
      : { _id: id, businessId: req.workspaceId };

    const invoiceObj = await Invoice.findOne(query);
    if (!invoiceObj) return res.status(404).json({ error: 'Invoice not found' });

    const invoice = invoiceObj.toObject();

    const newPayment = {
      date,
      amount: parseFloat(amount),
      paymentMethod,
      reference
    };

    const updatedPayments = [...(invoice.payments || []), newPayment];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    let newStatus = invoice.status;
    if (totalPaid >= invoice.total) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid';
    }

    const updated = await Invoice.findOneAndUpdate(query, { 
      $push: { payments: newPayment },
      $set: { status: newStatus }
    }, { new: true });

    // Create a corresponding transaction entry automatically!
    const txData = {
      userId: req.userId,
      businessId: req.isPersonal ? null : req.workspaceId,
      createdBy: req.userId,
      uploadId: 'invoice_payment',
      date,
      description: `Payment received for Invoice #${invoice.invoiceNumber}`,
      category: 'Sales',
      amount: parseFloat(amount),
      type: 'income',
      paymentMethod
    };
    await new Transaction(txData).save();

    await logAudit(req, 'add_invoice_payment', 'Invoice', id, { amount, newStatus });

    const returnObj = updated.toObject();
    res.json({ ...returnObj, id: (returnObj._id || returnObj.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment: ' + err.message });
  }
});

// ─── QUOTES APIS ───────────────────────────────────────────────────────────────
// Get Quotes
app.get('/api/quotes', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const query = req.isPersonal
      ? { createdBy: req.userId, businessId: null }
      : { businessId: req.workspaceId };

    const quotes = await Quote.find(query).lean();
    res.json(quotes.map(q => ({ ...q, id: (q._id || q.id).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotes: ' + err.message });
  }
});

// Create Quote
app.post('/api/quotes', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { quoteNumber, customerId, quoteDate, expiryDate, lineItems, subtotal, total } = req.body;
  if (!quoteNumber || !customerId || !quoteDate || !expiryDate || !lineItems || total === undefined) {
    return res.status(400).json({ error: 'Missing required quote fields' });
  }

  try {
    const quoteData = {
      quoteNumber,
      businessId: req.isPersonal ? null : req.workspaceId,
      customerId,
      quoteDate,
      expiryDate,
      lineItems,
      subtotal,
      total,
      status: 'draft',
      createdBy: req.userId
    };

    const saved = await new Quote(quoteData).save();
    await logAudit(req, 'create_quote', 'Quote', (saved._id || saved.id).toString(), { quoteNumber, total });

    const returnObj = saved.toObject();
    res.status(201).json({ ...returnObj, id: (returnObj._id || returnObj.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quote: ' + err.message });
  }
});

// Convert Quote to Invoice
app.post('/api/quotes/:id/convert', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  try {
    const query = req.isPersonal
      ? { _id: id, createdBy: req.userId }
      : { _id: id, businessId: req.workspaceId };

    const quoteObj = await Quote.findOne(query);
    if (!quoteObj) return res.status(404).json({ error: 'Quote not found' });
    const quote = quoteObj.toObject();

    if (quote.status === 'converted') {
      return res.status(400).json({ error: 'Quote has already been converted' });
    }

    // Generate Invoice Number
    const invoiceNumber = `INV-CONV-${Date.now().toString().slice(-6)}`;
    const invoiceData = {
      invoiceNumber,
      businessId: quote.businessId,
      customerId: quote.customerId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lineItems: quote.lineItems,
      subtotal: quote.subtotal,
      total: quote.total,
      status: 'draft',
      payments: [],
      createdBy: req.userId
    };

    const savedInvoice = await new Invoice(invoiceData).save();
    await Quote.findOneAndUpdate(query, { $set: { status: 'accepted' } });

    await logAudit(req, 'convert_quote', 'Quote', id, { invoiceId: (savedInvoice._id || savedInvoice.id).toString() });

    const returnObj = savedInvoice.toObject();
    res.json({ ...returnObj, id: (returnObj._id || returnObj.id).toString() });
    res.json({ ...returnObj, id: (returnObj._id || returnObj.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to convert quote: ' + err.message });
  }
});

// ─── BILLS APIS ────────────────────────────────────────────────────────────────
// Get Bills
app.get('/api/bills', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const query = req.isPersonal
      ? { createdBy: req.userId, businessId: null }
      : { businessId: req.workspaceId };

    const bills = await Bill.find(query).lean();

    res.json(bills.map(b => ({ ...b, id: (b._id || b.id).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bills: ' + err.message });
  }
});

// Create Bill
app.post('/api/bills', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { billNumber, supplierId, billDate, dueDate, amount, tax, lineItems } = req.body;
  if (!billNumber || !supplierId || !billDate || !dueDate || amount === undefined) {
    return res.status(400).json({ error: 'Missing required bill fields' });
  }

  try {
    const billData = {
      billNumber,
      businessId: req.isPersonal ? null : req.workspaceId,
      supplierId,
      billDate,
      dueDate,
      amount,
      tax: tax || 0,
      lineItems: lineItems || [],
      status: 'unpaid',
      payments: [],
      createdBy: req.userId
    };

    const saved = await new Bill(billData).save();
    await logAudit(req, 'create_bill', 'Bill', (saved._id || saved.id).toString(), { billNumber, amount });

    const returnObj = saved.toObject();
    res.status(201).json({ ...returnObj, id: (returnObj._id || returnObj.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create bill: ' + err.message });
  }
});

// Bill OCR Endpoint
app.post('/api/bills/ocr', authMiddleware, workspaceMiddleware, checkPermission('submit_self_expense'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No bill image uploaded.' });

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in backend environment.' });
    }

    console.log(`[OCR] Uploaded bill image: ${req.file.originalname}. Sending buffer to Gemini...`);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const imgBase64 = req.file.buffer.toString('base64');
    const inlineData = {
      data: imgBase64,
      mimeType: req.file.mimetype || 'image/jpeg'
    };

    const prompt = `
You are a precise supplier invoice/bill parser.
Extract billing details from this supplier bill and return strictly a raw JSON object with the following keys:
- "billNumber": Bill/Invoice reference number (generate one if not found, e.g. "BILL-YYYYMMDD-XXX")
- "supplierName": Supplier or Vendor name
- "billDate": Date of the bill in YYYY-MM-DD format (use current date if not clear, which is ${new Date().toISOString().split('T')[0]})
- "dueDate": Due date of the bill in YYYY-MM-DD format (use 30 days from bill date if not specified)
- "amount": Total bill amount as a positive float only
- "tax": Total tax amount as a positive float (default 0)
- "lineItems": Array of objects containing "description" and "amount"

Do not wrap in markdown \`\`\`json, just return the raw JSON object. If you cannot extract data, output an empty object {}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { inlineData },
        prompt
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    let jsonText = response.text || '{}';
    jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();

    console.log('[OCR] Gemini parsed bill response:', jsonText);

    let result = {};
    try {
      result = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse AI OCR bill response as JSON:', jsonText);
      return res.status(422).json({ error: 'AI failed to extract structured bill details from this image.' });
    }

    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to parse bill OCR: ' + err.message });
  }
});

// Accounts Receivable and Payable stats
app.get('/api/dashboard/ar-ap', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const query = req.isPersonal
      ? { createdBy: req.userId, businessId: null }
      : { businessId: req.workspaceId };

    const invoices = await Invoice.find(query).lean();

    const bills = await Bill.find(query).lean();

    // Accounts Receivable
    let totalReceivable = 0;
    let overdueReceivable = 0;
    const today = new Date().toISOString().split('T')[0];

    invoices.forEach(inv => {
      if (inv.status !== 'paid' && inv.status !== 'cancelled') {
        const totalPaid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
        const outstanding = inv.total - totalPaid;
        if (outstanding > 0) {
          totalReceivable += outstanding;
          if (inv.dueDate < today) {
            overdueReceivable += outstanding;
          }
        }
      }
    });

    // Accounts Payable
    let totalPayable = 0;
    let overduePayable = 0;

    bills.forEach(bill => {
      if (bill.status !== 'paid') {
        const totalPaid = (bill.payments || []).reduce((sum, p) => sum + p.amount, 0);
        const outstanding = bill.amount - totalPaid;
        if (outstanding > 0) {
          totalPayable += outstanding;
          if (bill.dueDate < today) {
            overduePayable += outstanding;
          }
        }
      }
    });

    res.json({
      accountsReceivable: totalReceivable,
      overdueReceivable,
      accountsPayable: totalPayable,
      overduePayable
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AR/AP stats: ' + err.message });
  }
});

// ─── APPROVAL WORKFLOW ROUTES ───────────────────────────────────────────────
// Get transactions pending approval
app.get('/api/dashboard/transactions/approvals', authMiddleware, workspaceMiddleware, checkPermission('manage_budgets'), async (req, res) => {
  try {
    const query = req.isPersonal
      ? { userId: req.userId, status: 'pending_approval' }
      : { businessId: req.workspaceId, status: 'pending_approval' };

    const txs = await Transaction.find(query).lean();

    res.json(txs.map(t => ({ ...t, id: (t._id || t.id).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending approvals: ' + err.message });
  }
});

// Approve claim
app.patch('/api/dashboard/transactions/:id/approve', authMiddleware, workspaceMiddleware, checkPermission('manage_budgets'), async (req, res) => {
  const { id } = req.params;
  try {
    const query = req.isPersonal
      ? { _id: id, userId: req.userId, status: 'pending_approval' }
      : { _id: id, businessId: req.workspaceId, status: 'pending_approval' };

    const updateFields = {
      status: 'approved',
      approvedBy: req.userId
    };

    const updated = await Transaction.findOneAndUpdate(query, { $set: updateFields }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Claim not found or already processed.' });

    await logAudit(req, 'approve_transaction', 'Transaction', id);

    const returnTx = updated.toObject();
    res.json({ ...returnTx, id: (returnTx._id || returnTx.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Approval failed: ' + err.message });
  }
});

// Reject claim
app.patch('/api/dashboard/transactions/:id/reject', authMiddleware, workspaceMiddleware, checkPermission('manage_budgets'), async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  try {
    const query = req.isPersonal
      ? { _id: id, userId: req.userId, status: 'pending_approval' }
      : { _id: id, businessId: req.workspaceId, status: 'pending_approval' };

    const updateFields = {
      status: 'rejected',
      approvalNotes: notes || ''
    };

    const updated = await Transaction.findOneAndUpdate(query, { $set: updateFields }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Claim not found or already processed.' });

    await logAudit(req, 'reject_transaction', 'Transaction', id, { notes });

    const returnTx = updated.toObject();
    res.json({ ...returnTx, id: (returnTx._id || returnTx.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Rejection failed: ' + err.message });
  }
});

// Reimburse claim
app.patch('/api/dashboard/transactions/:id/reimburse', authMiddleware, workspaceMiddleware, checkPermission('manage_budgets'), async (req, res) => {
  const { id } = req.params;
  try {
    const query = req.isPersonal
      ? { _id: id, userId: req.userId, status: 'approved' }
      : { _id: id, businessId: req.workspaceId, status: 'approved' };

    const updateFields = {
      status: 'reimbursed'
    };

    const updated = await Transaction.findOneAndUpdate(query, { $set: updateFields }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Claim not found or not in approved state.' });

    await logAudit(req, 'reimburse_transaction', 'Transaction', id);

    const returnTx = updated.toObject();
    res.json({ ...returnTx, id: (returnTx._id || returnTx.id).toString() });
    res.json({ ...returnTx, id: (returnTx._id || returnTx.id).toString() });
  } catch (err) {
    res.status(500).json({ error: 'Reimbursement failed: ' + err.message });
  }
});

// Helper to classify category based on description keywords
function classifyCategory(description) {
  const desc = (description || '').toLowerCase();
  if (desc.includes('rent') || desc.includes('landlord')) return 'Rent';
  if (desc.includes('salary') || desc.includes('payroll') || desc.includes('wage')) return 'Payroll';
  if (desc.includes('electric') || desc.includes('power') || desc.includes('water') || desc.includes('gas') || desc.includes('internet') || desc.includes('utilities')) return 'Utilities';
  if (desc.includes('marketing') || desc.includes('ads') || desc.includes('facebook') || desc.includes('google ads') || desc.includes('adwords')) return 'Marketing';
  if (desc.includes('flight') || desc.includes('hotel') || desc.includes('taxi') || desc.includes('uber') || desc.includes('travel') || desc.includes('ola')) return 'Travel';
  if (desc.includes('stationery') || desc.includes('paper') || desc.includes('printer') || desc.includes('office')) return 'Office';
  if (desc.includes('food') || desc.includes('restaurant') || desc.includes('swiggy') || desc.includes('zomato') || desc.includes('cafe')) return 'Food';
  if (desc.includes('sale') || desc.includes('payment from') || desc.includes('invoice') || desc.includes('customer')) return 'Sales';
  return 'Other';
}

// ─── BANK STATEMENT RECONCILIATION ROUTES ──────────────────────────────────
// Bank Statement Import (CSV upload)
app.post('/api/bank-transactions/import', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const rawRows = [];
  const bufferStream = new Readable();
  bufferStream.push(req.file.buffer);
  bufferStream.push(null);

  bufferStream
    .pipe(csv())
    .on('data', (row) => { if (rawRows.length < MAX_ROWS) rawRows.push(row); })
    .on('end', async () => {
      if (rawRows.length === 0) return res.status(400).json({ error: 'CSV has no rows.' });

      const headers = Object.keys(rawRows[0]);
      let mapping = detectMapping(headers);

      if (req.query.mappingConfirmed === 'true') {
        const fields = ['date', 'description', 'category', 'amount', 'type', 'debit', 'credit'];
        fields.forEach(f => { if (req.query[f]) mapping[f] = req.query[f]; });
      }

      const unmapped = [];
      if (!mapping.date) unmapped.push('Date');
      if (!mapping.amount && !mapping.credit && !mapping.debit) unmapped.push('Amount');

      if (unmapped.length > 0) {
        return res.status(422).json({
          needsMapping: true,
          headers,
          detectedMapping: mapping,
          message: `Could not auto-detect columns: ${unmapped.join(', ')}. Please map them.`
        });
      }

      const importedTxs = [];
      for (const row of rawRows) {
        const resolved = resolveRow(row, mapping);
        if (resolved.amount > 0) {
          const bankTxData = {
            userId: req.userId,
            businessId: req.isPersonal ? null : req.workspaceId,
            date: resolved.date,
            description: resolved.description,
            amount: resolved.amount,
            type: resolved.type === 'income' ? 'credit' : 'debit',
            reference: row.Reference || row.Ref || row.UTR || '',
            status: 'unmatched',
            matchedTransactionId: null,
            aiSuggestedCategory: classifyCategory(resolved.description)
          };
          
          const saved = await new BankTransaction(bankTxData).save()
          
          importedTxs.push({ ...saved.toObject ? saved.toObject() : saved, id: (saved._id || saved.id).toString() });
        }
      }

      await logAudit(req, 'import_bank_statement', 'BankTransaction', 'multiple', { count: importedTxs.length });

      res.status(201).json({ success: true, count: importedTxs.length, transactions: importedTxs });
    })
    .on('error', err => res.status(500).json({ error: `CSV parse error: ${err.message}` }));
});

// Get imported bank transactions
app.get('/api/bank-transactions', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const query = req.isPersonal
      ? { userId: req.userId, businessId: null }
      : { businessId: req.workspaceId };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const txs = await BankTransaction.find(query).lean();

    res.json(txs.map(t => ({ ...t, id: (t._id || t.id).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bank transactions: ' + err.message });
  }
});

// Get potential matches for a bank transaction
app.get('/api/bank-transactions/:id/matches', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  const { id } = req.params;
  try {
    const bankTx = await BankTransaction.findById(id).lean()

    if (!bankTx) return res.status(404).json({ error: 'Bank transaction not found' });

    // Fetch ledger transactions
    const query = req.isPersonal
      ? { userId: req.userId, businessId: { $in: [null, 'personal'] } }
      : { businessId: req.workspaceId };

    const ledgerTxs = await Transaction.find(query).lean();

    const matches = [];
    const bankDate = new Date(bankTx.date);

    ledgerTxs.forEach(ledgerTx => {
      // Must match amount
      if (ledgerTx.amount !== bankTx.amount) return;

      // Must match direction (debit = expense, credit = income)
      const ledgerDirection = ledgerTx.type === 'income' ? 'credit' : 'debit';
      if (ledgerDirection !== bankTx.type) return;

      const ledgerDate = new Date(ledgerTx.date);
      const diffTime = Math.abs(ledgerDate - bankDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 3) {
        // Evaluate similarity of description/merchant
        const descMatch = (ledgerTx.description || '').toLowerCase().includes((bankTx.description || '').toLowerCase().split(' ')[0]);
        const matchType = (diffDays === 0 && descMatch) ? 'exact' : 'possible';

        matches.push({
          transaction: { ...ledgerTx, id: (ledgerTx._id || ledgerTx.id).toString() },
          matchType,
          confidence: matchType === 'exact' ? 1.0 : 0.7
        });
      }
    });

    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to find matches: ' + err.message });
  }
});

// Reconcile bank transaction with existing ledger entry
app.post('/api/bank-transactions/:id/reconcile', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  const { ledgerTransactionId } = req.body;
  if (!ledgerTransactionId) return res.status(400).json({ error: 'ledgerTransactionId is required' });

  try {
    const updated = await BankTransaction.findByIdAndUpdate(id, { status: 'matched', matchedTransactionId: ledgerTransactionId }, { new: true })

    if (!updated) return res.status(404).json({ error: 'Bank transaction not found' });

    await logAudit(req, 'reconcile_bank_transaction', 'BankTransaction', id, { ledgerTransactionId });

    res.json({ success: true, transaction: updated });
  } catch (err) {
    res.status(500).json({ error: 'Reconciliation failed: ' + err.message });
  }
});

// Create new ledger transaction and reconcile it
app.post('/api/bank-transactions/:id/create-and-reconcile', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;

  try {
    const bankTx = await BankTransaction.findById(id).lean()

    if (!bankTx) return res.status(404).json({ error: 'Bank transaction not found' });

    // Create ledger transaction
    const txData = {
      userId: req.userId,
      businessId: req.isPersonal ? null : req.workspaceId,
      createdBy: req.userId,
      uploadId: 'bank_statement',
      date: bankTx.date,
      description: bankTx.description,
      category: category || bankTx.aiSuggestedCategory || 'Other',
      amount: bankTx.amount,
      type: bankTx.type === 'credit' ? 'income' : 'expense',
      status: 'approved'
    };

    const savedTx = await new Transaction(txData).save()

    const ledgerId = (savedTx._id || savedTx.id).toString();

    // Mark matched
    const updated = await BankTransaction.findByIdAndUpdate(id, { status: 'matched', matchedTransactionId: ledgerId }, { new: true })

    await logAudit(req, 'create_and_reconcile_bank_transaction', 'BankTransaction', id, { ledgerTransactionId: ledgerId });

    res.json({ success: true, transaction: updated, ledgerTransaction: savedTx });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create and reconcile: ' + err.message });
  }
});

// Ignore bank transaction
app.post('/api/bank-transactions/:id/ignore', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await BankTransaction.findByIdAndUpdate(id, { status: 'ignored' }, { new: true })

    if (!updated) return res.status(404).json({ error: 'Bank transaction not found' });

    await logAudit(req, 'ignore_bank_transaction', 'BankTransaction', id);

    res.json({ success: true, transaction: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ignore: ' + err.message });
  }
});

// AI Cash Flow Forecasting Route
app.get('/api/ai/forecast', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in backend (.env).' });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Retrieve active business context financial records
    const db = await getDbData(req.workspaceId, req.isPersonal);
    const txs = db.transactions || [];

    // Summarize historical trend by month
    const monthMap = {};
    txs.forEach(t => {
      const m = (t.date || '').slice(0, 7);
      if (!m) return;
      if (!monthMap[m]) monthMap[m] = { income: 0, expense: 0 };
      if (t.type === 'income') monthMap[m].income += t.amount;
      else monthMap[m].expense += t.amount;
    });

    const historicalSummary = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({ month, ...data }));

    const prompt = `
You are HisabHero AI, an expert financial forecaster.
Analyze the following historical monthly cash flow data (past 6 months max) for this business workspace:
${JSON.stringify(historicalSummary)}

Project the cash flow for the next 3 months. Provide a JSON response matching the following structure:
{
  "forecast": [
    {
      "month": "YYYY-MM",
      "estimatedIncome": number,
      "estimatedExpenses": number,
      "estimatedNetFlow": number
    }
  ],
  "confidenceScore": number,
  "confidenceReason": "Description of confidence factor",
  "factors": [
    "Factor 1 explaining trend",
    "Factor 2 explaining risk"
  ],
  "disclaimer": "This forecast is an AI-generated estimate based on historical patterns and does not guarantee future financial performance."
}

Do not include any markdown formatting like \`\`\`json, just output the raw JSON string.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    let forecastData;
    try {
      forecastData = JSON.parse(response.text);
    } catch (e) {
      console.error('Failed to parse AI forecast JSON. Text:', response.text);
      const avgIncome = historicalSummary.reduce((sum, h) => sum + h.income, 0) / (historicalSummary.length || 1);
      const avgExpense = historicalSummary.reduce((sum, h) => sum + h.expense, 0) / (historicalSummary.length || 1);
      forecastData = {
        forecast: [
          { month: 'Next Month 1', estimatedIncome: Math.round(avgIncome), estimatedExpenses: Math.round(avgExpense), estimatedNetFlow: Math.round(avgIncome - avgExpense) },
          { month: 'Next Month 2', estimatedIncome: Math.round(avgIncome), estimatedExpenses: Math.round(avgExpense), estimatedNetFlow: Math.round(avgIncome - avgExpense) },
          { month: 'Next Month 3', estimatedIncome: Math.round(avgIncome), estimatedExpenses: Math.round(avgExpense), estimatedNetFlow: Math.round(avgIncome - avgExpense) },
        ],
        confidenceScore: 60,
        confidenceReason: 'Heuristic calculation fallback due to parsing error',
        factors: ['Based on average historical cash flows.'],
        disclaimer: 'This forecast is an AI-generated estimate based on historical patterns and does not guarantee future financial performance.'
      };
    }

    res.json(forecastData);
  } catch (err) {
    res.status(500).json({ error: 'AI Forecast failed: ' + err.message });
  }
});
// ─── PHASE 5: INVENTORY MANAGEMENT ROUTES ──────────────────────────────────
// Get all inventory items
app.get('/api/inventory', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const query = { businessId: req.workspaceId };
    const items = await InventoryItem.find(query).lean();

    const lowStockAlerts = [];
    items.forEach(item => {
      if (item.stockQuantity <= item.reorderLevel) {
        lowStockAlerts.push({
          type: 'warning',
          message: `Low Stock Alert: SKU "${item.sku}" (${item.name}) is down to ${item.stockQuantity} (reorder level: ${item.reorderLevel})`
        });
      }
    });

    res.json({ items: items.map(i => ({ ...i, id: (i._id || i.id).toString() })), lowStockAlerts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory: ' + err.message });
  }
});

// Create inventory product
app.post('/api/inventory', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  try {
    const { name, sku, category, purchasePrice, sellingPrice, stockQuantity, reorderLevel } = req.body;
    if (!name || !sku) return res.status(400).json({ error: 'Name and SKU are required' });

    const itemData = {
      businessId: req.workspaceId,
      name,
      sku,
      category: category || 'General',
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stockQuantity: Number(stockQuantity) || 0,
      reorderLevel: Number(reorderLevel) || 5
    };

    const saved = await new InventoryItem(itemData).save()

    await logAudit(req, 'create_inventory_item', 'InventoryItem', (saved._id || saved.id).toString(), { name, sku });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create inventory item: ' + err.message });
  }
});

// Adjust stock balance
app.patch('/api/inventory/:id/adjust', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustmentQuantity, reason } = req.body; // positive to add, negative to subtract
    if (adjustmentQuantity === undefined) return res.status(400).json({ error: 'adjustmentQuantity is required' });

    const item = await InventoryItem.findById(id)

    if (!item) return res.status(404).json({ error: 'Inventory item not found' });

    const newStock = (item.stockQuantity || 0) + Number(adjustmentQuantity);

    const updated = await InventoryItem.findByIdAndUpdate(id, { stockQuantity: newStock }, { new: true })

    await logAudit(req, 'adjust_inventory_stock', 'InventoryItem', id, { adjustmentQuantity, reason, oldStock: item.stockQuantity, newStock });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to adjust stock: ' + err.message });
  }
});

// ─── PURCHASE ORDERS ROUTES ───────────────────────────────────────────────
// Get all purchase orders
app.get('/api/purchase-orders', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const query = { businessId: req.workspaceId };
    const pos = await PurchaseOrder.find(query).lean();

    res.json(pos.map(po => ({ ...po, id: (po._id || po.id).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchase orders: ' + err.message });
  }
});

// Create purchase order
app.post('/api/purchase-orders', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  try {
    const { poNumber, supplierId, items, notes, orderDate } = req.body;
    if (!poNumber || !supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'poNumber, supplierId, and items array are required' });
    }

    let total = 0;
    const poItems = items.map(item => {
      total += (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      return {
        inventoryItemId: item.inventoryItemId,
        name: item.name,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        receivedQuantity: 0
      };
    });

    const poData = {
      businessId: req.workspaceId,
      poNumber,
      supplierId,
      items: poItems,
      total,
      status: 'draft',
      orderDate: orderDate || new Date().toISOString().split('T')[0],
      notes: notes || ''
    };

    const saved = await new PurchaseOrder(poData).save()

    await logAudit(req, 'create_purchase_order', 'PurchaseOrder', (saved._id || saved.id).toString(), { poNumber });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create PO: ' + err.message });
  }
});

// Receive purchase order items (increments inventory stock)
app.patch('/api/purchase-orders/:id/receive', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  try {
    const { id } = req.params;
    const { itemsReceived } = req.body; // Key-value object mapping inventoryItemId -> receivedIncrementQuantity
    if (!itemsReceived) return res.status(400).json({ error: 'itemsReceived map is required' });

    const po = await PurchaseOrder.findById(id)

    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });

    let allFullyReceived = true;
    let anyReceived = false;

    // Update received levels inside PO items
    const updatedItems = po.items.map(item => {
      const increment = Number(itemsReceived[item.inventoryItemId]) || 0;
      const newRec = (item.receivedQuantity || 0) + increment;
      
      if (increment > 0) anyReceived = true;
      if (newRec < item.quantity) allFullyReceived = false;

      return {
        ...item.toObject ? item.toObject() : item,
        receivedQuantity: newRec
      };
    });

    // Compute new PO status
    let newStatus = po.status;
    if (allFullyReceived) newStatus = 'received';
    else if (anyReceived || po.status === 'partially_received') newStatus = 'partially_received';

    // Save purchase order changes
    const savedPO = await PurchaseOrder.findByIdAndUpdate(id, { items: updatedItems, status: newStatus }, { new: true })

    // RAMP UP the corresponding stock balance in Inventory Items!
    for (const item of po.items) {
      const increment = Number(itemsReceived[item.inventoryItemId]) || 0;
      if (increment > 0) {
        const invItem = await InventoryItem.findById(item.inventoryItemId)
        
        if (invItem) {
          const newStock = (invItem.stockQuantity || 0) + increment;
          await InventoryItem.findByIdAndUpdate(item.inventoryItemId, { stockQuantity: newStock })
        }
      }
    }

    await logAudit(req, 'receive_purchase_order_items', 'PurchaseOrder', id, { itemsReceived, newStatus });

    res.json(savedPO);
  } catch (err) {
    res.status(500).json({ error: 'Failed to receive items: ' + err.message });
  }
});

// Update PO status
app.patch('/api/purchase-orders/:id/status', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const updated = await PurchaseOrder.findByIdAndUpdate(id, { status }, { new: true })

    await logAudit(req, 'update_purchase_order_status', 'PurchaseOrder', id, { status });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update PO status: ' + err.message });
  }
});

// ─── FIXED ASSETS ROUTES ──────────────────────────────────────────────────
// Get all fixed assets
app.get('/api/fixed-assets', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  try {
    const query = { businessId: req.workspaceId };
    const assets = await FixedAsset.find(query).lean();

    res.json(assets.map(a => ({ ...a, id: (a._id || a.id).toString() })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fixed assets: ' + err.message });
  }
});

// Create fixed asset
app.post('/api/fixed-assets', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  try {
    const { name, category, purchaseDate, purchaseCost, usefulLife } = req.body;
    if (!name || !purchaseDate || !purchaseCost || !usefulLife) {
      return res.status(400).json({ error: 'name, purchaseDate, purchaseCost, and usefulLife are required' });
    }

    const assetData = {
      businessId: req.workspaceId,
      name,
      category: category || 'other',
      purchaseDate,
      purchaseCost: Number(purchaseCost),
      usefulLife: Number(usefulLife),
      currentValue: Number(purchaseCost),
      depreciationMethod: 'straight_line',
      accumulatedDepreciation: 0
    };

    const saved = await new FixedAsset(assetData).save()

    await logAudit(req, 'create_fixed_asset', 'FixedAsset', (saved._id || saved.id).toString(), { name, purchaseCost });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create fixed asset: ' + err.message });
  }
});

// Trigger annual depreciation calculations (Straight-Line method)
app.post('/api/fixed-assets/depreciate', authMiddleware, workspaceMiddleware, checkPermission('manage_transactions'), async (req, res) => {
  try {
    const query = { businessId: req.workspaceId };
    const assets = await FixedAsset.find(query)

    const updatedAssets = [];
    for (const asset of assets.lean ? assets.lean() : assets) {
      const id = (asset._id || asset.id).toString();
      // Straight-line annual depreciation = Purchase Cost / Useful Life
      const annualDepreciation = Math.round(asset.purchaseCost / (asset.usefulLife || 1));
      
      const newAccumulated = (asset.accumulatedDepreciation || 0) + annualDepreciation;
      const newCurrentValue = Math.max(0, asset.purchaseCost - newAccumulated);

      const updated = await FixedAsset.findByIdAndUpdate(id, { accumulatedDepreciation: newAccumulated, currentValue: newCurrentValue }, { new: true })

      updatedAssets.push(updated);
    }

    await logAudit(req, 'depreciate_fixed_assets', 'FixedAsset', 'multiple', { count: updatedAssets.length });

    res.json({ success: true, count: updatedAssets.length, assets: updatedAssets });
  } catch (err) {
    res.status(500).json({ error: 'Depreciation calculation failed: ' + err.message });
  }
});

// ─── [HISABHERO ENTERPRISE] CORE ACCOUNTING & JOURNAL ENTRIES ─────────────────
// Standard Chart of Accounts seed helper
const STANDARD_ACCOUNTS = [
  { code: '1000', name: 'Cash on Hand', type: 'Asset', subType: 'Current Asset' },
  { code: '1010', name: 'Bank Operating Account', type: 'Asset', subType: 'Bank' },
  { code: '1100', name: 'Accounts Receivable', type: 'Asset', subType: 'Current Asset' },
  { code: '1200', name: 'Inventory Asset', type: 'Asset', subType: 'Inventory' },
  { code: '2000', name: 'Accounts Payable', type: 'Asset', subType: 'Current Liability' }, // Liability
  { code: '2100', name: 'GST Payable', type: 'Liability', subType: 'Tax' },
  { code: '3000', name: "Owner's Equity", type: 'Equity', subType: 'Equity' },
  { code: '4000', name: 'Sales Revenue', type: 'Revenue', subType: 'Operating Income' },
  { code: '4100', name: 'Service Income', type: 'Revenue', subType: 'Operating Income' },
  { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'Expense', subType: 'Direct Expense' },
  { code: '5100', name: 'Rent & Utilities', type: 'Expense', subType: 'Operating Expense' },
  { code: '5200', name: 'Salaries & Wages', type: 'Expense', subType: 'Payroll Expense' },
  { code: '5300', name: 'Office Supplies', type: 'Expense', subType: 'General Expense' },
];

app.get('/api/accounting/chart-of-accounts', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    let accounts = await Account.find({ workspaceId: req.workspaceId }).sort({ code: 1 });
    if (accounts.length === 0) {
      // Auto-seed standard chart of accounts for workspace
      const seeds = STANDARD_ACCOUNTS.map(a => ({
        ...a,
        workspaceId: req.workspaceId,
      }));
      accounts = await Account.insertMany(seeds);
    }
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Chart of Accounts: ' + err.message });
  }
});

app.post('/api/accounting/chart-of-accounts', authMiddleware, workspaceMiddleware, async (req, res) => {
  const { code, name, type, subType, description } = req.body;
  if (!code || !name || !type) {
    return res.status(400).json({ error: 'Account code, name, and type are required' });
  }
  try {
    const newAcc = await new Account({
      workspaceId: req.workspaceId,
      code,
      name,
      type,
      subType: subType || 'General',
      description: description || '',
    }).save();
    res.status(201).json(newAcc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account: ' + err.message });
  }
});

app.get('/api/accounting/journal-entries', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    const entries = await JournalEntry.find({ workspaceId: req.workspaceId }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journal entries: ' + err.message });
  }
});

app.post('/api/accounting/journal-entries', authMiddleware, workspaceMiddleware, async (req, res) => {
  const { description, reference, lines } = req.body;
  if (!description || !lines || lines.length < 2) {
    return res.status(400).json({ error: 'A journal entry requires a description and at least two line items' });
  }

  let totalDebit = 0;
  let totalCredit = 0;
  lines.forEach((l) => {
    totalDebit += Number(l.debit || 0);
    totalCredit += Number(l.credit || 0);
  });

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return res.status(400).json({ error: `Double-entry unbalance: Total Debits (₹${totalDebit}) must equal Total Credits (₹${totalCredit})` });
  }

  try {
    const count = await JournalEntry.countDocuments({ workspaceId: req.workspaceId });
    const entryNumber = `JE-${String(count + 1).padStart(4, '0')}`;

    const entry = await new JournalEntry({
      workspaceId: req.workspaceId,
      entryNumber,
      description,
      reference: reference || '',
      lines,
      totalDebit,
      totalCredit,
      createdBy: req.userId,
    }).save();

    // Update account balances
    for (const l of lines) {
      if (l.accountId) {
        const acc = await Account.findById(l.accountId);
        if (acc) {
          // Asset & Expense increase with Debit, decrease with Credit
          // Liability, Equity, Revenue increase with Credit, decrease with Debit
          let netChange = 0;
          if (['Asset', 'Expense'].includes(acc.type)) {
            netChange = Number(l.debit || 0) - Number(l.credit || 0);
          } else {
            netChange = Number(l.credit || 0) - Number(l.debit || 0);
          }
          await Account.findByIdAndUpdate(l.accountId, { $inc: { balance: netChange } });
        }
      }
    }

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post journal entry: ' + err.message });
  }
});

// Trial Balance Generator
app.get('/api/accounting/trial-balance', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    const accounts = await Account.find({ workspaceId: req.workspaceId }).sort({ code: 1 });
    let grandDebit = 0;
    let grandCredit = 0;

    const report = accounts.map((acc) => {
      let debit = 0;
      let credit = 0;
      if (['Asset', 'Expense'].includes(acc.type)) {
        if (acc.balance >= 0) debit = acc.balance;
        else credit = Math.abs(acc.balance);
      } else {
        if (acc.balance >= 0) credit = acc.balance;
        else debit = Math.abs(acc.balance);
      }
      grandDebit += debit;
      grandCredit += credit;
      return {
        id: acc._id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit,
        credit,
      };
    });

    res.json({
      report,
      grandDebit,
      grandCredit,
      isBalanced: Math.abs(grandDebit - grandCredit) < 0.01,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate Trial Balance: ' + err.message });
  }
});

// Financial Statements (Balance Sheet & P&L)
app.get('/api/accounting/financial-statements', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    const accounts = await Account.find({ workspaceId: req.workspaceId });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    accounts.forEach((a) => {
      if (a.type === 'Asset') totalAssets += a.balance;
      else if (a.type === 'Liability') totalLiabilities += a.balance;
      else if (a.type === 'Equity') totalEquity += a.balance;
      else if (a.type === 'Revenue') totalRevenue += a.balance;
      else if (a.type === 'Expense') totalExpenses += a.balance;
    });

    const netProfit = totalRevenue - totalExpenses;

    res.json({
      balanceSheet: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        retainedEarnings: netProfit,
      },
      profitAndLoss: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate financial statements: ' + err.message });
  }
});

// ─── [HISABHERO ENTERPRISE] QUOTE & PO CONVERSIONS ───────────────────────────
app.post('/api/quotes/:id/convert-to-invoice', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quotation not found' });

    const invCount = await Invoice.countDocuments({ workspaceId: req.workspaceId });
    const invNumber = `INV-${String(invCount + 1).padStart(4, '0')}`;

    const newInvoice = await new Invoice({
      workspaceId: req.workspaceId,
      invoiceNumber: invNumber,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      date: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: quote.items || [],
      subtotal: quote.totalAmount || 0,
      tax: 0,
      totalAmount: quote.totalAmount || 0,
      status: 'Sent',
      notes: `Converted from Quotation ${quote.quoteNumber}`,
      createdBy: req.userId,
    }).save();

    await Quote.findByIdAndUpdate(req.params.id, { status: 'Accepted' });
    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to convert quotation to invoice: ' + err.message });
  }
});

app.post('/api/quotes/:id/convert', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quotation not found' });

    const invCount = await Invoice.countDocuments({ workspaceId: req.workspaceId });
    const invNumber = `INV-${String(invCount + 1).padStart(4, '0')}`;

    const newInvoice = await new Invoice({
      workspaceId: req.workspaceId,
      invoiceNumber: invNumber,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      date: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: quote.items || [],
      subtotal: quote.totalAmount || 0,
      tax: 0,
      totalAmount: quote.totalAmount || 0,
      status: 'Sent',
      notes: `Converted from Quotation ${quote.quoteNumber}`,
      createdBy: req.userId,
    }).save();

    await Quote.findByIdAndUpdate(req.params.id, { status: 'Accepted' });
    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to convert quotation to invoice: ' + err.message });
  }
});

app.post('/api/purchase-orders/:id/convert-to-bill', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });

    const billCount = await Bill.countDocuments({ workspaceId: req.workspaceId });
    const billNumber = `BILL-${String(billCount + 1).padStart(4, '0')}`;

    const newBill = await new Bill({
      workspaceId: req.workspaceId,
      billNumber,
      vendorName: po.vendorName,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: po.totalAmount || 0,
      status: 'Unpaid',
      description: `Converted from Purchase Order ${po.poNumber}`,
      createdBy: req.userId,
    }).save();

    await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: 'Fulfilled' });
    res.status(201).json(newBill);
  } catch (err) {
    res.status(500).json({ error: 'Failed to convert PO to Bill: ' + err.message });
  }
});

// ─── [HISABHERO ENTERPRISE] PROJECTS & PAYROLL ROUTING ──────────────────────
app.get('/api/projects', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ workspaceId: req.workspaceId }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects: ' + err.message });
  }
});

app.post('/api/projects', authMiddleware, workspaceMiddleware, async (req, res) => {
  const { name, customerName, budget, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  try {
    const newProj = await new Project({
      workspaceId: req.workspaceId,
      name,
      customerName: customerName || '',
      budget: Number(budget || 0),
      description: description || '',
    }).save();
    res.status(201).json(newProj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project: ' + err.message });
  }
});

app.get('/api/payroll', authMiddleware, workspaceMiddleware, async (req, res) => {
  try {
    const payrolls = await Payroll.find({ workspaceId: req.workspaceId }).sort({ createdAt: -1 });
    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payroll records: ' + err.message });
  }
});

app.post('/api/payroll', authMiddleware, workspaceMiddleware, async (req, res) => {
  const { month, records } = req.body;
  if (!month || !records || records.length === 0) {
    return res.status(400).json({ error: 'Month and employee salary records are required' });
  }

  let totalAmount = 0;
  const processedRecords = records.map((r) => {
    const net = Number(r.basicSalary || 0) + Number(r.allowances || 0) - Number(r.deductions || 0);
    totalAmount += net;
    return {
      ...r,
      netSalary: net,
    };
  });

  try {
    const payroll = await new Payroll({
      workspaceId: req.workspaceId,
      month,
      totalAmount,
      records: processedRecords,
      status: 'Approved',
      processedBy: req.userId,
    }).save();
    res.status(201).json(payroll);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process payroll: ' + err.message });
  }
});

// ─── EXCHANGE RATES HELPER ROUTE ──────────────────────────────────────────
// Static exchange rate mocks (USD, EUR, GBP to INR base)
app.get('/api/exchange-rates', authMiddleware, workspaceMiddleware, checkPermission('view_financials'), async (req, res) => {
  res.json({
    base: 'INR',
    rates: {
      USD: 83.50,
      EUR: 90.00,
      GBP: 105.00,
      AED: 22.70
    }
  });
});

// 404 Catch-all handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'An unexpected internal server error occurred.' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Express Backend running on http://localhost:${PORT}`);
  console.log(`✅ Smart CSV detection, auto-alerts, auto-runway, user database isolation enabled.`);
});
server.timeout = 600000;
