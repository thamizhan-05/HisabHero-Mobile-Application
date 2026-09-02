// ─── HISABHERO DETERMINISTIC LOCAL CFO EXPERT ENGINE ───
// Provides sub-5ms offline financial advice, runway calculation, affordability simulation, and category audits

export function parseRequestedAmount(query = '') {
  const match = query.match(/(?:(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?))|(?:(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|rupees?|bucks|k|lac|lakh)?)/i);
  if (!match) return null;
  const raw = (match[1] || match[2] || '').replace(/,/g, '');
  let val = parseFloat(raw);
  if (isNaN(val)) return null;

  // Handle 'k', 'lakh', 'lac' suffixes in natural language
  const lower = query.toLowerCase();
  if (lower.includes(`${raw}k`) || lower.includes(`${raw} k`)) val *= 1000;
  if (lower.includes(`${raw}lakh`) || lower.includes(`${raw} lakh`) || lower.includes(`${raw}lac`)) val *= 100000;

  return val;
}

export function generateLocalCfoAnalysis({ workspace, message = '', transactions = [], language = 'en' }) {
  const query = message.trim().toLowerCase();
  const openingBal = Number(workspace?.openingBalance || 0);

  let totalInflow = 0;
  let totalOutflow = 0;
  const categoryMap = {};
  const merchantMap = {};

  transactions.forEach(t => {
    const amt = Number(t.amount || 0);
    if (t.type === 'income') {
      totalInflow += amt;
    } else {
      totalOutflow += amt;
      const cat = t.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;

      const merch = t.merchant || t.description || 'Unknown';
      merchantMap[merch] = (merchantMap[merch] || 0) + amt;
    }
  });

  const currentBalance = openingBal + totalInflow - totalOutflow;
  const monthlyBurn = totalOutflow > 0 ? (totalOutflow / 2.5) : 1;
  const runwayMonths = monthlyBurn > 0 ? (currentBalance / monthlyBurn).toFixed(1) : '12.0+';

  // Sort categories by expenditure
  const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  // ─── 1. AFFORDABILITY & PURCHASE SIMULATION ───
  if (/(?:can i (?:afford|buy|spend|purchase)|should i buy|afford to spend|buying|purchase of)/i.test(query)) {
    const requestedAmt = parseRequestedAmount(query);
    if (requestedAmt && requestedAmt > 0) {
      const remainingBal = currentBalance - requestedAmt;
      const newRunway = monthlyBurn > 0 ? (remainingBal / monthlyBurn).toFixed(1) : '0';

      if (remainingBal < 0) {
        return {
          handled: true,
          reply: `🚫 **High Risk: Not Recommended**. Spending **₹${requestedAmt.toLocaleString('en-IN')}** will deplete your balance by **₹${Math.abs(remainingBal).toLocaleString('en-IN')}** and cause immediate cash deficit. Your current reserve is **₹${currentBalance.toLocaleString('en-IN')}**.`,
          suggestedActions: ['📈 Increase Inflow', '🎯 Set a Savings Goal', '📊 View Cash Flow']
        };
      } else if (Number(newRunway) < 2.0) {
        return {
          handled: true,
          reply: `⚠️ **Caution Advised**. A purchase of **₹${requestedAmt.toLocaleString('en-IN')}** leaves you with **₹${remainingBal.toLocaleString('en-IN')}**, compressing your liquid runway to **${newRunway} months** (below the 3-month safety floor). Consider saving first.`,
          suggestedActions: ['🎯 Set Financial Goal', '📊 Check Runway Simulator', '💡 Cost Optimization']
        };
      } else {
        return {
          handled: true,
          reply: `✅ **Affordable**. Spending **₹${requestedAmt.toLocaleString('en-IN')}** leaves a strong reserve of **₹${remainingBal.toLocaleString('en-IN')}** with **${newRunway} months** of liquid runway intact.`,
          suggestedActions: ['➕ Log Expense', '🎯 View Goals', '📊 View Runway']
        };
      }
    }
  }

  // ─── 2. TOP EXPENSES & CATEGORY BREAKDOWN ───
  if (/(?:where (?:did|is) my money|top (?:expense|spend|spending)|category|breakdown|spending most|highest expense)/i.test(query)) {
    if (sortedCategories.length === 0) {
      return {
        handled: true,
        reply: `No outflow records logged yet in **${workspace?.name || 'Workspace'}**. Current balance is **₹${currentBalance.toLocaleString('en-IN')}**.`,
        suggestedActions: ['📄 Upload Statement', '➕ Add Transaction']
      };
    }

    const top3 = sortedCategories.slice(0, 3).map(([cat, amt]) => {
      const pct = totalOutflow > 0 ? ((amt / totalOutflow) * 100).toFixed(1) : 0;
      return `**${cat}**: ₹${amt.toLocaleString('en-IN')} (${pct}%)`;
    }).join(' • ');

    return {
      handled: true,
      reply: `📊 **Top Outflow Distribution** (Total Outflow: **₹${totalOutflow.toLocaleString('en-IN')}**):\n\n${top3}\n\nTop outflow category is **${sortedCategories[0][0]}** at **₹${sortedCategories[0][1].toLocaleString('en-IN')}**.`,
      suggestedActions: ['📊 View Category Chart', '💡 Get Savings Tips', '🧾 Export Report']
    };
  }

  // ─── 3. SAVINGS & COST OPTIMIZATION ───
  if (/(?:how (?:can|to) (?:save|cut|reduce)|save money|cut costs|reduce burn|optimize expense)/i.test(query)) {
    const discretionaryCategories = ['Food', 'Dining', 'Entertainment', 'Shopping', 'Travel', 'Other'];
    let discretionarySum = 0;
    sortedCategories.forEach(([cat, amt]) => {
      if (discretionaryCategories.some(d => cat.toLowerCase().includes(d.toLowerCase()))) {
        discretionarySum += amt;
      }
    });

    const potential20PctSaving = Math.round(discretionarySum * 0.20);
    const addedRunwayDays = monthlyBurn > 0 ? Math.round((potential20PctSaving / (monthlyBurn / 30))) : 0;

    return {
      handled: true,
      reply: `💡 **Actionable Savings Strategy**:\nTrimming discretionary categories (${sortedCategories.slice(0, 2).map(c => c[0]).join(', ')}) by **20%** recovers approx **₹${potential20PctSaving.toLocaleString('en-IN')}/mo**, extending your runway by **+${addedRunwayDays} days**.`,
      suggestedActions: ['🎯 Set Monthly Budget', '📊 View Runway', '🔍 Audit Expenses']
    };
  }

  // ─── 4. RUNWAY, CASHFLOW & HEALTH SCORE ───
  if (/(?:runway|cashflow|cash flow|health score|burn rate|how is (?:my )?(?:business|finance|account))/i.test(query)) {
    const netMargin = totalInflow > 0 ? (((totalInflow - totalOutflow) / totalInflow) * 100).toFixed(1) : '0.0';
    const status = Number(runwayMonths) >= 6 ? '🟢 Excellent' : (Number(runwayMonths) >= 3 ? '🟡 Stable' : '🔴 Critical');

    return {
      handled: true,
      reply: `📈 **Financial Health Summary** (${status}):\n• **Net Balance:** ₹${currentBalance.toLocaleString('en-IN')}\n• **Total Inflow:** ₹${totalInflow.toLocaleString('en-IN')}\n• **Total Outflow:** ₹${totalOutflow.toLocaleString('en-IN')}\n• **Liquid Runway:** **${runwayMonths} Months** (Net Margin: **${netMargin}%**)`,
      suggestedActions: ['📊 Open Live Simulator', '🧾 Export Report', '🎯 Manage Budgets']
    };
  }

  // ─── 5. SUMMARY OF RECENT TRANSACTIONS ───
  if (/(?:summary|recent|last transaction|what happened|overview)/i.test(query)) {
    const count = transactions.length;
    return {
      handled: true,
      reply: `📋 Workspace **${workspace?.name || 'Active'}** has **${count}** recorded transactions. Net balance stands at **₹${currentBalance.toLocaleString('en-IN')}** (Inflow: **₹${totalInflow.toLocaleString('en-IN')}**, Outflow: **₹${totalOutflow.toLocaleString('en-IN')}**).`,
      suggestedActions: ['📊 View Transactions', '📄 Upload Statement', '🤖 Ask AI CFO']
    };
  }

  // If query is an unhandled natural language question, return fallback summary ready for Gemini enrichment
  return {
    handled: false,
    fallbackSummary: `Found **${transactions.length}** records in workspace "${workspace?.name || 'Active'}". Current liquid balance is **₹${currentBalance.toLocaleString('en-IN')}** with **${runwayMonths} months** runway.`,
    stats: { currentBalance, totalInflow, totalOutflow, runwayMonths, sortedCategories }
  };
}
