import mongoose from 'mongoose';

export let isMongoConnected = true;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hisabhero';


  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`📡 MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
    isMongoConnected = true;

    // Backfill Migration: Generate unique unambiguous join codes for any existing businesses or workspaces without a code
    try {
      const db = conn.connection.db;
      if (db) {
        const unassignedBus = await db.collection('businesses').find({
          $or: [{ joinCode: null }, { joinCode: { $exists: false } }, { joinCode: '' }, { joinCode: { $regex: '^HH-LEGACY' } }]
        }).toArray();

        for (const b of unassignedBus) {
          const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
          const block = () => Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
          const code = `${block()}-${block()}-${block()}`;
          await db.collection('businesses').updateOne({ _id: b._id }, { $set: { joinCode: code } });
          console.log(`[Backfill Migration] Assigned Join Code ${code} to existing Business ${b._id}`);
        }

        const unassignedWs = await db.collection('workspaces').find({
          type: 'business',
          $or: [{ joinCode: null }, { joinCode: { $exists: false } }, { joinCode: '' }, { joinCode: { $regex: '^HH-LEGACY' } }]
        }).toArray();

        for (const w of unassignedWs) {
          const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
          const block = () => Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
          const code = `${block()}-${block()}-${block()}`;
          await db.collection('workspaces').updateOne({ _id: w._id }, { $set: { joinCode: code } });
        }

        // ─── Role Migration: partner/manager → admin ───────────────────────
        // Migrate legacy roles to new 5-role system (owner/admin/accountant/employee/viewer)
        const bmPartnerResult = await db.collection('businessmembers').updateMany(
          { role: { $in: ['partner', 'manager'] } },
          { $set: { role: 'admin' } }
        );
        if (bmPartnerResult.modifiedCount > 0) {
          console.log(`[Role Migration] BusinessMember: Migrated ${bmPartnerResult.modifiedCount} partner/manager records → admin`);
        }

        const wmPartnerResult = await db.collection('workspacemembers').updateMany(
          { role: { $in: ['partner', 'manager'] } },
          { $set: { role: 'admin' } }
        );
        if (wmPartnerResult.modifiedCount > 0) {
          console.log(`[Role Migration] WorkspaceMember: Migrated ${wmPartnerResult.modifiedCount} partner/manager records → admin`);
        }
        // ──────────────────────────────────────────────────────────────────────
      }
    } catch (e) {
      console.warn('[Backfill Migration Warning]:', e.message);
    }
  } catch (error) {
    console.error(`❌ CRITICAL: MongoDB Atlas Connection Error: ${error.message}`);
    isMongoConnected = false;
    // Retry connection after 3 seconds
    setTimeout(connectDB, 3000);
  }
};

export default connectDB;
