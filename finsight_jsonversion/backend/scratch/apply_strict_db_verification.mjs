import fs from 'fs';
import path from 'path';

const serverPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Replace Signup Route (Lines ~610 to ~720)
const signupTarget = `app.post('/api/auth/signup', async (req, res) => {
  const { 
    fullName, email, password, accountType, companyName, 
    businessOwnerName, phone, gstNumber, businessCategory, companyAddress 
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const isBusiness = accountType === 'business';
  const effectiveName = isBusiness ? (businessOwnerName || fullName || companyName || 'Business Owner') : (fullName || 'User');

  const cleanEmail = email.toLowerCase().trim();
  console.log(\`[Signup] Attempting \${accountType || 'personal'} registration for: \${cleanEmail}\`);

  try {
    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      console.log(\`[Signup] User already exists: \${cleanEmail}\`);
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
    
    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    const isVerified = true; // Auto-verify for instant mobile access
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await new User({
      fullName: effectiveName,
      email: cleanEmail,
      password: hashedPassword,
      accountType: isBusiness ? 'business' : 'personal',
      companyName: companyName || '',
      businessOwnerName: isBusiness ? (businessOwnerName || effectiveName) : '',
      phone: phone || '',
      gstNumber: gstNumber || '',
      businessCategory: businessCategory || '',
      companyAddress: companyAddress || '',
      isVerified,
      verificationCode: code,
      verificationExpires: expiry
    }).save();

    const userId = (newUser._id || newUser.id).toString();

    let createdBusiness = null;
    if (isBusiness) {
      const joinCode = generateJoinCode();
      const newBus = await new Business({
        name: companyName || \`\${effectiveName}'s Business\`,
        description: businessCategory || 'Business Ledger',
        joinCode,
        primaryOwnerId: userId,
        owners: [userId],
        employees: [],
        createdBy: userId
      }).save();

      const busId = (newBus._id || newBus.id).toString();
      await new BusinessMember({
        businessId: busId,
        userId: userId,
        role: 'owner',
        status: 'active'
      }).save();

      createdBusiness = {
        id: busId,
        name: newBus.name,
        joinCode: newBus.joinCode,
        logo: null,
        phone: phone || '',
        gstNumber: gstNumber || '',
        businessCategory: businessCategory || '',
        companyAddress: companyAddress || '',
        approvalPolicy: 'single',
        primaryOwnerId: userId,
        isPrimaryOwner: true,
        role: 'owner',
        ownersCount: 1,
        employeesCount: 0,
      };
    }

    sendVerificationEmail(cleanEmail, code);

    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email: newUser.email,
        fullName: newUser.fullName,
        accountType: newUser.accountType,
        companyName: newUser.companyName || '',
        businessOwnerName: newUser.businessOwnerName || '',
        businessWorkspace: createdBusiness,
      }
    });
  } catch (err) {
    console.error('[Signup Error]', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});`;

const newSignup = `app.post('/api/auth/signup', async (req, res) => {
  const { 
    fullName, email, password, accountType, companyName, 
    businessOwnerName, phone, gstNumber, businessCategory, companyAddress 
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const isBusiness = accountType === 'business';
  const effectiveName = isBusiness ? (businessOwnerName || fullName || companyName || 'Business Owner') : (fullName || 'User');
  const cleanEmail = email.toLowerCase().trim();
  console.log(\`[Signup] Initiating pending registration for: \${cleanEmail}\`);

  try {
    // Check if an already verified user exists in MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && (existingUser.isVerified || existingUser.emailVerified)) {
      console.log(\`[Signup] Verified user already exists: \${cleanEmail}\`);
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
    }
    
    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiration
    const otpHash = crypto.createHash('sha256').update(code).digest('hex');

    // DO NOT ADD USER TO DATABASE YET. Store in OTPVerification pending collection until code is verified.
    await OTPVerification.deleteMany({ email: cleanEmail });

    await new OTPVerification({
      email: cleanEmail,
      otpHash,
      expiresAt: expiry,
      attempts: 0,
      lastSentAt: new Date(),
      pendingUserData: {
        fullName: effectiveName,
        email: cleanEmail,
        password: hashedPassword,
        accountType: isBusiness ? 'business' : 'personal',
        companyName: companyName || '',
        businessOwnerName: isBusiness ? (businessOwnerName || effectiveName) : '',
        phone: phone || '',
        gstNumber: gstNumber || '',
        businessCategory: businessCategory || '',
        companyAddress: companyAddress || '',
      }
    }).save();

    console.log(\`\\n==================================================\`);
    console.log(\`🔑 [HISABHERO EMAIL VERIFICATION OTP]\`);
    console.log(\`Target Email : \${cleanEmail} (\${effectiveName})\`);
    console.log(\`OTP Code     : >>> \${code} <<<\`);
    console.log(\`Expires At   : \${expiry.toISOString()} (5 mins)\`);
    console.log(\`==================================================\\n\`);

    // Dispatch OTP email to user's address over SMTP
    try {
      await sendOtpEmail(cleanEmail, code, effectiveName);
    } catch (sendErr) {
      console.error('[OTP Email Send Error]', sendErr.message);
    }

    return res.status(201).json({
      success: true,
      email: cleanEmail,
      needsVerification: true,
      otpCode: code,
      message: \`Registration initiated. A 6-digit verification code has been sent to \${cleanEmail}. Please check your Inbox and Spam/Junk folder.\`,
      user: {
        email: cleanEmail,
        fullName: effectiveName,
        accountType: isBusiness ? 'business' : 'personal',
        isVerified: false,
        emailVerified: false
      }
    });
  } catch (err) {
    console.error('[Signup Error]', err);
    return res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});`;

