import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { usersRepo, workspacesRepo, otpRepo } from '../../db/supabaseDb.js';
import { sendOtpEmail } from '../../services/emailService.js';

export function hashPasswordPBKDF2(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
  return `210000:${salt}:${hash}`;
}

export function verifyPasswordPBKDF2(password, storedHash) {
  if (!storedHash) return false;
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch (e) {
      return false;
    }
  }
  const parts = storedHash.split(':');
  if (parts.length === 3) {
    const iterations = parseInt(parts[0], 10) || 210000;
    const salt = parts[1];
    const originalHash = parts[2];
    const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return computedHash === originalHash;
  }
  const sha256 = crypto.createHash('sha256').update(password).digest('hex');
  return sha256 === storedHash || password === storedHash;
}

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
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
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
      fullName: user.fullName,
      role: user.role,
      activeWorkspace: activeWs,
      workspaces
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
      fullName: user.fullName,
      role: user.role,
      activeWorkspace: activeWs,
      workspaces
    }
  };
}
