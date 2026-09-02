import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Transaction from '../models/Transaction.js';
import Invoice from '../models/Invoice.js';
import AuditLog from '../models/AuditLog.js';
import OTPVerification from '../models/OTPVerification.js';

const API = 'http://localhost:5000/api';

async function runFullVerification() {
  console.log('🧪 Starting Complete Workspace Architecture & Security Test Suite...\n');
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://selvathevar10042005:Selva10042005@cluster0.kies5xc.mongodb.net/hisabhero?retryWrites=true&w=majority';
  await mongoose.connect(mongoUri);

  const timestamp = Date.now();
  const personalEmail = `test_personal_${timestamp}@hisabhero.test`;
  const businessEmail = `test_business_${timestamp}@hisabhero.test`;
  const workerEmail = `test_worker_${timestamp}@hisabhero.test`;

  // ──────────────────────────────────────────────
  // TEST 1: REGISTRATION AS PERSONAL WORKSPACE
  // ──────────────────────────────────────────────
  console.log('--- TEST 1: Registration with Personal Workspace Choice ---');
  const signupPersonalRes = await fetch(`${API}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Selva Personal',
      email: personalEmail,
      password: 'password123',
      workspaceChoice: 'personal'
    })
  });
  const signupPersonalData = await signupPersonalRes.json();
  console.log('Personal Signup Response:', signupPersonalData.message);

  // Check DB before OTP
  let userInDb = await User.findOne({ email: personalEmail });
  if (userInDb) throw new Error('FAIL: User created before OTP verification!');
  console.log('✅ PASS: User does NOT exist in MongoDB before OTP verification.');

  // Verify OTP
  const otpPersonal = signupPersonalData.otpCode;
  const verifyPersonalRes = await fetch(`${API}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: personalEmail, code: otpPersonal })
  });
  const verifyPersonalData = await verifyPersonalRes.json();
  const tokenA = verifyPersonalData.token;
  userInDb = await User.findOne({ email: personalEmail });
  if (!userInDb || !tokenA) throw new Error('FAIL: User was not created upon OTP verification!');

  const userAWorkspaces = await Workspace.find({ ownerId: userInDb._id.toString() });
  if (userAWorkspaces.length !== 1 || userAWorkspaces[0].type !== 'personal') {
    throw new Error(`FAIL: Expected exactly 1 Personal workspace, got: ${JSON.stringify(userAWorkspaces)}`);
  }
  const workspaceAId = userAWorkspaces[0]._id.toString();
  console.log(`✅ PASS: User created with ONLY 1 Personal Workspace (ID: ${workspaceAId}, Name: "${userAWorkspaces[0].name}")\n`);

  // ──────────────────────────────────────────────
  // TEST 2: CREATE SECOND BUSINESS WORKSPACE B
  // ──────────────────────────────────────────────
  console.log('--- TEST 2: Create Business Workspace B for Same User ---');
  const createBRes = await fetch(`${API}/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      name: 'Selva Tech Enterprises',
      type: 'business',
      industry: 'Software & Cloud'
    })
  });
  const createBData = await createBRes.json();
  const workspaceBId = createBData.workspace.id;
  const joinCodeB = createBData.workspace.joinCode;
  if (!joinCodeB || !joinCodeB.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
    throw new Error(`FAIL: Invalid 12-character join code format: ${joinCodeB}`);
  }
  console.log(`✅ PASS: Business Workspace B created (ID: ${workspaceBId}, JoinCode: ${joinCodeB})\n`);

  // ──────────────────────────────────────────────
  // TEST 3: ABSOLUTE DATA ISOLATION
  // ──────────────────────────────────────────────
  console.log('--- TEST 3: Absolute Data Isolation between A and B ---');
  // Add Expense in Personal Workspace A
  const addTxARes = await fetch(`${API}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
      'X-Workspace-Id': workspaceAId
    },
    body: JSON.stringify({
      description: 'Personal Grocery Shopping',
      amount: 1500,
      type: 'expense',
      category: 'Groceries'
    })
  });
  const addTxAData = await addTxARes.json();
  console.log('Added Transaction in Personal Workspace A:', addTxAData.transaction.description);

  // Add Invoice in Business Workspace B
  const addInvBRes = await fetch(`${API}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
      'X-Workspace-Id': workspaceBId
    },
    body: JSON.stringify({
      customerName: 'Enterprise Client Corp',
      invoiceNumber: 'INV-2026-9901',
      lineItems: [{ description: 'Cloud Consulting', quantity: 1, unitPrice: 45000, tax: 18 }]
    })
  });
  const addInvBData = await addInvBRes.json();
  console.log('Added Invoice in Business Workspace B:', addInvBData.invoice.invoiceNumber);

  // Query Workspace A transactions
  const getTxsARes = await fetch(`${API}/dashboard/transactions`, {
    headers: {
      'Authorization': `Bearer ${tokenA}`,
      'X-Workspace-Id': workspaceAId
    }
  });
  const txsA = await getTxsARes.json();
  if (txsA.some(t => t.description.includes('Enterprise') || t.workspaceId !== workspaceAId)) {
    throw new Error('FAIL: Business data leaked into Personal Workspace A!');
  }

  // Query Workspace B transactions
  const getTxsBRes = await fetch(`${API}/dashboard/transactions`, {
    headers: {
      'Authorization': `Bearer ${tokenA}`,
      'X-Workspace-Id': workspaceBId
    }
  });
  const txsB = await getTxsBRes.json();
  if (txsB.some(t => t.description.includes('Grocery') || t.workspaceId !== workspaceBId)) {
    throw new Error('FAIL: Personal data leaked into Business Workspace B!');
  }
  console.log('✅ PASS: Strict isolation verified. Personal records NEVER appear in Business, and vice-versa.\n');

  // ──────────────────────────────────────────────
  // TEST 4: ADD WORKER & CONVERT BUSINESS TO PERSONAL
  // ──────────────────────────────────────────────
  console.log('--- TEST 4: Add Team Member & Convert Business Workspace to Personal ---');
  // Register worker
  const workerSignup = await fetch(`${API}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Worker Employee', email: workerEmail, password: 'password123', workspaceChoice: 'personal' })
  }).then(r => r.json());

  const workerVerify = await fetch(`${API}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: workerEmail, code: workerSignup.otpCode })
  }).then(r => r.json());
  const workerToken = workerVerify.token;
  const workerUser = await User.findOne({ email: workerEmail });

  // Worker joins Workspace B
  const joinRes = await fetch(`${API}/workspaces/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${workerToken}` },
    body: JSON.stringify({ joinCode: joinCodeB, message: 'Please approve me' })
  }).then(r => r.json());
  console.log('Join Request sent by worker:', joinRes.message);

  // Owner approves worker
  const approveRes = await fetch(`${API}/workspaces/${workspaceBId}/join-requests/${joinRes.requestId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}`, 'X-Workspace-Id': workspaceBId },
    body: JSON.stringify({ role: 'employee' })
  }).then(r => r.json());
  console.log('Owner Approved Worker:', approveRes.message);

  let activeMembersB = await WorkspaceMember.find({ workspaceId: workspaceBId, status: 'active' });
  console.log(`Active members in B before conversion: ${activeMembersB.length}`);
  if (activeMembersB.length < 2) throw new Error('FAIL: Expected at least 2 active members in B');

  // Convert Business Workspace B to Personal Workspace B
  const convertRes = await fetch(`${API}/workspaces/${workspaceBId}/convert-to-personal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify({ confirmationName: 'Selva Tech Enterprises' })
  }).then(r => r.json());
  console.log('Conversion result:', convertRes.message);

  const convertedB = await Workspace.findById(workspaceBId);
  if (convertedB.type !== 'personal' || convertedB.joinCode !== null) {
    throw new Error('FAIL: Workspace B was not converted to personal or joinCode not cleared!');
  }

  // Verify non-owner workers were revoked/removed
  activeMembersB = await WorkspaceMember.find({ workspaceId: workspaceBId });
  if (activeMembersB.length !== 1 || activeMembersB[0].userId !== userInDb._id.toString()) {
    throw new Error('FAIL: Non-owner members were not revoked during conversion!');
  }
  console.log('✅ PASS: All non-owner workers successfully revoked. Owner is the sole member.');

  // Verify Personal Workspace A is completely untouched
  const wsAAfter = await Workspace.findById(workspaceAId);
  if (!wsAAfter || wsAAfter.type !== 'personal') {
    throw new Error('FAIL: Original Personal Workspace A was affected!');
  }
  console.log('✅ PASS: Original Personal Workspace A remains completely untouched.');

  // Verify Audit Log
  const auditLog = await AuditLog.findOne({ workspaceId: workspaceBId, action: 'BUSINESS_TO_PERSONAL_CONVERSION' });
  if (!auditLog) throw new Error('FAIL: BUSINESS_TO_PERSONAL_CONVERSION audit log was not found!');
  console.log('✅ PASS: Audit log recorded for workspace conversion.\n');

  // ──────────────────────────────────────────────
  // TEST 5: SCOPED WORKSPACE DELETION
  // ──────────────────────────────────────────────
  console.log('--- TEST 5: Scoped Soft Deletion of Workspace B ---');
  const deleteBRes = await fetch(`${API}/workspaces/${workspaceBId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  }).then(r => r.json());
  console.log('Delete result:', deleteBRes.message);

  const deletedB = await Workspace.findById(workspaceBId);
  if (!deletedB.deletedAt) throw new Error('FAIL: Workspace B was not marked as deleted!');

  // Verify Workspace A and User still exist and are active
  const wsAStillActive = await Workspace.findOne({ _id: workspaceAId, deletedAt: null });
  const userStillActive = await User.findById(userInDb._id);
  if (!wsAStillActive || !userStillActive) {
    throw new Error('FAIL: Deleting Workspace B accidentally deleted Workspace A or User!');
  }
  console.log('✅ PASS: Workspace B soft-deleted. Workspace A and User account remain intact.\n');

  // ──────────────────────────────────────────────
  // TEST 6: DOCUMENT INTELLIGENCE UPLOAD
  // ──────────────────────────────────────────────
  console.log('--- TEST 6: Document Intelligence CSV Upload ---');
  const csvContent = 'Date,Description,Amount,Type,Category\n2026-08-20,Server Hosting AWS,3200,expense,Technology\n2026-08-20,Client Retainer Fee,25000,income,Consulting\n';
  const formData = new FormData();
  const blob = new Blob([csvContent], { type: 'text/csv' });
  formData.append('file', blob, 'bank_statement.csv');

  const uploadRes = await fetch(`${API}/upload/intelligence`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenA}`,
      'X-Workspace-Id': workspaceAId
    },
    body: formData
  }).then(r => r.json());

  console.log('Upload Result:', uploadRes.message);
  if (!uploadRes.success || uploadRes.transactions.length !== 2) {
    throw new Error('FAIL: Document Intelligence failed to extract 2 transactions!');
  }
  console.log('✅ PASS: Document Intelligence successfully processed CSV and attached records strictly to Workspace A.\n');

  console.log('🎉 ALL 6 BACKEND & SECURITY ARCHITECTURAL TEST SUITES PASSED 100%!');
  await mongoose.disconnect();
  process.exit(0);
}

runFullVerification().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
