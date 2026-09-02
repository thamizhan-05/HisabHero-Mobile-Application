import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Comprehensive Vernacular Indian Numerals Mapping (Hindi, Marathi, Gujarati, Tamil, Telugu, etc.)
const INDIAN_VERNACULAR_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
  '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
};

export function normalizeDevanagari(text = '') {
  if (!text) return '';
  return String(text).replace(/[०-९૦-૯௦-௯౦-౯]/g, (w) => INDIAN_VERNACULAR_DIGITS[w] || w);
}

export function parseCleanAmount(val) {
  if (!val || val === '-' || val === '--') return 0;
  const normalized = normalizeDevanagari(String(val)).replace(/,/g, '').trim();
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.abs(num);
}

export function standardizeDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const cleaned = normalizeDevanagari(String(dateStr)).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // DD/MM/YY or DD/MM/YYYY or DD-MM-YYYY
  const m = cleaned.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = '20' + y;
    d = d.padStart(2, '0');
    mo = mo.padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }

  // DD-MMM-YYYY or DD MMM YYYY (e.g. 15-AUG-2026 or 15 Aug 2026 or 15-Aug-26)
  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const mNamed = cleaned.match(/^(\d{1,2})[\s\/-]([A-Za-z]{3})[\s\/-]?(\d{2,4})?/);
  if (mNamed) {
    let [, d, mon, y] = mNamed;
    if (!y) y = String(new Date().getFullYear());
    else if (y.length === 2) y = '20' + y;
    const mo = monthMap[mon.toLowerCase()] || '01';
    return `${y}-${mo}-${d.padStart(2, '0')}`;
  }

  const d = new Date(cleaned);
  return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
}

// ─── AUTO CLASSIFIER / CATEGORIZER ───
export function categorizeByNarration(narration = '') {
  const text = narration.toLowerCase();
  if (text.includes('swiggy') || text.includes('zomato') || text.includes('restaurant') || text.includes('food') || text.includes('cafe') || text.includes('mcdonald') || text.includes('hotel') || text.includes('किराणा') || text.includes('dining')) {
    return 'Food & Dining';
  }
  if (text.includes('rent') || text.includes('broker') || text.includes('landlord') || text.includes('भाडे') || text.includes('maintenance')) {
    return 'Rent & Utilities';
  }
  if (text.includes('salary') || text.includes('payroll') || text.includes('wages') || text.includes('stipend') || text.includes('bonus')) {
    return 'Payroll & Salary';
  }
  if (text.includes('electricity') || text.includes('bescom') || text.includes('tneb') || text.includes('water') || text.includes('gas') || text.includes('billdesk') || text.includes('airtel') || text.includes('jio') || text.includes('broadband') || text.includes('utility')) {
    return 'Rent & Utilities';
  }
  if (text.includes('uber') || text.includes('ola') || text.includes('fuel') || text.includes('petrol') || text.includes('diesel') || text.includes('irctc') || text.includes('flight') || text.includes('indigo') || text.includes('travel') || text.includes('toll') || text.includes('fastag')) {
    return 'Transportation';
  }
  if (text.includes('amazon') || text.includes('flipkart') || text.includes('myntra') || text.includes('retail') || text.includes('mart') || text.includes('store') || text.includes('shopping') || text.includes('zepto') || text.includes('blinkit') || text.includes('instamart') || text.includes('grocer')) {
    return 'Groceries';
  }
  if (text.includes('google ads') || text.includes('facebook ads') || text.includes('meta') || text.includes('marketing') || text.includes('seo') || text.includes('advert')) {
    return 'Marketing';
  }
  if (text.includes('aws') || text.includes('github') || text.includes('zoho') || text.includes('notion') || text.includes('slack') || text.includes('software') || text.includes('subscription') || text.includes('saas') || text.includes('digitalocean')) {
    return 'Technology';
  }
  if (text.includes('consulting') || text.includes('retainer') || text.includes('client payment') || text.includes('freelance') || text.includes('sales')) {
    return 'Consulting & Sales';
  }
  return 'General';
}

