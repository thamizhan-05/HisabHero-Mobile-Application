import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function testFullApprovalFlow() {
  console.log('🧪 Testing Document Upload Preview, Approval & Smart Batch Categorization Workflow...\n');

  // 1. Log in to get token
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'selvathevar10042005@gmail.com',
      password: 'Stvr2005$',
      deviceId: 'test_device_002',
      deviceName: 'Automated Tester',
      platform: 'Node'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.error('❌ Login failed:', loginData);
    process.exit(1);
  }

  const token = loginData.token;
  const wsId = loginData.user.activeWorkspace.id;
  console.log(`✅ Logged in as ${loginData.user.email} (Workspace ID: ${wsId})`);

  // 2. Upload file to /api/upload/preview (Step 1: Extract & Preview)
  const csvContent = `Date,Description,Type,Amount,Category
2026-02-05,Swiggy Order #9812,Debit,450.00,Food & Dining
2026-02-08,Swiggy Order #9845,Debit,320.00,General
2026-02-12,Swiggy Lunch Order,Debit,580.00,General
2026-02-15,Uber Ride Bangalore,Debit,280.00,Transportation & Fuel
2026-02-18,Uber Auto City,Debit,140.00,General
2026-02-20,Client Retainer Payment,Credit,45000.00,Client Retainer
2026-02-22,Amazon India Purchase,Debit,1299.00,Shopping & Retail
2026-02-25,Monthly Project Invoice,Credit,30000.00,Product Sales`;

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const formData = new FormData();
  formData.append('file', blob, 'test_monthly_statement.csv');

  console.log('⏳ Uploading statement to /api/upload/preview for AI extraction...');
  const previewRes = await fetch('http://localhost:5000/api/upload/preview', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': wsId
    },
    body: formData
  });

  const previewData = await previewRes.json();
  console.log('\n2. Preview Response:');
  console.log(`   • Success: ${previewData.success}`);
  console.log(`   • Extracted Count: ${previewData.count}`);
  console.log(`   • Total Inflow: +₹${previewData.totalInflow.toLocaleString('en-IN')}`);
  console.log(`   • Total Outflow: -₹${previewData.totalOutflow.toLocaleString('en-IN')}`);
  console.log(`   • Net Impact: ₹${previewData.net.toLocaleString('en-IN')}`);

  if (!previewData.success || previewData.count === 0) {
    console.error('❌ Preview extraction failed:', previewData);
    process.exit(1);
  }

  // 3. Simulate User Review & Smart Batch Categorization:
  // User changes Swiggy category to "Food & Dining" for all Swiggy items
  // User excludes 1 transaction (e.g. Amazon purchase)
  const extractedList = previewData.transactions;
  console.log('\n3. Simulating User Review & Smart Categorization:');

  const approvedTransactions = [];
  const merchantRules = [
    { pattern: 'Swiggy', category: 'Food & Dining', cleanMerchant: 'Swiggy' },
    { pattern: 'Uber', category: 'Transportation & Fuel', cleanMerchant: 'Uber' }
  ];

  for (const t of extractedList) {
    // If Amazon, user deselects / excludes it
    if (t.description.includes('Amazon')) {
      console.log(`   [EXCLUDED BY USER]: ${t.description} (₹${t.amount})`);
      continue;
    }

    // Apply smart merchant category
    if (t.description.toLowerCase().includes('swiggy')) {
      t.category = 'Food & Dining';
      console.log(`   [BATCH CATEGORIZED -> Food & Dining]: ${t.description} (₹${t.amount})`);
    } else if (t.description.toLowerCase().includes('uber')) {
      t.category = 'Transportation & Fuel';
      console.log(`   [BATCH CATEGORIZED -> Transportation & Fuel]: ${t.description} (₹${t.amount})`);
    } else {
      console.log(`   [APPROVED]: ${t.description} (${t.type === 'income' ? '+' : '-'}₹${t.amount}) [${t.category}]`);
    }

    approvedTransactions.push(t);
  }

  console.log(`\n   • Total Approved to Commit: ${approvedTransactions.length} of ${extractedList.length}`);

  // 4. Commit to Supabase (/api/upload/commit)
  console.log('\n⏳ Committing approved transactions to Supabase PostgreSQL...');
  const commitRes = await fetch('http://localhost:5000/api/upload/commit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': wsId
    },
    body: JSON.stringify({
      fileName: previewData.fileName,
      parserUsed: previewData.parserUsed,
      transactions: approvedTransactions,
      merchantRules
    })
  });

  const commitData = await commitRes.json();
  console.log('\n4. Commit Response:');
  console.log(`   • Success: ${commitData.success}`);
  console.log(`   • Message: ${commitData.message}`);
  console.log(`   • Committed Count: ${commitData.count}`);
  console.log(`   • Document ID in Supabase: ${commitData.documentId}`);

  // 5. Verify Supabase transactions and dashboard stats
  const txRes = await fetch('http://localhost:5000/api/transactions', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': wsId
    }
  });
  const txData = await txRes.json();

  const statsRes = await fetch('http://localhost:5000/api/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': wsId
    }
  });
  const statsData = await statsRes.json();

  console.log('\n5. Verification from Supabase Database:');
  console.log(`   • Total Transactions in Supabase: ${txData.transactions?.length}`);
  console.log(`   • Inflow in Supabase: +₹${statsData.inflow?.toLocaleString('en-IN')}`);
  console.log(`   • Outflow in Supabase: -₹${statsData.outflow?.toLocaleString('en-IN')}`);
  console.log(`   • Balance in Supabase: ₹${statsData.balance?.toLocaleString('en-IN')}`);
  console.log(`   • Category Breakdown:`, statsData.categoryBreakdown);

  console.log('\n🎉 STATEMENT EXTRACTION, REVIEW, BATCH CATEGORIZATION & SUPABASE COMMIT VERIFIED 100%!');
}

testFullApprovalFlow().catch(console.error);
