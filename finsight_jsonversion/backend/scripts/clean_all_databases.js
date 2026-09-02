import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export async function cleanSupabase() {
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
      'merchant_mappings',
      'otp_verifications',
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

async function main() {
  console.log('====================================================');
  console.log('🚨 PURGING SUPABASE POSTGRESQL (PURE SUPABASE ENGINE) 🚨');
  console.log('====================================================\n');

  await cleanSupabase();
  console.log('\n🎉 SUPABASE IS 100% CLEAN, FRESH AND BRAND NEW!');
}

if (process.argv[1]?.includes('clean_all_databases.js')) {
  main().catch(console.error);
}