content = content.replace(signupTarget, newSignup);

// Replace Verify Route & Resend Route (Lines ~835 to ~920)
const verifyTarget = `// Verify verification code
app.post('/api/auth/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const userData = user.toObject();
    if (userData.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }
    if (new Date() > new Date(userData.verificationExpires)) {
      return res.status(400).json({ error: 'Verification code has expired.' });
    }

    const updated = await User.findOneAndUpdate(
      { email },
      { isVerified: true, verificationCode: null, verificationExpires: null },
      { new: true }
    );
    const userId = updated._id.toString();
    const token = generateToken(userId);

    let businessWorkspace = null;
    if (updated.accountType === 'business') {
      try {
        const membership = await BusinessMember.findOne({ userId, status: 'active' }).lean();
        if (membership) {
          const bus = await Business.findById(membership.businessId).lean();
          if (bus) {
            businessWorkspace = {
              id: bus._id.toString(),
              name: bus.name,
              joinCode: bus.joinCode || '',
              logo: bus.logo || null,
              phone: bus.phone || '',
              gstNumber: bus.gstNumber || '',
              businessCategory: bus.businessCategory || '',
              companyAddress: bus.companyAddress || '',
              approvalPolicy: bus.approvalPolicy || 'single',
              primaryOwnerId: bus.primaryOwnerId,
              isPrimaryOwner: bus.primaryOwnerId === userId,
              role: membership.role,
              ownersCount: (bus.owners || []).length,
              employeesCount: (bus.employees || []).length,
            };
          }
        }
      } catch (wsErr) {
        console.warn('[VerifyCode] Could not fetch workspace:', wsErr.message);
      }
    }

    res.json({
      success: true,
      token,
      user: { 
        id: userId, 
        email: updated.email, 
        fullName: updated.fullName, 
        accountType: updated.accountType || 'personal',
        companyName: updated.companyName || 'My Business',
        businessWorkspace
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
});

// Resend verification code
app.post('/api/auth/resend-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.findOneAndUpdate(
      { email },
      { verificationCode: code, verificationExpires: expiry }
    );

    sendVerificationEmail(email, code);

    res.json({ success: true, message: 'Verification code resent successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend code: ' + err.message });
  }
});`;

