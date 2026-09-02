import fs from 'fs';
import path from 'path';

const serverPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Update generateAndSendEmailOtp to support pendingUserData
const oldOtpFunc = `// Generate & Dispatch 6-digit OTP code with expiration & hashing
async function generateAndSendEmailOtp(userId, email, fullName = 'User') {
  const cleanEmail = email.toLowerCase().trim();
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiration

  await OTPVerification.deleteMany({ email: cleanEmail });

  await new OTPVerification({
    userId,
    email: cleanEmail,
    otpHash,
    expiresAt,
    attempts: 0,
    lastSentAt: new Date()
  }).save();

  console.log(\`\\n==================================================\`);
  console.log(\`🔑 [HISABHERO EMAIL VERIFICATION OTP]\`);
  console.log(\`Target Email : \${cleanEmail} (\${fullName})\`);
  console.log(\`OTP Code     : >>> \${otpCode} <<<\`);
  console.log(\`Expires At   : \${expiresAt.toISOString()} (5 mins)\`);
  console.log(\`==================================================\\n\`);

  try {
    await sendOtpEmail(cleanEmail, otpCode, fullName);
  } catch (err) {
    console.error('[OTP Dispatch Error]', err.message);
  }

  return { expiresAt, otpCode };
}`;

const newOtpFunc = `// Generate & Dispatch 6-digit OTP code with expiration & hashing (Supports pending registration data)
async function generateAndSendEmailOtp(userId, email, fullName = 'User', pendingUserData = null) {
  const cleanEmail = email.toLowerCase().trim();
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiration

  // Preserve existing pending registration data if not explicitly passed
  let finalPendingData = pendingUserData;
  if (!finalPendingData) {
    const existing = await OTPVerification.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
    if (existing && existing.pendingUserData) {
      finalPendingData = existing.pendingUserData;
    }
  }

  await OTPVerification.deleteMany({ email: cleanEmail });

  await new OTPVerification({
    userId: userId || null,
    email: cleanEmail,
    otpHash,
    expiresAt,
    attempts: 0,
    lastSentAt: new Date(),
    pendingUserData: finalPendingData || null
  }).save();

  console.log(\`\\n==================================================\`);
  console.log(\`🔑 [HISABHERO EMAIL VERIFICATION OTP]\`);
  console.log(\`Target Email : \${cleanEmail} (\${fullName})\`);
  console.log(\`OTP Code     : >>> \${otpCode} <<<\`);
  console.log(\`Expires At   : \${expiresAt.toISOString()} (5 mins)\`);
  console.log(\`==================================================\\n\`);

  try {
    await sendOtpEmail(cleanEmail, otpCode, fullName);
  } catch (err) {
    console.error('[OTP Dispatch Error]', err.message);
  }

  return { expiresAt, otpCode };
}`;

content = content.replace(oldOtpFunc, newOtpFunc);

// 2. Update POST /api/auth/signup to NOT save user to DB before verification
const oldSignupRoute = `app.post('/api/auth/signup', authRateLimiter, async (req, res) => {

  const { fullName, email, password, dateOfBirth, mobileNumber, profilePhoto } = req.body;

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {

    return res.status(400).json({ error: 'Valid email address and password are required.' });
  }


  // Validate password requirements (minimum 6 characters)
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const effectiveName = (fullName && fullName.trim()) ? fullName.trim() : 'User';
  const cleanEmail = email.toLowerCase().trim();
  console.log(\`[Signup] Registering account for: \${cleanEmail}\`);

  try {
    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      console.log(\`[Signup] User already exists: \${cleanEmail}\`);
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);


    const newUser = await new User({
      fullName: effectiveName,
      email: cleanEmail,
      password: hashedPassword,
      accountType: 'personal',
      dateOfBirth: dateOfBirth || '',
      mobileNumber: mobileNumber || '',
      profilePhoto: profilePhoto || '',
      profileImage: profilePhoto || '',
      phone: mobileNumber || '',
      isVerified: false,
      emailVerified: false
    }).save();

    const userId = newUser._id.toString();

    // Automatically create DEFAULT PERSONAL WORKSPACE: "My Personal Finance"
    const defaultWorkspace = await new Workspace({
      name: 'My Personal Finance',
      type: 'personal',
      isDefault: true,
      ownerId: userId,
      description: 'Primary Default Personal Finance Workspace'
    }).save();

    const defaultWsId = defaultWorkspace._id.toString();

    // Create WorkspaceMember link (Owner)
    await new WorkspaceMember({
      workspaceId: defaultWsId,
      userId: userId,
      role: 'owner',
      status: 'active'
    }).save();

    // Link user's defaultWorkspaceId
    newUser.defaultWorkspaceId = defaultWsId;
    await newUser.save();

    // Generate & Dispatch 6-digit Email OTP via Resend
    const otpInfo = await generateAndSendEmailOtp(userId, cleanEmail, effectiveName);

    return res.status(201).json({
      success: true,
      email: cleanEmail,
      needsVerification: true,
      otpCode: otpInfo?.otpCode,
      message: \`Registration successful. A 6-digit verification code has been sent to \${cleanEmail}. Please check your Inbox and Spam/Junk folder.\`,
      user: {
        id: userId,
        email: cleanEmail,
        fullName: effectiveName,
        accountType: 'personal',
        emailVerified: false,
        defaultWorkspaceId: defaultWsId,
      }
    });
  } catch (err) {
    console.error('[Signup] ❌ Unhandled Error:', err);
    return res.status(500).json({ error: 'Registration failed: ' + (err.message || 'Internal server error') });
  }
});`;

