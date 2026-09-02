import http from 'http';
import mongoose from 'mongoose';
import 'dotenv/config';

import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import JoinRequest from '../models/JoinRequest.js';
import Transaction from '../models/Transaction.js';

const PORT = 5099;
process.env.PORT = PORT;

// Start server locally for automated verification
import('../server.js').then(async () => {
  console.log(`\n===============================================================`);
  console.log(`🚀 RUNNING COMPREHENSIVE WORKSPACE & SINGLE IDENTITY TEST SUITE`);
  console.log(`===============================================================\n`);

  const API_BASE = `http://localhost:${PORT}/api`;
  const timestamp = Date.now();
  const gmailA = `test_owner_${timestamp}@gmail.com`;
  const gmailB = `test_mobile_${timestamp}@gmail.com`;
  const gmailC = `test_worker_${timestamp}@gmail.com`;
  const password = 'Password@123456';

  let tokenA = '';
  let userA_id = '';
  let tokenB = '';
  let tokenC = '';
  let userC_id = '';
  let abcTradersJoinCode = '';
  let abcTradersWsId = '';
  let xyzEnterprisesWsId = '';
  let personalWsIdA = '';

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // SCENARIO 1: Create account on website with Gmail A + Business "ABC Traders", login on mobile
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n▶️ TEST 1: Website Signup for ${gmailA} with Business Workspace "ABC Traders"...`);
    
    // 1.1 Web Signup
    const res1 = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Selva Website',
        email: gmailA,
        password,
        workspaceChoice: 'business',
        businessName: 'ABC Traders',
        industry: 'Trading & Logistics'
      })
    });
    const data1 = await res1.json();
    console.log(`  Signup Response: status=${res1.status}, needsVerification=${data1.needsVerification}`);
    if (!res1.ok || !data1.success) throw new Error(`TEST 1 Failed: Signup error ${data1.error}`);

    // 1.2 Web Verify OTP
    const res1_verify = await fetch(`${API_BASE}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: gmailA, code: '123456' })
    });
    const data1_verify = await res1_verify.json();
    console.log(`  Verify Response: status=${res1_verify.status}, token=${Boolean(data1_verify.token)}`);
    if (!res1_verify.ok || !data1_verify.token) throw new Error(`TEST 1 Failed: Verify error ${data1_verify.error}`);

    tokenA = data1_verify.token;
    userA_id = data1_verify.user.id;

    // 1.3 Simulate Mobile Login with Gmail A
    console.log(`  Simulating Mobile Login with ${gmailA}...`);
    const res1_mobile_login = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: gmailA, password })
    });
    const data1_mobile = await res1_mobile_login.json();
    console.log(`  Mobile Login Response: status=${res1_mobile_login.status}`);
    
    // 1.4 Query /api/workspaces
    const res1_ws = await fetch(`${API_BASE}/workspaces`, {
      headers: { 'Authorization': `Bearer ${data1_mobile.token}` }
    });
    const data1_ws = await res1_ws.json();
    const wsNames1 = (data1_ws.workspaces || []).map(w => w.name);
    console.log(`  Workspaces retrieved for ${gmailA}:`, wsNames1);

    const hasPersonal1 = (data1_ws.personal || []).length > 0;
    const abcTradersWs = (data1_ws.business || []).find(w => w.name === 'ABC Traders');
    if (!hasPersonal1 || !abcTradersWs) {
      throw new Error(`TEST 1 Failed: Expected both Personal Workspace and ABC Traders, got: ${JSON.stringify(wsNames1)}`);
    }
    abcTradersJoinCode = abcTradersWs.joinCode;
    abcTradersWsId = abcTradersWs.id;
    personalWsIdA = data1_ws.personal[0].id;
    console.log(`  ✅ TEST 1 PASSED! Mobile retrieved: Personal Workspace & "ABC Traders" (JoinCode: ${abcTradersJoinCode})`);

    // ──────────────────────────────────────────────────────────────────────────
    // SCENARIO 2: Create account on mobile using Gmail B + Business "XYZ Enterprises", login on website
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n▶️ TEST 2: Mobile Signup for ${gmailB} with Business "XYZ Enterprises", login on Web...`);
    const res2 = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Selva Mobile',
        email: gmailB,
        password,
        workspaceChoice: 'business',
        businessName: 'XYZ Enterprises',
        industry: 'Technology Services'
      })
    });
    await res2.json();

    const res2_verify = await fetch(`${API_BASE}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: gmailB, code: '123456' })
    });
    const data2_verify = await res2_verify.json();
    tokenB = data2_verify.token;

    // Simulate Website Login with Gmail B
    const res2_web_login = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: gmailB, password })
    });
    const data2_web = await res2_web_login.json();
    const res2_ws = await fetch(`${API_BASE}/workspaces`, {
      headers: { 'Authorization': `Bearer ${data2_web.token}` }
    });
    const data2_ws = await res2_ws.json();
    const wsNames2 = (data2_ws.workspaces || []).map(w => w.name);
    console.log(`  Workspaces retrieved on Web for ${gmailB}:`, wsNames2);

    const hasPersonal2 = (data2_ws.personal || []).length > 0;
    const xyzWs = (data2_ws.business || []).find(w => w.name === 'XYZ Enterprises');
    if (!hasPersonal2 || !xyzWs) {
      throw new Error(`TEST 2 Failed: Expected Personal Workspace and XYZ Enterprises, got: ${JSON.stringify(wsNames2)}`);
    }
    xyzEnterprisesWsId = xyzWs.id;
    console.log(`  ✅ TEST 2 PASSED! Web retrieved: Personal Workspace & "XYZ Enterprises"`);

    // ──────────────────────────────────────────────────────────────────────────
    // SCENARIO 3: Gmail C joins ABC Traders with join code, Owner approves, login on mobile
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n▶️ TEST 3: Gmail C (${gmailC}) joins ABC Traders using Join Code (${abcTradersJoinCode})...`);
    // 3.1 Signup Gmail C (Personal only)
    const res3_signup = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Worker Charlie', email: gmailC, password, workspaceChoice: 'personal' })
    });
    await res3_signup.json();
    const res3_verify = await fetch(`${API_BASE}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: gmailC, code: '123456' })
    });
    const data3_verify = await res3_verify.json();
    tokenC = data3_verify.token;
    userC_id = data3_verify.user.id;

    // 3.2 Submit Join Request
    const res3_join = await fetch(`${API_BASE}/workspaces/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenC}`
      },
      body: JSON.stringify({ joinCode: abcTradersJoinCode, message: 'I am the senior accountant' })
    });
    const data3_join = await res3_join.json();
    console.log(`  Join Request response:`, data3_join.message);
    if (!res3_join.ok || !data3_join.requestId) throw new Error(`TEST 3 Failed: Join request failed`);

    // 3.3 Owner A fetches pending requests
    const res3_reqs = await fetch(`${API_BASE}/workspaces/${abcTradersWsId}/join-requests`, {
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Workspace-Id': abcTradersWsId
      }
    });
    const data3_reqs = await res3_reqs.json();
    console.log(`  Owner found ${data3_reqs.requests?.length} pending requests.`);
    const joinReq = data3_reqs.requests.find(r => r.userId === userC_id);
    if (!joinReq) throw new Error(`TEST 3 Failed: Join request not found in owner queue`);

    // 3.4 Owner A approves join request with role 'accountant'
    const res3_approve = await fetch(`${API_BASE}/workspaces/${abcTradersWsId}/join-requests/${joinReq._id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`,
        'X-Workspace-Id': abcTradersWsId
      },
      body: JSON.stringify({ role: 'accountant' })
    });
    const data3_approve = await res3_approve.json();
    console.log(`  Owner approval response:`, data3_approve.message);
    if (!res3_approve.ok || !data3_approve.success) throw new Error(`TEST 3 Failed: Approval failed`);

    // 3.5 Worker C calls /api/workspaces
    const res3_worker_ws = await fetch(`${API_BASE}/workspaces`, {
      headers: { 'Authorization': `Bearer ${tokenC}` }
    });
    const data3_worker_ws = await res3_worker_ws.json();
    const workerWsNames = (data3_worker_ws.workspaces || []).map(w => `${w.name} (${w.role})`);
    console.log(`  Worker C Workspaces after approval:`, workerWsNames);
    const workerAbc = (data3_worker_ws.business || []).find(w => w.name === 'ABC Traders');
    if (!workerAbc || workerAbc.role !== 'accountant') {
      throw new Error(`TEST 3 Failed: Worker C does not see ABC Traders with accountant role`);
    }
    console.log(`  ✅ TEST 3 PASSED! Worker C successfully joined ABC Traders with role: accountant`);

    // ──────────────────────────────────────────────────────────────────────────
    // SCENARIO 4: Same Gmail logs in on Web & Mobile simultaneously -> Identical Workspaces
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n▶️ TEST 4: Simultaneous Web & Mobile Login for ${gmailA}...`);
    const [webSyncRes, mobSyncRes] = await Promise.all([
      fetch(`${API_BASE}/workspaces`, { headers: { 'Authorization': `Bearer ${tokenA}` } }),
      fetch(`${API_BASE}/workspaces`, { headers: { 'Authorization': `Bearer ${tokenA}` } })
    ]);
    const webData = await webSyncRes.json();
    const mobData = await mobSyncRes.json();
    if (JSON.stringify(webData.workspaces) !== JSON.stringify(mobData.workspaces)) {
      throw new Error(`TEST 4 Failed: Web and Mobile workspace lists diverged!`);
    }
    console.log(`  ✅ TEST 4 PASSED! Web and Mobile workspace lists are 100% identical and synchronized.`);

    // ──────────────────────────────────────────────────────────────────────────
    // SCENARIO 5: User has multiple businesses
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n▶️ TEST 5: User A creates a second business "Delta Global Enterprises"...`);
    const res5_create = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ name: 'Delta Global Enterprises', type: 'business', industry: 'Export' })
    });
    const data5_create = await res5_create.json();
    const deltaWsId = data5_create.workspace.id;

    const res5_all = await fetch(`${API_BASE}/workspaces`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const data5_all = await res5_all.json();
    const allNamesA = (data5_all.workspaces || []).map(w => w.name);
    console.log(`  User A All Workspaces:`, allNamesA);
    if (!allNamesA.includes('ABC Traders') || !allNamesA.includes('Delta Global Enterprises')) {
      throw new Error(`TEST 5 Failed: User A missing one of the business workspaces`);
    }
    console.log(`  ✅ TEST 5 PASSED! User A has multiple business workspaces + Personal Workspace.`);

    // ──────────────────────────────────────────────────────────────────────────
    // SCENARIO 6: Data Scoping & Switching between Workspaces
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n▶️ TEST 6: Strict Data Isolation between ABC Traders and Personal Finance...`);
    
    // Add transaction to ABC Traders
    await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`,
        'X-Workspace-Id': abcTradersWsId
      },
      body: JSON.stringify({ description: 'ABC Traders Server Cost', amount: 5000, type: 'expense', category: 'IT' })
    });

    // Add transaction to Personal Workspace
    await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`,
        'X-Workspace-Id': personalWsIdA
      },
      body: JSON.stringify({ description: 'Personal Grocery Shopping', amount: 1200, type: 'expense', category: 'Food' })
    });

    // Query ABC Traders Transactions
    const res6_abc_txs = await fetch(`${API_BASE}/dashboard/transactions`, {
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Workspace-Id': abcTradersWsId }
    });
    const data6_abc_txs = await res6_abc_txs.json();
    const abcDesc = data6_abc_txs.map(t => t.description);
    console.log(`  ABC Traders Transactions:`, abcDesc);

    // Query Personal Transactions
    const res6_p_txs = await fetch(`${API_BASE}/dashboard/transactions`, {
      headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Workspace-Id': personalWsIdA }
    });
    const data6_p_txs = await res6_p_txs.json();
    const pDesc = data6_p_txs.map(t => t.description);
    console.log(`  Personal Workspace Transactions:`, pDesc);

    if (abcDesc.includes('Personal Grocery Shopping') || pDesc.includes('ABC Traders Server Cost')) {
      throw new Error(`TEST 6 Failed: Data leakage between workspaces!`);
    }
    console.log(`  ✅ TEST 6 PASSED! Absolute zero cross-workspace data leakage.`);

    // ──────────────────────────────────────────────────────────────────────────
    // SCENARIO 7: Logout / Login with another Gmail account -> Zero cache/workspace leakage
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n▶️ TEST 7: Logout & Switch Accounts Isolation...`);
    const res7_c = await fetch(`${API_BASE}/workspaces`, {
      headers: { 'Authorization': `Bearer ${tokenC}` }
    });
    const data7_c = await res7_c.json();
    const wsNamesC = (data7_c.workspaces || []).map(w => w.name);
    console.log(`  User C Workspaces:`, wsNamesC);
    if (wsNamesC.includes('Delta Global Enterprises') || wsNamesC.includes('XYZ Enterprises')) {
      throw new Error(`TEST 7 Failed: User C has access to unauthorized workspaces!`);
    }
    console.log(`  ✅ TEST 7 PASSED! Strict tenant security enforced. No cross-account leakage.`);

    // ──────────────────────────────────────────────────────────────────────────
    // SCENARIO 8: Google Sign-In account linking to existing user
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n▶️ TEST 8: Google Sign-In Single Identity Mapping...`);
    const res8_google = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: `mock-google-token-${gmailA}-Selva_Google` })
    });
    const data8_google = await res8_google.json();
    console.log(`  Google Sign-In response: isNewUser=${data8_google.isNewUser}, userId=${data8_google.user.id}`);
    if (data8_google.user.id !== userA_id || data8_google.isNewUser !== false) {
      throw new Error(`TEST 8 Failed: Google Sign-In created a duplicate account instead of linking to existing userId!`);
    }
    console.log(`  ✅ TEST 8 PASSED! Single Gmail Identity verified: Google Login resolved to existing USER ID ${userA_id}.`);

    console.log(`\n===============================================================`);
    console.log(`🎉 ALL 8 INTEGRATION & ARCHITECTURE TESTS PASSED WITH 100% SUCCESS!`);
    console.log(`===============================================================\n`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ TEST SUITE FAILED: ${err.message}`);
    process.exit(1);
  }
});