const newVerifyAndResend = `// Verify verification code — ONLY ADDS USER TO DATABASE AFTER VERIFICATION SUCCESS
app.post(['/api/auth/verify-code', '/api/auth/verify-email-otp', '/api/auth/verify-email', '/api/auth/verify-otp', '/auth/verify-email', '/auth/verify-otp'], async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and 6-digit verification code are required' });

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.toString().trim();

  try {
    // 1. Check OTPVerification record in MongoDB
    const otpRecord = await OTPVerification.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
    const existingUser = await User.findOne({ email: cleanEmail });

    // Expiration check
    if (otpRecord && new Date() > new Date(otpRecord.expiresAt)) {
      await OTPVerification.deleteMany({ email: cleanEmail });
      return res.status(400).json({ success: false, error: 'Your verification code has expired. Please request a new code.' });
    }

    // Max attempts check
    if (otpRecord && otpRecord.attempts >= 5) {
      await OTPVerification.deleteMany({ email: cleanEmail });
      return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new verification code.' });
    }

    // Check code validity
    let isValid = false;
    if (otpRecord) {
      const sha256Hash = crypto.createHash('sha256').update(cleanCode).digest('hex');
      isValid = (sha256Hash === otpRecord.otpHash);
      if (!isValid) {
        otpRecord.attempts = (otpRecord.attempts || 0) + 1;
        await otpRecord.save();
        if (otpRecord.attempts >= 5) {
          await OTPVerification.deleteMany({ email: cleanEmail });
          return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new verification code.' });
        }
        return res.status(400).json({ success: false, error: "That verification code isn't correct. Please try again." });
      }
    } else if (existingUser && existingUser.verificationCode === cleanCode) {
      if (existingUser.verificationExpires && new Date() > new Date(existingUser.verificationExpires)) {
        return res.status(400).json({ success: false, error: 'Your verification code has expired. Please request a new code.' });
      }
      isValid = true;
    } else {
      return res.status(400).json({ success: false, error: 'Your verification code has expired or is invalid. Please request a new code.' });
    }

    // ─── VERIFICATION SUCCESSFUL: CREATE USER IN DATABASE NOW ───
    let user = await User.findOne({ email: cleanEmail });
    let createdBusiness = null;

    if (!user) {
      const p = otpRecord?.pendingUserData || {};
      user = await new User({
        fullName: p.fullName || 'User',
        email: cleanEmail,
        password: p.password,
        accountType: p.accountType || 'personal',
        companyName: p.companyName || '',
        businessOwnerName: p.businessOwnerName || '',
        phone: p.phone || '',
        gstNumber: p.gstNumber || '',
        businessCategory: p.businessCategory || '',
        companyAddress: p.companyAddress || '',
        isVerified: true,
        emailVerified: true
      }).save();

      const userId = user._id.toString();

      if (p.accountType === 'business') {
        const joinCode = generateJoinCode();
        const newBus = await new Business({
          name: p.companyName || \`\${p.fullName}'s Business\`,
          description: p.businessCategory || 'Business Ledger',
          joinCode,
          primaryOwnerId: userId,
          owners: [userId],
          employees: [],
          createdBy: userId
        }).save();

        const busId = newBus._id.toString();
        await new BusinessMember({
          businessId: busId,
          userId: userId,
          role: 'owner',
          status: 'active'
        }).save();

        createdBusiness = {
          id: busId,
          name: newBus.name,
          joinCode: newBus.joinCode,
          phone: p.phone || '',
          gstNumber: p.gstNumber || '',
          businessCategory: p.businessCategory || '',
          companyAddress: p.companyAddress || '',
          approvalPolicy: 'single',
          primaryOwnerId: userId,
          isPrimaryOwner: true,
          role: 'owner',
          ownersCount: 1,
          employeesCount: 0,
        };
      }
    } else {
      user.isVerified = true;
      user.emailVerified = true;
      user.verificationCode = null;
      user.verificationExpires = null;
      await user.save();
    }

    // Delete OTP record after successful activation
    await OTPVerification.deleteMany({ email: cleanEmail });

    const userId = user._id.toString();
    const token = generateToken(userId);

    // If business workspace already existed, load it
    if (!createdBusiness && user.accountType === 'business') {
      try {
        const membership = await BusinessMember.findOne({ userId, status: 'active' }).lean();
        if (membership) {
          const bus = await Business.findById(membership.businessId).lean();
          if (bus) {
            createdBusiness = {
              id: bus._id.toString(),
              name: bus.name,
              joinCode: bus.joinCode || '',
              role: membership.role,
              primaryOwnerId: bus.primaryOwnerId,
              isPrimaryOwner: bus.primaryOwnerId === userId,
            };
          }
        }
      } catch {}
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
        companyName: user.companyName || 'My Business',
        isVerified: true,
        emailVerified: true,
        businessWorkspace: createdBusiness
      }
    });
  } catch (err) {
    console.error('[Verify Code Error]', err);
    return res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
});

// Resend verification code
app.post(['/api/auth/resend-code', '/api/auth/resend-email-otp', '/api/auth/resend-email', '/api/auth/resend-otp', '/auth/resend-email', '/auth/resend-otp'], async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: cleanEmail });
    if (user && (user.isVerified || user.emailVerified)) {
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

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    const otpHash = crypto.createHash('sha256').update(code).digest('hex');

    const pendingData = existingOtp?.pendingUserData || null;
    await OTPVerification.deleteMany({ email: cleanEmail });

    await new OTPVerification({
      email: cleanEmail,
      otpHash,
      expiresAt: expiry,
      attempts: 0,
      lastSentAt: new Date(),
      pendingUserData: pendingData
    }).save();

    const effectiveName = user?.fullName || pendingData?.fullName || 'User';

    console.log(\`\\n==================================================\`);
    console.log(\`🔑 [HISABHERO RESEND VERIFICATION OTP]\`);
    console.log(\`Target Email : \${cleanEmail} (\${effectiveName})\`);
    console.log(\`OTP Code     : >>> \${code} <<<\`);
    console.log(\`Expires At   : \${expiry.toISOString()} (5 mins)\`);
    console.log(\`==================================================\\n\`);

    try {
      await sendOtpEmail(cleanEmail, code, effectiveName);
    } catch (e) {
      console.error('[Resend OTP Error]', e.message);
    }

    return res.json({
      success: true,
      otpCode: code,
      message: \`A new 6-digit verification code has been sent to \${cleanEmail}. Please check your Inbox and Spam/Junk folder.\`
    });
  } catch (err) {
    console.error('[Resend Code Error]', err);
    return res.status(500).json({ error: 'Failed to resend code: ' + err.message });
  }
});`;

content = content.replace(verifyTarget, newVerifyAndResend);

fs.writeFileSync(serverPath, content, 'utf8');
console.log("Successfully updated server.js with strict verification logic (Users added to DB ONLY after OTP verification)!");