const newSignupRoute = `app.post('/api/auth/signup', authRateLimiter, async (req, res) => {
  const { fullName, email, password, dateOfBirth, mobileNumber, profilePhoto } = req.body;

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Valid email address and password are required.' });
  }

  // Validate password requirements (minimum 6 characters)
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const effectiveName = (fullName && fullName.trim()) ? fullName.trim() : 'User';
  const cleanEmail = email.toLowerCase().trim();
  console.log(\`[Signup] Initiating pending registration for: \${cleanEmail}\`);

  try {
    // Check if an already verified user exists in MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && existingUser.emailVerified) {
      console.log(\`[Signup] Verified user already exists: \${cleanEmail}\`);
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Bundle pending user data (DO NOT SAVE TO DATABASE YET)
    const pendingUserData = {
      fullName: effectiveName,
      email: cleanEmail,
      password: hashedPassword,
      accountType: 'personal',
      dateOfBirth: dateOfBirth || '',
      mobileNumber: mobileNumber || '',
      profilePhoto: profilePhoto || '',
      profileImage: profilePhoto || '',
      phone: mobileNumber || '',
    };

    // Generate & Dispatch 6-digit Email OTP with pending data
    const otpInfo = await generateAndSendEmailOtp(null, cleanEmail, effectiveName, pendingUserData);

    return res.status(201).json({
      success: true,
      email: cleanEmail,
      needsVerification: true,
      otpCode: otpInfo?.otpCode,
      message: \`Registration initiated. A 6-digit verification code has been sent to \${cleanEmail}. Please check your Inbox and Spam/Junk folder.\`,
      user: {
        email: cleanEmail,
        fullName: effectiveName,
        accountType: 'personal',
        emailVerified: false,
      }
    });
  } catch (err) {
    console.error('[Signup] ❌ Unhandled Error:', err);
    return res.status(500).json({ error: 'Registration failed: ' + (err.message || 'Internal server error') });
  }
});`;

content = content.replace(oldSignupRoute, newSignupRoute);

// 3. Update POST /api/auth/verify-email-otp to create user in DB upon successful OTP verification
const oldVerifyRoute = `// Verify verification code (Email OTP)
app.post(['/api/auth/verify-email-otp', '/api/auth/verify-email', '/api/auth/verify-code', '/api/auth/verify-otp', '/auth/verify-email', '/auth/verify-otp'], async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.toString().trim();

  try {
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Check OTPVerification record in MongoDB
    const otpRecord = await OTPVerification.findOne({ email: cleanEmail }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Your verification code has expired. Please request a new code.' });
    }

    // Expiration check (5 minutes)
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await OTPVerification.deleteMany({ email: cleanEmail });
      return res.status(400).json({ success: false, error: 'Your verification code has expired. Please request a new code.' });
    }

    // Maximum attempts check (5 max attempts)
    if (otpRecord.attempts >= 5) {
      await OTPVerification.deleteMany({ email: cleanEmail });
      return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new verification code.' });
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Hashed OTP verification (supports both SHA-256 and bcrypt)
    let isValid = false;
    if (otpRecord.otpHash.startsWith('$2a$') || otpRecord.otpHash.startsWith('$2b$')) {
      isValid = await bcrypt.compare(cleanCode, otpRecord.otpHash);
    } else {
      const sha256Hash = crypto.createHash('sha256').update(cleanCode).digest('hex');
      isValid = (sha256Hash === otpRecord.otpHash);
    }

    if (!isValid) {
      if (otpRecord.attempts >= 5) {
        await OTPVerification.deleteMany({ email: cleanEmail });
        return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new verification code.' });
      }
      return res.status(400).json({ success: false, error: "That verification code isn't correct. Please try again." });
    }

    // Activate User account
    const updatedUser = await User.findOneAndUpdate(
      { email: cleanEmail },
      { emailVerified: true, isVerified: true, verificationCode: null, verificationExpires: null },
      { new: true }
    );

    // Clean up used OTP records
    await OTPVerification.deleteMany({ email: cleanEmail });

    const userId = updatedUser._id.toString();
    const token = generateToken(userId);

    // Personal workspace info
    let personalWorkspace = { id: 'personal', name: 'My Personal Finance', type: 'personal', role: 'owner' };
    if (updatedUser.defaultWorkspaceId) {
      const dbWs = await Workspace.findById(updatedUser.defaultWorkspaceId).lean();
      if (dbWs) {
        personalWorkspace = { id: dbWs._id.toString(), name: dbWs.name, type: 'personal', role: 'owner', isDefault: true };
      }
    }

    return res.json({
      success: true,
      message: 'Email verified successfully. Welcome to HisabHero!',
      token,
      user: {
        id: userId,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        accountType: 'personal',
        emailVerified: true,
        personalWorkspace
      }
    });
  } catch (err) {
    console.error('[Verify OTP Error]', err);
    return res.status(500).json({ error: 'Verification failed due to a server error: ' + err.message });
  }
});`;

