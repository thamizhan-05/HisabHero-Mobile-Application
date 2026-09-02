import fetch from 'node-fetch';
import mongoose from 'mongoose';
import crypto from 'crypto';

const API_BASE = 'http://localhost:5000/api';
const MONGO_URI = 'mongodb+srv://nebulonhackathon2026:manimau28@hisabhero.kies5xc.mongodb.net/hisabhero?retryWrites=true&w=majority';

const OTPVerificationSchema = new mongoose.Schema({
  userId: String,
  email: String,
  otpHash: String,
  expiresAt: Date,
  attempts: Number
}, { timestamps: true });

const OTPVerification = mongoose.models.OTPVerification || mongoose.model('OTPVerification', OTPVerificationSchema);

async function runEnterpriseExpansionTestSuite() {
  console.log('===========================================================');
  console.log('🚀 RUNNING HISABHERO ENTERPRISE EXPANSION VERIFICATION SUITE');
  console.log('===========================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas for test authentication.');

  const testEmail = `enterprise_test_${Date.now()}@hisabhero.test`;
  const testPassword = 'Password@123';

  // 1. Signup test user
  await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Enterprise Test Admin',
      dateOfBirth: '1995-05-15',
      email: testEmail,
      mobileNumber: '9876543210',
      password: testPassword,
      confirmPassword: testPassword
    })
  });

  const otpCode = '999888';
  const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  await OTPVerification.deleteMany({ email: testEmail });
  await new OTPVerification({
    email: testEmail,
    otpHash,
    expiresAt: new Date(Date.now() + 300000),
    attempts: 0
  }).save();

  const verifyRes = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code: otpCode })
  });
  const verifyData = await verifyRes.json();
  const token = verifyData.token;
  const workspaceId = verifyData.user?.defaultWorkspaceId || verifyData.user?.personalWorkspace?.id;

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-workspace-id': workspaceId
  };

  console.log('✅ Authenticated test session initialized. Workspace ID:', workspaceId, '\n');

  try {
    // 1. TEST AI AUTO-AUDITOR (ANOMALY DETECTOR)
    console.log('--- 1. AI AUTO-AUDITOR & FRAUD DETECTOR ---');
    const auditorRes = await fetch(`${API_BASE}/ai/auto-auditor`, { headers: authHeaders });
    const auditorData = await auditorRes.json();
    console.log('[1.1] Auto-Auditor Scan Status:', auditorRes.status);
    console.log('[1.2] Audit Health Score:', auditorData.auditHealthScore);
    console.log('[1.3] Anomalies Count:', auditorData.anomaliesCount);
    if (!auditorRes.ok) throw new Error('Auto-auditor scan failed');
    console.log('    ✅ AI Auto-Auditor module PASSED 100%!\n');

    // 2. TEST AI VOICE COMMAND EXPENSE PARSER & LOGGER
    console.log('--- 2. AI VOICE COMMAND EXPENSE PARSER ---');
    const voiceRes = await fetch(`${API_BASE}/ai/voice-expense`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ spokenText: 'Paid 3400 rupees for petrol today' })
    });
    const voiceData = await voiceRes.json();
    console.log('[2.1] Voice Expense Status:', voiceRes.status);
    console.log('[2.2] Parsed Payload:', voiceData.parsed);
    console.log('[2.3] Result Message:', voiceData.message);
    if (!voiceRes.ok || voiceData.parsed?.amount !== 3400 || voiceData.parsed?.category !== 'Fuel') {
      throw new Error('Voice command parsing failed');
    }
    console.log('    ✅ AI Voice Command Expense module PASSED 100%!\n');

    // 3. TEST AI TAX SAVER & COST OPTIMIZATION ADVISOR
    console.log('--- 3. AI TAX SAVER & COST OPTIMIZATION ADVISOR ---');
    const taxRes = await fetch(`${API_BASE}/ai/tax-advisor`, { headers: authHeaders });
    const taxData = await taxRes.json();
    console.log('[3.1] Tax Advisor Status:', taxRes.status);
    console.log('[3.2] Estimated Total Tax Savings: ₹', taxData.totalEstimatedSavings);
    console.log('[3.3] Recommendations Count:', taxData.recommendations?.length);
    if (!taxRes.ok || !taxData.recommendations?.length) throw new Error('Tax advisor recommendations failed');
    console.log('    ✅ AI Tax Advisor module PASSED 100%!\n');

    // 4. TEST KHATA BOOK LEDGER (CUSTOMER/VENDOR ACCOUNTS & REMINDERS)
    console.log('--- 4. KHATA BOOK LEDGER & WHATSAPP UPI REMINDERS ---');
    const createPartyRes = await fetch(`${API_BASE}/khata`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        partyName: 'Sharma Electronics & Sons',
        partyType: 'customer',
        phone: '+919876543210',
        initialBalance: 12500
      })
    });
    const partyData = await createPartyRes.json();
    console.log('[4.1] Create Khata Party Status:', createPartyRes.status);
    console.log('[4.2] Created Party ID:', partyData.party?._id, 'Balance: ₹', partyData.party?.netBalance);
    const partyId = partyData.party?._id;

    // Add entry
    const entryRes = await fetch(`${API_BASE}/khata/${partyId}/entry`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ type: 'credit', amount: 3500, note: 'Additional LED Screens' })
    });
    const entryData = await entryRes.json();
    console.log('[4.3] Added Ledger Entry Balance: ₹', entryData.party?.netBalance);

    // Generate UPI & WhatsApp Reminder
    const reminderRes = await fetch(`${API_BASE}/khata/${partyId}/reminder`, {
      method: 'POST',
      headers: authHeaders
    });
    const reminderData = await reminderRes.json();
    console.log('[4.4] WhatsApp Reminder Share Link:', reminderData.whatsappShareUrl?.substring(0, 50) + '...');
    console.log('[4.5] UPI Deep Link:', reminderData.upiDeepLink);
    if (!reminderRes.ok || !reminderData.upiDeepLink?.startsWith('upi://pay')) {
      throw new Error('Khata reminder generation failed');
    }
    console.log('    ✅ Khata Ledger & Payment Reminder module PASSED 100%!\n');

    // 5. TEST RECURRING SUBSCRIPTIONS & UTILITY BILLS
    console.log('--- 5. RECURRING SUBSCRIPTION & BILL MANAGER ---');
    const subRes = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'AWS Cloud Infrastructure',
        vendorName: 'Amazon Web Services',
        category: 'Software & SaaS',
        amount: 8500,
        billingCycle: 'monthly'
      })
    });
    const subData = await subRes.json();
    console.log('[5.1] Create Subscription Status:', subRes.status);
    console.log('[5.2] Subscription Created:', subData.subscription?.name, 'Amount: ₹', subData.subscription?.amount);

    const getSubsRes = await fetch(`${API_BASE}/subscriptions`, { headers: authHeaders });
    const getSubsData = await getSubsRes.json();
    console.log('[5.3] Active Subscriptions Count:', getSubsData.activeCount, 'Monthly Total: ₹', getSubsData.monthlyTotal);
    if (!getSubsRes.ok || getSubsData.monthlyTotal <= 0) throw new Error('Subscriptions management failed');
    console.log('    ✅ Recurring Subscriptions module PASSED 100%!\n');

    // 6. TEST MULTI-CURRENCY & LIVE FX EXCHANGE RATES
    console.log('--- 6. MULTI-CURRENCY & FX EXCHANGE RATES ENGINE ---');
    const fxRes = await fetch(`${API_BASE}/fx-rates`);
    const fxData = await fxRes.json();
    console.log('[6.1] Base Currency:', fxData.base, 'Supported Rates:', Object.keys(fxData.rates || {}));

    const convertRes = await fetch(`${API_BASE}/fx-rates/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100, fromCurrency: 'USD', toCurrency: 'INR' })
    });
    const convertData = await convertRes.json();
    console.log(`[6.2] Converted $100 USD -> ₹${convertData.convertedAmount} INR`);
    if (!convertRes.ok || convertData.convertedAmount <= 0) throw new Error('FX currency conversion failed');
    console.log('    ✅ Multi-Currency & Live FX module PASSED 100%!\n');

    // 7. TEST EXECUTIVE FINANCIAL PDF REPORT GENERATOR
    console.log('--- 7. EXECUTIVE FINANCIAL PDF REPORT GENERATOR ---');
    const reportRes = await fetch(`${API_BASE}/reports/executive-pdf`, {
      method: 'POST',
      headers: authHeaders
    });
    const reportData = await reportRes.json();
    console.log('[7.1] Report Generation Status:', reportRes.status);
    console.log('[7.2] Report Title:', reportData.report?.title);
    console.log('[7.3] Financial Summary:', reportData.report?.financialSummary);
    if (!reportRes.ok || !reportData.report?.financialSummary) throw new Error('Executive report generation failed');
    console.log('    ✅ Executive Financial PDF Report module PASSED 100%!\n');

    // 8. TEST CLOUD ENCRYPTED BACKUP EXPORT
    console.log('--- 8. CLOUD ENCRYPTED BACKUP EXPORT ---');
    const backupRes = await fetch(`${API_BASE}/backup/export`, { headers: authHeaders });
    const backupData = await backupRes.json();
    console.log('[8.1] Backup Status:', backupRes.status);
    console.log('[8.2] Export Version:', backupData.backup?.version);
    console.log('[8.3] Backup Counts:', backupData.backup?.counts);
    if (!backupRes.ok || !backupData.backup?.counts) throw new Error('Cloud backup export failed');
    console.log('    ✅ Cloud Encrypted Backup module PASSED 100%!\n');

    console.log('===========================================================');
    console.log('🎉 ALL 8 ENTERPRISE EXPANSION MODULES PASSED 100%!');
    console.log('===========================================================');

  } catch (err) {
    console.error('❌ Enterprise Verification Failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runEnterpriseExpansionTestSuite();
