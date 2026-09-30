import mongoose from 'mongoose';

let isConnected = false;

const ATLAS_URI = 'mongodb+srv://nebulonhackathon2026:manimau28@hisabhero.kies5xc.mongodb.net/hisabhero?retryWrites=true&w=majority';

export async function getMongoDb() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || ATLAS_URI;
  if (!uri) return null;

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false
      });
    }
    isConnected = true;
    return mongoose.connection.db;
  } catch (err) {
    console.warn('[MongoDB Atlas Connection Warning]', err.message);
    return null;
  }
}

function toObjectId(id) {
  if (!id) return null;
  try {
    if (id instanceof mongoose.Types.ObjectId) return id;
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      return new mongoose.Types.ObjectId(id);
    }
  } catch (e) {}
  return null;
}

// ─── USERS REPOSITORY (ATLAS) ────────────────────────────────────────────────
export const mongoUsersRepo = {
  async findByEmail(email) {
    const db = await getMongoDb();
    if (!db) return null;
    const cleanEmail = email.trim().toLowerCase();
    const doc = await db.collection('users').findOne({ email: cleanEmail });
    if (!doc) return null;
    return {
      _id: String(doc._id),
      id: String(doc._id),
      email: doc.email,
      fullName: doc.fullName || doc.full_name || 'User',
      passwordHash: doc.passwordHash || doc.password,
      role: doc.role || 'owner',
      accountType: doc.accountType || doc.account_type || 'personal',
      isVerified: doc.isVerified ?? doc.is_verified ?? true,
      activeWorkspace: doc.activeWorkspace ? String(doc.activeWorkspace) : null,
      createdAt: doc.createdAt
    };
  },

  async findById(id) {
    const db = await getMongoDb();
    if (!db || !id) return null;
    const objId = toObjectId(id);
    const doc = await db.collection('users').findOne({
      $or: [
        ...(objId ? [{ _id: objId }] : []),
        { _id: String(id) },
        { id: String(id) }
      ]
    });
    if (!doc) return null;
    return {
      _id: String(doc._id),
      id: String(doc._id),
      email: doc.email,
      fullName: doc.fullName || doc.full_name || 'User',
      passwordHash: doc.passwordHash || doc.password,
      role: doc.role || 'owner',
      accountType: doc.accountType || doc.account_type || 'personal',
      isVerified: doc.isVerified ?? doc.is_verified ?? true,
      activeWorkspace: doc.activeWorkspace ? String(doc.activeWorkspace) : null,
      createdAt: doc.createdAt
    };
  },

  async create(userData) {
    const db = await getMongoDb();
    if (!db) return null;
    const cleanEmail = userData.email.trim().toLowerCase();
    const newDoc = {
      fullName: userData.fullName || 'User',
      email: cleanEmail,
      passwordHash: userData.passwordHash || userData.password,
      role: userData.role || 'owner',
      accountType: userData.accountType || 'personal',
      isVerified: userData.isVerified ?? true,
      authProviders: userData.authProviders || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await db.collection('users').insertOne(newDoc);
    const id = String(res.insertedId);
    return {
      _id: id,
      id,
      ...newDoc
    };
  },

  async update(id, updates) {
    const db = await getMongoDb();
    if (!db || !id) return null;
    const objId = toObjectId(id);
    const updateFields = { updatedAt: new Date() };
    if (updates.fullName !== undefined) updateFields.fullName = updates.fullName;
    if (updates.password !== undefined) updateFields.passwordHash = updates.password;
    if (updates.passwordHash !== undefined) updateFields.passwordHash = updates.passwordHash;
    if (updates.role !== undefined) updateFields.role = updates.role;
    if (updates.isVerified !== undefined) updateFields.isVerified = updates.isVerified;
    if (updates.activeWorkspace !== undefined) updateFields.activeWorkspace = updates.activeWorkspace;

    await db.collection('users').updateOne(
      { $or: [...(objId ? [{ _id: objId }] : []), { _id: String(id) }, { id: String(id) }] },
      { $set: updateFields }
    );
    return this.findById(id);
  },

  async delete(id) {
    const db = await getMongoDb();
    if (!db || !id) return false;
    const objId = toObjectId(id);
    const res = await db.collection('users').deleteOne({
      $or: [...(objId ? [{ _id: objId }] : []), { _id: String(id) }, { id: String(id) }]
    });
    return res.deletedCount > 0;
  }
};

// ─── WORKSPACES REPOSITORY (ATLAS) ──────────────────────────────────────────
export const mongoWorkspacesRepo = {
  async findById(id) {
    const db = await getMongoDb();
    if (!db || !id) return null;
    const objId = toObjectId(id);
    const doc = await db.collection('workspaces').findOne({
      $or: [
        ...(objId ? [{ _id: objId }] : []),
        { _id: String(id) },
        { id: String(id) }
      ]
    });
    if (!doc) return null;
    return {
      _id: String(doc._id),
      id: String(doc._id),
      name: doc.name,
      type: doc.type || 'personal',
      ownerId: String(doc.ownerId || doc.owner_id || ''),
      businessName: doc.businessName || null,
      industry: doc.industry || null,
      currency: doc.currency || 'INR',
      joinCode: doc.joinCode || doc.join_code,
      settings: doc.settings || { currency: 'INR', currencySymbol: '₹' },
      createdAt: doc.createdAt
    };
  },

  async findByOwnerId(ownerId) {
    const db = await getMongoDb();
    if (!db || !ownerId) return [];
    const objId = toObjectId(ownerId);
    const docs = await db.collection('workspaces').find({
      $or: [
        { ownerId: String(ownerId) },
        ...(objId ? [{ ownerId: objId }] : []),
        { owner_id: String(ownerId) },
        ...(objId ? [{ owner_id: objId }] : [])
      ]
    }).toArray();
    return docs.map(doc => ({
      _id: String(doc._id),
      id: String(doc._id),
      name: doc.name,
      type: doc.type || 'personal',
      ownerId: String(doc.ownerId || doc.owner_id || ''),
      businessName: doc.businessName || null,
      industry: doc.industry || null,
      currency: doc.currency || 'INR',
      joinCode: doc.joinCode || doc.join_code,
      settings: doc.settings || { currency: 'INR', currencySymbol: '₹' },
      createdAt: doc.createdAt
    }));
  },

  async findByJoinCode(joinCode) {
    const db = await getMongoDb();
    if (!db || !joinCode) return null;
    const clean = joinCode.trim().toUpperCase();
    const doc = await db.collection('workspaces').findOne({
      $or: [{ joinCode: clean }, { join_code: clean }]
    });
    if (!doc) return null;
    return {
      _id: String(doc._id),
      id: String(doc._id),
      name: doc.name,
      type: doc.type || 'personal',
      ownerId: String(doc.ownerId || doc.owner_id || ''),
      businessName: doc.businessName || null,
      industry: doc.industry || null,
      currency: doc.currency || 'INR',
      joinCode: doc.joinCode || doc.join_code,
      settings: doc.settings || { currency: 'INR', currencySymbol: '₹' },
      createdAt: doc.createdAt
    };
  },

  async upgradeToBusiness(workspaceId) {
    const db = await getMongoDb();
    if (!db || !workspaceId) return null;
    const objId = toObjectId(workspaceId);
    const filter = {
      $or: [
        ...(objId ? [{ _id: objId }] : []),
        { _id: String(workspaceId) },
        { id: String(workspaceId) }
      ]
    };
    const ws = await db.collection('workspaces').findOne(filter);
    if (!ws) return null;

    let updatedName = ws.name;
    if (updatedName && /personal/i.test(updatedName)) {
      updatedName = updatedName.replace(/personal/i, 'Business');
    }

    const updates = {
      type: 'business',
      name: updatedName,
      businessName: ws.businessName || updatedName,
      updatedAt: new Date()
    };

    await db.collection('workspaces').updateOne(filter, { $set: updates });
    return {
      ...ws,
      _id: String(ws._id),
      id: String(ws._id),
      ...updates
    };
  },

  async addMember(workspaceId, { userId, role = 'employee', status = 'active', message = '', fullName = '', email = '' }) {
    const db = await getMongoDb();
    if (!db || !workspaceId || !userId) return null;
    const wsIdStr = String(workspaceId);
    const uIdStr = String(userId);

    const memberDoc = {
      workspaceId: wsIdStr,
      userId: uIdStr,
      role,
      status,
      message,
      fullName,
      email,
      joinedAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('workspacemembers').updateOne(
      { workspaceId: wsIdStr, userId: uIdStr },
      { $set: memberDoc },
      { upsert: true }
    );
    return memberDoc;
  },

  async create(wsData) {
    const db = await getMongoDb();
    if (!db) return null;
    const newDoc = {
      name: wsData.name,
      type: wsData.type || 'personal',
      ownerId: String(wsData.ownerId),
      businessName: wsData.businessName || (wsData.type === 'business' ? wsData.name : null),
      industry: wsData.industry || null,
      currency: wsData.currency || 'INR',
      joinCode: wsData.joinCode || `HERO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      settings: {
        currency: 'INR',
        currencySymbol: '₹',
        startingBalance: 0,
        ...wsData.settings
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await db.collection('workspaces').insertOne(newDoc);
    const id = String(res.insertedId);
    return {
      _id: id,
      id,
      ...newDoc
    };
  },

  async getUserWorkspaces(userId) {
    const db = await getMongoDb();
    if (!db || !userId) return this.findByOwnerId(userId);
    const userIdStr = String(userId);
    const objId = toObjectId(userId);

    // 1. Owned workspaces
    const ownedDocs = await db.collection('workspaces').find({
      $or: [
        { ownerId: userIdStr },
        ...(objId ? [{ ownerId: objId }] : []),
        { owner_id: userIdStr },
        ...(objId ? [{ owner_id: objId }] : [])
      ],
      deletedAt: null
    }).toArray();

    // 2. Workspaces where user is a member
    const memberships = await db.collection('workspacemembers').find({
      $or: [
        { userId: userIdStr },
        ...(objId ? [{ userId: objId }] : [])
      ],
      status: 'active'
    }).toArray();

    const memberWsIds = memberships.map(m => String(m.workspaceId || m.workspace_id)).filter(Boolean);
    const extraObjIds = memberWsIds.map(toObjectId).filter(Boolean);

    let memberDocs = [];
    if (memberWsIds.length > 0) {
      memberDocs = await db.collection('workspaces').find({
        $or: [
          ...(extraObjIds.length > 0 ? [{ _id: { $in: extraObjIds } }] : []),
          { _id: { $in: memberWsIds } },
          { id: { $in: memberWsIds } }
        ],
        deletedAt: null
      }).toArray();
    }

    const allDocs = [...ownedDocs];
    for (const mDoc of memberDocs) {
      if (!allDocs.some(d => String(d._id) === String(mDoc._id))) {
        allDocs.push(mDoc);
      }
    }

    return allDocs.map(doc => {
      const isOwner = String(doc.ownerId || doc.owner_id) === userIdStr;
      const mem = memberships.find(m => String(m.workspaceId || m.workspace_id) === String(doc._id || doc.id));
      const role = isOwner ? 'owner' : (mem?.role || 'employee');

      return {
        _id: String(doc._id),
        id: String(doc._id),
        name: doc.name,
        type: doc.type || 'personal',
        role,
        isOwner,
        ownerId: String(doc.ownerId || doc.owner_id || ''),
        businessName: doc.businessName || null,
        industry: doc.industry || null,
        currency: doc.currency || 'INR',
        joinCode: doc.joinCode || doc.join_code,
        settings: doc.settings || { currency: 'INR', currencySymbol: '₹' },
        createdAt: doc.createdAt
      };
    });
  },

  async getMembers(workspaceId) {
    const db = await getMongoDb();
    if (!db) return [];
    const ws = await this.findById(workspaceId);
    const members = [];
    if (ws && ws.ownerId) {
      const owner = await mongoUsersRepo.findById(ws.ownerId);
      if (owner) {
        members.push({
          id: String(owner._id || owner.id),
          fullName: owner.fullName || owner.name || 'Workspace Owner',
          email: owner.email,
          role: 'owner',
          status: 'Active',
          joinedAt: owner.createdAt ? new Date(owner.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
      }
    }
    const wsIdStr = String(workspaceId);
    const objId = toObjectId(workspaceId);
    const extra = await db.collection('workspacemembers').find({
      $or: [
        { workspaceId: wsIdStr },
        ...(objId ? [{ workspaceId: objId }] : []),
        { workspace_id: wsIdStr }
      ]
    }).toArray();
    for (const em of extra) {
      members.push({
        id: String(em._id),
        fullName: em.fullName || em.name || 'Team Member',
        email: em.email,
        role: em.role || 'employee',
        status: em.status || 'Active',
        joinedAt: em.joinedAt ? new Date(em.joinedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
    return members;
  }
};

// ─── TRANSACTIONS REPOSITORY (ATLAS) ─────────────────────────────────────────
export const mongoTransactionsRepo = {
  async create(tx) {
    const db = await getMongoDb();
    if (!db) return null;
    const wsId = String(tx.workspaceId || tx.workspace_id || 'personal');
    const doc = {
      workspaceId: wsId,
      userId: tx.userId ? String(tx.userId) : null,
      type: tx.type || 'expense',
      category: tx.category || 'General',
      amount: Number(tx.amount || 0),
      description: tx.description || 'Transaction',
      merchant: tx.merchant || null,
      date: tx.date || new Date().toISOString().split('T')[0],
      paymentMethod: tx.paymentMethod || 'Cash',
      source: tx.source || 'Manual',
      taxRate: Number(tx.taxRate || 0),
      taxAmount: Number(tx.taxAmount || 0),
      isVerified: tx.isVerified ?? true,
      metadata: tx.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await db.collection('transactions').insertOne(doc);
    const id = String(res.insertedId);
    return {
      _id: id,
      id,
      ...doc
    };
  },

  async createBatch(txList) {
    const db = await getMongoDb();
    if (!db || !Array.isArray(txList) || txList.length === 0) return [];
    const docs = txList.map(tx => ({
      workspaceId: String(tx.workspaceId || tx.workspace_id || 'personal'),
      userId: tx.userId ? String(tx.userId) : null,
      type: tx.type || 'expense',
      category: tx.category || 'General',
      amount: Number(tx.amount || 0),
      description: tx.description || 'Transaction',
      merchant: tx.merchant || null,
      date: tx.date || new Date().toISOString().split('T')[0],
      paymentMethod: tx.paymentMethod || 'Cash',
      source: tx.source || 'Manual',
      taxRate: Number(tx.taxRate || 0),
      taxAmount: Number(tx.taxAmount || 0),
      isVerified: tx.isVerified ?? true,
      metadata: tx.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    const res = await db.collection('transactions').insertMany(docs);
    return docs.map((d, i) => ({
      _id: String(res.insertedIds[i]),
      id: String(res.insertedIds[i]),
      ...d
    }));
  },

  async listByWorkspace(workspaceId, options = {}) {
    const db = await getMongoDb();
    if (!db) return [];
    const wsIdStr = String(workspaceId || 'personal');
    const objId = toObjectId(workspaceId);
    const query = {
      $or: [
        { workspaceId: wsIdStr },
        ...(objId ? [{ workspaceId: objId }] : []),
        { workspace_id: wsIdStr },
        ...(objId ? [{ workspace_id: objId }] : [])
      ]
    };
    let cursor = db.collection('transactions').find(query).sort({ date: -1, createdAt: -1 });
    if (options.limit) cursor = cursor.limit(Number(options.limit));
    const docs = await cursor.toArray();
    return docs.map(d => ({
      _id: String(d._id),
      id: String(d._id),
      workspaceId: String(d.workspaceId || d.workspace_id || wsIdStr),
      userId: d.userId ? String(d.userId) : null,
      type: d.type,
      category: d.category,
      amount: Number(d.amount),
      description: d.description,
      merchant: d.merchant,
      date: d.date,
      paymentMethod: d.paymentMethod || d.payment_method || 'Cash',
      taxAmount: Number(d.taxAmount || d.tax_amount || 0),
      isVerified: d.isVerified,
      createdAt: d.createdAt
    }));
  },

  async findById(id) {
    const db = await getMongoDb();
    if (!db || !id) return null;
    const objId = toObjectId(id);
    const doc = await db.collection('transactions').findOne({
      $or: [...(objId ? [{ _id: objId }] : []), { _id: String(id) }, { id: String(id) }]
    });
    if (!doc) return null;
    return {
      _id: String(doc._id),
      id: String(doc._id),
      workspaceId: String(doc.workspaceId || doc.workspace_id),
      userId: doc.userId ? String(doc.userId) : null,
      type: doc.type,
      category: doc.category,
      amount: Number(doc.amount),
      description: doc.description,
      merchant: doc.merchant,
      date: doc.date,
      paymentMethod: doc.paymentMethod || doc.payment_method || 'Cash',
      createdAt: doc.createdAt
    };
  },

  async update(id, updates) {
    const db = await getMongoDb();
    if (!db || !id) return null;
    const objId = toObjectId(id);
    const fields = { updatedAt: new Date() };
    if (updates.description !== undefined) fields.description = updates.description;
    if (updates.amount !== undefined) fields.amount = Number(updates.amount);
    if (updates.type !== undefined) fields.type = updates.type;
    if (updates.category !== undefined) fields.category = updates.category;
    if (updates.date !== undefined) fields.date = updates.date;
    if (updates.merchant !== undefined) fields.merchant = updates.merchant;
    if (updates.paymentMethod !== undefined) fields.paymentMethod = updates.paymentMethod;

    await db.collection('transactions').updateOne(
      { $or: [...(objId ? [{ _id: objId }] : []), { _id: String(id) }, { id: String(id) }] },
      { $set: fields }
    );
    return this.findById(id);
  },

  async delete(id) {
    const db = await getMongoDb();
    if (!db || !id) return false;
    const objId = toObjectId(id);
    const res = await db.collection('transactions').deleteOne({
      $or: [...(objId ? [{ _id: objId }] : []), { _id: String(id) }, { id: String(id) }]
    });
    return res.deletedCount > 0;
  },

  async deleteByWorkspace(workspaceId) {
    const db = await getMongoDb();
    if (!db) return 0;
    const wsIdStr = String(workspaceId || 'personal');
    const objId = toObjectId(workspaceId);
    const res = await db.collection('transactions').deleteMany({
      $or: [
        { workspaceId: wsIdStr },
        ...(objId ? [{ workspaceId: objId }] : []),
        { workspace_id: wsIdStr },
        ...(objId ? [{ workspace_id: objId }] : [])
      ]
    });
    return res.deletedCount;
  },

  async getMetrics(workspaceId) {
    const txns = await this.listByWorkspace(workspaceId);
    let totalInflow = 0;
    let totalOutflow = 0;
    const categoryBreakdown = {};

    for (const t of txns) {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') {
        totalInflow += amt;
      } else {
        totalOutflow += amt;
        const cat = t.category || 'General';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
      }
    }

    return {
      totalInflow,
      totalOutflow,
      netBalance: totalInflow - totalOutflow,
      count: txns.length,
      categoryBreakdown
    };
  }
};

// ─── STAFF & PAGAR KHATA REPOSITORY (ATLAS) ──────────────────────────────────
export const mongoStaffRepo = {
  async listByWorkspace(workspaceId) {
    const db = await getMongoDb();
    if (!db) return [];
    const wsIdStr = String(workspaceId || 'personal');
    const objId = toObjectId(workspaceId);
    const docs = await db.collection('staff').find({
      $or: [
        { workspaceId: wsIdStr },
        ...(objId ? [{ workspaceId: objId }] : []),
        { workspace_id: wsIdStr }
      ]
    }).toArray();
    return docs.map(d => ({
      id: String(d._id),
      _id: String(d._id),
      name: d.name,
      role: d.role || d.designation || 'Staff',
      monthlySalary: Number(d.monthlySalary || d.baseSalary || 0),
      baseSalary: Number(d.monthlySalary || d.baseSalary || 0),
      dailyWage: Number(d.dailyWage || Math.round(Number(d.monthlySalary || 0) / 30)),
      attendance: d.attendance || { present: 0, absent: 0, halfDay: 0, overtimeDays: 0 },
      advancesDrawn: Number(d.advancesDrawn || 0),
      netPayable: Number(d.netPayable || d.monthlySalary || 0),
      advances: d.advances || [],
      phone: d.phone || null
    }));
  },

  async create(staffData) {
    const db = await getMongoDb();
    if (!db) return null;
    const wsIdStr = String(staffData.workspaceId || 'personal');
    const monthlySalary = Number(staffData.monthlySalary || staffData.baseSalary || 0);
    const doc = {
      workspaceId: wsIdStr,
      name: staffData.name,
      role: staffData.role || staffData.designation || 'Staff',
      monthlySalary,
      baseSalary: monthlySalary,
      dailyWage: staffData.dailyWage ? Number(staffData.dailyWage) : Math.round(monthlySalary / 30),
      attendance: staffData.attendance || { present: 26, absent: 0, halfDay: 0, overtimeDays: 0 },
      advancesDrawn: 0,
      netPayable: monthlySalary,
      advances: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await db.collection('staff').insertOne(doc);
    return { id: String(res.insertedId), _id: String(res.insertedId), ...doc };
  },

  async addAdvance(staffId, advanceData) {
    const db = await getMongoDb();
    if (!db || !staffId) return null;
    const objId = toObjectId(staffId);
    const amount = Number(advanceData.amount || 0);
    const record = {
      amount,
      date: advanceData.date || new Date().toISOString().split('T')[0],
      note: advanceData.reason || advanceData.note || 'Cash Advance'
    };
    await db.collection('staff').updateOne(
      { $or: [...(objId ? [{ _id: objId }] : []), { _id: String(staffId) }] },
      {
        $push: { advances: record },
        $inc: { advancesDrawn: amount, netPayable: -amount },
        $set: { updatedAt: new Date() }
      }
    );
    return record;
  }
};

// ─── OTP VERIFICATION REPOSITORY (ATLAS) ────────────────────────────────────
export const mongoOtpRepo = {
  async store(email, otpCode, purpose = 'signup', expiresAt = new Date(Date.now() + 15 * 60 * 1000)) {
    const db = await getMongoDb();
    if (!db) return null;
    const cleanEmail = email.trim().toLowerCase();
    await db.collection('otpverifications').deleteMany({ email: cleanEmail });
    const newDoc = {
      email: cleanEmail,
      otpCode: String(otpCode),
      purpose,
      expiresAt,
      isVerified: false,
      createdAt: new Date()
    };
    await db.collection('otpverifications').insertOne(newDoc);
    return newDoc;
  },

  async verify(email, otpCode, purpose = 'signup') {
    const db = await getMongoDb();
    if (!db) return false;
    const cleanEmail = email.trim().toLowerCase();
    const strCode = String(otpCode).trim();
    const doc = await db.collection('otpverifications').findOne({
      email: cleanEmail,
      otpCode: strCode,
      isVerified: false
    });
    if (!doc) return false;
    if (new Date() > new Date(doc.expiresAt)) return false;

    await db.collection('otpverifications').updateOne(
      { _id: doc._id },
      { $set: { isVerified: true, verifiedAt: new Date() } }
    );
    return true;
  }
};
