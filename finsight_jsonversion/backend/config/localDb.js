import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_PATH = path.join(__dirname, '..', 'local_db.json');

async function readLocalDb() {
  try {
    const data = await fs.readFile(LOCAL_DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      users: parsed.users || [],
      transactions: parsed.transactions || [],
      uploads: parsed.uploads || [],
      businesses: parsed.businesses || [],
      members: parsed.members || [],
      invitations: parsed.invitations || [],
      auditLogs: parsed.auditLogs || [],
      contacts: parsed.contacts || [],
      invoices: parsed.invoices || [],
      quotes: parsed.quotes || [],
      bills: parsed.bills || [],
      bankTransactions: parsed.bankTransactions || [],
      inventoryItems: parsed.inventoryItems || [],
      purchaseOrders: parsed.purchaseOrders || [],
      fixedAssets: parsed.fixedAssets || [],
    };
  } catch (err) {
    return { 
      users: [], 
      transactions: [], 
      uploads: [], 
      businesses: [], 
      members: [], 
      invitations: [], 
      auditLogs: [], 
      contacts: [], 
      invoices: [], 
      quotes: [], 
      bills: [],
      bankTransactions: [],
      inventoryItems: [],
      purchaseOrders: [],
      fixedAssets: []
    };
  }
}

async function writeLocalDb(db) {
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export const LocalUser = {
  findOne: async (query) => {
    const db = await readLocalDb();
    if (query.email && query.password) {
      const user = db.users.find(u => u.email === query.email && u.password === query.password);
      return user ? { ...user, toObject: () => user } : null;
    }
    if (query.email) {
      const user = db.users.find(u => u.email === query.email);
      return user ? { ...user, toObject: () => user } : null;
    }
    if (query._id) {
      const user = db.users.find(u => u._id === query._id);
      return user ? { ...user, toObject: () => user } : null;
    }
    return null;
  },
  find: async (query) => {
    const db = await readLocalDb();
    return db.users;
  },
  deleteOne: async (query) => {
    const db = await readLocalDb();
    const beforeLen = db.users.length;
    db.users = db.users.filter(u => u._id !== query._id);
    await writeLocalDb(db);
    return { deletedCount: beforeLen - db.users.length };
  },
  createAndSave: async (userData) => {
    const db = await readLocalDb();
    const newUser = { 
      _id: 'mock-user-' + Date.now(), 
      isVerified: false,
      ...userData 
    };
    db.users.push(newUser);
    await writeLocalDb(db);
    return { ...newUser, toObject: () => newUser };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.users.findIndex(u => u._id === query._id || u.email === query.email);
    if (idx === -1) return null;
    db.users[idx] = { 
      ...db.users[idx], 
      ...update 
    };
    await writeLocalDb(db);
    return { ...db.users[idx], toObject: () => db.users[idx] };
  }
};

export const LocalBusiness = {
  find: async (query) => {
    const db = await readLocalDb();
    let results = db.businesses;
    if (query._id && Array.isArray(query._id.$in)) {
      results = db.businesses.filter(b => query._id.$in.includes(b._id));
    }
    return {
      lean: () => results,
      map: (fn) => results.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    const bus = db.businesses.find(b => b._id === query._id);
    return bus ? { ...bus, toObject: () => bus } : null;
  },
  createAndSave: async (busData) => {
    const db = await readLocalDb();
    const newBus = { 
      _id: 'mock-business-' + Date.now(), 
      budgets: {}, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString(), 
      ...busData 
    };
    db.businesses.push(newBus);
    await writeLocalDb(db);
    return { ...newBus, toObject: () => newBus };
  },
  findByIdAndUpdate: async (id, update, options) => {
    const db = await readLocalDb();
    const idx = db.businesses.findIndex(b => b._id === id);
    if (idx === -1) return null;
    
    const updated = { 
      ...db.businesses[idx], 
      ...update, 
      updatedAt: new Date().toISOString() 
    };
    
    db.businesses[idx] = updated;
    await writeLocalDb(db);
    return { ...updated, toObject: () => updated };
  },
  deleteOne: async (query) => {
    const db = await readLocalDb();
    const initialLen = db.businesses.length;
    db.businesses = db.businesses.filter(b => b._id !== query._id);
    await writeLocalDb(db);
    return { deletedCount: initialLen - db.businesses.length };
  }
};

export const LocalBusinessMember = {
  find: async (query) => {
    const db = await readLocalDb();
    let results = db.members;
    if (query.businessId) {
      results = results.filter(m => m.businessId === query.businessId);
    }
    if (query.userId) {
      results = results.filter(m => m.userId === query.userId);
    }
    if (query.status) {
      results = results.filter(m => m.status === query.status);
    }
    return {
      lean: () => results,
      map: (fn) => results.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    const mem = db.members.find(m => {
      const matchBus = !query.businessId || m.businessId === query.businessId;
      const matchUser = !query.userId || m.userId === query.userId;
      const matchStatus = !query.status || m.status === query.status;
      const matchId = !query._id || m._id === query._id;
      return matchBus && matchUser && matchStatus && matchId;
    });
    return mem ? { ...mem, toObject: () => mem } : null;
  },
  createAndSave: async (memData) => {
    const db = await readLocalDb();
    const newMem = { 
      _id: 'mock-member-' + Date.now(), 
      joinedAt: new Date().toISOString(), 
      status: 'active', 
      ...memData 
    };
    db.members.push(newMem);
    await writeLocalDb(db);
    return { ...newMem, toObject: () => newMem };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.members.findIndex(m => {
      const matchBus = !query.businessId || m.businessId === query.businessId;
      const matchUser = !query.userId || m.userId === query.userId;
      const matchId = !query._id || m._id === query._id;
      return matchBus && matchUser && matchId;
    });
    if (idx === -1) return null;
    db.members[idx] = { ...db.members[idx], ...update };
    await writeLocalDb(db);
    return { ...db.members[idx], toObject: () => db.members[idx] };
  },
  deleteOne: async (query) => {
    const db = await readLocalDb();
    const initialLen = db.members.length;
    db.members = db.members.filter(m => !(m._id === query._id || (query.businessId && m.businessId === query.businessId && query.userId && m.userId === query.userId)));
    await writeLocalDb(db);
    return { deletedCount: initialLen - db.members.length };
  },
  deleteMany: async (query) => {
    const db = await readLocalDb();
    const initialLen = db.members.length;
    db.members = db.members.filter(m => m.businessId !== query.businessId);
    await writeLocalDb(db);
    return { deletedCount: initialLen - db.members.length };
  }
};

export const LocalInvitation = {
  find: async (query) => {
    const db = await readLocalDb();
    let results = db.invitations;
    if (query.businessId) {
      results = results.filter(i => i.businessId === query.businessId);
    }
    if (query.invitedEmail) {
      results = results.filter(i => i.invitedEmail.toLowerCase() === query.invitedEmail.toLowerCase());
    }
    if (query.status) {
      results = results.filter(i => i.status === query.status);
    }
    return {
      lean: () => results,
      map: (fn) => results.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    const inv = db.invitations.find(i => {
      const matchId = !query._id || i._id === query._id;
      const matchToken = !query.token || i.token === query.token;
      const matchEmail = !query.invitedEmail || i.invitedEmail.toLowerCase() === query.invitedEmail.toLowerCase();
      const matchBus = !query.businessId || i.businessId === query.businessId;
      const matchStatus = !query.status || i.status === query.status;
      return matchId && matchToken && matchEmail && matchBus && matchStatus;
    });
    return inv ? { ...inv, toObject: () => inv } : null;
  },
  createAndSave: async (invData) => {
    const db = await readLocalDb();
    const newInv = { 
      _id: 'mock-invitation-' + Date.now(), 
      status: 'pending', 
      createdAt: new Date().toISOString(), 
      ...invData 
    };
    db.invitations.push(newInv);
    await writeLocalDb(db);
    return { ...newInv, toObject: () => newInv };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.invitations.findIndex(i => i._id === query._id || i.token === query.token);
    if (idx === -1) return null;
    db.invitations[idx] = { ...db.invitations[idx], ...update };
    await writeLocalDb(db);
    return { ...db.invitations[idx], toObject: () => db.invitations[idx] };
  },
  deleteMany: async (query) => {
    const db = await readLocalDb();
    const initialLen = db.invitations.length;
    if (query.businessId) {
      db.invitations = db.invitations.filter(i => i.businessId !== query.businessId);
    } else {
      db.invitations = db.invitations.filter(i => !i.invitedEmail.includes('test_'));
    }
    await writeLocalDb(db);
    return { deletedCount: initialLen - db.invitations.length };
  }
};

export const LocalAuditLog = {
  find: async (query) => {
    const db = await readLocalDb();
    let results = db.auditLogs;
    if (query.businessId) {
      results = results.filter(log => log.businessId === query.businessId);
    }
    return {
      lean: () => results,
      map: (fn) => results.map(fn)
    };
  },
  createAndSave: async (logData) => {
    const db = await readLocalDb();
    const newLog = { 
      _id: 'mock-audit-' + Date.now(), 
      timestamp: new Date().toISOString(), 
      ...logData 
    };
    db.auditLogs.push(newLog);
    await writeLocalDb(db);
    return { ...newLog, toObject: () => newLog };
  }
};

export const LocalTransaction = {
  find: async (query) => {
    const db = await readLocalDb();
    let results = db.transactions;
    if (query.businessId) {
      if (query.businessId === 'personal' || query.businessId.$in?.includes(null)) {
        results = results.filter(t => t.userId === query.userId && (!t.businessId || t.businessId === 'personal'));
      } else {
        results = results.filter(t => t.businessId === query.businessId);
      }
    } else if (query.userId) {
      results = results.filter(t => t.userId === query.userId);
    }
    return {
      lean: () => results,
      map: (fn) => results.map(fn)
    };
  },
  createAndSave: async (txData) => {
    const db = await readLocalDb();
    const newTx = { 
      _id: 'mock-tx-' + Date.now(), 
      businessId: txData.businessId || null, 
      createdBy: txData.userId, 
      status: txData.status || 'approved',
      ...txData 
    };
    db.transactions.push(newTx);
    await writeLocalDb(db);
    return { ...newTx, toObject: () => newTx };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.transactions.findIndex(t => t._id === query._id);
    if (idx === -1) return null;
    db.transactions[idx] = { ...db.transactions[idx], ...update };
    await writeLocalDb(db);
    return { ...db.transactions[idx], toObject: () => db.transactions[idx] };
  },
  deleteOne: async (query) => {
    const db = await readLocalDb();
    const initialLen = db.transactions.length;
    db.transactions = db.transactions.filter(t => !(t._id === query._id && (t.userId === query.userId || t.businessId === query.businessId)));
    await writeLocalDb(db);
    return { deletedCount: initialLen - db.transactions.length };
  },
  deleteMany: async (query) => {
    const db = await readLocalDb();
    const initialLen = db.transactions.length;
    if (query.businessId) {
      db.transactions = db.transactions.filter(t => t.businessId !== query.businessId);
    } else {
      db.transactions = db.transactions.filter(t => t.userId !== query.userId);
    }
    await writeLocalDb(db);
    return { deletedCount: initialLen - db.transactions.length };
  }
};

export const LocalUpload = {
  find: async (query) => {
    const db = await readLocalDb();
    let results = db.uploads;
    if (query.businessId) {
      results = results.filter(u => u.businessId === query.businessId);
    } else if (query.userId) {
      results = results.filter(u => u.userId === query.userId);
    }
    return {
      lean: () => results,
      map: (fn) => results.map(fn)
    };
  },
  createAndSave: async (uploadData) => {
    const db = await readLocalDb();
    const newUpload = { 
      _id: 'mock-upload-' + Date.now(), 
      businessId: uploadData.businessId || null,
      ...uploadData 
    };
    db.uploads.push(newUpload);
    await writeLocalDb(db);
    return { ...newUpload, toObject: () => newUpload };
  },
  deleteOne: async (query) => {
    const db = await readLocalDb();
    db.uploads = db.uploads.filter(u => !(u._id === query._id && (u.userId === query.userId || u.businessId === query.businessId)));
    await writeLocalDb(db);
    return { deletedCount: 1 };
  },
  deleteMany: async (query) => {
    const db = await readLocalDb();
    const initialLen = db.uploads.length;
    if (query.businessId) {
      db.uploads = db.uploads.filter(u => u.businessId !== query.businessId);
    } else {
      db.uploads = db.uploads.filter(u => u.userId !== query.userId);
    }
    await writeLocalDb(db);
    return { deletedCount: initialLen - db.uploads.length };
  }
};

export const LocalContact = {
  find: async (query) => {
    const db = await readLocalDb();
    let results = db.contacts;
    if (query.businessId !== undefined) {
      results = results.filter(c => c.businessId === query.businessId);
    }
    if (query.userId !== undefined) {
      results = results.filter(c => c.userId === query.userId);
    }
    if (query.type !== undefined) {
      results = results.filter(c => c.type === query.type);
    }
    return {
      lean: () => results,
      map: (fn) => results.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    if (query._id) {
      return db.contacts.find(c => c._id === query._id) || null;
    }
    return null;
  },
  findById: async (id) => {
    const db = await readLocalDb();
    return db.contacts.find(c => c._id === id) || null;
  },
  createAndSave: async (data) => {
    const db = await readLocalDb();
    const newContact = {
      _id: 'mock-contact-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    db.contacts.push(newContact);
    await writeLocalDb(db);
    return { ...newContact, toObject: () => newContact };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.contacts.findIndex(c => c._id === query._id);
    if (idx === -1) return null;
    db.contacts[idx] = { ...db.contacts[idx], ...update, updatedAt: new Date().toISOString() };
    await writeLocalDb(db);
    return { ...db.contacts[idx], toObject: () => db.contacts[idx] };
  },
  deleteOne: async (query) => {
    const db = await readLocalDb();
    db.contacts = db.contacts.filter(c => c._id !== query._id);
    await writeLocalDb(db);
    return { deletedCount: 1 };
  }
};

export const LocalInvoice = {
  find: async (query) => {
    const db = await readLocalDb();
    let results = db.invoices;
    if (query.businessId !== undefined) {
      results = results.filter(i => i.businessId === query.businessId);
    }
    if (query.customerId !== undefined) {
      results = results.filter(i => i.customerId === query.customerId);
    }
    if (query.createdBy !== undefined) {
      results = results.filter(i => i.createdBy === query.createdBy);
    }
    return {
      lean: () => results,
      map: (fn) => results.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    if (query._id) {
      return db.invoices.find(i => i._id === query._id) || null;
    }
    return null;
  },
  findById: async (id) => {
    const db = await readLocalDb();
    return db.invoices.find(i => i._id === id) || null;
  },
  createAndSave: async (data) => {
    const db = await readLocalDb();
    const newInvoice = {
      _id: 'mock-invoice-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
      ...data
    };
    db.invoices.push(newInvoice);
    await writeLocalDb(db);
    return { ...newInvoice, toObject: () => newInvoice };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.invoices.findIndex(i => i._id === query._id);
    if (idx === -1) return null;
    
    let finalUpdate = { ...update };
    if (update.$push && update.$push.payments) {
      const payments = db.invoices[idx].payments || [];
      payments.push(update.$push.payments);
      finalUpdate = { payments };
    }
    
    db.invoices[idx] = { ...db.invoices[idx], ...finalUpdate, updatedAt: new Date().toISOString() };
    await writeLocalDb(db);
    return { ...db.invoices[idx], toObject: () => db.invoices[idx] };
  },
  deleteOne: async (query) => {
    const db = await readLocalDb();
    db.invoices = db.invoices.filter(i => i._id !== query._id);
    await writeLocalDb(db);
    return { deletedCount: 1 };
  }
};

export const LocalQuote = {
  find: async (query) => {
    const db = await readLocalDb();
    let results = db.quotes;
    if (query.businessId !== undefined) {
      results = results.filter(q => q.businessId === query.businessId);
    }
    if (query.customerId !== undefined) {
      results = results.filter(q => q.customerId === query.customerId);
    }
    return {
      lean: () => results,
      map: (fn) => results.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    if (query._id) {
      return db.quotes.find(q => q._id === query._id) || null;
    }
    return null;
  },
  findById: async (id) => {
    const db = await readLocalDb();
    return db.quotes.find(q => q._id === id) || null;
  },
  createAndSave: async (data) => {
    const db = await readLocalDb();
    const newQuote = {
      _id: 'mock-quote-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    db.quotes.push(newQuote);
    await writeLocalDb(db);
    return { ...newQuote, toObject: () => newQuote };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.quotes.findIndex(q => q._id === query._id);
    if (idx === -1) return null;
    db.quotes[idx] = { ...db.quotes[idx], ...update, updatedAt: new Date().toISOString() };
    await writeLocalDb(db);
    return { ...db.quotes[idx], toObject: () => db.quotes[idx] };
  },
  deleteOne: async (query) => {
    const db = await readLocalDb();
    db.quotes = db.quotes.filter(q => q._id !== query._id);
    await writeLocalDb(db);
    return { deletedCount: 1 };
  }
};

export const LocalBill = {
  find: async (query) => {
    const db = await readLocalDb();
    let results = db.bills;
    if (query.businessId !== undefined) {
      results = results.filter(b => b.businessId === query.businessId);
    }
    if (query.supplierId !== undefined) {
      results = results.filter(b => b.supplierId === query.supplierId);
    }
    return {
      lean: () => results,
      map: (fn) => results.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    if (query._id) {
      return db.bills.find(b => b._id === query._id) || null;
    }
    return null;
  },
  findById: async (id) => {
    const db = await readLocalDb();
    return db.bills.find(b => b._id === id) || null;
  },
  createAndSave: async (data) => {
    const db = await readLocalDb();
    const newBill = {
      _id: 'mock-bill-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
      ...data
    };
    db.bills.push(newBill);
    await writeLocalDb(db);
    return { ...newBill, toObject: () => newBill };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.bills.findIndex(b => b._id === query._id);
    if (idx === -1) return null;
    
    let finalUpdate = { ...update };
    if (update.$push && update.$push.payments) {
      const payments = db.bills[idx].payments || [];
      payments.push(update.$push.payments);
      finalUpdate = { payments };
    }

    db.bills[idx] = { ...db.bills[idx], ...finalUpdate, updatedAt: new Date().toISOString() };
    await writeLocalDb(db);
    return { ...db.bills[idx], toObject: () => db.bills[idx] };
  },
  deleteOne: async (query) => {
    const db = await readLocalDb();
    db.bills = db.bills.filter(b => b._id !== query._id);
    await writeLocalDb(db);
    return { deletedCount: 1 };
  }
};

export const LocalBankTransaction = {
  find: async (query) => {
    const db = await readLocalDb();
    let res = db.bankTransactions || [];
    if (query.businessId !== undefined) {
      res = res.filter(t => t.businessId === query.businessId);
    }
    if (query.userId !== undefined) {
      res = res.filter(t => t.userId === query.userId);
    }
    if (query.status !== undefined) {
      res = res.filter(t => t.status === query.status);
    }
    return {
      lean: () => res,
      map: (fn) => res.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    if (query._id) {
      return db.bankTransactions.find(t => t._id === query._id) || null;
    }
    return null;
  },
  findById: async (id) => {
    const db = await readLocalDb();
    return db.bankTransactions.find(t => t._id === id) || null;
  },
  createAndSave: async (data) => {
    const db = await readLocalDb();
    const newTx = {
      _id: 'mock-bank-tx-' + Date.now() + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'unmatched',
      matchedTransactionId: null,
      aiSuggestedCategory: 'Other',
      ...data
    };
    db.bankTransactions.push(newTx);
    await writeLocalDb(db);
    return { ...newTx, toObject: () => newTx };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.bankTransactions.findIndex(t => t._id === query._id);
    if (idx === -1) return null;
    db.bankTransactions[idx] = { 
      ...db.bankTransactions[idx], 
      ...update, 
      updatedAt: new Date().toISOString() 
    };
    await writeLocalDb(db);
    return { ...db.bankTransactions[idx], toObject: () => db.bankTransactions[idx] };
  },
  deleteMany: async (query) => {
    const db = await readLocalDb();
    if (query.businessId) {
      db.bankTransactions = db.bankTransactions.filter(t => t.businessId !== query.businessId);
    } else if (query.userId) {
      db.bankTransactions = db.bankTransactions.filter(t => t.userId !== query.userId);
    }
    await writeLocalDb(db);
    return { deletedCount: 1 };
  }
};

export const LocalInventoryItem = {
  find: async (query) => {
    const db = await readLocalDb();
    let res = db.inventoryItems || [];
    if (query.businessId !== undefined) {
      res = res.filter(x => x.businessId === query.businessId);
    }
    return {
      lean: () => res,
      map: (fn) => res.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    if (query._id) return db.inventoryItems.find(x => x._id === query._id) || null;
    return null;
  },
  findById: async (id) => {
    const db = await readLocalDb();
    return db.inventoryItems.find(x => x._id === id) || null;
  },
  createAndSave: async (data) => {
    const db = await readLocalDb();
    const newItem = {
      _id: 'mock-inventory-' + Date.now() + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stockQuantity: 0,
      reorderLevel: 5,
      ...data
    };
    db.inventoryItems.push(newItem);
    await writeLocalDb(db);
    return { ...newItem, toObject: () => newItem };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.inventoryItems.findIndex(x => x._id === query._id || x.id === query._id);
    if (idx === -1) return null;
    db.inventoryItems[idx] = { 
      ...db.inventoryItems[idx], 
      ...update, 
      updatedAt: new Date().toISOString() 
    };
    await writeLocalDb(db);
    return { ...db.inventoryItems[idx], toObject: () => db.inventoryItems[idx] };
  },
  deleteMany: async (query) => {
    const db = await readLocalDb();
    db.inventoryItems = db.inventoryItems.filter(x => x.businessId !== query.businessId);
    await writeLocalDb(db);
    return { deletedCount: 1 };
  }
};

export const LocalPurchaseOrder = {
  find: async (query) => {
    const db = await readLocalDb();
    let res = db.purchaseOrders || [];
    if (query.businessId !== undefined) {
      res = res.filter(x => x.businessId === query.businessId);
    }
    return {
      lean: () => res,
      map: (fn) => res.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    if (query._id) return db.purchaseOrders.find(x => x._id === query._id) || null;
    return null;
  },
  findById: async (id) => {
    const db = await readLocalDb();
    return db.purchaseOrders.find(x => x._id === id) || null;
  },
  createAndSave: async (data) => {
    const db = await readLocalDb();
    const newPO = {
      _id: 'mock-po-' + Date.now() + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      ...data
    };
    db.purchaseOrders.push(newPO);
    await writeLocalDb(db);
    return { ...newPO, toObject: () => newPO };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.purchaseOrders.findIndex(x => x._id === query._id || x.id === query._id);
    if (idx === -1) return null;
    db.purchaseOrders[idx] = { 
      ...db.purchaseOrders[idx], 
      ...update, 
      updatedAt: new Date().toISOString() 
    };
    await writeLocalDb(db);
    return { ...db.purchaseOrders[idx], toObject: () => db.purchaseOrders[idx] };
  },
  deleteMany: async (query) => {
    const db = await readLocalDb();
    db.purchaseOrders = db.purchaseOrders.filter(x => x.businessId !== query.businessId);
    await writeLocalDb(db);
    return { deletedCount: 1 };
  }
};

export const LocalFixedAsset = {
  find: async (query) => {
    const db = await readLocalDb();
    let res = db.fixedAssets || [];
    if (query.businessId !== undefined) {
      res = res.filter(x => x.businessId === query.businessId);
    }
    return {
      lean: () => res,
      map: (fn) => res.map(fn)
    };
  },
  findOne: async (query) => {
    const db = await readLocalDb();
    if (query._id) return db.fixedAssets.find(x => x._id === query._id) || null;
    return null;
  },
  findById: async (id) => {
    const db = await readLocalDb();
    return db.fixedAssets.find(x => x._id === id) || null;
  },
  createAndSave: async (data) => {
    const db = await readLocalDb();
    const newAsset = {
      _id: 'mock-asset-' + Date.now() + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accumulatedDepreciation: 0,
      ...data
    };
    db.fixedAssets.push(newAsset);
    await writeLocalDb(db);
    return { ...newAsset, toObject: () => newAsset };
  },
  findOneAndUpdate: async (query, update) => {
    const db = await readLocalDb();
    const idx = db.fixedAssets.findIndex(x => x._id === query._id || x.id === query._id);
    if (idx === -1) return null;
    db.fixedAssets[idx] = { 
      ...db.fixedAssets[idx], 
      ...update, 
      updatedAt: new Date().toISOString() 
    };
    await writeLocalDb(db);
    return { ...db.fixedAssets[idx], toObject: () => db.fixedAssets[idx] };
  },
  deleteMany: async (query) => {
    const db = await readLocalDb();
    db.fixedAssets = db.fixedAssets.filter(x => x.businessId !== query.businessId);
    await writeLocalDb(db);
    return { deletedCount: 1 };
  }
};
