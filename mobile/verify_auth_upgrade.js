const API_URL = 'http://localhost:5000/api';

const testEmail = `auth_test_${Date.now()}@hisabhero.com`;
const testPassword = 'Password123!';

async function runTest() {
  console.log('🔄 STARTING COMPREHENSIVE AUTH UPGRADE INTEGRATION TEST...');

  try {
    // 1. Sign up user (should trigger OTP generation)
    console.log(`\n👤 Step 1: Registering user: ${testEmail}...`);
    const signupRes = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Auth Tester', email: testEmail, password: testPassword, companyName: 'Global Inc' })
    });
    const signupData = await signupRes.json();
    console.log(`👉 Signup status: ${signupRes.status}`);
    if (signupRes.status !== 201 && signupRes.status !== 200) {
      throw new Error(`Expected 201/200, got ${signupRes.status}`);
    }
    console.log('✅ Correct: Registration successful, verification code sent.');

    // 2. Block login if unverified
    console.log('\n🔒 Step 2: Verifying unverified login block...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    console.log(`👉 Login status: ${loginRes.status}, needsVerification: ${loginData.needsVerification}`);
    if (loginRes.status !== 403 || loginData.needsVerification !== true) {
      throw new Error('Expected 403 with needsVerification: true');
    }
    console.log('✅ Correct: Login blocked.');

    // 3. Verify OTP code
    console.log('\n🔑 Step 3: Verifying account using OTP...');
    console.log('\n📡 Querying API test-harness for regenerated OTP code...');
    const otpRes = await fetch(`${API_URL}/auth/test-otp-code?email=${testEmail}`);
    const otpData = await otpRes.json();
    const otpCode = otpData.code;
    console.log(`👉 Verification OTP: ${otpCode}`);
    if (!otpCode) {
      throw new Error('Verification OTP was not returned by the API');
    }

    const verifyRes = await fetch(`${API_URL}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, code: otpCode })
    });
    const verifyData = await verifyRes.json();
    console.log(`👉 Verify status: ${verifyRes.status}, token length: ${verifyData.token?.length}`);
    if (verifyRes.status !== 200 || !verifyData.token) {
      throw new Error('Verification failed');
    }
    console.log('✅ Correct: Account verified.');

    // 4. Test Forgot Password code generation
    console.log('\n📦 Step 4: Requesting Password Reset Code...');
    const forgotRes = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const forgotData = await forgotRes.json();
    console.log(`👉 Forgot Password status: ${forgotRes.status}`);
    if (forgotRes.status !== 200 || forgotData.success !== true) {
      throw new Error('Forgot password request failed');
    }
    
    // Retrieve reset code from harness
    const resetCodeRes = await fetch(`${API_URL}/auth/test-otp-code?email=${testEmail}`);
    const resetCodeData = await resetCodeRes.json();
    const resetCode = resetCodeData.code;
    console.log(`👉 Reset Password Code: ${resetCode}`);

    // 5. Test Reset Password action
    console.log('\n🔄 Step 5: Submitting Password Reset action...');
    const resetRes = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, code: resetCode, newPassword: 'NewSecurePassword1!' })
    });
    const resetData = await resetRes.json();
    console.log(`👉 Reset password status: ${resetRes.status}`);
    if (resetRes.status !== 200 || resetData.success !== true) {
      throw new Error('Password reset failed');
    }
    console.log('✅ Correct: Password reset successfully.');

    // 6. Test login with new password
    console.log('\n🔒 Step 6: Logging in with new password...');
    const loginRes2 = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'NewSecurePassword1!' })
    });
    const loginData2 = await loginRes2.json();
    console.log(`👉 Login status: ${loginRes2.status}, token length: ${loginData2.token?.length}`);
    if (loginRes2.status !== 200 || !loginData2.token) {
      throw new Error('Login with new password failed');
    }
    console.log('✅ Correct: Logged in successfully.');

    // 7. Google OAuth simulation: Registering a new Google user
    const googleEmail = `google_test_${Date.now()}@gmail.com`;
    console.log(`\n💱 Step 7: Simulating signup for new Google user: ${googleEmail}...`);
    const googleRes = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: `mock-google-token-${googleEmail}-Google_Tester` })
    });
    const googleData = await googleRes.json();
    console.log(`👉 Google sign-in status: ${googleRes.status}, isNewUser: ${googleData.isNewUser}`);
    if (googleRes.status !== 200 || googleData.isNewUser !== true) {
      throw new Error('Google new user signup failed');
    }
    console.log('✅ Correct: New Google account created.');

    // 8. Google OAuth simulation: Account linking (existing standard email login links to Google)
    console.log(`\n🔗 Step 8: Linking Google sign-in to existing email-registered user: ${testEmail}...`);
    const linkRes = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: `mock-google-token-${testEmail}-Auth_Tester` })
    });
    const linkData = await linkRes.json();
    console.log(`👉 Link status: ${linkRes.status}, isNewUser: ${linkData.isNewUser}`);
    if (linkRes.status !== 200 || linkData.isNewUser !== false) {
      throw new Error('Google account linking failed');
    }
    console.log('✅ Correct: Google provider linked to existing account without duplicating it!');

    console.log('\n🎉 ALL COMPREHENSIVE AUTHENTICATION UPGRADE INTEGRATION TESTS PASSED SUCCESSFULLY! 100% CORRECT!');
  } catch (err) {
    console.error(`\n❌ TEST SUITE FAILED: ${err.message}`);
    process.exit(1);
  }
}

runTest();
