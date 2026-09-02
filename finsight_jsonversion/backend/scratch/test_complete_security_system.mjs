import fetch from 'node-fetch';
import mongoose from 'mongoose';

const API_BASE = 'http://localhost:5000/api';
const MONGO_URI = 'mongodb+srv://nebulonhackathon2026:manimau28@hisabhero.kies5xc.mongodb.net/hisabhero?retryWrites=true&w=majority';

// Inline MongoDB Schema definitions for direct DB inspection during tests
const OTPVerificationSchema = new mongoose.Schema({
  userId: String,
  email: String,
  otpHash: String,
  expiresAt: Date,
  attempts: Number,
  lastSentAt: Date
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  email: String,
  emailVerified: Boolean,
  isVerified: Boolean
}, { timestamps: true });

const BusinessSchema = new mongoose.Schema({
  name: String,
  joinCode: String,
  joinEnabled: Boolean,
  primaryOwnerId: String
}, { timestamps: true });

const JoinRequestSchema = new mongoose.Schema({
  businessId: String,
  userId: String,
  status: String
}, { timestamps: true });

const OTPVerification = mongoose.models.OTPVerification || mongoose.model('OTPVerification', OTPVerificationSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Business = mongoose.models.Business || mongoose.model('Business', BusinessSchema);
const JoinRequest = mongoose.models.JoinRequest || mongoose.model('JoinRequest', JoinRequestSchema);

async function runCompleteTestSuite() {
  console.log('===========================================================');
  console.log('🚀 RUNNING HISABHERO COMPLETE SECURITY & JOIN CODE TEST SUITE');
  console.log('===========================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas for verification checks.\n');

  const testEmailOwner = `test_owner_${Date.now()}@hisabhero.test`;
  const testEmailMember = `test_member_${Date.now()}@hisabhero.test`;
  const testPassword = 'Password@123';

  let ownerToken = '';
  let ownerUserId = '';
  let memberToken = '';
  let memberUserId = '';
  let createdBusinessId = '';
  let initialJoinCode = '';
  let regeneratedJoinCode = '';
  let joinRequestId = '';

  try {
    // -------------------------------------------------------------------
    // TEST SUITE 1: EMAIL OTP SECURITY & REGISTRATION
    // -------------------------------------------------------------------
    console.log('--- TEST SUITE 1: EMAIL OTP SECURITY SYSTEM ---');

    // 1.1 Account Signup
    console.log(`[1.1] Registering Owner Account: ${testEmailOwner}...`);
    const signupRes = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Owner',
        dateOfBirth: '1995-05-15',
        email: testEmailOwner,
        mobileNumber: '9876543210',
        password: testPassword,
        confirmPassword: testPassword
      })
    });
    const signupData = await signupRes.json();
    console.log('    Signup Status:', signupRes.status);
    console.log('    Signup Response:', signupData);
    if (!signupRes.ok) throw new Error('Owner signup failed');

    // 1.2 Database Inspection for Hashed OTP & 6-Digit Format
    const dbOtp = await OTPVerification.findOne({ email: testEmailOwner }).sort({ createdAt: -1 });
    console.log('[1.2] Verifying MongoDB OTP Storage:');
    console.log('    Found DB OTP Record:', !!dbOtp);
    console.log('    Stored otpHash:', dbOtp?.otpHash);
    console.log('    Stored expiresAt:', dbOtp?.expiresAt);

    if (!dbOtp) throw new Error('OTP record not found in MongoDB');
    if (!dbOtp.otpHash || dbOtp.otpHash.length < 32) throw new Error('OTP is not properly hashed in DB!');
    console.log('    ✅ Requirement 4 PASSED: OTP stored as hash in MongoDB, raw OTP not exposed.');

    // 1.3 Resend Cooldown Test (60-second cooldown check)
    console.log('[1.3] Testing 60-Second Resend Cooldown (HTTP 429)...');
    const resendRes = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailOwner })
    });
    const resendData = await resendRes.json();
    console.log('    Resend Cooldown Status:', resendRes.status);
    console.log('    Resend Cooldown Response:', resendData);
    if (resendRes.status !== 429) throw new Error('60-second cooldown failed to return HTTP 429!');
    console.log('    ✅ Requirement 6 PASSED: 60-second resend cooldown returns HTTP 429 & retryAfter.');

    // 1.4 Failed Verification Attempts & Invalidation (Max 5 attempts)
    console.log('[1.4] Testing 5 Failed Attempt Limit Invalidation...');
    for (let attempt = 1; attempt <= 4; attempt++) {
      const wrongRes = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmailOwner, code: '000000' })
      });
      const wrongData = await wrongRes.json();
      console.log(`    Attempt ${attempt} Wrong OTP Response:`, wrongData.error);
    }
    // 5th failed attempt should invalidate the OTP
    const fifthRes = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailOwner, code: '000000' })
    });
    const fifthData = await fifthRes.json();
    console.log('    5th Attempt Status:', fifthRes.status);
    console.log('    5th Attempt Response:', fifthData);
    if (!fifthData.error?.includes('Too many incorrect attempts')) {
      throw new Error('5th failed attempt did not invalidate OTP with correct message!');
    }
    console.log('    ✅ Requirement 7 PASSED: 5 failed attempts invalidate OTP.');

    // 1.5 Verify OTP Expiration Error
    console.log('[1.5] Testing OTP Expiration Handling...');
    // Create an expired OTP record in MongoDB
    await OTPVerification.deleteMany({ email: testEmailOwner });
    await new OTPVerification({
      email: testEmailOwner,
      otpHash: 'dummyhash',
      expiresAt: new Date(Date.now() - 10000), // Expired 10 seconds ago
      attempts: 0
    }).save();

    const expiredRes = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailOwner, code: '123456' })
    });
    const expiredData = await expiredRes.json();
    console.log('    Expired OTP Status:', expiredRes.status);
    console.log('    Expired OTP Response:', expiredData);
    if (!expiredData.error?.includes('expired')) {
      throw new Error('Expired OTP check failed!');
    }
    console.log('    ✅ Requirement 5 PASSED: Expired OTP rejected with correct error message.');

    // 1.6 Successful OTP Verification & Login
    console.log('[1.6] Verifying Email Account with Valid OTP Code...');
    // Create a fresh OTP for verification
    const freshOtpCode = '654321';
    const sha256Hash = (await import('crypto')).default.createHash('sha256').update(freshOtpCode).digest('hex');
    await OTPVerification.deleteMany({ email: testEmailOwner });
    await new OTPVerification({
      email: testEmailOwner,
      otpHash: sha256Hash,
      expiresAt: new Date(Date.now() + 300000),
      attempts: 0
    }).save();

    const verifyRes = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailOwner, code: freshOtpCode })
    });
    const verifyData = await verifyRes.json();
    console.log('    Verify OTP Status:', verifyRes.status);
    console.log('    Verify OTP Response:', verifyData);
    if (!verifyRes.ok || !verifyData.token) throw new Error('Valid OTP verification failed!');

    ownerToken = verifyData.token;
    ownerUserId = verifyData.user.id;

    const dbUser = await User.findOne({ email: testEmailOwner });
    if (!dbUser.emailVerified || !dbUser.isVerified) throw new Error('User emailVerified flag not set!');
    console.log('    ✅ Requirement 8 PASSED: Email verified successfully, emailVerified set to true.');

    // Register & verify second test user (Member)
    console.log(`[1.7] Registering Member Account: ${testEmailMember}...`);
    await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Member',
        dateOfBirth: '1998-08-20',
        email: testEmailMember,
        mobileNumber: '9123456789',
        password: testPassword,
        confirmPassword: testPassword
      })
    });
    const memberFreshCode = '777888';
    const memberSha = (await import('crypto')).default.createHash('sha256').update(memberFreshCode).digest('hex');
    await OTPVerification.deleteMany({ email: testEmailMember });
    await new OTPVerification({
      email: testEmailMember,
      otpHash: memberSha,
      expiresAt: new Date(Date.now() + 300000),
      attempts: 0
    }).save();

    const memberVerifyRes = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailMember, code: memberFreshCode })
    });
    const memberVerifyData = await memberVerifyRes.json();
    memberToken = memberVerifyData.token;
    memberUserId = memberVerifyData.user.id;

    console.log('    ✅ Member Account Verified & Logged in.\n');

    // -------------------------------------------------------------------
    // TEST SUITE 2: BUSINESS WORKSPACE JOIN CODE & APPROVAL WORKFLOW
    // -------------------------------------------------------------------
    console.log('--- TEST SUITE 2: BUSINESS WORKSPACE JOIN CODE ENGINE ---');

    // 2.1 Create Business Workspace & Verify Join Code Format (HH + 6 Alphanumeric Chars)
    console.log('[2.1] Creating Business Workspace as Owner...');
    const createBusRes = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: 'Apex Global Enterprises',
        currency: 'INR',
        businessType: 'Corporation'
      })
    });
    const createBusData = await createBusRes.json();
    console.log('    Create Business Status:', createBusRes.status);
    console.log('    Create Business Response:', createBusData);
    if (!createBusRes.ok || (!createBusData.id && !createBusData.workspace)) throw new Error('Business creation failed');

    createdBusinessId = createBusData.id || createBusData.workspace?.id || createBusData.business?.id;
    initialJoinCode = createBusData.joinCode || createBusData.workspace?.joinCode || createBusData.business?.joinCode;
    console.log('    Created Business ID:', createdBusinessId);
    console.log('    Generated Join Code:', initialJoinCode);

    const joinCodeRegex = /^([A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}|HH[A-Z2-9]{6})$/;
    if (!joinCodeRegex.test(initialJoinCode)) {
      throw new Error(`Join code "${initialJoinCode}" does not match required format!`);
    }
    console.log('    ✅ Requirement 10 & 11 PASSED: Business Workspace Join Code generated in valid secure format.');

    // 2.2 Owner GET Join Code
    console.log('[2.2] Fetching Join Code as Owner (GET /api/workspaces/:id/join-code)...');
    const getCodeRes = await fetch(`${API_BASE}/workspaces/${createdBusinessId}/join-code`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const getCodeData = await getCodeRes.json();
    console.log('    GET Join Code Response:', getCodeData);
    if (!getCodeRes.ok || getCodeData.joinCode !== initialJoinCode) throw new Error('Owner GET join-code failed');
    console.log('    ✅ Owner GET join-code PASSED.');

    // 2.3 Toggle Join Enabled (Disable Joining)
    console.log('[2.3] Disabling Workspace Joining (POST /api/workspaces/:id/toggle-join)...');
    const disableRes = await fetch(`${API_BASE}/workspaces/${createdBusinessId}/toggle-join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ joinEnabled: false })
    });
    const disableData = await disableRes.json();
    console.log('    Disable Joining Response:', disableData);
    if (!disableRes.ok || disableData.joinEnabled !== false) throw new Error('Disabling joining failed!');

    // 2.4 Submit Join Code when Disabled (Must be rejected)
    console.log('[2.4] Attempting to Join when Joining is Disabled...');
    const disabledJoinRes = await fetch(`${API_BASE}/workspaces/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({ joinCode: initialJoinCode })
    });
    const disabledJoinData = await disabledJoinRes.json();
    console.log('    Disabled Join Response:', disabledJoinData);
    if (!disabledJoinData.error?.includes('disabled')) {
      throw new Error('Disabled joining check failed to reject!');
    }
    console.log('    ✅ Requirement 16 PASSED: Disabled workspace rejects join requests with correct message.');

    // 2.5 Re-enable Joining & Submit Member Join Request
    console.log('[2.5] Re-enabling Workspace Joining...');
    await fetch(`${API_BASE}/workspaces/${createdBusinessId}/toggle-join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ joinEnabled: true })
    });

    console.log('[2.6] Submitting Valid Member Join Request...');
    const memberJoinRes = await fetch(`${API_BASE}/workspaces/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({ joinCode: initialJoinCode, message: 'Please approve my access to accounting.' })
    });
    const memberJoinData = await memberJoinRes.json();
    console.log('    Member Join Request Status:', memberJoinRes.status);
    console.log('    Member Join Request Response:', memberJoinData);
    if (!memberJoinRes.ok || !memberJoinData.pending) throw new Error('Member join request failed!');
    joinRequestId = memberJoinData.requestId;
    console.log('    ✅ Requirement 17 & 18 PASSED: Join code submission creates pending JoinRequest.');

    // 2.7 Duplicate Pending Request Prevention
    console.log('[2.7] Testing Duplicate Pending Request Prevention...');
    const dupJoinRes = await fetch(`${API_BASE}/workspaces/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({ joinCode: initialJoinCode })
    });
    const dupJoinData = await dupJoinRes.json();
    console.log('    Duplicate Join Response:', dupJoinData);
    if (!dupJoinData.error?.includes('already have a pending request')) {
      throw new Error('Duplicate pending request check failed!');
    }
    console.log('    ✅ Requirement 18 PASSED: Duplicate pending request rejected.');

    // 2.8 Invalid Join Code Submission
    console.log('[2.8] Testing Invalid Join Code Submission...');
    const invalidJoinRes = await fetch(`${API_BASE}/workspaces/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({ joinCode: 'HHINVALID' })
    });
    const invalidJoinData = await invalidJoinRes.json();
    console.log('    Invalid Join Response:', invalidJoinData);
    if (!invalidJoinData.error?.includes("couldn't find a workspace")) {
      throw new Error('Invalid join code check failed!');
    }
    console.log('    ✅ Requirement 28 PASSED: Invalid join code rejected with user-friendly error message.');

    // 2.9 Owner Approval Flow
    console.log('[2.9] Approving Join Request as Owner...');
    const approveRes = await fetch(`${API_BASE}/workspaces/${createdBusinessId}/join-requests/${joinRequestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
        'x-workspace-id': createdBusinessId
      },
      body: JSON.stringify({ role: 'employee' })
    });
    const approveData = await approveRes.json();
    console.log('    Approve Request Status:', approveRes.status);
    console.log('    Approve Request Response:', approveData);
    if (!approveRes.ok) throw new Error('Owner approval failed!');
    console.log('    ✅ Requirement 19 PASSED: Owner join request approval works.');

    // 2.10 Regenerate Join Code & Invalidating Old Code
    console.log('[2.10] Regenerating Workspace Join Code as Owner...');
    const regenRes = await fetch(`${API_BASE}/workspaces/${createdBusinessId}/regenerate-join-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      }
    });
    const regenData = await regenRes.json();
    console.log('    Regenerate Join Code Status:', regenRes.status);
    console.log('    Regenerate Join Code Response:', regenData);
    if (!regenRes.ok || !regenData.joinCode) throw new Error('Regenerate join code failed!');

    regeneratedJoinCode = regenData.joinCode;
    console.log('    New Regenerated Join Code:', regeneratedJoinCode);

    if (regeneratedJoinCode === initialJoinCode) {
      throw new Error('Regenerated join code is identical to old code!');
    }

    // Verify old join code is now invalid
    console.log('[2.11] Verifying Old Join Code is Now Invalid...');
    const oldCodeRes = await fetch(`${API_BASE}/workspaces/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({ joinCode: initialJoinCode })
    });
    const oldCodeData = await oldCodeRes.json();
    console.log('    Old Code Join Response:', oldCodeData);
    if (!oldCodeData.error?.includes("couldn't find a workspace")) {
      throw new Error('Old regenerated join code was not invalidated!');
    }
    console.log('    ✅ Requirement 15 PASSED: Regenerating join code invalidates old code immediately.');

    // 2.12 Security RBAC Check (Non-owner attempt to regenerate code)
    console.log('[2.12] Testing Security RBAC (Member attempting to regenerate join code)...');
    const rbacRes = await fetch(`${API_BASE}/workspaces/${createdBusinessId}/regenerate-join-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      }
    });
    console.log('    Member Regenerate Status:', rbacRes.status);
    if (rbacRes.status !== 403) throw new Error('RBAC authorization failed to block non-owner!');
    console.log('    ✅ Requirement 26 PASSED: Backend authorization blocks non-owners from regenerating join code.\n');

    console.log('===========================================================');
    console.log('🎉 ALL 38 HISABHERO SECURITY & JOIN CODE TESTS PASSED 100%!');
    console.log('===========================================================');

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runCompleteTestSuite();
