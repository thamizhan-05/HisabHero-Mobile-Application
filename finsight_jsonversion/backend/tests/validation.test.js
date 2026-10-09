import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidEmail,
  isValidUUID,
  isValidDateString,
  isValidAmount,
  validate
} from '../utils/validation.js';

test('Validation Utils - Email format checks', () => {
  assert.equal(isValidEmail('user@hisabhero.com'), true);
  assert.equal(isValidEmail('test.dev+extra@sub.domain.org'), true);
  assert.equal(isValidEmail('plainaddress'), false);
  assert.equal(isValidEmail('user@'), false);
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail(null), false);
});

test('Validation Utils - UUID format checks', () => {
  assert.equal(isValidUUID('c8d23450-48cf-4b72-9112-8736d71b3e81'), true);
  assert.equal(isValidUUID('invalid-uuid-string'), false);
  assert.equal(isValidUUID(''), false);
});

test('Validation Utils - Date string checks', () => {
  assert.equal(isValidDateString('2026-10-09'), true);
  assert.equal(isValidDateString('2026-02-28'), true);
  assert.equal(isValidDateString('09/10/2026'), false); // Only ISO YYYY-MM-DD
  assert.equal(isValidDateString('invalid'), false);
});

test('Validation Utils - Amount checks', () => {
  assert.equal(isValidAmount(100), true);
  assert.equal(isValidAmount('50.25'), true);
  assert.equal(isValidAmount(0, false), false);
  assert.equal(isValidAmount(0, true), true);
  assert.equal(isValidAmount(-10), false);
  assert.equal(isValidAmount(NaN), false);
});

test('Validation Utils - Schema validator', () => {
  const schema = {
    email: { required: true, type: 'email' },
    amount: { required: true, type: 'number', min: 1 },
    date: { required: true, type: 'date' }
  };

  const validData = { email: 'test@example.com', amount: 150, date: '2026-10-09' };
  const res1 = validate(validData, schema);
  assert.equal(res1.isValid, true);
  assert.equal(res1.errors.length, 0);

  const invalidData = { email: 'bad-email', amount: 0, date: 'not-a-date' };
  const res2 = validate(invalidData, schema);
  assert.equal(res2.isValid, false);
  assert.equal(res2.errors.length, 3);
});
