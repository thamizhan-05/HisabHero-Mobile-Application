import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPasswordPBKDF2,
  verifyPasswordPBKDF2,
  generateToken,
  generateJoinCode
} from '../modules/auth/auth.service.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

test('Auth Service - PBKDF2 Password Hashing & Verification', () => {
  const password = 'SuperSecretHeroPassword2026!';
  const hash = hashPasswordPBKDF2(password);

  assert.ok(hash.startsWith('210000:'), 'Hash must contain iteration count 210,000');
  
  // Verification success
  const isMatch = verifyPasswordPBKDF2(password, hash);
  assert.equal(isMatch, true);

  // Verification failure with wrong password
  const isWrong = verifyPasswordPBKDF2('WrongPassword123', hash);
  assert.equal(isWrong, false);
});

test('Auth Service - JWT Token generation & claims', () => {
  const userId = 'usr_test_uuid_12345';
  const token = generateToken(userId);

  assert.ok(typeof token === 'string' && token.length > 20);

  const decoded = jwt.verify(token, config.jwtSecret);
  assert.equal(decoded.userId, userId);
});

test('Auth Service - Workspace Join Code format', () => {
  const code = generateJoinCode();
  assert.ok(code.startsWith('HERO-WS-'));
  assert.equal(code.length, 14); // HERO-WS-XXXXXX
});
