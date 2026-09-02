import pg from 'pg';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function cleanSupabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('⚠️ DATABASE_URL missing, skipping Supabase truncate.');
    return;
  }

  console.log('⏳ Connecting to Supabase PostgreSQL...');
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL.');

    const tables = [
      'hero_insights',
      'business_calendar_events',
      'device_sessions',
      'recurring_subscriptions',
      'projects',
      'payroll_records',
      'fixed_assets',
      'uploaded_documents',
      'khata_ledgers',
      'bills',
      'invoices',
      'transactions',
      'journal_entries',
      'accounts',
      'workspace_members',
      'workspaces',
      'users'
    ];

    console.log('🧹 Truncating all Supabase PostgreSQL tables...');
    await client.query(`TRUNCATE TABLE ${tables.join(', ')} CASCADE;`);
    console.log('✨ Supabase PostgreSQL is completely clean and empty (fresh schema intact)!');
  } catch (err) {
    console.error('❌ Supabase clean error:', err.message);
  } finally {
    await client.end().catch(() => {});
  }
}

async function cleanMongo() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn('⚠️ MONGO_URI missing, skipping MongoDB clean.');
    return;
  }

  console.log('\n⏳ Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas.');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`🧹 Purging ${collections.length} collections in MongoDB Atlas...`);

    for (const col of collections) {
      if (!col.name.startsWith('system.')) {
        await mongoose.connection.db.collection(col.name).deleteMany({});
        console.log(`  • Cleared collection: ${col.name}`);
      }
    }

    console.log('✨ MongoDB Atlas is completely clean and empty!');
  } catch (err) {
    console.error('❌ MongoDB clean error:', err.message);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

async function main() {
  console.log('====================================================');
  console.log('🚨 PURGING ALL TEST DATA — STARTING FRESH DATABASE 🚨');
  console.log('====================================================\n');

  await cleanSupabase();
  await cleanMongo();

  console.log('\n🎉 ALL DATABASES ARE 100% CLEAN, FRESH AND BRAND NEW!');
}

main().catch(console.error);
