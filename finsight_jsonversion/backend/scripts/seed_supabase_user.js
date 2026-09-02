import dotenv from 'dotenv';
import crypto from 'crypto';
import { supabase } from '../db/supabaseClient.js';

dotenv.config();

function hashPasswordPBKDF2(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
  return `210000:${salt}:${hash}`;
}

async function seedSupabaseUser() {
  console.log('⏳ Connecting to Supabase PostgreSQL to seed clean initial user...');

  const cleanEmail = 'selvathevar10042005@gmail.com';
  const rawPassword = 'Stvr2005$';
  const passwordHash = hashPasswordPBKDF2(rawPassword);

  // 1. Remove existing user if present
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (existing) {
    console.log(`🧹 Removing existing Supabase user ${cleanEmail}...`);
    await supabase.from('users').delete().eq('id', existing.id);
  }

  // 2. Insert fresh verified user
  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({
      email: cleanEmail,
      full_name: 'Selva',
      password: passwordHash,
      role: 'owner',
      account_type: 'personal',
      is_verified: true,
      email_verified: true
    })
    .select()
    .single();

  if (userErr) {
    console.error('❌ Error creating user in Supabase:', userErr.message);
    process.exit(1);
  }

  // 3. Create default workspace in Supabase
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .insert({
      name: "Selva's Personal Finance",
      type: 'personal',
      owner_id: user.id,
      currency: 'INR',
      join_code: 'HERO-WS-SELVA1',
      cash_balance: 0,
      settings: {
        currency: 'INR',
        currencySymbol: '₹',
        allowNegativeBalance: true,
        taxEnabled: true,
        startingBalance: 0
      }
    })
    .select()
    .single();

  if (wsErr) {
    console.error('❌ Error creating workspace in Supabase:', wsErr.message);
    process.exit(1);
  }

  console.log('🎉 Verified Supabase User & Workspace Initialized:');
  console.log(`   • Email: ${user.email}`);
  console.log(`   • Password: ${rawPassword}`);
  console.log(`   • User ID: ${user.id}`);
  console.log(`   • Workspace: "${ws.name}" (ID: ${ws.id})`);
  console.log(`   • Transactions: 0 (100% Clean)`);
}

seedSupabaseUser().catch(console.error);