const newVerifyRoute = `// Verify verification code (Email OTP) — Creates User in DB ONLY upon verification success
app.post(['/api/auth/verify-email-otp', '/api/auth/verify-email', '/api/auth/verify-code', '/api/auth/verify-otp', '/auth/verify-email', '/auth/verify-otp'], async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.toString().trim();

  try {
    // Check OTPVerification record in MongoDB
    const otpRecord = await OTPVerification.findOne({ email: cleanEmail }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Your verification code has expired. Please request a new code.' });
    }

    // Expiration check (5 minutes)
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await OTPVerification.deleteMany({ email: cleanEmail });
      return res.status(400).json({ success: false, error: 'Your verification code has expired. Please request a new code.' });
    }

    // Maximum attempts check (5 max attempts)
    if (otpRecord.attempts >= 5) {
      await OTPVerification.deleteMany({ email: cleanEmail });
      return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new verification code.' });
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Hashed OTP verification (supports both SHA-256 and bcrypt)
    let isValid = false;
    if (otpRecord.otpHash.startsWith('$2a$') || otpRecord.otpHash.startsWith('$2b$')) {
      isValid = await bcrypt.compare(cleanCode, otpRecord.otpHash);
    } else {
      const sha256Hash = crypto.createHash('sha256').update(cleanCode).digest('hex');
      isValid = (sha256Hash === otpRecord.otpHash);
    }

    if (!isValid) {
      if (otpRecord.attempts >= 5) {
        await OTPVerification.deleteMany({ email: cleanEmail });
        return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new verification code.' });
      }
      return res.status(400).json({ success: false, error: "That verification code isn't correct. Please try again." });
    }

    // ─── OTP IS VALID: CREATE USER & DEFAULT WORKSPACE IN MONGODB NOW ───
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const pData = otpRecord.pendingUserData || {};
      user = await new User({
        fullName: pData.fullName || 'User',
        email: cleanEmail,
        password: pData.password || (await bcrypt.hash('Password@123', 10)),
        accountType: pData.accountType || 'personal',
        dateOfBirth: pData.dateOfBirth || '',
        mobileNumber: pData.mobileNumber || '',
        profilePhoto: pData.profilePhoto || '',
        profileImage: pData.profilePhoto || '',
        phone: pData.mobileNumber || '',
        isVerified: true,
        emailVerified: true
      }).save();

      const userId = user._id.toString();

      // Automatically create DEFAULT PERSONAL WORKSPACE: "My Personal Finance"
      const defaultWorkspace = await new Workspace({
        name: 'My Personal Finance',
        type: 'personal',
        isDefault: true,
        ownerId: userId,
        description: 'Primary Default Personal Finance Workspace'
      }).save();

      const defaultWsId = defaultWorkspace._id.toString();

      // Create WorkspaceMember link (Owner)
      await new WorkspaceMember({
        workspaceId: defaultWsId,
        userId: userId,
        role: 'owner',
        status: 'active'
      }).save();

      user.defaultWorkspaceId = defaultWsId;
      await user.save();
    } else {
      user.emailVerified = true;
      user.isVerified = true;
      await user.save();
    }

    // Clean up used OTP records
    await OTPVerification.deleteMany({ email: cleanEmail });

    const userId = user._id.toString();
    const token = generateToken(userId);

    // Personal workspace info
    let personalWorkspace = { id: 'personal', name: 'My Personal Finance', type: 'personal', role: 'owner' };
    if (user.defaultWorkspaceId) {
      const dbWs = await Workspace.findById(user.defaultWorkspaceId).lean();
      if (dbWs) {
        personalWorkspace = { id: dbWs._id.toString(), name: dbWs.name, type: 'personal', role: 'owner', isDefault: true };
      }
    }

    return res.json({
      success: true,
      message: 'Email verified successfully. Welcome to HisabHero!',
      token,
      user: {
        id: userId,
        email: user.email,
        fullName: user.fullName,
        accountType: user.accountType || 'personal',
        emailVerified: true,
        personalWorkspace
      }
    });
  } catch (err) {
    console.error('[Verify OTP Error]', err);
    return res.status(500).json({ error: 'Verification failed due to a server error: ' + err.message });
  }
});`;

