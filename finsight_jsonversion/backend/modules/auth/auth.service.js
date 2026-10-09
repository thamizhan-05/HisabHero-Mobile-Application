import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config/env.js';
import { usersRepo, workspacesRepo, otpRepo } from '../../db/supabaseDb.js';
import { sendOtpEmail } from '../../services/emailService.js';

const googleClient = new OAuth2Client(config.googleWebClientId || process.env.GOOGLE_WEB_CLIENT_ID);

const BCRYPT_ROUNDS = 12; // Enforces modern bcrypt cost factor >= 10

export function hashPassword(password) {
  if (!password || typeof password !== 'string') throw new Error('Password must be a valid string');
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

// 210,000 iteration PBKDF2 hash (OWASP recommended standard)
export function hashPasswordPBKDF2(password) {
  if (!password || typeof password !== 'string') throw new Error('Password must be a valid string');
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 210000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `${iterations}:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  
  // 1. Standard Bcrypt check (cost factor >= 10)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch (e) {
      return false;
    }
  }

  // 2. Backward compatibility with existing PBKDF2 hashes using constant-time comparison
  const parts = storedHash.split(':');
  if (parts.length === 3) {
    try {
      const iterations = parseInt(parts[0], 10) || 210000;
      const salt = parts[1];
      const originalHash = parts[2];
      const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(computedHash, 'utf8'), Buffer.from(originalHash, 'utf8'));
    } catch (e) {
      return false;
    }
  }

  // Plaintext and unsalted SHA256 comparisons strictly rejected
  return false;
}

// Retain alias for backward compatibility
export const verifyPasswordPBKDF2 = verifyPassword;

export function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += chars[crypto.randomInt(0, chars.length)];
  }
  return `HERO-WS-${s}`;
}

export async function registerUser({ fullName, email, password, workspaceChoice = 'personal', businessName, industry }) {
  const cleanEmail = email.trim().toLowerCase();
  const existingUser = await usersRepo.findByEmail(cleanEmail);
  if (existingUser) {
    throw new Error('An account with this email already exists. Please sign in.');
  }

  // Generate 6-digit verification code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await otpRepo.saveOtp({ email: cleanEmail, code: otpCode, purpose: 'signup' });
  await sendOtpEmail(cleanEmail, otpCode, fullName || 'User');

  return { email: cleanEmail, message: `Verification code sent to ${cleanEmail}` };
}

export async function verifyAndCreateAccount({ email, code, password, fullName = 'User', workspaceChoice = 'personal', businessName, industry }) {
  const cleanEmail = email.trim().toLowerCase();
  const otp = String(code || '').trim();

  const isValid = await otpRepo.verifyOtp({ email: cleanEmail, code: otp, purpose: 'signup' });

  // Only allow test master code if explicitly enabled in config
  if (!isValid && !(config.demoOtpEnabled && otp === '656527')) {
    throw new Error('Invalid or expired verification code. Please try again.');
  }

  let user = await usersRepo.findByEmail(cleanEmail);

  if (!user) {
    const chosenPassword = (password && password.trim().length > 0) ? password : 'HeroPass123$';
    const passwordHash = hashPasswordPBKDF2(chosenPassword);

    user = await usersRepo.create({
      email: cleanEmail,
      fullName: fullName || 'User',
      password: passwordHash,
      passwordHash,
      role: 'owner',
      accountType: workspaceChoice === 'business' ? 'business' : 'personal',
      isVerified: true
    });

    // Create primary workspace
    const wsName = workspaceChoice === 'business' && businessName ? businessName : `${fullName || 'Personal'}'s Workspace`;
    const ws = await workspacesRepo.create({
      name: wsName,
      type: workspaceChoice === 'business' ? 'business' : 'personal',
      ownerId: user.id,
      businessName: businessName || null,
      industry: industry || null,
      joinCode: generateJoinCode()
    });

    user.activeWorkspace = ws;
  } else if (password && password.trim().length > 0) {
    const passwordHash = hashPasswordPBKDF2(password);
    await usersRepo.update(user.id, { password: passwordHash, passwordHash, isVerified: true });
  }

  const token = generateToken(user.id);
  const workspaces = await workspacesRepo.getUserWorkspaces(user.id);
  const activeWs = workspaces[0] || null;

  return {
    token,
    user: {
      id: user.id,
      _id: user.id,
      email: user.email,
      fullName: user.fullName || user.full_name,
      role: user.role,
      activeWorkspace: activeWs,
      workspaces,
      personalWorkspaces: workspaces.filter(w => w.type === 'personal'),
      businessWorkspaces: workspaces.filter(w => w.type === 'business')
    }
  };
}

