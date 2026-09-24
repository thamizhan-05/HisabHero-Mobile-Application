#!/usr/bin/env node
// Script to set all Vercel env vars using Vercel CLI non-interactively
import { execSync } from 'child_process';

const PROJECT = 'hisabhero';

const ENV_VARS = {
  NODE_ENV: 'production',
  GEMINI_API_KEY: 'AQ.Ab8RN6LPfiQrhjvsDld4gGshBNLvyT2HIfeETHZGjueXagXc3A',
  MONGO_URI: 'mongodb+srv://nebulonhackathon2026:manimau28@hisabhero.kies5xc.mongodb.net/hisabhero?retryWrites=true&w=majority',
  MONGODB_URI: 'mongodb+srv://nebulonhackathon2026:manimau28@hisabhero.kies5xc.mongodb.net/hisabhero?retryWrites=true&w=majority',
  SUPABASE_URL: 'https://lsrcyhoxxbndzhntlvay.supabase.co',
  SUPABASE_KEY: 'sb_secret_Sr_w_Ogs_W1J-x6U8r_fow_rwwtR6py',
  DATABASE_URL: 'postgresql://postgres:Stvr2005Selva@db.lsrcyhoxxbndzhntlvay.supabase.co:5432/postgres',
  GOOGLE_WEB_CLIENT_ID: '67517586498-g54j68rmr8tfhk2l5uotqjt525sc3s0q.apps.googleusercontent.com',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '465',
  SMTP_SECURE: 'true',
  SMTP_USER: 'hisabhero27@gmail.com',
  SMTP_PASS: 'vosufsbqxztmuxos',
  SMTP_FROM: '"HisabHero" <hisabhero27@gmail.com>',
  TWILIO_ACCOUNT_SID: 'ACc0b4387df1fb1f31695e167e0b7203fc',
  TWILIO_AUTH_TOKEN: 'a3fc6550073db2ad958f0c2327116197',
  TWILIO_WHATSAPP_NUMBER: 'whatsapp:+14155238886',
};

// Use Vercel API directly with the auth token from Vercel CLI config
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

let token;
const authPaths = [
  join(process.env.APPDATA || '', 'com.vercel.cli', 'Data', 'auth.json'),
  join(homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
  join(homedir(), '.config', 'vercel', 'auth.json'),
  join(process.env.APPDATA || '', 'com.vercel.cli', 'auth.json'),
];
for (const p of authPaths) {
  try {
    const cfg = JSON.parse(readFileSync(p, 'utf8'));
    if (cfg.token) { token = cfg.token; break; }
  } catch {}
}
if (!token) {
  console.error('Could not find Vercel auth token. Run: vercel login');
  process.exit(1);
}

console.log('🔑 Found Vercel token, setting env vars for project:', PROJECT);

// Get project ID
const projRes = await fetch(`https://api.vercel.com/v9/projects/${PROJECT}`, {
  headers: { Authorization: `Bearer ${token}` }
});
const projData = await projRes.json();
if (!projRes.ok) {
  console.error('❌ Project lookup failed:', projData.error?.message);
  process.exit(1);
}
const projectId = projData.id;
console.log('📦 Project ID:', projectId, '\n');

let added = 0, skipped = 0, failed = 0;

for (const [key, value] of Object.entries(ENV_VARS)) {
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
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
      console.log(`  ⚠️  ${key} — already exists, updating...`);
      // Try to update instead
      const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const listData = await listRes.json();
      const existing = (listData.envs || []).find(e => e.key === key);
      if (existing) {
        const updRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ value, target: ['production', 'preview', 'development'] })
        });
        if (updRes.ok) { console.log(`    ✅ ${key} updated`); skipped++; }
        else { console.log(`    ❌ ${key} update failed`); failed++; }
      } else {
        skipped++;
      }
    } else {
      console.log(`  ❌ ${key} failed: ${data.error?.message}`);
      failed++;
    }
  } else {
    console.log(`  ✅ ${key} set`);
    added++;
  }
}

console.log(`\n📊 Results: ${added} added, ${skipped} updated/skipped, ${failed} failed`);

if (failed === 0) {
  console.log('\n🚀 Triggering redeploy...');
  const deployRes = await fetch(`https://api.vercel.com/v13/deployments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: PROJECT,
      gitSource: {
        type: 'github',
        repoId: projData.link?.repoId,
        ref: 'main'
      }
    })
  });
  const deployData = await deployRes.json();
  if (deployRes.ok) {
    console.log('✅ Redeploy triggered! URL:', deployData.url);
  } else {
    console.log('⚠️  Could not auto-trigger redeploy. Please redeploy manually from Vercel dashboard.');
    console.log('   https://vercel.com/thamizhan-05/hisabhero');
  }
}
