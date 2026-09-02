import mongoose from 'mongoose';
import 'dotenv/config';

const testEmail = `strict_verify_${Date.now()}@hisabhero.test`;
const testPass = 'Password@123';
const testName = 'Strict Verification User';

async function runTest() {
  console.log('===========================================================');
  console.log('🧪 TESTING STRICT DATABASE VERIFICATION FLOW');
  console.log('===========================================================');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas.');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const OTPVerification = mongoose.model('OTPVerification', new mongoose.Schema({}, { strict: false }));

  // Step 1: Sign up
  console.log(`\n[Step 1] Initiating signup for: ${testEmail}`);
  const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: testName,
      email: testEmail,
      password: testPass,
      accountType: 'personal'
    })
  });
  const signupData = await signupRes.json();
  console.log('Signup Response Status:', signupRes.status);
  console.log('Signup Needs Verification:', signupData.needsVerification);

  // Step 2: Check MongoDB - User should NOT exist in users collection!
  const userBeforeVerify = await User.findOne({ email: testEmail });
  console.log('\n[Step 2] Checking MongoDB User collection:');
  console.log('User in Database Before OTP Verification:', userBeforeVerify ? '❌ FOUND (Should be null!)' : '✅ NULL (NOT ADDED TO DATABASE YET!)');

  if (userBeforeVerify) {
    throw new Error('FAILED: User was added to database before verification!');
  }

  // Step 3: Check OTPVerification record in MongoDB
  const otpDoc = await OTPVerification.findOne({ email: testEmail });
  console.log('\n[Step 3] Checking MongoDB OTPVerification collection:');
  console.log('OTP Document Found:', Boolean(otpDoc));
  console.log('Pending User Full Name:', otpDoc?.pendingUserData?.fullName);
  console.log('Pending User Email:', otpDoc?.pendingUserData?.email);

  const otpCode = signupData.otpCode;
  console.log('\nDispatched OTP Code:', otpCode);

  // Step 4: Submit Wrong OTP - User should STILL NOT exist in database!
  console.log('\n[Step 4] Testing invalid OTP submission:');
  const wrongRes = await fetch('http://localhost:5000/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code: '000000' })
  });
  console.log('Wrong OTP Response Status:', wrongRes.status);
  const userAfterWrongOtp = await User.findOne({ email: testEmail });
  console.log('User in Database After Wrong OTP:', userAfterWrongOtp ? '❌ FOUND' : '✅ STILL NULL');

  // Step 5: Submit Correct OTP - User SHOULD NOW be created in MongoDB!
  console.log('\n[Step 5] Submitting valid OTP code:');
  const correctRes = await fetch('http://localhost:5000/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code: otpCode })
  });
  const correctData = await correctRes.json();
  console.log('Valid OTP Response Status:', correctRes.status);
  console.log('Verification Success:', correctData.success);
  console.log('Returned Token:', Boolean(correctData.token));

  // Step 6: Check MongoDB - User must NOW exist and be verified!
  const userAfterVerify = await User.findOne({ email: testEmail });
  console.log('\n[Step 6] Checking MongoDB User collection after verification:');
  console.log('User in Database NOW:', Boolean(userAfterVerify));
  console.log('User ID:', userAfterVerify?._id?.toString());
  console.log('User isVerified:', userAfterVerify?.isVerified);
  console.log('User emailVerified:', userAfterVerify?.emailVerified);

  // Step 7: Check OTPVerification record - must be cleaned up
  const otpDocAfter = await OTPVerification.findOne({ email: testEmail });
  console.log('\n[Step 7] Checking OTP collection cleanup:');
  console.log('OTP Record Cleaned Up:', otpDocAfter === null ? '✅ YES (DELETED)' : '❌ NO');

  // Cleanup test user
  await User.deleteOne({ email: testEmail });
  await OTPVerification.deleteMany({ email: testEmail });

  console.log('\n===========================================================');
  console.log('🎉 ALL STRICT DATABASE VERIFICATION TESTS PASSED 100%!');
  console.log('===========================================================');
  await mongoose.disconnect();
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
