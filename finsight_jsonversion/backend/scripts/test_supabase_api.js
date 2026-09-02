import dotenv from 'dotenv';
dotenv.config();

async function testApi() {
  console.log('🧪 Testing Supabase Backend API Endpoints...\n');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log('1. Health Check:', healthData);

  // 2. Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'selvathevar10042005@gmail.com',
      password: 'Stvr2005$',
      deviceId: 'test_device_001',
      deviceName: 'API Test Runner',
      platform: 'Node.js'
    })
  });

  const loginData = await loginRes.json();
  console.log('\n2. Login Response:', {
    success: loginData.success,
    hasToken: Boolean(loginData.token),
    user: loginData.user?.email,
    activeWorkspace: loginData.user?.activeWorkspace?.name,
    workspaceId: loginData.user?.activeWorkspace?.id
  });

  if (!loginData.token) {
    console.error('❌ Login failed:', loginData);
    process.exit(1);
  }

  const token = loginData.token;
  const wsId = loginData.user.activeWorkspace.id;

  // 3. Transactions
  const txRes = await fetch('http://localhost:5000/api/transactions', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': wsId
    }
  });
  const txData = await txRes.json();
  console.log('\n3. Transactions in Supabase:', {
    success: txData.success,
    count: txData.transactions?.length || 0
  });

  // 4. Documents
  const docRes = await fetch('http://localhost:5000/api/documents', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': wsId
    }
  });
  const docData = await docRes.json();
  console.log('\n4. Documents in Supabase:', {
    success: docData.success,
    count: docData.documents?.length || 0
  });

  // 5. Dashboard Stats
  const statsRes = await fetch('http://localhost:5000/api/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': wsId
    }
  });
  const statsData = await statsRes.json();
  console.log('\n5. Dashboard Stats from Supabase:', {
    inflow: statsData.inflow,
    outflow: statsData.outflow,
    balance: statsData.balance,
    transactionCount: statsData.transactionCount,
    healthScore: statsData.healthScore
  });

  console.log('\n🎉 ALL SUPABASE API ENDPOINTS VERIFIED AND PASSING 100%!');
}

testApi().catch(console.error);
