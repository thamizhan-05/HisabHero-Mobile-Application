import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toMinorUnits,
  fromMinorUnits,
  addMoney,
  subtractMoney,
  multiplyMoney,
  percentageOf,
  formatINR
} from '../utils/currency.js';

test('Currency Utils - Minor units conversion', () => {
  assert.equal(toMinorUnits(10.50), 1050);
  assert.equal(toMinorUnits(0.01), 1);
  assert.equal(fromMinorUnits(1050), 10.50);
  assert.equal(fromMinorUnits(1), 0.01);
});

test('Currency Utils - Floating-point drift eliminated', () => {
  // In pure JS: 0.1 + 0.2 === 0.30000000000000004
  const sum = addMoney(0.1, 0.2);
  assert.equal(sum, 0.3);

  const diff = subtractMoney(1.0, 0.9);
  assert.equal(diff, 0.1);
});

test('Currency Utils - Multiplications & Percentages', () => {
  assert.equal(multiplyMoney(100.50, 3), 301.50);
  assert.equal(percentageOf(1000, 18), 180.00); // 18% GST
  assert.equal(percentageOf(550, 5), 27.50);     // 5% GST
});

test('Currency Utils - Indian Rupee formatting', () => {
  assert.equal(formatINR(150000, true), '₹1,50,000.00');
  assert.equal(formatINR(1234567.89, false), '12,34,567.89');
});
