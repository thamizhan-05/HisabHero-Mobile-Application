import {
  normalizeDevanagari,
  parseCleanAmount,
  standardizeDate,
  categorizeByNarration,
  isSummaryOrNonTransactionLine,
  determineCashFlowType,
  filterOutSummaryRows
} from '../backend/services/pdfParsers.js';

import {
  SAMPLE_SBI_TEXT,
  SAMPLE_ICICI_TEXT,
  SAMPLE_IOB_TEXT,
  SAMPLE_INDIAN_BANK_TEXT
} from './test_bank_parsers.mjs';

export function extractMerchantFromNarration(narration = '', bankName = '') {
  if (!narration) return `${bankName} Transaction`;
  const clean = narration.trim();

  // Pattern: UPI/DR/<rrn>/<MERCHANT>/... or UPI/CR/<rrn>/<MERCHANT>/...
  if (/^UPI\/(?:DR|CR)\//i.test(clean)) {
    const parts = clean.split('/');
    if (parts.length >= 4 && parts[3].trim()) {
      return parts[3].trim();
    }
  }

  // Pattern: UPI/<MERCHANT>/...
  if (/^UPI\/([^\/]+)\//i.test(clean)) {
    const match = clean.match(/^UPI\/([^\/]+)\//i);
    if (match && match[1] && !/^(?:DR|CR)$/i.test(match[1])) {
      return match[1].trim();
    }
  }

  // Pattern: IFSC/Beneficiary e.g. YESB0PTMUPI/Sunil kumar ramkeval kahar/XXXXX/...
  const ifscMerchant = clean.match(/^[A-Z]{4}\w+\/([^\/]+)\//i);
  if (ifscMerchant && ifscMerchant[1]) {
    return ifscMerchant[1].trim();
  }

  // Pattern: NEFT-ICIC-IN...-ULAGAMMAL or BIL/NEFT/.../ULAGAMMAL/...
  if (/NEFT/i.test(clean)) {
    const neftParts = clean.split(/[-\/]/);
    for (let i = neftParts.length - 1; i >= 0; i--) {
      const part = neftParts[i].trim();
      if (part && !/^\d+$/.test(part) && !/^(?:NEFT|ICIC|IN\d+|INDIA|OVERSEAS|BANK)$/i.test(part) && part.length > 2) {
        return part;
      }
    }
  }

  // Pattern: CAM/03272SRY/CASH DEP-Other/...
  if (/CASH\s*DEP/i.test(clean)) {
    return 'Cash Deposit';
  }

  const firstToken = clean.split(/[\/\-]/)[0].trim();
  return firstToken || `${bankName} Narration`;
}

// ─── 1. SBI PARSER ───
export function parseSbiStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || isSummaryOrNonTransactionLine('', '', line)) continue;
    if (/^Your\s+(?:Opening|Closing)\s+Balance/i.test(line)) continue;
    if (/^(?:Date|TRANSACTION|SAVING|Relationship|Customer|Welcome|Account|Branch)/i.test(line)) continue;

    // Pattern 1: Standard SBI table row:
    // Date Narration Ref Credit Debit Balance
    // 01-02-26 UPI/DR/603220940637/ROYAL SW/YESB/q808440253/UPI - 0 70.00 5305.14
    // 01-02-26 UPI/CR/437036914218/MUNUSAMY/SBIN/7678224964/Haris - 1500.00 0 6805.14
    const sbiTableRegex = /^(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\s+(.+?)\s+(?:(-|--|[A-Za-z0-9\/]+)\s+)?([\d,]+(?:\.\d{2})?|-)\s+([\d,]+(?:\.\d{2})?|-)\s+([\d,]+(?:\.\d{2})?)$/i;
    let match = line.match(sbiTableRegex);

    if (match) {
      const [, dateStr, desc, refNo, creditStr, debitStr, balStr] = match;
      const credit = parseCleanAmount(creditStr);
      const debit = parseCleanAmount(debitStr);
      const balance = parseCleanAmount(balStr);

      if (credit === 0 && debit === 0) continue;

      let type = 'expense';
      let amount = debit;
      if (credit > 0 && debit === 0) {
        type = 'income';
        amount = credit;
      } else if (debit > 0 && credit === 0) {
        type = 'expense';
        amount = debit;
      } else if (/\bUPI\/CR\b/i.test(desc) || /\bCR\b/i.test(desc)) {
        type = 'income';
        amount = credit || debit;
      } else {
        type = 'expense';
        amount = debit || credit;
      }

      transactions.push({
        tempId: `sbi-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: desc.trim(),
        merchantName: extractMerchantFromNarration(desc, 'SBI'),
        category: categorizeByNarration(desc),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        balance,
        referenceNumber: refNo && refNo !== '-' && refNo !== '--' ? refNo.trim() : undefined,
        confidenceScore: 0.99,
        bankName: 'State Bank of India',
        approved: true
      });
      continue;
    }

    // Pattern 2: Multi-line fallback where line starts with date
    const datePrefixMatch = line.match(/^(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/);
    if (datePrefixMatch) {
      const numbers = [...line.matchAll(/([\d,]+\.\d{2})/g)].map(m => m[1]);
      if (numbers.length >= 2) {
        const balStr = numbers[numbers.length - 1];
        const prevNumStr = numbers[numbers.length - 2];
        const balance = parseCleanAmount(balStr);
        const amount = parseCleanAmount(prevNumStr);
        const isCr = /\bUPI\/CR\b/i.test(line) || /\bCR\b/i.test(line);
        const type = isCr ? 'income' : 'expense';

        transactions.push({
          tempId: `sbi-${Date.now()}-${idCounter++}`,
          date: standardizeDate(datePrefixMatch[1]),
          description: line,
          merchantName: extractMerchantFromNarration(line, 'SBI'),
          category: categorizeByNarration(line),
          type,
          amount,
          debit: type === 'expense' ? amount : 0,
          credit: type === 'income' ? amount : 0,
          balance,
          confidenceScore: 0.95,
          bankName: 'State Bank of India',
          approved: true
        });
      }
    }
  }

  return filterOutSummaryRows(transactions);
}

// ─── 2. ICICI BANK PARSER ───
export function parseIciciStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  // Preprocess lines: Group multi-line entries that start with (serial + date) or date
  const groupedEntries = [];
  let currentEntry = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || isSummaryOrNonTransactionLine('', '', trimmed)) continue;
    if (/^(?:Statement of Transactions|Your Base Branch|Sincerely|Team ICICI|This is a system|Never share|www\.icici|Please call|Legends for|RCHG|DTAX|BPAY|IDTX|BBPS|INFT|BIL|ONL|NEFT|PAVC|PAC|LNPY|CCWD|PAYC|IMPS|VAT|INF|EBA|SMO|VPS|TOP|BCTT|UCCBRN|LCCBRN|N chg|MMT|T Chg|SGB|Page\s*\d+)/i.test(trimmed)) continue;
    if (/^(?:S No\.|Transaction Date|Cheque Number|Transaction Remarks|Withdrawal Amount|Deposit Amount|Balance)/i.test(trimmed)) continue;

    // Check if line starts a new transaction: e.g. "1 10.09.2026" or "10.09.2026"
    const isNewTxn = /^(?:\d+\s+)?\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}/.test(trimmed);
    if (isNewTxn) {
      if (currentEntry) groupedEntries.push(currentEntry);
      currentEntry = trimmed;
    } else if (currentEntry) {
      currentEntry += ' ' + trimmed;
    }
  }
  if (currentEntry) groupedEntries.push(currentEntry);

  let prevBalance = null;

  for (const entry of groupedEntries) {
    // Match: [SNo] Date [ChequeNo] Remarks [Withdrawal] [Deposit] Balance
    // Or: [SNo] Date [ChequeNo] Remarks Amount Balance
    const match = entry.match(/^(?:(\d+)\s+)?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\s+(.+)$/);
    if (!match) continue;

    const [, sNo, dateStr, rest] = match;

    // Extract all currency / decimal amounts from the end of the entry
    const amountMatches = [...rest.matchAll(/([\d,]+\.\d{2})/g)];
    if (amountMatches.length === 0) continue;

    const balanceStr = amountMatches[amountMatches.length - 1][1];
    const balance = parseCleanAmount(balanceStr);

    let amount = 0;
    let type = 'expense';
    let debit = 0;
    let credit = 0;
    let desc = rest;

    if (amountMatches.length >= 3) {
      // Format: Withdrawal Deposit Balance
      const withdrawalStr = amountMatches[amountMatches.length - 3][1];
      const depositStr = amountMatches[amountMatches.length - 2][1];
      debit = parseCleanAmount(withdrawalStr);
      credit = parseCleanAmount(depositStr);

      if (credit > 0 && debit === 0) {
        type = 'income';
        amount = credit;
      } else {
        type = 'expense';
        amount = debit;
      }
      desc = rest.replace(withdrawalStr, '').replace(depositStr, '').replace(balanceStr, '').trim();
    } else if (amountMatches.length >= 2) {
      // Format: Amount Balance
      const amtStr = amountMatches[amountMatches.length - 2][1];
      amount = parseCleanAmount(amtStr);
      desc = rest.slice(0, rest.lastIndexOf(amtStr)).trim();

      // Determine income vs expense
      // 1. Balance arithmetic
      if (prevBalance !== null) {
        const diff = balance - prevBalance;
        if (Math.abs(diff - amount) < 0.05) {
          type = 'income';
        } else if (Math.abs(diff + amount) < 0.05) {
          type = 'expense';
        }
      }

      // 2. Keyword heuristic override
      if (/\b(?:Credit\s*trxn|Payment\s*fr|received|refund|cashback|CR)\b/i.test(desc)) {
        type = 'income';
      } else if (/\b(?:Bil\s*Payment|Payment\s*to|withdrawn|debit|DR|iDirect)\b/i.test(desc)) {
        type = 'expense';
      }

      if (type === 'income') {
        credit = amount;
      } else {
        debit = amount;
      }
    } else {
      continue;
    }

    prevBalance = balance;

    transactions.push({
      tempId: `icici-${Date.now()}-${idCounter++}`,
      date: standardizeDate(dateStr),
      description: desc.trim(),
      merchantName: extractMerchantFromNarration(desc, 'ICICI'),
      category: categorizeByNarration(desc),
      type,
      amount,
      debit: type === 'expense' ? amount : 0,
      credit: type === 'income' ? amount : 0,
      balance,
      referenceNumber: sNo || undefined,
      confidenceScore: 0.99,
      bankName: 'ICICI Bank',
      approved: true
    });
  }

  return filterOutSummaryRows(transactions);
}

// ─── 3. INDIAN OVERSEAS BANK (IOB) PARSER ───
export function parseIobStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  // Preprocess multi-line entries: Date(Value Date) Particulars RefNo TxnType Debit Credit Balance
  const groupedEntries = [];
  let currentEntry = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || isSummaryOrNonTransactionLine('', '', trimmed)) continue;
    if (/^(?:Page\s*\d+|Report Generation|STATEMENT OF THE ACCOUNT|CUSTOMER DETAILS|Customer ID|Branch Address|Account No|Effective available balance|\*\*This is a computer)/i.test(trimmed)) continue;
    if (/^(?:Date\(Value Date\)|Particulars|Ref No\.|Transaction Type|Debit\(Rs\)|Credit\(Rs\)|Balance\(Rs\))/i.test(trimmed)) continue;
    if (/^[\d,]+\.\d{2}\s+[\d,]+\.\d{2}$/.test(trimmed)) continue; // Bottom total row (e.g. 28,364.53 29,500.00)

    const isDateStart = /^(\d{1,2}-[A-Za-z]{3}-\d{2,4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/.test(trimmed);
    if (isDateStart) {
      if (currentEntry) groupedEntries.push(currentEntry);
      currentEntry = trimmed;
    } else if (currentEntry) {
      currentEntry += ' ' + trimmed;
    }
  }
  if (currentEntry) groupedEntries.push(currentEntry);

  for (const entry of groupedEntries) {
    // Example:
    // 19-Sep-26 (19-Sep-26) NEFT-ICIC-IN12626256075479-ULAGAMMAL S49644638 Transfer - 5,500.00 5,615.46
    // 19-Sep-26 (19-Sep-26) UPI/662852171325/DR/GAYATRI FRESH /YES/veg S48007774 Transfer 30.00 - 115.46
    const dateMatch = entry.match(/^(\d{1,2}-[A-Za-z]{3}-\d{2,4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})(?:\s*\(\d{1,2}-[A-Za-z]{3}-\d{2,4}\))?\s+(.+)$/);
    if (!dateMatch) continue;

    const [, dateStr, rest] = dateMatch;

    // Last 3 columns are Debit(Rs) Credit(Rs) Balance(Rs)
    // Debit or Credit can be "-" or a number
    const colsMatch = rest.match(/([\d,]+(?:\.\d{2})?|-)\s+([\d,]+(?:\.\d{2})?|-)\s+([\d,]+(?:\.\d{2})?)$/);
    if (!colsMatch) continue;

    const [fullCols, debitStr, creditStr, balStr] = colsMatch;
    const debit = parseCleanAmount(debitStr);
    const credit = parseCleanAmount(creditStr);
    const balance = parseCleanAmount(balStr);

    if (debit === 0 && credit === 0) continue;

    const type = credit > 0 ? 'income' : 'expense';
    const amount = type === 'income' ? credit : debit;

    // Remaining part contains Particulars [RefNo] [TxnType]
    let descPart = rest.slice(0, rest.length - fullCols.length).trim();
    // Remove trailing TxnType (Transfer / Clearing / Cash)
    descPart = descPart.replace(/\s+(?:Transfer|Clearing|Cash|ATM|NEFT|RTGS|UPI|IMPS|POS)$/i, '').trim();

    // Extract RefNo if present at end of descPart (e.g. S49644638)
    let refNo;
    const refMatch = descPart.match(/\s+([A-Za-z0-9]{8,12})$/);
    if (refMatch) {
      refNo = refMatch[1];
      descPart = descPart.slice(0, descPart.length - refMatch[0].length).trim();
    }

    transactions.push({
      tempId: `iob-${Date.now()}-${idCounter++}`,
      date: standardizeDate(dateStr),
      description: descPart,
      merchantName: extractMerchantFromNarration(descPart, 'IOB'),
      category: categorizeByNarration(descPart),
      type,
      amount,
      debit: type === 'expense' ? amount : 0,
      credit: type === 'income' ? amount : 0,
      balance,
      referenceNumber: refNo,
      confidenceScore: 0.99,
      bankName: 'Indian Overseas Bank',
      approved: true
    });
  }

  return filterOutSummaryRows(transactions);
}

// ─── 4. INDIAN BANK PARSER ───
export function parseIndianBankStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  // Preprocess multi-line entries: Date Transaction Details Debits Credits Balance
  const groupedEntries = [];
  let currentEntry = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || isSummaryOrNonTransactionLine('', '', trimmed)) continue;
    if (/^(?:ACCOUNT STATEMENT|Last \d+ Transactions|ACCOUNT DETAILS|Account Holder|Account Type|Account Number|Customer's Address|Branch Name|IFSC|Account Currency|ACCOUNT SUMMARY|Opening Balance|Total Credits|Total Debits|Ending Balance|ACCOUNT ACTIVITY|Indian Bank)/i.test(trimmed)) continue;
    if (/^(?:Date|Transaction Details|Debits|Credits|Balance)/i.test(trimmed)) continue;
    if (/^Total\s+INR/i.test(trimmed)) continue;

    const isDateStart = /^(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}-[A-Za-z]{3}-\d{2,4})/.test(trimmed);
    if (isDateStart) {
      if (currentEntry) groupedEntries.push(currentEntry);
      currentEntry = trimmed;
    } else if (currentEntry) {
      currentEntry += ' ' + trimmed;
    }
  }
  if (currentEntry) groupedEntries.push(currentEntry);

  for (const entry of groupedEntries) {
    // Example:
    // 30 Aug 2026 YESB0PTMUPI/Sunil kumar.../UPI/660840562611/UPI INR 60.00 - INR 4,422.48
    // 31 Aug 2026 IOBA0000094/AMALRAJP/.../UPI - INR 1,650.00 INR 5,772.48
    const dateMatch = entry.match(/^(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}-[A-Za-z]{3}-\d{2,4})\s+(.+)$/);
    if (!dateMatch) continue;

    const [, dateStr, rest] = dateMatch;

    // Match Debits Credits Balance at the end
    // Each can have optional "INR " prefix, or be "-"
    const colsMatch = rest.match(/(?:INR\s*)?([\d,]+(?:\.\d{2})?|-)\s+(?:INR\s*)?([\d,]+(?:\.\d{2})?|-)\s+(?:INR\s*)?([\d,]+(?:\.\d{2})?)$/i);
    if (!colsMatch) continue;

    const [fullCols, debitStr, creditStr, balStr] = colsMatch;
    const debit = parseCleanAmount(debitStr);
    const credit = parseCleanAmount(creditStr);
    const balance = parseCleanAmount(balStr);

    if (debit === 0 && credit === 0) continue;

    const type = credit > 0 ? 'income' : 'expense';
    const amount = type === 'income' ? credit : debit;
    const descPart = rest.slice(0, rest.length - fullCols.length).trim();

    transactions.push({
      tempId: `indianbank-${Date.now()}-${idCounter++}`,
      date: standardizeDate(dateStr),
      description: descPart,
      merchantName: extractMerchantFromNarration(descPart, 'Indian Bank'),
      category: categorizeByNarration(descPart),
      type,
      amount,
      debit: type === 'expense' ? amount : 0,
      credit: type === 'income' ? amount : 0,
      balance,
      confidenceScore: 0.99,
      bankName: 'Indian Bank',
      approved: true
    });
  }

  return filterOutSummaryRows(transactions);
}

// ─── RUN VERIFICATION TESTS ───
console.log('=== RUNNING UPGRADED BANK PARSERS TEST ===\n');

const sbi = parseSbiStatement(SAMPLE_SBI_TEXT);
console.log(`✅ SBI Extracted: ${sbi.length} transactions (Expected: 21)`);
console.log('Sample SBI transaction:', sbi[0]);

const icici = parseIciciStatement(SAMPLE_ICICI_TEXT);
console.log(`\n✅ ICICI Extracted: ${icici.length} transactions (Expected: 11)`);
console.log('Sample ICICI transaction:', icici[0]);

const iob = parseIobStatement(SAMPLE_IOB_TEXT);
console.log(`\n✅ IOB Extracted: ${iob.length} transactions (Expected: 25)`);
console.log('Sample IOB transaction:', iob[0]);

const indianBank = parseIndianBankStatement(SAMPLE_INDIAN_BANK_TEXT);
console.log(`\n✅ Indian Bank Extracted: ${indianBank.length} transactions (Expected: 30)`);
console.log('Sample Indian Bank transaction:', indianBank[0]);
