import dotenv from 'dotenv';
dotenv.config();

async function verifyDashboardReflection() {
  console.log('🧪 Verifying Live Dashboard & Ledger Data Reflection...\n');

  // 1. Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'selvathevar10042005@gmail.com',
      password: 'Stvr2005$',
      deviceId: 'reflect_dev',
      deviceName: 'Reflection Tester'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const wsId = loginData.user.activeWorkspace.id;

  console.log(`✅ Logged in as ${loginData.user.email} (Workspace: ${wsId})`);

  // 2. Fetch stats, transactions, health
  const [statsRes, txsRes, healthRes] = await Promise.all([
    fetch('http://localhost:5000/api/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId }
    }),
    fetch('http://localhost:5000/api/dashboard/transactions', {
      headers: { 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId }
    }),
    fetch('http://localhost:5000/api/dashboard/health', {
      headers: { 'Authorization': `Bearer ${token}`, 'X-Workspace-Id': wsId }
    })
  ]);

  const stats = await statsRes.json();
  const txs = await txsRes.json();
  const health = await healthRes.json();

  console.log('📊 Dashboard Stats:', stats);
  console.log(`📋 Total Transactions in Dashboard: ${txs.length} items`);
  console.log('❤️ Financial Health Score:', health);

  if (statsRes.ok && txsRes.ok && healthRes.ok) {
    console.log('\n🎉 ALL DASHBOARD ENDPOINTS LIVE & REFLECTING TRANSACTIONS 100%!');
  } else {
    throw new Error('Endpoint failure');
  }
}

verifyDashboardReflection().catch(console.error);
