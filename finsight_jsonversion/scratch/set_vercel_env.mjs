#!/usr/bin/env node
/**
 * HisabHero Vercel Env Vars Setup Script
 * Adds all required environment variables via Vercel API
 * Run: node set_vercel_env.mjs
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_NAME = 'hisabhero';

const ENV_VARS = [
  { key: 'NODE_ENV',              value: 'production' },
  { key: 'GEMINI_API_KEY',        value: 'AQ.Ab8RN6LPfiQrhjvsDld4gGshBNLvyT2HIfeETHZGjueXagXc3A' },
  { key: 'MONGO_URI',             value: 'mongodb+srv://nebulonhackathon2026:manimau28@hisabhero.kies5xc.mongodb.net/hisabhero?retryWrites=true&w=majority' },
  { key: 'MONGODB_URI',           value: 'mongodb+srv://nebulonhackathon2026:manimau28@hisabhero.kies5xc.mongodb.net/hisabhero?retryWrites=true&w=majority' },
  { key: 'SUPABASE_URL',          value: 'https://lsrcyhoxxbndzhntlvay.supabase.co' },
  { key: 'SUPABASE_KEY',          value: 'sb_secret_Sr_w_Ogs_W1J-x6U8r_fow_rwwtR6py' },
  { key: 'DATABASE_URL',          value: 'postgresql://postgres:Stvr2005Selva@db.lsrcyhoxxbndzhntlvay.supabase.co:5432/postgres' },
  { key: 'GOOGLE_WEB_CLIENT_ID',  value: '67517586498-g54j68rmr8tfhk2l5uotqjt525sc3s0q.apps.googleusercontent.com' },
  { key: 'SMTP_HOST',             value: 'smtp.gmail.com' },
  { key: 'SMTP_PORT',             value: '465' },
  { key: 'SMTP_SECURE',           value: 'true' },
  { key: 'SMTP_USER',             value: 'hisabhero27@gmail.com' },
  { key: 'SMTP_PASS',             value: 'vosufsbqxztmuxos' },
  { key: 'SMTP_FROM',             value: '"HisabHero" <hisabhero27@gmail.com>' },
  { key: 'TWILIO_ACCOUNT_SID',    value: 'ACc0b4387df1fb1f31695e167e0b7203fc' },
  { key: 'TWILIO_AUTH_TOKEN',     value: 'a3fc6550073db2ad958f0c2327116197' },
  { key: 'TWILIO_WHATSAPP_NUMBER',value: 'whatsapp:+14155238886' },
];

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN env var required. Get it from: https://vercel.com/account/tokens');
  console.error('   Run: $env:VERCEL_TOKEN="your_token_here"; node set_vercel_env.mjs');
  process.exit(1);
}

async function getProjectId() {
  const res = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_NAME}`, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Project lookup failed: ${data.error?.message || JSON.stringify(data)}`);
  return data.id;
}

async function setEnvVar(projectId, key, value) {
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview', 'development']
    })
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.error?.code === 'ENV_ALREADY_EXISTS') {
      console.log(`  ⚠️  ${key} already exists — skipping`);
      return;
    }
    throw new Error(`Failed to set ${key}: ${data.error?.message || JSON.stringify(data)}`);
  }
  console.log(`  ✅ ${key} set`);
}

async function main() {
  console.log('🚀 HisabHero Vercel Env Vars Setup\n');
  const projectId = await getProjectId();
  console.log(`📦 Project ID: ${projectId}\n`);
  
  for (const { key, value } of ENV_VARS) {
    await setEnvVar(projectId, key, value);
  }

  console.log('\n✅ All env vars configured! Trigger a redeploy from Vercel dashboard.');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
