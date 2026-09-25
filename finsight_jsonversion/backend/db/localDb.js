import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BUNDLED_DATA_DIR = path.join(__dirname, '../data');
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'hisabhero_data')
  : BUNDLED_DATA_DIR;
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (process.env.VERCEL && !fs.existsSync(DB_FILE)) {
    const bundledFile = path.join(BUNDLED_DATA_DIR, 'local_db.json');
    if (fs.existsSync(bundledFile)) {
      fs.copyFileSync(bundledFile, DB_FILE);
    }
  }
} catch (e) {
  console.warn('[LocalDB] Directory initialization note:', e.message);
}

function generateUUID() {
  return crypto.randomUUID();
}

const DEFAULT_USER_ID = '6a982bb9-0fad-4fc4-b3e2-199100000001';
const DEFAULT_WS_ID = '6a982bb9-0fad-4fc4-b3e2-199100000002';

const defaultData = {
  users: [
    {
      id: DEFAULT_USER_ID,
      _id: DEFAULT_USER_ID,
      email: 'selvathevar10042005@gmail.com',
      full_name: 'Selva',
      fullName: 'Selva',
      password: '210000:4fb5f49e59b13bcb5ff5b5a022502192:f329cbd51d2571aff4673e9b8e0e6822d5cb6aaa2bf5e78d8988d0a37a91ae60763fdd2713009d3ef6d19f1ec71ee82ae95bef09a35fdd6bdd5c0d3d8fe892ff',
      passwordHash: '210000:4fb5f49e59b13bcb5ff5b5a022502192:f329cbd51d2571aff4673e9b8e0e6822d5cb6aaa2bf5e78d8988d0a37a91ae60763fdd2713009d3ef6d19f1ec71ee82ae95bef09a35fdd6bdd5c0d3d8fe892ff',
      role: 'owner',
      account_type: 'personal',
      accountType: 'personal',
      is_verified: true,
      isVerified: true,
      auth_providers: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  workspaces: [
    {
      id: DEFAULT_WS_ID,
      _id: DEFAULT_WS_ID,
      name: "Selva's Personal Finance",
      type: 'personal',
      owner_id: DEFAULT_USER_ID,
      ownerId: DEFAULT_USER_ID,
      currency: 'INR',
      join_code: 'HERO-WS-SELVA1',
      joinCode: 'HERO-WS-SELVA1',
      cash_balance: 0,
      cashBalance: 0,
      settings: { currency: 'INR', currencySymbol: '₹', startingBalance: 0 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  transactions: [],
  uploaded_documents: [],
  invoices: [],
  khata_ledgers: [],
  device_sessions: [],
  otp_verifications: [],
  merchant_mappings: [],
  inventory_items: [],
  subscriptions: []
};

let db = { ...defaultData };

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      db = { ...defaultData, ...JSON.parse(raw) };
    } else {
      saveDb();
    }
  } catch (e) {
    console.warn('[LocalDB] Load warning:', e.message);
    db = { ...defaultData };
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('[LocalDB] Save error:', e.message);
  }
}

// Initial load
loadDb();

export const localDb = {
  get data() {
    return db;
  },
  save: saveDb,
  generateId: generateUUID,

  // Users
  findUserByEmail(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    return db.users.find(u => u.email?.toLowerCase() === clean) || null;
  },

  findUserById(id) {
    if (!id) return null;
    return db.users.find(u => u.id === id || u._id === id) || null;
  },

  createUser(userData) {
    const id = generateUUID();
    const clean = userData.email.trim().toLowerCase();
    const newUser = {
      id,
      _id: id,
      email: clean,
      full_name: userData.fullName,
      fullName: userData.fullName,
      password: userData.password,
      passwordHash: userData.password,
      role: userData.role || 'owner',
      account_type: userData.accountType || 'personal',
      accountType: userData.accountType || 'personal',
      is_verified: userData.isVerified ?? true,
      isVerified: userData.isVerified ?? true,
      auth_providers: userData.authProviders || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.users.push(newUser);

    // Auto-create default personal workspace
    const wsId = generateUUID();
    db.workspaces.push({
      id: wsId,
      _id: wsId,
      name: `${userData.fullName}'s Personal Workspace`,
      type: 'personal',
      owner_id: id,
      ownerId: id,
      currency: 'INR',
      join_code: `HERO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      joinCode: `HERO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      cash_balance: 0,
      cashBalance: 0,
      settings: { currency: 'INR', currencySymbol: '₹' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    saveDb();
    return newUser;
  },

  updateUser(id, updates) {
    const user = db.users.find(u => u.id === id || u._id === id);
    if (!user) return null;
    if (updates.fullName !== undefined) {
      user.fullName = updates.fullName;
      user.full_name = updates.fullName;
    }
    if (updates.password !== undefined) {
      user.password = updates.password;
      user.passwordHash = updates.password;
    }
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.isVerified !== undefined) {
      user.isVerified = updates.isVerified;
      user.is_verified = updates.isVerified;
    }
    user.updated_at = new Date().toISOString();
    saveDb();
    return user;
  },

  // Workspaces
  findWorkspaceById(id) {
    if (!id) return null;
    if (id === 'personal' || id === 'default') {
      return db.workspaces[0] || null;
    }
    return db.workspaces.find(w => w.id === id || w._id === id) || db.workspaces[0] || null;
  },

  findWorkspacesByOwner(ownerId) {
    if (!ownerId) return [];
    return db.workspaces.filter(w => w.owner_id === ownerId || w.ownerId === ownerId);
  },

  createWorkspace(wsData) {
    const id = generateUUID();
    const newWs = {
      id,
      _id: id,
      name: wsData.name || 'New Workspace',
      type: wsData.type || 'personal',
      owner_id: wsData.ownerId,
      ownerId: wsData.ownerId,
      business_name: wsData.businessName || null,
      industry: wsData.industry || null,
      currency: wsData.currency || 'INR',
      join_code: wsData.joinCode || `HERO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      joinCode: wsData.joinCode || `HERO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      cash_balance: 0,
      cashBalance: 0,
      settings: { currency: 'INR', currencySymbol: '₹' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.workspaces.push(newWs);
    saveDb();
    return newWs;
  },

  resetWorkspaceData(workspaceId) {
    db.transactions = db.transactions.filter(t => t.workspace_id !== workspaceId && t.workspaceId !== workspaceId);
    db.uploaded_documents = db.uploaded_documents.filter(d => d.workspace_id !== workspaceId && d.workspaceId !== workspaceId);
    saveDb();
    return true;
  },

  // Transactions
  listTransactions(workspaceId, filters = {}) {
    let list = db.transactions.filter(t => {
      if (!workspaceId || workspaceId === 'personal') return true;
      return t.workspace_id === workspaceId || t.workspaceId === workspaceId;
    });

    if (filters.category && filters.category !== 'all') {
      list = list.filter(t => t.category?.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.type && filters.type !== 'all') {
      list = list.filter(t => t.type?.toLowerCase() === filters.type.toLowerCase());
    }

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  },

  createTransaction(txData) {
    const id = generateUUID();
    const newTx = {
      id,
      _id: id,
      workspace_id: txData.workspaceId,
      workspaceId: txData.workspaceId,
      user_id: txData.userId,
      userId: txData.userId,
      description: txData.description,
      amount: Number(txData.amount || 0),
      type: txData.type,
      category: txData.category || 'General',
      date: txData.date || new Date().toISOString().split('T')[0],
      merchant: txData.merchant || null,
      payment_method: txData.paymentMethod || 'UPI',
      source: txData.source || 'Manual',
      created_at: new Date().toISOString()
    };
    db.transactions.push(newTx);
    saveDb();
    return newTx;
  },

  createTransactionsBatch(txList) {
    const created = [];
    for (const tx of txList) {
      const id = generateUUID();
      const newTx = {
        id,
        _id: id,
        workspace_id: tx.workspaceId,
        workspaceId: tx.workspaceId,
        user_id: tx.userId,
        userId: tx.userId,
        description: tx.description,
        amount: Number(tx.amount || 0),
        type: tx.type,
        category: tx.category || 'General',
        date: tx.date || new Date().toISOString().split('T')[0],
        merchant: tx.merchant || null,
        payment_method: tx.paymentMethod || 'Statement Parser',
        source: tx.source || 'Statement Parser',
        created_at: new Date().toISOString()
      };
      db.transactions.push(newTx);
      created.push(newTx);
    }
    saveDb();
    return created;
  },

  deleteTransaction(id) {
    db.transactions = db.transactions.filter(t => t.id !== id && t._id !== id);
    saveDb();
    return true;
  },

  // Documents
  listDocuments(workspaceId) {
    return db.uploaded_documents
      .filter(d => !workspaceId || workspaceId === 'personal' || d.workspace_id === workspaceId || d.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  findDocumentById(id) {
    return db.uploaded_documents.find(d => d.id === id || d._id === id) || null;
  },

  createDocument(docData) {
    const id = generateUUID();
    const newDoc = {
      id,
      _id: id,
      workspace_id: docData.workspaceId,
      workspaceId: docData.workspaceId,
      file_name: docData.fileName,
      fileName: docData.fileName,
      parser_used: docData.parserUsed,
      parserUsed: docData.parserUsed,
      summary: docData.summary || {},
      extracted_transactions: docData.extractedTransactions || [],
      extractedTransactions: docData.extractedTransactions || [],
      created_at: new Date().toISOString()
    };
    db.uploaded_documents.push(newDoc);
    saveDb();
    return newDoc;
  },

  deleteDocument(id) {
    const doc = db.uploaded_documents.find(d => d.id === id || d._id === id);
    if (doc) {
      const wsId = doc.workspace_id || doc.workspaceId;
      const extracted = doc.extracted_transactions || doc.extractedTransactions || [];
      if (Array.isArray(extracted)) {
        const dates = extracted.map(e => e.date).filter(Boolean);
        db.transactions = db.transactions.filter(t => !(t.workspaceId === wsId && dates.includes(t.date)));
      }
    }
    db.uploaded_documents = db.uploaded_documents.filter(d => d.id !== id && d._id !== id);
    saveDb();
    return true;
  },

  // Invoices & Khata
  listInvoices(workspaceId) {
    return db.invoices.filter(i => !workspaceId || i.workspace_id === workspaceId || i.workspaceId === workspaceId);
  },

  createInvoice(invData) {
    const id = generateUUID();
    const newInv = { id, _id: id, ...invData, created_at: new Date().toISOString() };
    db.invoices.push(newInv);
    saveDb();
    return newInv;
  },

  listKhata(workspaceId) {
    return db.khata_ledgers.filter(k => !workspaceId || k.workspace_id === workspaceId || k.workspaceId === workspaceId);
  },

  createKhata(khataData) {
    const id = generateUUID();
    const newK = { id, _id: id, ...khataData, created_at: new Date().toISOString() };
    db.khata_ledgers.push(newK);
    saveDb();
    return newK;
  },

  // Sessions
  listSessions(userId) {
    return db.device_sessions.filter(s => s.user_id === userId || s.userId === userId);
  },

  upsertSession(arg1, arg2) {
    const userId = typeof arg1 === 'object' ? (arg1.userId || arg1.user_id) : arg1;
    const dev = typeof arg1 === 'object' ? arg1 : (arg2 || {});
    const devId = dev.deviceId || dev.device_id || 'web_default';

    let sess = db.device_sessions.find(s => (s.user_id === userId || s.userId === userId) && s.device_id === devId);
    if (sess) {
      sess.last_active = new Date().toISOString();
      if (dev.deviceName) sess.device_name = dev.deviceName;
      if (dev.platform) sess.platform = dev.platform;
    } else {
      sess = {
        id: generateUUID(),
        user_id: userId,
        device_id: devId,
        device_name: dev.deviceName || 'Web Client',
        platform: dev.platform || 'Web',
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      db.device_sessions.push(sess);
    }
    saveDb();
    return sess;
  },

  revokeSession(sessionId) {
    db.device_sessions = db.device_sessions.filter(s => s.id !== sessionId);
    saveDb();
    return true;
  },

  // OTP
  storeOtp(email, otpCode, purpose, expiresAt) {
    const clean = email.trim().toLowerCase();
    db.otp_verifications = db.otp_verifications.filter(o => o.email !== clean);
    db.otp_verifications.push({
      id: generateUUID(),
      email: clean,
      otp_code: String(otpCode),
      purpose,
      is_verified: false,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    });
    saveDb();
  },

  verifyOtp(email, otpCode, purpose) {
    const clean = email.trim().toLowerCase();
    const entry = db.otp_verifications.find(o => o.email === clean && o.otp_code === String(otpCode));
    if (!entry) return false;
    entry.is_verified = true;
    saveDb();
    return true;
  },

  // Merchant Mappings
  getMerchantMappings(workspaceId) {
    return db.merchant_mappings.filter(m => !workspaceId || m.workspace_id === workspaceId);
  },

  saveMerchantMapping({ workspaceId, rawPattern, cleanMerchant, category, confidence = 0.95 }) {
    const existing = db.merchant_mappings.find(m => m.raw_pattern === rawPattern && m.workspace_id === workspaceId);
    if (existing) {
      existing.clean_merchant = cleanMerchant;
      existing.category = category;
      existing.confidence = confidence;
    } else {
      db.merchant_mappings.push({
        id: generateUUID(),
        workspace_id: workspaceId || null,
        raw_pattern: rawPattern,
        clean_merchant: cleanMerchant,
        category,
        confidence,
        created_at: new Date().toISOString()
      });
    }
    saveDb();
  },

  // Khata Ledgers
  listKhata(workspaceId) {
    db.khata_ledgers = db.khata_ledgers || [];
    return db.khata_ledgers.filter(k => !workspaceId || k.workspace_id === workspaceId || k.workspaceId === workspaceId);
  },

  createKhataParty(partyData) {
    db.khata_ledgers = db.khata_ledgers || [];
    const id = generateUUID();
    const newParty = {
      id,
      _id: id,
      workspace_id: partyData.workspaceId || partyData.workspace_id,
      workspaceId: partyData.workspaceId || partyData.workspace_id,
      party_name: partyData.partyName || partyData.party_name,
      partyName: partyData.partyName || partyData.party_name,
      party_type: partyData.partyType || partyData.party_type || 'customer',
      partyType: partyData.partyType || partyData.party_type || 'customer',
      phone: partyData.phone || '',
      email: partyData.email || '',
      net_balance: Number(partyData.netBalance || partyData.net_balance || 0),
      netBalance: Number(partyData.netBalance || partyData.net_balance || 0),
      currency: partyData.currency || 'INR',
      notes: partyData.notes || partyData.note || '',
      entries: partyData.entries || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.khata_ledgers.push(newParty);
    saveDb();
    return newParty;
  },

  deleteKhataParty(partyId) {
    db.khata_ledgers = (db.khata_ledgers || []).filter(k => k.id !== partyId && k._id !== partyId);
    saveDb();
    return true;
  },

  // Inventory & Fixed Assets
  listInventory(workspaceId) {
    db.inventory_items = db.inventory_items || [];
    return db.inventory_items.filter(i => !workspaceId || i.workspace_id === workspaceId || i.workspaceId === workspaceId);
  },

  createInventoryItem(itemData) {
    db.inventory_items = db.inventory_items || [];
    const id = generateUUID();
    const newItem = {
      id,
      _id: id,
      workspace_id: itemData.workspaceId || itemData.workspace_id,
      workspaceId: itemData.workspaceId || itemData.workspace_id,
      name: itemData.name || 'Unnamed Item',
      type: itemData.type || 'stock', // 'stock' or 'asset'
      sku: itemData.sku || `SKU-${Date.now().toString().slice(-4)}`,
      category: itemData.category || 'General',
      stock_quantity: Number(itemData.stockQuantity || itemData.stock_quantity || itemData.stockQty || 0),
      stockQuantity: Number(itemData.stockQuantity || itemData.stock_quantity || itemData.stockQty || 0),
      unit_value: Number(itemData.unitValue || itemData.unit_value || itemData.purchasePrice || 0),
      unitValue: Number(itemData.unitValue || itemData.unit_value || itemData.purchasePrice || 0),
      reorder_level: Number(itemData.reorderLevel || itemData.reorder_level || 5),
      useful_life: Number(itemData.usefulLife || itemData.useful_life || 5), // in years for fixed asset
      usefulLife: Number(itemData.usefulLife || itemData.useful_life || 5),
      depreciation_method: itemData.depreciationMethod || 'straight_line',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.inventory_items.push(newItem);
    saveDb();
    return newItem;
  },

  deleteInventoryItem(itemId) {
    db.inventory_items = (db.inventory_items || []).filter(i => i.id !== itemId && i._id !== itemId);
    saveDb();
    return true;
  },

  // Subscriptions
  listSubscriptions(workspaceId) {
    db.subscriptions = db.subscriptions || [];
    return db.subscriptions.filter(s => !workspaceId || s.workspace_id === workspaceId || s.workspaceId === workspaceId);
  },

  createSubscription(subData) {
    db.subscriptions = db.subscriptions || [];
    const id = generateUUID();
    const newSub = {
      id,
      _id: id,
      workspace_id: subData.workspaceId || subData.workspace_id,
      workspaceId: subData.workspaceId || subData.workspace_id,
      name: subData.name || 'Unnamed Subscription',
      category: subData.category || 'Software & SaaS',
      amount: Number(subData.amount || subData.cost || 0),
      billing_cycle: subData.billingCycle || subData.billing_cycle || 'monthly',
      billingCycle: subData.billingCycle || subData.billing_cycle || 'monthly',
      next_billing_date: subData.nextBillingDate || subData.next_billing_date || new Date().toISOString().split('T')[0],
      nextBillingDate: subData.nextBillingDate || subData.next_billing_date || new Date().toISOString().split('T')[0],
      status: subData.status || 'active',
      notes: subData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.subscriptions.push(newSub);
    saveDb();
    return newSub;
  },

  deleteSubscription(subId) {
    db.subscriptions = (db.subscriptions || []).filter(s => s.id !== subId && s._id !== subId);
    saveDb();
    return true;
  }
};
