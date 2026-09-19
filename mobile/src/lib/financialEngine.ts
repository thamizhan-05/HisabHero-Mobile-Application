/**
 * HisabHero Financial Engine
 * Centralized, safe monetary calculation layer for accurate financial totals across screens.
 * Implements 3-Tier Health Score, Zero-Floor Safety Logic, Safe Daily Spend,
 * Dual Runway Engine with What-If Simulation Sandbox, MoM Variance, and NLP Quick Log parser.
 */

export function safeRound(val: any, decimals: number = 2): number {
  const num = Number(val || 0);
  if (!isFinite(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export function formatCurrencyINR(amount: number): string {
  const safeAmt = safeRound(amount);
  return `₹${safeAmt.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export interface TransactionItem {
  id?: string;
  _id?: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  subcategory?: string;
  merchant?: string;
  merchantName?: string;
  date: string;
  status?: string;
  description?: string;
  paymentMethod?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
  netMarginPercent: number;
  categories: { name: string; value: number; percent: number; color: string }[];
  monthlyData: { month: string; inflow: number; outflow: number; net: number }[];
  formattedIncome: string;
  formattedExpenses: string;
  formattedNetCashFlow: string;
  formattedClosingBalance: string;
}

export function computeFinancialSummary(transactions: TransactionItem[], initialBalance: number = 0): FinancialSummary {
  const validTxs = (transactions || []).filter(t => {
    const s = (t.status || 'approved').toLowerCase();
    return s === 'approved' || s === 'completed' || s === 'active';
  });

  let totalIncome = 0;
  let totalExpenses = 0;

  const categoryMap: { [cat: string]: number } = {};
  const monthMap: { [m: string]: { inflow: number; outflow: number } } = {};

  validTxs.forEach(t => {
    const amt = safeRound(t.amount);
    if (t.type === 'income') {
      totalIncome = safeRound(totalIncome + amt);
    } else {
      totalExpenses = safeRound(totalExpenses + amt);
      const cat = t.category || 'Other';
      categoryMap[cat] = safeRound((categoryMap[cat] || 0) + amt);
    }

    const month = (t.date || '').slice(0, 7) || 'Unknown';
    if (!monthMap[month]) monthMap[month] = { inflow: 0, outflow: 0 };
    if (t.type === 'income') {
      monthMap[month].inflow = safeRound(monthMap[month].inflow + amt);
    } else {
      monthMap[month].outflow = safeRound(monthMap[month].outflow + amt);
    }
  });

  const netCashFlow = safeRound(totalIncome - totalExpenses);
  const closingBalance = safeRound(initialBalance + netCashFlow);
  const netMarginPercent = totalIncome > 0 ? safeRound(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const colors = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];
  const categories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      percent: totalExpenses > 0 ? safeRound((value / totalExpenses) * 100) : 0,
      color: colors[i % colors.length]
    }));

  const monthlyData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      inflow: data.inflow,
      outflow: data.outflow,
      net: safeRound(data.inflow - data.outflow)
    }));

  return {
    totalIncome,
    totalExpenses,
    netCashFlow,
    openingBalance: initialBalance,
    closingBalance,
    netMarginPercent,
    categories,
    monthlyData,
    formattedIncome: formatCurrencyINR(totalIncome),
    formattedExpenses: formatCurrencyINR(totalExpenses),
    formattedNetCashFlow: formatCurrencyINR(netCashFlow),
    formattedClosingBalance: formatCurrencyINR(closingBalance)
  };
}

/**
 * 8.1 3-Tier Financial Health Score with Zero-Floor Logic
 */
export function calculate3TierHealthScore({
  workspaceType = 'personal',
  currentBalance = 0,
  totalInflow = 0,
  totalOutflow = 0,
  runwayMonths = 0,
  budgets = {},
  categorySpending = {},
  savingsGoals = []
}: {
  workspaceType?: string;
  currentBalance: number;
  totalInflow: number;
  totalOutflow: number;
  runwayMonths: number;
  budgets?: Record<string, number>;
  categorySpending?: Record<string, number>;
  savingsGoals?: Array<{ currentAmount?: number; targetAmount: number }>;
}) {
  // Zero-Floor Safety Logic: If net balance <= 0, Health Score immediately drops to 0!
  if (currentBalance < 0) {
    return {
      score: 0,
      grade: 'CRITICAL_DEFICIT',
      zeroFloorTriggered: true,
      marginScore: 0,
      runwayScore: 0,
      budgetScore: 0,
      growthScore: 0
    };
  }

  const netMargin = totalInflow > 0 ? ((totalInflow - totalOutflow) / totalInflow) * 100 : 0;
  const savingsRate = netMargin;

  // Budget Compliance
  const budgetKeys = Object.keys(budgets || {}).filter(k => (budgets[k] || 0) > 0);
  let breached = 0;
  budgetKeys.forEach(k => {
    if ((categorySpending[k] || 0) > budgets[k]) breached++;
  });
  const budgetScore = budgetKeys.length > 0 ? Math.max(0, 100 - ((breached / budgetKeys.length) * 100)) : 100;

  if (workspaceType === 'business') {
    const marginScore = netMargin >= 20 ? 100 : (netMargin > 0 ? (netMargin / 20) * 100 : 0);
    const runwayScore = runwayMonths >= 6 ? 100 : (runwayMonths > 0 ? (runwayMonths / 6) * 100 : 0);
    const growthScore = netMargin >= 0 ? 100 : 0;

    const total = Math.round((marginScore * 0.30) + (runwayScore * 0.30) + (budgetScore * 0.20) + (growthScore * 0.20));
    const score = Math.max(0, Math.min(100, total));

    return {
      score,
      grade: score >= 80 ? 'EXCELLENT' : score >= 60 ? 'HEALTHY' : score >= 40 ? 'MODERATE' : 'AT_RISK',
      zeroFloorTriggered: false,
      marginScore: safeRound(marginScore),
      runwayScore: safeRound(runwayScore),
      budgetScore: safeRound(budgetScore),
      growthScore: safeRound(growthScore)
    };
  } else {
    const savingsRateScore = savingsRate >= 30 ? 100 : (savingsRate > 0 ? (savingsRate / 30) * 100 : 0);
    const avgMonthlyExpense = totalOutflow || 1;
    const monthsCovered = currentBalance / avgMonthlyExpense;
    const emergencyBufferScore = monthsCovered >= 6 ? 100 : Math.max(0, (monthsCovered / 6) * 100);

    let goalsScore = 100;
    if (savingsGoals && savingsGoals.length > 0) {
      const sum = savingsGoals.reduce((acc, g) => {
        const pct = g.targetAmount > 0 ? (Math.min(g.currentAmount || 0, g.targetAmount) / g.targetAmount) * 100 : 100;
        return acc + pct;
      }, 0);
      goalsScore = sum / savingsGoals.length;
    }

    const total = Math.round((savingsRateScore * 0.30) + (emergencyBufferScore * 0.30) + (budgetScore * 0.25) + (goalsScore * 0.15));
    const score = Math.max(0, Math.min(100, total));

    return {
      score,
      grade: score >= 80 ? 'EXCELLENT' : score >= 60 ? 'HEALTHY' : score >= 40 ? 'MODERATE' : 'AT_RISK',
      zeroFloorTriggered: false,
      savingsRateScore: safeRound(savingsRateScore),
      emergencyBufferScore: safeRound(emergencyBufferScore),
      budgetScore: safeRound(budgetScore),
      goalsScore: safeRound(goalsScore)
    };
  }
}

/**
 * 8.2 Safe Daily Spend (Personal Workspace Mode)
 */
export function calculateSafeDailySpend({
  currentBalance = 0,
  categoryBudgets = {},
  categorySpending = {},
  daysInMonth = 30,
  currentDay = new Date().getDate()
}: {
  currentBalance: number;
  categoryBudgets?: Record<string, number>;
  categorySpending?: Record<string, number>;
  daysInMonth?: number;
  currentDay?: number;
}) {
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);
  let remainingCommitted = 0;
  Object.keys(categoryBudgets || {}).forEach(k => {
    const limit = Number(categoryBudgets[k]) || 0;
    const spent = Number(categorySpending[k]) || 0;
    if (limit > spent) remainingCommitted += (limit - spent);
  });

  const discretionaryPool = Math.max(0, currentBalance - remainingCommitted);
  const safeDailySpend = safeRound(discretionaryPool / remainingDays);

  return {
    safeDailySpend,
    discretionaryPool: safeRound(discretionaryPool),
    remainingCommitted: safeRound(remainingCommitted),
    remainingDays
  };
}

/**
 * 8.3 Dual Runway Engine & What-If Simulation Sandbox
 */
export function calculateDualRunwayWithSandbox({
  currentBalance = 0,
  monthlyOutflow = 0,
  monthlyInflow = 0,
  subscriptionCost = 0,
  overrides = null
}: {
  currentBalance: number;
  monthlyOutflow: number;
  monthlyInflow: number;
  subscriptionCost?: number;
  overrides?: {
    simulatedBalance?: number;
    simulatedInflow?: number;
    simulatedOutflow?: number;
    excludeSubscriptions?: boolean;
  } | null;
}) {
  const effSub = (overrides && overrides.excludeSubscriptions) ? 0 : (subscriptionCost || 0);
  const startBal = (overrides && overrides.simulatedBalance !== undefined) ? overrides.simulatedBalance : currentBalance;
  const inFlow = (overrides && overrides.simulatedInflow !== undefined) ? overrides.simulatedInflow : monthlyInflow;
  const outFlow = (overrides && overrides.simulatedOutflow !== undefined) ? overrides.simulatedOutflow : (monthlyOutflow + effSub);

  const netBurn = Math.max(0, outFlow - inFlow);
  const standardRunwayMonths = netBurn > 0 ? safeRound(startBal / netBurn, 1) : (startBal > 0 ? 99 : 0);
  const worstCaseRunwayMonths = outFlow > 0 ? safeRound(startBal / outFlow, 1) : 99;

  const projections = [];
  let rollingStd = startBal;
  let rollingWorst = startBal;

  for (let i = 1; i <= 6; i++) {
    rollingStd = safeRound(rollingStd + inFlow - outFlow);
    rollingWorst = safeRound(rollingWorst - outFlow);

    projections.push({
      label: `Proj.${i}*`,
      monthIndex: i,
      standardBalance: Math.max(0, rollingStd),
      worstCaseBalance: Math.max(0, rollingWorst)
    });
  }

  return {
    startingBalance: startBal,
    standardRunwayMonths,
    worstCaseRunwayMonths,
    monthlyInflow: inFlow,
    monthlyOutflow: outFlow,
    projections
  };
}

/**
 * Month-over-Month Variance Calculator ("What Changed?")
 */
export function calculateMoMVariance(currentIn: number, currentOut: number, prevIn: number, prevOut: number) {
  const currMargin = currentIn > 0 ? ((currentIn - currentOut) / currentIn) * 100 : 0;
  const prevMargin = prevIn > 0 ? ((prevIn - prevOut) / prevIn) * 100 : 0;

  return {
    revenueDelta: safeRound(currentIn - prevIn),
    revenuePct: prevIn > 0 ? safeRound(((currentIn - prevIn) / prevIn) * 100, 1) : (currentIn > 0 ? 100 : 0),
    outflowDelta: safeRound(currentOut - prevOut),
    outflowPct: prevOut > 0 ? safeRound(((currentOut - prevOut) / prevOut) * 100, 1) : (currentOut > 0 ? 100 : 0),
    marginDelta: safeRound(currMargin - prevMargin, 1),
    isRevenueUp: currentIn >= prevIn,
    isExpenseDown: currentOut <= prevOut
  };
}

/**
 * NLP Quick Log Natural Language Parser
 * Converts strings like "Paid 450 for Swiggy food yesterday" or "Received 25000 from client for consulting via UPI"
 */
export function parseNLPQuickLog(input: string): Partial<TransactionItem> {
  if (!input || !input.trim()) return {};

  const clean = input.trim();
  const lower = clean.toLowerCase();

  // 1. Detect Type (Income vs Expense)
  const isIncome = /received|credited|got|salary|earned|income|deposit|cashback/i.test(lower);
  const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

  // 2. Extract Numeric Amount
  let amount = 0;
  const amtMatch = clean.match(/(?:₹|rs\.?|inr|\$)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  if (amtMatch) {
    amount = parseFloat(amtMatch[1].replace(/,/g, '')) || 0;
  }

  // 3. Detect Category & Subcategory
  let category = 'Other';
  let subcategory = '';

  if (/swiggy|zomato|food|lunch|dinner|breakfast|restaurant|cafe|chai|coffee|groceries|kirana/i.test(lower)) {
    category = 'Food';
    subcategory = /grocery|kirana/i.test(lower) ? 'Groceries' : 'Dining';
  } else if (/rent|landlord|flat|office space/i.test(lower)) {
    category = 'Rent';
  } else if (/electricity|bescom|tneb|water|gas|wifi|broadband|airtel|jio|bill/i.test(lower)) {
    category = 'Utilities';
    subcategory = /electricity/i.test(lower) ? 'Electricity' : (/water/i.test(lower) ? 'Water' : 'Internet');
  } else if (/fuel|petrol|diesel|uber|ola|cab|flight|train|irctc|bus|travel/i.test(lower)) {
    category = 'Travel';
    subcategory = /fuel|petrol|diesel/i.test(lower) ? 'Fuel' : 'Transit';
  } else if (/salary|payroll|wages|stipend|freelance|consulting/i.test(lower)) {
    category = 'Payroll';
  } else if (/amazon|flipkart|myntra|shopping|supplies|hardware|stationery/i.test(lower)) {
    category = 'Office';
  } else if (/ads|marketing|campaign|meta|google ads|seo/i.test(lower)) {
    category = 'Marketing';
  } else if (/aws|azure|github|software|notion|slack|zoho/i.test(lower)) {
    category = 'Software';
  }

  // 4. Detect Date
  let date = new Date().toISOString().split('T')[0];
  if (/yesterday/i.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split('T')[0];
  } else if (/day before yesterday/i.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    date = d.toISOString().split('T')[0];
  }

  // 5. Detect Payment Mode
  let paymentMethod = 'UPI';
  if (/cash/i.test(lower)) paymentMethod = 'Cash';
  else if (/card|credit card|debit card/i.test(lower)) paymentMethod = 'Card';
  else if (/netbanking|transfer|neft|rtgs/i.test(lower)) paymentMethod = 'Net Banking';

  // 6. Clean Narration
  const description = clean.replace(/^(paid|received|spent|got)\s+/i, '');

  return {
    amount,
    type,
    category,
    subcategory,
    date,
    paymentMethod,
    description: description.charAt(0).toUpperCase() + description.slice(1)
  };
}
