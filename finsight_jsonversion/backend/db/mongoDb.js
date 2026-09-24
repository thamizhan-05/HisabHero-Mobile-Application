import mongoose from 'mongoose';

let isConnected = false;

export async function getMongoDb() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
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

function normalizeId(id) {
  if (!id) return null;
  return String(id);
}

function toObjectId(id) {
  if (!id) return null;
  try {
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      return new mongoose.Types.ObjectId(id);
    }
  } catch (e) {}
  return id;
}

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
      $or: [{ _id: objId }, { _id: String(id) }, { id: String(id) }]
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
      { $or: [{ _id: objId }, { _id: String(id) }, { id: String(id) }] },
      { $set: updateFields }
    );
    return this.findById(id);
  },

  async delete(id) {
    const db = await getMongoDb();
    if (!db || !id) return false;
    const objId = toObjectId(id);
    const res = await db.collection('users').deleteOne({
      $or: [{ _id: objId }, { _id: String(id) }, { id: String(id) }]
    });
    return res.deletedCount > 0;
  }
};

export const mongoWorkspacesRepo = {
  async findById(id) {
    const db = await getMongoDb();
    if (!db || !id) return null;
    const objId = toObjectId(id);
    const doc = await db.collection('workspaces').findOne({
      $or: [{ _id: objId }, { _id: String(id) }, { id: String(id) }]
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
      $or: [{ ownerId: String(ownerId) }, { ownerId: objId }, { owner_id: String(ownerId) }]
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
      type: doc.type,
      ownerId: String(doc.ownerId || doc.owner_id || ''),
      joinCode: doc.joinCode || doc.join_code
    };
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
    return this.findByOwnerId(userId);
  }
};

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
