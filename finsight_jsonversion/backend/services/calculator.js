/**
 * HisabHero / FinSight Financial Intelligence & Calculation Engine
 * Implements exact mathematical models for Health Score, Dual Runway,
 * Safe Daily Spend, MoM Variance, and Subscription Detection.
 */

export function safeRound(val, decimals = 2) {
  const num = Number(val || 0);
  if (!isFinite(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * 8.1 3-Tier Financial Health Score Algorithms
 */
export function calculateHealthScore({
  workspaceType = 'personal',
  currentBalance = 0,
  totalInflow = 0,
  totalOutflow = 0,
  runwayMonths = 0,
  budgets = {}, // { categoryName: limitAmount }
  categorySpending = {}, // { categoryName: spentAmount }
  savingsGoals = [], // [{ currentAmount, targetAmount }]
  historicalMonthlyExpenses = [] // [monthExpense1, monthExpense2, ...]
}) {
  // Zero-Floor Safety Logic: If net balance <= 0, Health Score immediately drops to 0!
  if (currentBalance < 0) {
    return {
      score: 0,
      grade: 'CRITICAL_DEFICIT',
      zeroFloorTriggered: true,
      breakdown: {
        reason: 'Zero-Floor Activated: Current cash balance is below ₹0. Immediate capital injection required.'
      }
    };
  }

  const netMargin = totalInflow > 0 ? ((totalInflow - totalOutflow) / totalInflow) * 100 : (totalInflow === 0 && totalOutflow === 0 ? 0 : -100);
  const savingsRate = netMargin; // For personal mode

  // Compute Budget Compliance Score (20-25% weight)
  const configuredBudgetKeys = Object.keys(budgets || {}).filter(k => budgets[k] > 0);
  let breachedCount = 0;
  configuredBudgetKeys.forEach(k => {
    const spent = categorySpending[k] || 0;
    if (spent > budgets[k]) breachedCount++;
  });
  const budgetComplianceScore = configuredBudgetKeys.length > 0
    ? Math.max(0, Math.min(100, 100 - ((breachedCount / configuredBudgetKeys.length) * 100)))
    : 100;

  if (workspaceType === 'business') {
    // ─── Business Mode (0-100) ───
    // 1. Margin Score (30% weight)
    let marginScore = 0;
    if (netMargin >= 20) {
      marginScore = 100;
    } else if (netMargin > 0) {
      marginScore = (netMargin / 20) * 100;
    } else {
      marginScore = 0;
    }

    // 2. Runway Score (30% weight)
    let runwayScore = 0;
    if (runwayMonths >= 6 || runwayMonths >= 99) {
      runwayScore = 100;
    } else if (runwayMonths > 0) {
      runwayScore = (runwayMonths / 6) * 100;
    } else {
      runwayScore = 0;
    }

    // 3. Budget Score (20% weight)
    const budgetScore = budgetComplianceScore;

    // 4. Growth Score (20% weight)
    const growthScore = netMargin >= 0 ? 100 : 0;

    const totalScore = Math.round(
      (marginScore * 0.30) +
      (runwayScore * 0.30) +
      (budgetScore * 0.20) +
      (growthScore * 0.20)
    );

    const clampedScore = Math.max(0, Math.min(100, totalScore));

    return {
      score: clampedScore,
      grade: clampedScore >= 80 ? 'EXCELLENT' : clampedScore >= 60 ? 'HEALTHY' : clampedScore >= 40 ? 'MODERATE' : 'AT_RISK',
      zeroFloorTriggered: false,
      breakdown: {
        marginScore: safeRound(marginScore),
        runwayScore: safeRound(runwayScore),
        budgetScore: safeRound(budgetScore),
        growthScore: safeRound(growthScore),
        netMarginPercent: safeRound(netMargin),
        runwayMonths: safeRound(runwayMonths)
      }
    };
  } else {
    // ─── Personal Mode (0-100) ───
    // 1. Savings Rate Score (30% weight)
    let savingsRateScore = 0;
    if (savingsRate >= 30) {
      savingsRateScore = 100;
    } else if (savingsRate > 0) {
      savingsRateScore = (savingsRate / 30) * 100;
    } else {
      savingsRateScore = 0;
    }

    // 2. Emergency Buffer Score (30% weight)
    // 100 if accumulated balance covers >= 6 months average expenses
    const avgMonthlyExpense = historicalMonthlyExpenses.length > 0
      ? historicalMonthlyExpenses.reduce((a, b) => a + b, 0) / historicalMonthlyExpenses.length
      : (totalOutflow || 1);
    
    const monthsCovered = avgMonthlyExpense > 0 ? currentBalance / avgMonthlyExpense : 12;
    let emergencyBufferScore = 0;
    if (monthsCovered >= 6) {
      emergencyBufferScore = 100;
    } else if (monthsCovered > 0) {
      emergencyBufferScore = (monthsCovered / 6) * 100;
    } else {
      emergencyBufferScore = 0;
    }

    // 3. Budget Score (25% weight)
    const budgetScore = budgetComplianceScore;

    // 4. Goals Score (15% weight)
    let goalsScore = 100;
    if (savingsGoals && savingsGoals.length > 0) {
      const totalProgress = savingsGoals.reduce((sum, g) => {
        const pct = g.targetAmount > 0 ? (Math.min(g.currentAmount || 0, g.targetAmount) / g.targetAmount) * 100 : 100;
        return sum + pct;
      }, 0);
      goalsScore = totalProgress / savingsGoals.length;
    }

    const totalScore = Math.round(
      (savingsRateScore * 0.30) +
      (emergencyBufferScore * 0.30) +
      (budgetScore * 0.25) +
      (goalsScore * 0.15)
    );

    const clampedScore = Math.max(0, Math.min(100, totalScore));

    return {
      score: clampedScore,
      grade: clampedScore >= 80 ? 'EXCELLENT' : clampedScore >= 60 ? 'HEALTHY' : clampedScore >= 40 ? 'MODERATE' : 'AT_RISK',
      zeroFloorTriggered: false,
      breakdown: {
        savingsRateScore: safeRound(savingsRateScore),
        emergencyBufferScore: safeRound(emergencyBufferScore),
        budgetScore: safeRound(budgetScore),
        goalsScore: safeRound(goalsScore),
        savingsRatePercent: safeRound(savingsRate),
        monthsCovered: safeRound(monthsCovered)
      }
    };
  }
}

/**
 * 8.2 Safe Daily Spend (Personal Workspace Mode)
 * Safe Daily Spend = (Current Cash Balance - Remaining Category Budgets) / Remaining Days in Current Month
 */
export function calculateSafeDailySpend({
  currentBalance = 0,
  categoryBudgets = {}, // { category: limit }
  currentMonthSpentByCategory = {}, // { category: spent }
  daysInMonth = 30,
  currentDayOfMonth = new Date().getDate()
}) {
  const remainingDays = Math.max(1, (daysInMonth || 30) - currentDayOfMonth + 1);

  // Sum of remaining unspent committed category budgets
  let remainingCommittedBudgets = 0;
  Object.keys(categoryBudgets || {}).forEach(cat => {
    const limit = Number(categoryBudgets[cat]) || 0;
    const spent = Number(currentMonthSpentByCategory[cat]) || 0;
    if (limit > spent) {
      remainingCommittedBudgets += (limit - spent);
    }
  });

  const discretionaryPool = Math.max(0, currentBalance - remainingCommittedBudgets);
  const safeDailySpend = safeRound(discretionaryPool / remainingDays);

  return {
    safeDailySpend,
    discretionaryPool: safeRound(discretionaryPool),
    remainingCommittedBudgets: safeRound(remainingCommittedBudgets),
    remainingDays,
    isHealthy: safeDailySpend > 0
  };
}

/**
 * 8.3 Dual Runway Engine & What-If Simulation Sandbox
 */
export function calculateDualRunway({
  currentBalance = 0,
  monthlyHistory = [], // [{ month: '2026-06', inflow: 100000, outflow: 80000 }, ...]
  activeMonthlySubscriptions = 0,
  simulationOverrides = null // { startingBalance, monthlyInflow, monthlyOutflow, excludeSubscriptions }
}) {
  // 1. Calculate 3-month rolling average burn rate
  const last3Months = monthlyHistory.slice(-3);
  let avgMonthlyBurn = 0;
  let avgMonthlyInflow = 0;

  if (last3Months.length > 0) {
    const totalOut = last3Months.reduce((s, m) => s + (m.outflow || 0), 0);
    const totalIn = last3Months.reduce((s, m) => s + (m.inflow || 0), 0);
    avgMonthlyBurn = totalOut / last3Months.length;
    avgMonthlyInflow = totalIn / last3Months.length;
  }

  const effectiveSubscriptions = (simulationOverrides && simulationOverrides.excludeSubscriptions)
    ? 0
    : Number(activeMonthlySubscriptions || 0);

  const effectiveStartingBalance = (simulationOverrides && simulationOverrides.startingBalance !== undefined)
    ? Number(simulationOverrides.startingBalance)
    : Number(currentBalance || 0);

  const effectiveMonthlyOutflow = (simulationOverrides && simulationOverrides.monthlyOutflow !== undefined)
    ? Number(simulationOverrides.monthlyOutflow)
    : (avgMonthlyBurn + effectiveSubscriptions);

  const effectiveMonthlyInflow = (simulationOverrides && simulationOverrides.monthlyInflow !== undefined)
    ? Number(simulationOverrides.monthlyInflow)
    : avgMonthlyInflow;

  // Standard Historical Runway (Net Burn)
  const netMonthlyBurn = Math.max(0, effectiveMonthlyOutflow - effectiveMonthlyInflow);
  let standardRunwayMonths = 99;
  if (netMonthlyBurn > 0) {
    standardRunwayMonths = safeRound(effectiveStartingBalance / netMonthlyBurn, 1);
  } else if (effectiveStartingBalance <= 0) {
    standardRunwayMonths = 0;
  }

  // Zero-Revenue Worst-Case Runway
  let worstCaseRunwayMonths = 0;
  if (effectiveMonthlyOutflow > 0) {
    worstCaseRunwayMonths = safeRound(effectiveStartingBalance / effectiveMonthlyOutflow, 1);
  } else {
    worstCaseRunwayMonths = 99;
  }

  // Generate 6 Future Trajectory Projection Points (Proj.1* to Proj.6*)
  const projections = [];
  let rollingBalStandard = effectiveStartingBalance;
  let rollingBalWorstCase = effectiveStartingBalance;

  for (let i = 1; i <= 6; i++) {
    rollingBalStandard = safeRound(rollingBalStandard + effectiveMonthlyInflow - effectiveMonthlyOutflow);
    rollingBalWorstCase = safeRound(rollingBalWorstCase - effectiveMonthlyOutflow);

    projections.push({
      label: `Proj.${i}*`,
      monthIndex: i,
      standardBalance: Math.max(0, rollingBalStandard),
      worstCaseBalance: Math.max(0, rollingBalWorstCase),
      isDepleted: rollingBalStandard <= 0
    });
  }

  return {
    currentBalance: effectiveStartingBalance,
    standardRunwayMonths,
    worstCaseRunwayMonths,
    avgMonthlyBurn: safeRound(avgMonthlyBurn),
    netMonthlyBurn: safeRound(netMonthlyBurn),
    effectiveMonthlyInflow: safeRound(effectiveMonthlyInflow),
    effectiveMonthlyOutflow: safeRound(effectiveMonthlyOutflow),
    projections
  };
}

/**
 * Month-over-Month (MoM) Financial Variance Engine ("What Changed?")
 */
export function calculateMoMVariance(currentMonthData, previousMonthData) {
  const currIn = Number(currentMonthData?.inflow || 0);
  const currOut = Number(currentMonthData?.outflow || 0);
  const currMargin = currIn > 0 ? ((currIn - currOut) / currIn) * 100 : 0;

  const prevIn = Number(previousMonthData?.inflow || 0);
  const prevOut = Number(previousMonthData?.outflow || 0);
  const prevMargin = prevIn > 0 ? ((prevIn - prevOut) / prevIn) * 100 : 0;

  const revenueDelta = safeRound(currIn - prevIn);
  const revenuePctChange = prevIn > 0 ? safeRound(((currIn - prevIn) / prevIn) * 100, 1) : (currIn > 0 ? 100 : 0);

  const outflowDelta = safeRound(currOut - prevOut);
  const outflowPctChange = prevOut > 0 ? safeRound(((currOut - prevOut) / prevOut) * 100, 1) : (currOut > 0 ? 100 : 0);

  const marginPctPointsDelta = safeRound(currMargin - prevMargin, 1);

  return {
    currentMonth: currentMonthData?.month || 'Current',
    previousMonth: previousMonthData?.month || 'Previous',
    revenue: {
      current: currIn,
      previous: prevIn,
      delta: revenueDelta,
      pctChange: revenuePctChange,
      improved: revenueDelta >= 0
    },
    outflow: {
      current: currOut,
      previous: prevOut,
      delta: outflowDelta,
      pctChange: outflowPctChange,
      improved: outflowDelta <= 0
    },
    profitMargin: {
      current: safeRound(currMargin, 1),
      previous: safeRound(prevMargin, 1),
      delta: marginPctPointsDelta,
      improved: marginPctPointsDelta >= 0
    }
  };
}

/**
 * Automatic Recurring Subscription Detection
 * Detects repeat payments with similar interval (28-35 days) and amount variance <= 15%
 */
export function detectRecurringSubscriptions(transactions = []) {
  const expenseTxs = transactions.filter(t => t.type === 'expense' && t.amount > 0);
  const groupedByMerchant = {};

  expenseTxs.forEach(t => {
    const key = (t.merchantName || t.description || 'Unknown').toLowerCase().trim();
    if (!groupedByMerchant[key]) groupedByMerchant[key] = [];
    groupedByMerchant[key].push(t);
  });

  const detected = [];

  Object.entries(groupedByMerchant).forEach(([merchant, txs]) => {
    if (txs.length < 2) return;
    txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const intervals = [];
    let isConsistentAmount = true;
    const baseAmount = txs[0].amount;

    for (let i = 1; i < txs.length; i++) {
      const diffMs = new Date(txs[i].date).getTime() - new Date(txs[i - 1].date).getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      intervals.push(diffDays);

      const variancePct = Math.abs((txs[i].amount - baseAmount) / baseAmount) * 100;
      if (variancePct > 15) {
        isConsistentAmount = false;
      }
    }

    // Check if intervals match monthly (25-35 days) or yearly (350-380 days)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const isMonthly = avgInterval >= 25 && avgInterval <= 35;
    const isYearly = avgInterval >= 350 && avgInterval <= 380;

    if (isConsistentAmount && (isMonthly || isYearly)) {
      const lastTx = txs[txs.length - 1];
      const nextDue = new Date(new Date(lastTx.date).getTime() + (avgInterval * 24 * 60 * 60 * 1000));
      const daysLeft = Math.ceil((nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      detected.push({
        merchantName: txs[0].merchantName || merchant,
        category: txs[0].category || 'Software',
        amount: safeRound(baseAmount),
        frequency: isMonthly ? 'monthly' : 'yearly',
        confidenceScore: 0.95,
        lastBilledDate: lastTx.date,
        nextDueDate: nextDue.toISOString().split('T')[0],
        daysLeft: Math.max(0, daysLeft),
        transactionCount: txs.length
      });
    }
  });

  return detected;
}