// Helper template builder for standard table statements
function createStandardTableParser(bankName, regex, dateIdx, descIdx, refIdx, debitIdx, creditIdx, balIdx) {
  return function parse(text) {
    const transactions = [];
    const lines = text.split(/\r?\n/);
    let idCounter = 1;

    for (const line of lines) {
      const match = line.trim().match(regex);
      if (match) {
        const dateStr = match[dateIdx];
        const desc = match[descIdx] || 'Bank Transaction';
        const refNo = refIdx ? match[refIdx] : undefined;
        const debit = debitIdx ? parseCleanAmount(match[debitIdx]) : 0;
        const credit = creditIdx ? parseCleanAmount(match[creditIdx]) : 0;
        const balance = balIdx ? parseCleanAmount(match[balIdx]) : 0;

        if (debit === 0 && credit === 0) continue;
        const type = credit > 0 ? 'income' : 'expense';
        const amount = type === 'income' ? credit : debit;
        if (amount <= 0) continue;

        transactions.push({
          tempId: `${bankName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}-${idCounter++}`,
          date: standardizeDate(dateStr),
          description: desc.trim(),
          merchantName: desc.split('/')[0].split('-')[0].trim() || `${bankName} Narration`,
          category: categorizeByNarration(desc),
          type,
          amount,
          debit: type === 'expense' ? amount : 0,
          credit: type === 'income' ? amount : 0,
          balance,
          referenceNumber: refNo && refNo !== '-' && refNo !== '--' ? refNo.trim() : undefined,
          confidenceScore: 0.98,
          bankName,
          approved: true
        });
      }
    }
    return transactions;
  };
}

// ─── 1. HDFC BANK ───
export const parseHdfcStatement = createStandardTableParser(
  'HDFC Bank',
  /(\d{2}\/\d{2}\/\d{2,4})\s+(.+?)\s+(\d+|--|\s{2,})\s+(\d{2}\/\d{2}\/\d{2,4})\s+([\d,]+\.\d{2}|0(?:\.00)?|-)\s+([\d,]+\.\d{2}|0(?:\.00)?|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 5, 6, 7
);

// ─── 2. STATE BANK OF INDIA (SBI) ───
export const parseSbiStatement = createStandardTableParser(
  'State Bank of India',
  /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9\/]+)?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 3. ICICI BANK ───
