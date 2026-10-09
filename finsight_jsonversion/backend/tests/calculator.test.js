import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHealthScore,
  calculateSafeDailySpend,
  calculateDualRunway,
  calculateMoMVariance,
  safeRound
} from '../services/calculator.js';

test('Financial Engine - safeRound accurately handles floats and edge cases', () => {
  assert.equal(safeRound(10.555, 2), 10.56);
  assert.equal(safeRound(10.554, 2), 10.55);
  assert.equal(safeRound(0.1 + 0.2, 2), 0.3);
  assert.equal(safeRound(null), 0);
  assert.equal(safeRound('invalid'), 0);
});

test('Financial Engine - calculateHealthScore activates Zero-Floor when balance < 0', () => {
  const result = calculateHealthScore({
    currentBalance: -500,
    totalInflow: 50000,
    totalOutflow: 30000
  });

  assert.equal(result.score, 0);
  assert.equal(result.grade, 'CRITICAL_DEFICIT');
  assert.equal(result.zeroFloorTriggered, true);
  assert.ok(result.breakdown.reason.includes('Zero-Floor'));
});

test('Financial Engine - calculateHealthScore computes personal health score', () => {
  const result = calculateHealthScore({
    workspaceType: 'personal',
    currentBalance: 150000,
    totalInflow: 80000,
    totalOutflow: 40000,
    historicalMonthlyExpenses: [40000, 35000, 45000],
    budgets: { 'Groceries': 10000, 'Rent': 20000 },
    categorySpending: { 'Groceries': 8000, 'Rent': 20000 }
  });

  assert.ok(result.score >= 70, `Expected score >= 70, got ${result.score}`);
  assert.equal(result.zeroFloorTriggered, false);
  assert.ok(['EXCELLENT', 'HEALTHY'].includes(result.grade));
});

test('Financial Engine - calculateSafeDailySpend calculates correct daily allowance', () => {
  const result = calculateSafeDailySpend({
    currentBalance: 30000,
    categoryBudgets: { 'Utilities': 5000 },
    currentMonthSpentByCategory: { 'Utilities': 2000 },
    daysInMonth: 30,
    currentDayOfMonth: 11
  });

  // Remaining budget to commit = 3,000. Discretionary pool = 30,000 - 3,000 = 27,000
  // Remaining days = 30 - 11 + 1 = 20 days. Daily spend = 27,000 / 20 = 1,350
  assert.equal(result.remainingDays, 20);
  assert.equal(result.remainingCommittedBudgets, 3000);
  assert.equal(result.discretionaryPool, 27000);
  assert.equal(result.safeDailySpend, 1350);
  assert.equal(result.isHealthy, true);
});

test('Financial Engine - calculateDualRunway accurately forecasts trajectory', () => {
  const result = calculateDualRunway({
    currentBalance: 200000,
    monthlyHistory: [
      { month: '2026-07', inflow: 100000, outflow: 80000 },
      { month: '2026-08', inflow: 90000, outflow: 70000 },
      { month: '2026-09', inflow: 110000, outflow: 90000 }
    ],
    activeMonthlySubscriptions: 5000
  });

  assert.equal(result.currentBalance, 200000);
  assert.equal(result.projections.length, 6);
  assert.ok(result.worstCaseRunwayMonths > 0);
});

test('Financial Engine - calculateMoMVariance accurately detects revenue & expense trends', () => {
  const curr = { month: '2026-09', inflow: 120000, outflow: 60000 };
  const prev = { month: '2026-08', inflow: 100000, outflow: 50000 };

  const variance = calculateMoMVariance(curr, prev);

  assert.equal(variance.revenue.delta, 20000);
  assert.equal(variance.revenue.pctChange, 20);
  assert.equal(variance.revenue.improved, true);

  assert.equal(variance.outflow.delta, 10000);
  assert.equal(variance.outflow.pctChange, 20);
  assert.equal(variance.outflow.improved, false); // Increased outflow is not an improvement
});