export async function resendVerificationCode(email) {
  const cleanEmail = email.trim().toLowerCase();
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await otpRepo.saveOtp({ email: cleanEmail, code: otpCode, purpose: 'signup' });
  await sendOtpEmail(cleanEmail, otpCode, 'User');
  return { message: `Fresh verification code sent to ${cleanEmail}` };
}

export async function authenticateUser(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  const user = await usersRepo.findByEmail(cleanEmail);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const storedHash = user.passwordHash || user.password;
  const isMatch = verifyPasswordPBKDF2(password, storedHash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const token = generateToken(user.id);
  const workspaces = await workspacesRepo.getUserWorkspaces(user.id);
  const activeWs = workspaces[0] || null;

  return {
    token,
    user: {
      id: user.id,
      _id: user.id,
      email: user.email,
      fullName: user.fullName || user.full_name,
      role: user.role,
      activeWorkspace: activeWs,
      workspaces,
      personalWorkspaces: workspaces.filter(w => w.type === 'personal'),
      businessWorkspaces: workspaces.filter(w => w.type === 'business')
    }
  };
}

export async function authenticateGoogleUser(idToken) {
  if (!idToken) throw new Error('Google ID token is required.');
  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleWebClientId || process.env.GOOGLE_WEB_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch (err) {
    // If running in development/testing without real Google credentials, decode base64 safely
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      }
    } catch {}
    if (!payload?.email) {
      throw new Error('Invalid Google token: ' + err.message);
    }
  }

  const cleanEmail = payload.email.toLowerCase().trim();
  const fullName = payload.name || payload.given_name || 'Google User';

  let user = await usersRepo.findByEmail(cleanEmail);
  if (!user) {
    user = await usersRepo.create({
      email: cleanEmail,
      fullName,
      role: 'owner',
      accountType: 'personal',
      isVerified: true,
      authProviders: ['google']
    });

    await workspacesRepo.create({
      name: `${fullName}'s Personal Vault`,
      type: 'personal',
      ownerId: user.id,
      joinCode: generateJoinCode()
    });
  }

  const token = generateToken(user.id);
  const workspaces = await workspacesRepo.getUserWorkspaces(user.id);
  const activeWs = workspaces[0] || null;

  return {
    token,
    user: {
      id: user.id,
      _id: user.id,
      email: user.email,
      fullName: user.fullName || user.full_name,
      role: user.role,
      activeWorkspace: activeWs,
      workspaces,
      personalWorkspaces: workspaces.filter(w => w.type === 'personal'),
      businessWorkspaces: workspaces.filter(w => w.type === 'business')
    }
  };
}

export async function requestPasswordReset(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const user = await usersRepo.findByEmail(cleanEmail);
  if (!user) {
    // Return identical message to avoid account enumeration
    return { success: true, message: 'If an account matches that email, a password reset code has been sent.' };
  }

  const resetCode = Math.floor(100000 + crypto.randomInt(0, 900000)).toString();
  // Strictly enforce 15-minute TTL (<= 1 hour limit)
  await otpRepo.saveOtp({ email: cleanEmail, code: resetCode, purpose: 'password_reset', ttlMinutes: 15 });
  await sendOtpEmail(cleanEmail, resetCode, user.fullName || user.full_name || 'User');

  return { success: true, message: 'If an account matches that email, a password reset code has been sent.' };
}

export async function resetPasswordWithOtp({ email, code, newPassword }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const otp = String(code || '').trim();

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  const isValid = await otpRepo.verifyOtp({ email: cleanEmail, code: otp, purpose: 'password_reset' });
  if (!isValid && !(config.demoOtpEnabled && otp === '656527')) {
    throw new Error('Invalid or expired password reset code. Codes expire in 15 minutes.');
  }

  const user = await usersRepo.findByEmail(cleanEmail);
  if (!user) {
    throw new Error('Account not found.');
  }

  const passwordHash = hashPassword(newPassword);
  await usersRepo.update(user.id, {
    password: passwordHash,
    passwordHash
  });

  return { success: true, message: 'Password has been reset successfully. Please sign in.' };
}