content = content.replace(oldVerifyRoute, newVerifyRoute);

// 4. Update POST /api/auth/resend-email-otp to support resending for pending registrations
const oldResendRoute = `// Resend verification code (Email OTP)
app.post(['/api/auth/resend-email-otp', '/api/auth/resend-email', '/api/auth/resend-code', '/api/auth/resend-otp', '/auth/resend-email', '/auth/resend-otp'], authRateLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: 'Account with this email address was not found.' });
    }

    if (user.emailVerified && user.isVerified) {
      return res.status(400).json({ error: 'Your email address is already verified. Please sign in.' });
    }

    // Cooldown check (60 seconds)
    const existingOtp = await OTPVerification.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
    if (existingOtp && existingOtp.lastSentAt) {
      const timeElapsed = Date.now() - new Date(existingOtp.lastSentAt).getTime();
      if (timeElapsed < 60000) {
        const remainingSec = Math.ceil((60000 - timeElapsed) / 1000);
        return res.status(429).json({
          success: false,
          error: \`Please wait \${remainingSec} seconds before requesting a new verification code.\`,
          message: \`Please wait 60 seconds before requesting a new verification code.\`,
          retryAfter: remainingSec
        });
      }
    }

    // Generate & Dispatch new 6-digit OTP via Resend
    const otpInfo = await generateAndSendEmailOtp(user._id.toString(), cleanEmail, user.fullName);

    return res.json({
      success: true,
      otpCode: otpInfo?.otpCode,
      message: \`A new 6-digit verification code has been sent to \${cleanEmail}. Please check your Inbox and Spam/Junk folder.\`
    });
  } catch (err) {
    console.error('[Resend OTP Error]', err);
    return res.status(500).json({ error: 'Failed to resend verification code: ' + err.message });
  }
});`;

const newResendRoute = `// Resend verification code (Email OTP)
app.post(['/api/auth/resend-email-otp', '/api/auth/resend-email', '/api/auth/resend-code', '/api/auth/resend-otp', '/auth/resend-email', '/auth/resend-otp'], authRateLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: cleanEmail });
    if (user && user.emailVerified && user.isVerified) {
      return res.status(400).json({ error: 'Your email address is already verified. Please sign in.' });
    }

    const existingOtp = await OTPVerification.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
    if (!user && !existingOtp) {
      return res.status(404).json({ error: 'No pending registration found for this email address. Please sign up.' });
    }

    // Cooldown check (60 seconds)
    if (existingOtp && existingOtp.lastSentAt) {
      const timeElapsed = Date.now() - new Date(existingOtp.lastSentAt).getTime();
      if (timeElapsed < 60000) {
        const remainingSec = Math.ceil((60000 - timeElapsed) / 1000);
        return res.status(429).json({
          success: false,
          error: \`Please wait \${remainingSec} seconds before requesting a new verification code.\`,
          message: \`Please wait 60 seconds before requesting a new verification code.\`,
          retryAfter: remainingSec
        });
      }
    }

    const effectiveName = user?.fullName || existingOtp?.pendingUserData?.fullName || 'User';
    // Generate & Dispatch new 6-digit OTP
    const otpInfo = await generateAndSendEmailOtp(user?._id?.toString() || null, cleanEmail, effectiveName, existingOtp?.pendingUserData || null);

    return res.json({
      success: true,
      otpCode: otpInfo?.otpCode,
      message: \`A new 6-digit verification code has been sent to \${cleanEmail}. Please check your Inbox and Spam/Junk folder.\`
    });
  } catch (err) {
    console.error('[Resend OTP Error]', err);
    return res.status(500).json({ error: 'Failed to resend verification code: ' + err.message });
  }
});`;

content = content.replace(oldResendRoute, newResendRoute);

fs.writeFileSync(serverPath, content, 'utf8');
console.log("Successfully updated server.js so users are added to database ONLY AFTER successful email verification!");
