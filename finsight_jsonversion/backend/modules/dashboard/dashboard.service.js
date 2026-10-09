import { transactionsRepo } from '../../db/supabaseDb.js';
import { safeRound } from '../../utils/currency.js';
import { calculateHealthScore, calculateSafeDailySpend, calculateDualRunway } from '../../services/calculator.js';

export async function getDashboardStats(workspaceId, workspaceType = 'personal') {
  const transactions = await transactionsRepo.findByWorkspace(workspaceId);
  const list = Array.isArray(transactions) ? transactions : [];

  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySpending = {};

  list.forEach(tx => {
    const amt = safeRound(tx.amount || 0);
    if (tx.type === 'income') {
      totalIncome = safeRound(totalIncome + amt);
    } else {
      totalExpenses = safeRound(totalExpenses + amt);
      const cat = tx.category || 'Other';
      categorySpending[cat] = safeRound((categorySpending[cat] || 0) + amt);
    }
  });

  const netSavings = safeRound(totalIncome - totalExpenses);
  const currentBalance = netSavings;

  const health = calculateHealthScore({
    workspaceType,
    currentBalance,
    totalInflow: totalIncome,
    totalOutflow: totalExpenses,
    runwayMonths: totalExpenses > 0 ? safeRound(currentBalance / (totalExpenses / 3 || 1), 1) : 12,
    categorySpending
  });

  const safeSpend = calculateSafeDailySpend({
    currentBalance: Math.max(0, currentBalance),
    daysInMonth: 30,
    currentDayOfMonth: new Date().getDate()
  });

  // Recent 10 transactions
  const recent = [...list]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    currentBalance,
    transactionCount: list.length,
    healthScore: health.score,
    healthGrade: health.grade,
    healthBreakdown: health.breakdown,
    safeDailySpend: safeSpend.safeDailySpend,
    categorySpending,
    recentTransactions: recent
  };
}

export async function getDashboardHealth(workspaceId, workspaceType = 'personal') {
  const stats = await getDashboardStats(workspaceId, workspaceType);
  return {
    score: stats.healthScore,
    grade: stats.healthGrade,
    breakdown: stats.healthBreakdown,
    currentBalance: stats.currentBalance,
    safeDailySpend: stats.safeDailySpend
  };
}