export const parseIciciStatement = createStandardTableParser(
  'ICICI Bank',
  /(\d{2}-\d{2}-\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+([\d,]+\.\d{2}|0(?:\.00)?)\s+([\d,]+\.\d{2}|0(?:\.00)?)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 5, 4, 6
);

// ─── 4. AXIS BANK ───
export const parseAxisStatement = createStandardTableParser(
  'Axis Bank',
  /(\d{2}-\d{2}-\d{4}|\d{2}\/\d{2}\/\d{4})\s+(\S+)?\s+(.+?)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 3, 2, 4, 5, 6
);

// ─── 5. KOTAK MAHINDRA BANK ───
export function parseKotakStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  const kotakRegex = /(\d{2}-[A-Za-z]{3}-\d{2,4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+([\d,]+\.\d{2})\s+\((Dr|Cr)\)\s+([\d,]+\.\d{2})/;
  let idCounter = 1;

  for (const line of lines) {
    const match = line.trim().match(kotakRegex);
    if (match) {
      const [, dateStr, narration, refNo, amtStr, drCr, balStr] = match;
      const amount = parseCleanAmount(amtStr);
      const balance = parseCleanAmount(balStr);
      const type = drCr.toLowerCase() === 'cr' ? 'income' : 'expense';
      if (amount <= 0) continue;

      transactions.push({
        tempId: `kotak-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: narration.trim(),
        merchantName: narration.split('/')[0].trim() || 'Kotak Narration',
        category: categorizeByNarration(narration),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        balance,
        referenceNumber: refNo || undefined,
        confidenceScore: 0.98,
        bankName: 'Kotak Mahindra Bank',
        approved: true
      });
    }
  }
  return transactions;
}

// ─── 6. INDUSIND BANK ───
export const parseIndusIndStatement = createStandardTableParser(
  'IndusInd Bank',
  /(\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 7. YES BANK ───
export const parseYesBankStatement = createStandardTableParser(
  'Yes Bank',
  /(\d{2}\/\d{2}\/\d{4})\s+(?:\d{2}\/\d{2}\/\d{4}\s+)?(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 8. FEDERAL BANK / FI / JUPITER ───
export function parseFederalBankStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  const regex = /(\d{2}-[A-Za-z]{3}-\d{2,4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(DR|CR|Dr|Cr)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/;
  let idCounter = 1;

  for (const line of lines) {
    const match = line.trim().match(regex);
    if (match) {
      const [, dateStr, desc, drCr, amtStr, balStr] = match;
      const amount = parseCleanAmount(amtStr);
      const balance = parseCleanAmount(balStr);
      const type = drCr.toUpperCase() === 'CR' ? 'income' : 'expense';
      if (amount <= 0) continue;

      transactions.push({
        tempId: `federal-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: desc.trim(),
        merchantName: desc.split('/')[0].trim(),
        category: categorizeByNarration(desc),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        balance,
        confidenceScore: 0.98,
        bankName: 'Federal Bank',
        approved: true
      });
    }
  }
  return transactions;
}

// ─── 9. IDFC FIRST BANK ───
export const parseIdfcStatement = createStandardTableParser(
  'IDFC FIRST Bank',
  /(\d{2}-[A-Za-z]{3}-\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+([\d,]+\.\d{2}|0(?:\.00)?|-)\s+([\d,]+\.\d{2}|0(?:\.00)?|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 10. RBL BANK ───
export const parseRblStatement = createStandardTableParser(
  'RBL Bank',
  /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 11. BANDHAN BANK ───
export const parseBandhanStatement = createStandardTableParser(
  'Bandhan Bank',
  /(\d{2}-\d{2}-\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+([\d,]+\.\d{2}|0(?:\.00)?|-)\s+([\d,]+\.\d{2}|0(?:\.00)?|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 12. CITY UNION BANK (CUB) ───
export const parseCityUnionStatement = createStandardTableParser(
  'City Union Bank',
  /(\d{2}-[A-Za-z]{3}-\d{2,4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(\d+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 13. KARUR VYSYA BANK (KVB) ───
export const parseKvbStatement = createStandardTableParser(
  'Karur Vysya Bank',
  /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 14. SOUTH INDIAN BANK (SIB) ───
export const parseSibStatement = createStandardTableParser(
  'South Indian Bank',
  /(\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 15. PUNJAB NATIONAL BANK (PNB) ───
export const parsePnbStatement = createStandardTableParser(
  'Punjab National Bank',
  /(\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|0(?:\.00)?|-)\s+([\d,]+\.\d{2}|0(?:\.00)?|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 16. BANK OF BARODA (BOB) ───
export const parseBobStatement = createStandardTableParser(
  'Bank of Baroda',
  /(\d{2}-\d{2}-\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 17. CANARA BANK ───
export const parseCanaraStatement = createStandardTableParser(
  'Canara Bank',
  /(\d{2}-[A-Za-z]{3}-\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 18. UNION BANK OF INDIA ───
export const parseUnionBankStatement = createStandardTableParser(
  'Union Bank of India',
  /(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 19. INDIAN BANK ───
export const parseIndianBankStatement = createStandardTableParser(
  'Indian Bank',
  /(\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{2,4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 20. BANK OF INDIA (BOI) ───
export const parseBoiStatement = createStandardTableParser(
  'Bank of India',
  /(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 21. INDIAN OVERSEAS BANK (IOB) ───
export const parseIobStatement = createStandardTableParser(
  'Indian Overseas Bank',
  /(\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 22. CENTRAL BANK OF INDIA ───
export const parseCentralBankStatement = createStandardTableParser(
  'Central Bank of India',
  /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 23. AU SMALL FINANCE BANK ───
export const parseAuBankStatement = createStandardTableParser(
  'AU Small Finance Bank',
  /(\d{2}-[A-Za-z]{3}-\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 24. EQUITAS SMALL FINANCE BANK ───
export const parseEquitasStatement = createStandardTableParser(
  'Equitas Small Finance Bank',
  /(\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 25. AIRTEL PAYMENTS BANK ───
export function parseAirtelBankStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  const regex = /(\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+(DEBIT|CREDIT|DR|CR)\s+(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i;
  let idCounter = 1;

  for (const line of lines) {
    const match = line.trim().match(regex);
    if (match) {
      const [, dateStr, desc, refNo, drCr, amtStr] = match;
      const amount = parseCleanAmount(amtStr);
      const type = drCr.toUpperCase().startsWith('CR') ? 'income' : 'expense';
      if (amount <= 0) continue;

      transactions.push({
        tempId: `airtel-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: desc.trim(),
        merchantName: desc.replace(/^(Paid to|Received from)\s+/i, '').trim(),
        category: categorizeByNarration(desc),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        referenceNumber: refNo,
        confidenceScore: 0.98,
        bankName: 'Airtel Payments Bank',
        approved: true
      });
    }
  }
  return transactions;
}

// ─── 26. JIO PAYMENTS BANK ───
export const parseJioBankStatement = createStandardTableParser(
  'Jio Payments Bank',
  /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 27. UJJIVAN SMALL FINANCE BANK ───
export const parseUjjivanStatement = createStandardTableParser(
  'Ujjivan Small Finance Bank',
  /(\d{2}-[A-Za-z]{3}-\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 28. STANDARD CHARTERED BANK ───
export const parseStandardCharteredStatement = createStandardTableParser(
  'Standard Chartered Bank',
  /(\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 29. HSBC INDIA ───
export function parseHsbcStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  const regex = /(\d{2}\s+[A-Za-z]{3}\s+\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})\s+(DR|CR)\s+([\d,]+\.\d{2})/;
  let idCounter = 1;

  for (const line of lines) {
    const match = line.trim().match(regex);
    if (match) {
      const [, dateStr, desc, amtStr, drCr, balStr] = match;
      const amount = parseCleanAmount(amtStr);
      const balance = parseCleanAmount(balStr);
      const type = drCr.toUpperCase() === 'CR' ? 'income' : 'expense';
      if (amount <= 0) continue;

      transactions.push({
        tempId: `hsbc-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: desc.trim(),
        merchantName: desc.split('/')[0].trim(),
        category: categorizeByNarration(desc),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        balance,
        confidenceScore: 0.98,
        bankName: 'HSBC India',
        approved: true
      });
    }
  }
  return transactions;
}

// ─── 30. DBS BANK INDIA (DIGIBANK) ───
export const parseDbsStatement = createStandardTableParser(
  'DBS Bank India',
  /(\d{2}\s+[A-Za-z]{3}\s+\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 31. RAZORPAYX (STARTUP & B2B PAYOUTS) ───
export function parseRazorpayXStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  for (const line of lines) {
    const match = line.trim().match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/);
    if (match) {
      const [, dateStr, desc, debitStr, creditStr, balStr] = match;
      const debit = parseCleanAmount(debitStr);
      const credit = parseCleanAmount(creditStr);
      const balance = parseCleanAmount(balStr);
      if (debit === 0 && credit === 0) continue;

      const type = credit > 0 ? 'income' : 'expense';
      const amount = type === 'income' ? credit : debit;
      if (amount <= 0) continue;

      transactions.push({
        tempId: `razorpayx-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: desc.trim(),
        merchantName: desc.split('/')[0].split('-')[0].trim(),
        category: categorizeByNarration(desc),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        balance,
        confidenceScore: 0.99,
        bankName: 'RazorpayX',
        approved: true
      });
    }
  }
  return transactions;
}

// ─── 32. BHARATPE (MERCHANT QR DAILY PASSBOOK) ───
export function parseBharatPeStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  const regex = /(\d{2}\s+[A-Za-z]{3}\s+\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9]+)?\s+(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i;
  let idCounter = 1;

  for (const line of lines) {
    const match = line.trim().match(regex);
    if (match) {
      const [, dateStr, desc, txnId, amtStr] = match;
      const amount = parseCleanAmount(amtStr);
      if (amount <= 0) continue;

      transactions.push({
        tempId: `bharatpe-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: `BharatPe QR Settlement: ${desc.trim()}`,
        merchantName: desc.trim(),
        category: 'Consulting & Sales',
        type: 'income',
        amount,
        debit: 0,
        credit: amount,
        referenceNumber: txnId,
        confidenceScore: 0.99,
        bankName: 'BharatPe Merchant QR',
        approved: true
      });
    }
  }
  return transactions;
}

// ─── 33. AMAZON PAY (WALLET & UPI) ───
export function parseAmazonPayStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  const regex = /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([A-Za-z0-9_-]+)?\s+(Paid|Added|Received|Refunded)\s+(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)/i;
  let idCounter = 1;

  for (const line of lines) {
    const match = line.trim().match(regex);
    if (match) {
      const [, dateStr, desc, txnId, actType, amtStr] = match;
      const amount = parseCleanAmount(amtStr);
      if (amount <= 0) continue;

      const isInc = /Added|Received|Refunded/i.test(actType);
      const type = isInc ? 'income' : 'expense';

      transactions.push({
        tempId: `amazonpay-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: desc.trim(),
        merchantName: desc.replace(/^(Paid at|Purchased from)\s+/i, '').trim(),
        category: categorizeByNarration(desc),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        referenceNumber: txnId,
        confidenceScore: 0.98,
        bankName: 'Amazon Pay',
        approved: true
      });
    }
  }
  return transactions;
}

// ─── 34. CRED (CRED PAY & CARD CONSOLIDATED PASSBOOK) ───
export function parseCredStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  const regex = /(\d{1,2}\s+[A-Za-z]{3}(?:\s+\d{4})?|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(?:₹|Rs\.?)?\s*([\d,]+\.?\d*)\s*(CR|DR|Cashback|Spent)?/i;
  let idCounter = 1;

  for (const line of lines) {
    const match = line.trim().match(regex);
    if (match) {
      const [, dateStr, desc, amtStr, actType] = match;
      const amount = parseCleanAmount(amtStr);
      if (amount <= 0) continue;

      const isInc = /CR|Cashback|Reward/i.test(actType || '');
      const type = isInc ? 'income' : 'expense';

      transactions.push({
        tempId: `cred-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: desc.trim(),
        merchantName: desc.trim(),
        category: categorizeByNarration(desc),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        confidenceScore: 0.98,
        bankName: 'CRED Passbook',
        approved: true
      });
    }
  }
  return transactions;
}

// ─── 35. GOOGLE PAY (GPAY) & UPI STATEMENT PARSER ───
export function parseGooglePayStatement(text) {
  const transactions = [];
  let idCounter = 1;

  // Strategy A: Block-based ("Paid to ...", "Received from ...", "Payment to ...")
  const blocks = text.split(/(?=Paid to|Received from|Payment to|Money sent to|To\s*:|From\s*:)/i);
  for (const block of blocks) {
    const isPaid = /Paid to|Payment to|Money sent to|To\s*:/i.test(block);
    const isReceived = /Received from|From\s*:/i.test(block);
    if (!isPaid && !isReceived) continue;

    const type = isReceived ? 'income' : 'expense';
    const nameMatch = block.match(/(?:Paid to|Received from|Payment to|Money sent to|To\s*:|From\s*:)\s*([^\n\r]+)/i);
    let partyName = nameMatch ? nameMatch[1].trim() : 'Google Pay Transfer';
    partyName = partyName.replace(/(?:₹|INR|Rs\.?).*$/, '').trim();

    const amtMatch = block.match(/(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/i) || block.match(/([\d,]+\.\d{2})/);
    const amount = amtMatch ? parseCleanAmount(amtMatch[1]) : 0;
    if (amount <= 0) continue;

    const dateMatch = block.match(/(\d{1,2}\s+[A-Za-z]{3}(?:\s+\d{4})?|\d{2}[\/\.-]\d{2}[\/\.-]\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/);
    const dateStr = dateMatch ? dateMatch[1] : '';

    const refMatch = block.match(/(?:UPI Ref ID|UPI transaction ID|Google transaction ID|UTR|Ref No)[:\s]+([A-Za-z0-9]+)/i);
    const refNo = refMatch ? refMatch[1].trim() : undefined;

    transactions.push({
      tempId: `gpay-${Date.now()}-${idCounter++}`,
      date: standardizeDate(dateStr),
      description: `${type === 'income' ? 'Received from' : 'Paid to'} ${partyName}`,
      merchantName: partyName,
      category: categorizeByNarration(partyName),
      type,
      amount,
      debit: type === 'expense' ? amount : 0,
      credit: type === 'income' ? amount : 0,
      referenceNumber: refNo,
      confidenceScore: 0.99,
      bankName: 'Google Pay (UPI)',
      approved: true
    });
  }

  if (transactions.length > 0) return transactions;

  // Strategy B: Line-by-line GPay / UPI Statement table records
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    const dateMatch = trimmed.match(/(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/);
    const amtMatch = trimmed.match(/(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/i) || trimmed.match(/([\d,]+\.\d{2})/);

    if (dateMatch && amtMatch) {
      const amount = parseCleanAmount(amtMatch[1]);
      if (amount > 0) {
        const isCr = /received|credited|deposit|\bcr\b/i.test(trimmed);
        const type = isCr ? 'income' : 'expense';
        let desc = trimmed
          .replace(dateMatch[0], '')
          .replace(amtMatch[0], '')
          .replace(/\b(?:COMPLETED|SUCCESS|SUCCESSFUL|DEBITED|CREDITED|PAID|RECEIVED|UPI)\b/gi, '')
          .trim();
        if (!desc) desc = isCr ? 'UPI Inflow' : 'UPI Outflow';

        transactions.push({
          tempId: `gpay-line-${Date.now()}-${idCounter++}`,
          date: standardizeDate(dateMatch[1]),
          description: desc,
          merchantName: desc.split(/[\/\-_]/)[0].trim() || 'UPI Merchant',
          category: categorizeByNarration(desc),
          type,
          amount,
          debit: type === 'expense' ? amount : 0,
          credit: type === 'income' ? amount : 0,
          confidenceScore: 0.96,
          bankName: 'Google Pay (UPI)',
          approved: true
        });
      }
    }
  }

  return transactions;
}

// ─── 36. PHONEPE ───
export function parsePhonePeStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/(\d{2}\s+[A-Za-z]{3}\s+\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(DEBIT|CREDIT|DEBITED|CREDITED)\s+(?:₹|INR|Rs\.?)?\s*([\d,]+(?:\.\d{2})?)/i);
    if (match) {
      const [, dateStr, details, drCr, amtStr] = match;
      const amount = parseCleanAmount(amtStr);
      const type = drCr.toUpperCase().startsWith('CR') ? 'income' : 'expense';
      if (amount <= 0) continue;

      transactions.push({
        tempId: `phonepe-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: details.trim(),
        merchantName: details.replace(/^(Paid to|Received from)\s+/i, '').trim(),
        category: categorizeByNarration(details),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        confidenceScore: 0.99,
        bankName: 'PhonePe (UPI)',
        approved: true
      });
    }
  }
  return transactions;
}

// ─── 37. PAYTM WALLET / PAYMENTS BANK ───
export function parsePaytmStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  for (const line of lines) {
    const match = line.match(/(\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([A-Za-z0-9_]+)?\s+(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)\s*(Cr|Dr)?/i);
    if (match) {
      const [, dateStr, details, txnId, amtStr, crDr] = match;
      const amount = parseCleanAmount(amtStr);
      if (amount <= 0) continue;

      const isCr = (crDr && crDr.toLowerCase() === 'cr') || /received|added|cashback|refund/i.test(details);
      const type = isCr ? 'income' : 'expense';

      transactions.push({
        tempId: `paytm-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: details.trim(),
        merchantName: details.split('-')[0].trim(),
        category: categorizeByNarration(details),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        referenceNumber: txnId || undefined,
        confidenceScore: 0.98,
        bankName: 'Paytm Wallet',
        approved: true
      });
    }
  }
  return transactions;
}

// ─── 38. UNIVERSAL INDIAN BANK & UPI STATEMENT PARSER ───
export function parseUniversalStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 8) continue;

    // Matches standard table rows starting with a Date
    const dateMatch = trimmed.match(/^(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/);
    if (!dateMatch) continue;

    const rest = trimmed.slice(dateMatch[0].length).trim();
    const amounts = [...rest.matchAll(/(?:₹|INR|Rs\.?)?\s*([\d,]+\.\d{2})/g)];
    if (amounts.length === 0) continue;

    const targetAmtStr = amounts[0][1];
    const amount = parseCleanAmount(targetAmtStr);
    if (amount <= 0) continue;

    const isCr = /\b(?:CR|CREDIT|CREDITED|RECEIVED|DEPOSIT|DEPOSITED)\b/i.test(trimmed);
    const type = isCr ? 'income' : 'expense';

    let desc = rest.replace(/(?:₹|INR|Rs\.?)?\s*[\d,]+\.\d{2}/g, '').replace(/\b(?:CR|DR|DEBIT|CREDIT|DEBITED|CREDITED|COMPLETED|SUCCESS|SUCCESSFUL)\b/gi, '').trim();
    if (!desc || desc.length < 2) desc = isCr ? 'Direct Inflow' : 'Direct Outflow';

    transactions.push({
      tempId: `univ-${Date.now()}-${idCounter++}`,
      date: standardizeDate(dateMatch[1]),
      description: desc,
      merchantName: desc.replace(/^(?:UPI|NEFT|IMPS|RTGS|POS|ACH|NACH|PAID TO|RECEIVED FROM)[\s\/\-_:]*/i, '').split(/[\/\-_]/)[0].trim() || 'Merchant',
      category: categorizeByNarration(desc),
      type,
      amount,
      debit: type === 'expense' ? amount : 0,
      credit: type === 'income' ? amount : 0,
      confidenceScore: 0.94,
      bankName: 'Universal Bank Statement',
      approved: true
    });
  }

  return transactions;
}

// ─── HIGH LEVEL DISPATCHER WITH ALL 37 INSTITUTIONS ───
export async function parsePdfBufferWithNativeRegex(fileBuffer) {
  try {
    let extractedText = '';
    const uint8Data = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer);

    if (pdfParse && pdfParse.PDFParse) {
      const parser = new pdfParse.PDFParse(uint8Data);
      const textResult = await parser.getText();
      extractedText = typeof textResult === 'string' ? textResult : (textResult?.text || '');
    } else if (typeof pdfParse === 'function') {
      const parsedData = await pdfParse(uint8Data);
      extractedText = parsedData.text || '';
    } else if (typeof pdfParse?.default === 'function') {
      const parsedData = await pdfParse.default(uint8Data);
      extractedText = parsedData.text || '';
    }

    const text = normalizeDevanagari(extractedText);

    if (!text || text.trim().length < 20) {
      return null; // Empty or scanned image PDF -> fallback to Vision OCR
    }

    const lower = text.toLowerCase();

    // Direct keyword match checks for high accuracy
    const bankRules = [
      { keywords: ['google pay', 'gpay', 'upi', 'okaxis', 'okhdfcbank', 'okicici', 'oksbi', 'tez'], fn: parseGooglePayStatement, name: 'gpay' },
      { keywords: ['hdfc bank', 'hdfcbank'], fn: parseHdfcStatement, name: 'hdfc' },
      { keywords: ['state bank of india', 'onlinesbi', 'sbi'], fn: parseSbiStatement, name: 'sbi' },
      { keywords: ['icici bank', 'icicibank'], fn: parseIciciStatement, name: 'icici' },
      { keywords: ['axis bank', 'axisbank'], fn: parseAxisStatement, name: 'axis' },
      { keywords: ['kotak mahindra', 'kotak bank'], fn: parseKotakStatement, name: 'kotak' },
      { keywords: ['indusind bank', 'indusind'], fn: parseIndusIndStatement, name: 'indusind' },
      { keywords: ['yes bank', 'yesbank'], fn: parseYesBankStatement, name: 'yesbank' },
      { keywords: ['federal bank', 'federalbank', 'fi money', 'jupiter money'], fn: parseFederalBankStatement, name: 'federal' },
      { keywords: ['idfc first', 'idfc bank', 'idfcfirst'], fn: parseIdfcStatement, name: 'idfc' },
      { keywords: ['rbl bank', 'ratnakar bank'], fn: parseRblStatement, name: 'rbl' },
      { keywords: ['bandhan bank'], fn: parseBandhanStatement, name: 'bandhan' },
      { keywords: ['city union bank', 'cub'], fn: parseCityUnionStatement, name: 'cub' },
      { keywords: ['karur vysya bank', 'kvb'], fn: parseKvbStatement, name: 'kvb' },
      { keywords: ['south indian bank', 'sib'], fn: parseSibStatement, name: 'sib' },
      { keywords: ['punjab national bank', 'pnb'], fn: parsePnbStatement, name: 'pnb' },
      { keywords: ['bank of baroda', 'bob'], fn: parseBobStatement, name: 'bob' },
      { keywords: ['canara bank'], fn: parseCanaraStatement, name: 'canara' },
      { keywords: ['union bank of india', 'unionbank'], fn: parseUnionBankStatement, name: 'unionbank' },
      { keywords: ['indian bank', 'allahabad bank'], fn: parseIndianBankStatement, name: 'indianbank' },
      { keywords: ['bank of india', 'boi'], fn: parseBoiStatement, name: 'boi' },
      { keywords: ['indian overseas bank', 'iob'], fn: parseIobStatement, name: 'iob' },
      { keywords: ['central bank of india'], fn: parseCentralBankStatement, name: 'centralbank' },
      { keywords: ['au small finance bank', 'aubank'], fn: parseAuBankStatement, name: 'aubank' },
      { keywords: ['equitas small finance', 'equitas bank'], fn: parseEquitasStatement, name: 'equitas' },
      { keywords: ['airtel payments bank', 'airtel money'], fn: parseAirtelBankStatement, name: 'airtel' },
      { keywords: ['jio payments bank', 'jio money'], fn: parseJioBankStatement, name: 'jio' },
      { keywords: ['ujjivan small finance', 'ujjivan'], fn: parseUjjivanStatement, name: 'ujjivan' },
      { keywords: ['standard chartered', 'scb'], fn: parseStandardCharteredStatement, name: 'standardchartered' },
      { keywords: ['hsbc', 'hongkong and shanghai'], fn: parseHsbcStatement, name: 'hsbc' },
      { keywords: ['dbs bank', 'digibank'], fn: parseDbsStatement, name: 'dbs' },
      { keywords: ['razorpay', 'razorpayx'], fn: parseRazorpayXStatement, name: 'razorpay' },
      { keywords: ['bharatpe', 'bharat pe', 'resilient innovations'], fn: parseBharatPeStatement, name: 'bharatpe' },
      { keywords: ['amazon pay', 'amazon.in'], fn: parseAmazonPayStatement, name: 'amazonpay' },
      { keywords: ['cred', 'dreamplug'], fn: parseCredStatement, name: 'cred' },
      { keywords: ['phonepe', 'phone pe'], fn: parsePhonePeStatement, name: 'phonepe' },
      { keywords: ['paytm', 'one97'], fn: parsePaytmStatement, name: 'paytm' },
    ];

    for (const rule of bankRules) {
      if (rule.keywords.some(k => lower.includes(k))) {
        const res = rule.fn(text);
        if (res.length > 0) {
          return { parser: `${rule.name}_native_regex`, transactions: res };
        }
      }
    }

    // Universal statement parser
    const universalRes = parseUniversalStatement(text);
    if (universalRes.length > 0) {
      return { parser: 'universal_statement_regex', transactions: universalRes };
    }

    // Fallback: test all native parsers in priority sequence
    for (const rule of bankRules) {
      const res = rule.fn(text);
      if (res.length >= 2) {
        return { parser: `${rule.name}_native_regex`, transactions: res };
      }
    }

    return null; // Fall back to Gemini Multimodal Vision OCR
  } catch (err) {
    console.warn('[PDF Regex Parser] Local parsing skipped, falling back to Vision OCR:', err.message);
    return null;
  }
}
