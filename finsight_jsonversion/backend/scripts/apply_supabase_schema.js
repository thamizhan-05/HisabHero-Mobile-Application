import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL is missing in .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('⏳ Connecting directly to Supabase PostgreSQL database...');
  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL!');

  const schemaPath = path.join(__dirname, '..', 'db', 'supabase_schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('📜 Executing full DDL table schema...');
  await client.query(sql);
  console.log('🎉 All HisabHero tables, constraints, indexes & foreign keys successfully created in Supabase!');

  // Verify tables
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  console.log('\n📊 Created Tables in Supabase:');
  res.rows.forEach(r => console.log('  •', r.table_name));

  await client.end();
}

run().catch(err => {
  console.error('💥 Error applying schema:', err);
  client.end().catch(() => {});
  process.exit(1);
});
