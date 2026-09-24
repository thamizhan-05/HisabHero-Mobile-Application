// Polyfill web standards for serverless pdfjs-dist
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
  };
}
if (typeof globalThis.ImageData === 'undefined') globalThis.ImageData = class ImageData {};
if (typeof globalThis.Path2D === 'undefined') globalThis.Path2D = class Path2D {};

import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
globalThis.pdfjsWorker = pdfjsWorker;

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let CachedPDFParse = null;
async function getPDFParse() {
  if (!CachedPDFParse) {
    try {
      const mod = await import('pdf-parse');
      CachedPDFParse = mod.PDFParse || mod.default?.PDFParse || mod.default;
    } catch (e) {
      console.warn('[PDFParse Load Warning]:', e.message);
    }
  }
  return CachedPDFParse;
}

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
  if (val === null || val === undefined || val === '' || val === '-' || val === '--') return 0;
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? 0 : Math.round(Math.abs(val) * 100) / 100;
  }
  // 1. Normalize Devanagari numerals to 0-9
  let s = normalizeDevanagari(String(val)).trim();
  
  // 2. Remove currency symbols, words, Cr/Dr markers, quotes
  s = s.replace(/(?:₹|INR|Rs.?|Rupees?|$|€|£)/gi, '');
  s = s.replace(/\b(?:CR|DR|DEBIT|CREDIT|BAL|BALANCE)\b/gi, '');
  
  // 3. Handle accounting bracketed negatives: (1,234.50) -> 1234.50
  const isBracketed = /^\((.*)\)$/.test(s.trim());
  if (isBracketed) {
    s = s.trim().replace(/^\(|\)$/g, '');
  }

  // 4. Remove all characters except digits, minus, plus, and period
  s = s.replace(/,/g, '').replace(/[^0-9.+-]/g, '').trim();

  // If there are multiple periods (e.g. thousand separator 10.000.50 or date artifact),
  // keep all integer parts together and treat the last part as decimal
  const parts = s.split('.');
  if (parts.length > 2) {
    s = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  }

  const num = parseFloat(s);
  if (isNaN(num) || !isFinite(num)) return 0;
  
  // Exactly 2-decimal precision to prevent floating point zero bugs
  return Math.round(Math.abs(num) * 100) / 100;
}

export function extractMerchantAndCaption(narration = '', bankName = '') {
  if (!narration) return { merchant: `${bankName} Transaction`, caption: '' };
  const clean = narration.trim();

  // Pattern: UPI/624643439226/DR/Flipkart Payme /YES/UPI
  // or UPI/661371343856/DR/ RSM MALL LLP /YES/milk
  if (/^UPI\//i.test(clean)) {
    const parts = clean.split('/').map(p => p.trim());

    // Case 1: UPI/<RRN>/DR or CR/<MERCHANT>/<BANK>/<CAPTION>
    if (parts.length >= 4 && /^\d+$/.test(parts[1]) && /^(?:DR|CR)$/i.test(parts[2])) {
      const merchant = parts[3];
      let caption = '';
      if (parts.length >= 6 && parts[5] && !/^(?:UPI|NA|NULL|NONE)$/i.test(parts[5])) {
        caption = parts[5];
      }
      return { merchant: merchant || `${bankName} UPI`, caption };
    }

    // Case 2: UPI/DR or CR/<RRN>/<MERCHANT>/<BANK>/<CAPTION>
    if (parts.length >= 4 && /^(?:DR|CR)$/i.test(parts[1])) {
      const merchant = /^\d+$/.test(parts[2]) ? parts[3] : parts[2];
      let caption = '';
      if (parts.length >= 6 && parts[5] && !/^(?:UPI|NA|NULL|NONE)$/i.test(parts[5])) {
        caption = parts[5];
      } else if (parts.length >= 5 && parts[4] && !/^(?:UPI|NA|NULL|NONE)$/i.test(parts[4])) {
        caption = parts[4];
      }
      return { merchant: merchant || `${bankName} UPI`, caption };
    }

    // Case 3: UPI/<RRN>/<MERCHANT>/...
    if (parts.length >= 3 && /^\d+$/.test(parts[1])) {
      const merchant = parts[2];
      let caption = '';
      if (parts.length >= 4 && parts[3] && !/^(?:UPI|NA|NULL|NONE)$/i.test(parts[3])) {
        caption = parts[3];
      }
      return { merchant: merchant || `${bankName} UPI`, caption };
    }

    // Case 4: UPI/<MERCHANT>/<VPA>/<REMARK>/...
    if (parts.length >= 2 && !/^\d+$/.test(parts[1]) && !/^(?:DR|CR)$/i.test(parts[1])) {
      const merchant = parts[1];
      let caption = '';
      if (parts.length >= 4 && parts[3] && !/^(?:UPI|NA|NULL|NONE)$/i.test(parts[3])) {
        caption = parts[3];
      }
      return { merchant: merchant || `${bankName} UPI`, caption };
    }
  }

  // IFSC/Beneficiary e.g. YESB0PTMUPI/Sunil kumar ramkeval kahar/XXXXX/...
  const ifscMerchant = clean.match(/^[A-Z]{4}\w+\/([^\/]+)\//i);
  if (ifscMerchant && ifscMerchant[1] && !/^\d+$/.test(ifscMerchant[1])) {
    return { merchant: ifscMerchant[1].trim(), caption: '' };
  }

  // BIL/ONL/<REF>/<MERCHANT>/...
  if (/BIL\/ONL\//i.test(clean)) {
    const parts = clean.split('/').map(p => p.trim());
    if (parts.length >= 4 && parts[3]) {
      return { merchant: parts[3], caption: '' };
    }
  }

  // NEFT-ICIC-IN...-ULAGAMMAL or BIL/NEFT/.../ULAGAMMAL/...
  if (/NEFT/i.test(clean)) {
    const neftParts = clean.split(/[-\/]/).map(p => p.trim());
    for (let i = neftParts.length - 1; i >= 0; i--) {
      const part = neftParts[i];
      if (part && !/^\d+$/.test(part) && !/^(?:NEFT|ICIC|IN\d+|INDIA|OVERSEAS|BANK|BIL|BRANCH|RTGS)$/i.test(part) && part.length > 2) {
        return { merchant: part, caption: '' };
      }
    }
  }

  // Cash Deposit
  if (/CASH\s*DEP/i.test(clean)) {
    return { merchant: 'Cash Deposit', caption: 'Cash Deposit' };
  }

  // iDirect
  if (/iDirect/i.test(clean)) {
    return { merchant: 'ICICI Direct', caption: 'Investments' };
  }

  const firstToken = clean.split(/[\/\-]/)[0].trim();
  const safeMerchant = (firstToken && !/^\d+$/.test(firstToken)) ? firstToken : `${bankName} Narration`;
  return { merchant: safeMerchant, caption: '' };
}

export function extractMerchantFromNarration(narration = '', bankName = '') {
  return extractMerchantAndCaption(narration, bankName).merchant;
}

export function standardizeDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const cleaned = normalizeDevanagari(String(dateStr)).trim();

  // 1. ISO YYYY-MM-DD
  const iso = cleaned.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    const mo = parseInt(m, 10);
    const day = parseInt(d, 10);
    if (mo >= 1 && mo <= 12 && day >= 1 && day <= 31) {
      return `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 2. Named Months: "30 Aug 2026", "30-Aug-2026", "Aug 30, 2026", "30-Aug-26", "19-Sep-26"
  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const dayFirstNamed = cleaned.match(/(?:^|\b)(\d{1,2})[\s\/-]([A-Za-z]{3,9})[\s\/-](\d{2,4})\b/);
  if (dayFirstNamed) {
    const [, dayStr, monthName, yearStr] = dayFirstNamed;
    const mKey = monthName.toLowerCase().slice(0, 3);
    const mo = monthMap[mKey] || '01';
    let y = yearStr.length === 2 ? '20' + yearStr : yearStr;
    const d = parseInt(dayStr, 10);
    if (d >= 1 && d <= 31) {
      return `${y}-${mo}-${String(d).padStart(2, '0')}`;
    }
  }

  const monthFirstNamed = cleaned.match(/(?:^|\b)([A-Za-z]{3,9})\s+(\d{1,2})(?:,?\s*(\d{2,4}))?\b/);
  if (monthFirstNamed) {
    const [, monthName, dayStr, yearStr] = monthFirstNamed;
    const mKey = monthName.toLowerCase().slice(0, 3);
    const mo = monthMap[mKey] || '01';
    let y = (yearStr && yearStr.length === 2) ? '20' + yearStr : (yearStr || String(new Date().getFullYear()));
    const d = parseInt(dayStr, 10);
    if (d >= 1 && d <= 31) {
      return `${y}-${mo}-${String(d).padStart(2, '0')}`;
    }
  }


  // 3. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = cleaned.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
  if (dmy) {
    let [, dStr, mStr, yStr] = dmy;
    let d = parseInt(dStr, 10);
    let m = parseInt(mStr, 10);
    let y = yStr;
    if (y.length === 2) y = '20' + y;

    if (m > 12 && d <= 12) {
      const temp = m; m = d; d = temp;
    }

    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

// ─── COMPREHENSIVE AUTO CLASSIFIER / CATEGORIZER (CAPTION -> MERCHANT -> GENERAL) ───
export const STANDARD_CATEGORY_RULES = [
  {
    category: 'Groceries',
    keywords: [
      'milk', 'curd', 'dairy', 'paneer', 'butter', 'cheese', 'ghee', 'egg', 'eggs', 'bread',
      'vegetable', 'vegetables', 'veggie', 'veggies', 'fruit', 'fruits', 'apple', 'banana',
      'meat', 'chicken', 'fish', 'mutton', 'prawn', 'ration', 'grocery', 'groceries',
      'supermarket', 'hypermarket', 'kirana', 'provisions', 'dmart', 'd-mart', 'zepto',
      'blinkit', 'instamart', 'bigbasket', 'bb daily', 'dunzo', 'spencers', 'more retail',
      'nature basket', 'reliance fresh', 'reliance smart', 'mall', 'mart'
    ]
  },
  {
    category: 'Food & Dining',
    keywords: [
      'food', 'dining', 'restaurant', 'cafe', 'swiggy', 'zomato', 'mcdonald', 'kfc', 'domino',
      'pizza', 'burger', 'biryani', 'tea', 'chai', 'coffee', 'snacks', 'lunch', 'dinner',
      'breakfast', 'bakery', 'sweets', 'mithai', 'haldiram', 'starbucks', 'subway',
      'barbeque', 'hotel food', 'canteen', 'dhaba', 'mess'
    ]
  },
  {
    category: 'Shopping & Retail',
    keywords: [
      'flipkart', 'amazon', 'myntra', 'ajio', 'meesho', 'nykaa', 'tata cliq', 'retail',
      'shopping', 'clothing', 'apparel', 'garments', 'fashion', 'footwear', 'shoes', 'dress',
      'electronics', 'croma', 'reliance digital', 'vijay sales', 'lifestyle', 'pantaloons',
      'zara', 'h&m', 'trends', 'max fashion', 'westside', 'decathlon', 'gift', 'store', 'bazaar'
    ]
  },
  {
    category: 'Transportation & Fuel',
    keywords: [
      'petrol', 'diesel', 'fuel', 'cng', 'gas station', 'indian oil', 'ioc', 'iocl', 'bpcl',
      'hpcl', 'shell', 'nayara', 'uber', 'ola', 'rapido', 'cab', 'taxi', 'auto', 'metro',
      'bus', 'irctc', 'railway', 'train', 'flight', 'indigo', 'air india', 'spicejet',
      'fastag', 'toll', 'parking', 'transport'
    ]
  },
  {
    category: 'Healthcare',
    keywords: [
      'health', 'hospital', 'doctor', 'clinic', 'pharmacy', 'chemist', 'medicine', 'medicines',
      'medical', 'tablet', 'tablets', 'apollo', 'pharmeasy', '1mg', 'medplus', 'netmeds',
      'dr lal', 'pathology', 'diagnostics', 'lab', 'dental', 'dentist', 'opticals', 'eyecare'
    ]
  },
  {
    category: 'Rent & Utilities',
    keywords: [
      'rent', 'landlord', 'society maintenance', 'maintenance', 'electricity', 'power',
      'bescom', 'tneb', 'mseb', 'uppcl', 'cesc', 'water bill', 'gas bill', 'cylinder',
      'indane', 'bharat gas', 'hp gas', 'broadband', 'wifi', 'act fibernet', 'airtel',
      'jio fiber', 'vi bill', 'recharge', 'dth', 'tata play', 'utility', 'utilities'
    ]
  },
  {
    category: 'Entertainment',
    keywords: [
      'movie', 'cinema', 'theatre', 'pvr', 'inox', 'cinepolis', 'bookmyshow', 'ticketnew',
      'netflix', 'hotstar', 'disney', 'prime video', 'spotify', 'youtube', 'gaming', 'game',
      'playstation', 'steam', 'amusement', 'concert', 'event'
    ]
  },
  {
    category: 'Investments & SIP',
    keywords: [
      'sip', 'mutual fund', 'zerodha', 'groww', 'upstox', 'angel one', 'kuvera', 'et money',
      'share', 'stocks', 'equity', 'bse', 'nse', 'dividend', 'fd', 'rd', 'ppf', 'nps', 'gold',
      'idirect', 'icici direct'
    ]
  },
  {
    category: 'Technology & SaaS',
    keywords: [
      'aws', 'azure', 'gcp', 'google cloud', 'github', 'gitlab', 'vercel', 'netlify',
      'heroku', 'digitalocean', 'openai', 'chatgpt', 'notion', 'slack', 'zoho', 'canva',
      'adobe', 'figma', 'domain', 'godaddy', 'hostinger', 'software', 'saas'
    ]
  },
  {
    category: 'Payroll & Salary',
    keywords: [
      'salary', 'stipend', 'payroll', 'wages', 'staff salary', 'employee', 'bonus', 'advance'
    ]
  },
  {
    category: 'Client Retainer',
    keywords: [
      'client payment', 'retainer', 'freelance', 'consulting', 'project fee', 'invoice payment'
    ]
  }
];

export function categorizeByNarration(narration = '', merchant = '', caption = '') {
  // If merchant or caption not provided, extract from narration
  if (!merchant && !caption && narration) {
    const extracted = extractMerchantAndCaption(narration);
    merchant = extracted.merchant;
    caption = extracted.caption;
  }

  // 1. User caption has highest priority (e.g. user entered "milk", "petrol", "dinner")
  if (caption && caption.trim()) {
    const cLower = caption.toLowerCase();
    for (const rule of STANDARD_CATEGORY_RULES) {
      if (rule.keywords.some(k => cLower.includes(k))) {
        return rule.category;
      }
    }
  }

  // 2. Merchant name (e.g. "Flipkart Payme" -> Shopping & Retail, "Swiggy" -> Food & Dining)
  if (merchant && merchant.trim()) {
    const mLower = merchant.toLowerCase();
    for (const rule of STANDARD_CATEGORY_RULES) {
      if (rule.keywords.some(k => mLower.includes(k))) {
        return rule.category;
      }
    }
  }

  // 3. Full narration string
  if (narration && narration.trim()) {
    const nLower = narration.toLowerCase();
    for (const rule of STANDARD_CATEGORY_RULES) {
      if (rule.keywords.some(k => nLower.includes(k))) {
        return rule.category;
      }
    }
  }

  // 4. Default if cannot categorise or caption not given
  return 'General';
}

// Comprehensive Summary / Balance / Header Line Detector
export function isSummaryOrNonTransactionLine(desc = '', merchant = '', lineText = '') {
  const combined = `${desc} ${merchant} ${lineText}`.toLowerCase().trim();
  if (!combined) return false;

  const summaryPatterns = [
    /\btotal\s*(?:money\s*)?(?:sent|received|paid|transferred|inflow|outflow|income|expenses?|debits?|credits?|deposits?|withdrawals?|amount|balance|count)?\b/i,
    /\b(?:grand|sub|page|period|monthly|annual|statement)\s*totals?\b/i,
    /\b(?:opening|closing|initial|ending|cleared|uncleared|available|ledger|current)\s*balances?\b/i,
    /\b(?:balance\s*b\/f|balance\s*c\/f|brought\s*forward|carried\s*forward|b\/f\s*balance|c\/f\s*balance)\b/i,
    /\bstatement\s*(?:summary|period|from|details|overview|for\s+the\s+period)\b/i,
    /\b(?:total|summary)\s*[:=-]/i,
    /\bmoney\s*sent\s*[:=-]/i,
    /\bmoney\s*received\s*[:=-]/i,
    /\b(?:total\s*dr|total\s*cr|dr\s*total|cr\s*total)\b/i,
    /\b(?:net\s*inflow|net\s*outflow|net\s*transfer|net\s*amount)\b/i
  ];

  for (const pat of summaryPatterns) {
    if (pat.test(combined)) {
      const isPureMerchant = /^(total\s+(?:energies|oil|petroleum|fitness|stationery|solutions|logistics|care))\b/i.test(merchant || desc);
      if (!isPureMerchant) {
        return true;
      }
    }
  }

  // Exact matches for standalone summary keywords
  const trimmedDesc = desc.trim().toLowerCase();
  const trimmedMerch = merchant.trim().toLowerCase();
  if (/^(?:money\s*sent|money\s*received|total\s*sent|total\s*received|total\s*income|total\s*expense|total\s*debit|total\s*credit|opening\s*bal|closing\s*bal|total|summary|grand\s*total)$/i.test(trimmedDesc) ||
      /^(?:money\s*sent|money\s*received|total\s*sent|total\s*received|total\s*income|total\s*expense|total\s*debit|total\s*credit|opening\s*bal|closing\s*bal|total|summary|grand\s*total)$/i.test(trimmedMerch)) {
    return true;
  }

  return false;
}

export function determineCashFlowType({ text = '', desc = '', debit = 0, credit = 0, drCr = '', rawAmountStr = '' }) {
  const cleanDebit = parseCleanAmount(debit);
  const cleanCredit = parseCleanAmount(credit);

  const combined = `${desc} ${text} ${rawAmountStr}`.toLowerCase();

  // 1. High-priority explicit received / income phrases
  // Handles: "Payment received", "Received payment", "Received from", "Money received", "Payment from", "Paid by", "Customer paid"
  const isExplicitIncome = /\b(?:received from|payment received|received payment|money received|amount received|received via|received rs|received inr|received\b|payment from|paid by|transferred by|sent by|client paid|customer paid|cashback from|cashback|refund from|refund of|refunded|refund|salary from|salary credit|salary|dividend|stipend|interest credited|int\.pd|inward|upi inward|collection|settlement|mila|mil gaya|jama|aaya|vasool|vaanginen|varavu)\b/i.test(combined);

  // 2. High-priority explicit expense / sent phrases
  // Handles: "Paid to", "Payment to", "Money sent to", "Sent to", "Paid for", "Debited from", "Bill payment", "Recharge"
  const isExplicitExpense = /\b(?:paid to|payment to|money sent to|sent to|paid for|paid using|paid via|transfer to|debited from|withdrawn from|withdrawal|atm wdl|pos swipe|recharge|bill payment|autopay|nach|ecs|emi|loan payment|spent|purchase|bought|kharcha|diya)\b/i.test(combined);

  // If text has both (e.g. "Payment received from Ramesh" has "payment" and "received"):
  if (isExplicitIncome && isExplicitExpense) {
    if (/\b(?:received|payment from|paid by|cashback|refund|salary|credited|cr)\b/i.test(combined)) {
      return 'income';
    }
    if (/\b(?:paid to|money sent to|sent to|payment to)\b/i.test(combined)) {
      return 'expense';
    }
  }

  if (isExplicitIncome && !isExplicitExpense) return 'income';
  if (isExplicitExpense && !isExplicitIncome) return 'expense';

  // 3. Explicit Dr / Cr field indicator
  const cleanDrCr = String(drCr).toUpperCase().trim();
  if (/^(?:CR|CREDIT|CREDITED|INFLOW|DEPOSIT|DEPOSITED|C)$/i.test(cleanDrCr)) return 'income';
  if (/^(?:DR|DEBIT|DEBITED|OUTFLOW|WITHDRAWAL|WITHDRAWN|D)$/i.test(cleanDrCr)) return 'expense';

  // 4. Explicit debit / credit columns
  if (cleanCredit > 0 && cleanDebit === 0) return 'income';
  if (cleanDebit > 0 && cleanCredit === 0) return 'expense';

  // 5. Amount string sign indicators: + is income, - or (brackets) is expense
  const rawStr = String(rawAmountStr).trim();
  if (/^\+\s*(?:₹|INR|Rs\.?)?\s*[\d,]+/i.test(rawStr) || /[\d,]+\s*\+\s*$/.test(rawStr)) return 'income';
  if (/^-\s*(?:₹|INR|Rs\.?)?\s*[\d,]+/i.test(rawStr) || /[\d,]+\s*-\s*$/.test(rawStr) || /^\([\d,.]+\)$/.test(rawStr)) return 'expense';

  // 6. UPI narration tags & bank codes: UPI/CR/... vs UPI/DR/...
  if (/\b(?:upi\/cr|cr\/|\/cr\/|\(cr\)|[\s\/]cr[\s\/$]|by transfer|by clearing|neft cr|rtgs cr|imps cr)\b/i.test(combined)) {
    return 'income';
  }
  if (/\b(?:upi\/dr|dr\/|\/dr\/|\(dr\)|[\s\/]dr[\s\/$]|to transfer|neft dr|rtgs dr|imps dr)\b/i.test(combined)) {
    return 'expense';
  }

  // 7. General keyword heuristics
  if (/\b(?:credit|credited|deposit|deposited|inflow|income|sale|sales)\b/i.test(combined)) return 'income';
  if (/\b(?:debit|debited|outflow|expense|spent|fee|charge|tax|gst)\b/i.test(combined)) return 'expense';

  return 'expense';
}

export function filterOutSummaryRows(transactions = []) {
  if (!Array.isArray(transactions)) return [];
  return transactions.filter(t => {
    if (!t) return false;
    const desc = String(t.description || '').trim();
    const merchant = String(t.merchantName || '').trim();
    const amt = Number(t.amount || 0);

    if (amt <= 0) return false;

    if (isSummaryOrNonTransactionLine(desc, merchant)) {
      return false;
    }

    // Filter out common header row texts
    if (/^(?:transaction\s*date|value\s*date|chq\s*no|particulars|narration|withdrawal|deposit|balance|description|date|amount)$/i.test(desc)) {
      return false;
    }

    return true;
  });
}

// Helper template builder for standard table statements
function createStandardTableParser(bankName, regex, dateIdx, descIdx, refIdx, debitIdx, creditIdx, balIdx) {
  return function parse(text) {
    const transactions = [];
    const lines = text.split(/\r?\n/);
    let idCounter = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || isSummaryOrNonTransactionLine('', '', trimmed)) continue;

      const match = trimmed.match(regex);
      if (match) {
        const dateStr = match[dateIdx];
        const desc = match[descIdx] || 'Bank Transaction';
        const refNo = refIdx ? match[refIdx] : undefined;
        const debit = debitIdx ? parseCleanAmount(match[debitIdx]) : 0;
        const credit = creditIdx ? parseCleanAmount(match[creditIdx]) : 0;
        const balance = balIdx ? parseCleanAmount(match[balIdx]) : 0;

        if (debit === 0 && credit === 0) continue;
        if (isSummaryOrNonTransactionLine(desc, refNo, trimmed)) continue;

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
    return filterOutSummaryRows(transactions);
  };
}

// ─── 1. HDFC BANK ───
export const parseHdfcStatement = createStandardTableParser(
  'HDFC Bank',
  /(\d{2}\/\d{2}\/\d{2,4})\s+(.+?)\s+(\d+|--|\s{2,})\s+(\d{2}\/\d{2}\/\d{2,4})\s+([\d,]+\.\d{2}|0(?:\.00)?|-)\s+([\d,]+\.\d{2}|0(?:\.00)?|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 5, 6, 7
);

// ─── 2. STATE BANK OF INDIA (SBI) ───
export function parseSbiStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || isSummaryOrNonTransactionLine('', '', line)) continue;
    if (/^Your\s+(?:Opening|Closing)\s+Balance/i.test(line)) continue;
    if (/^(?:Date\s+Transaction|TRANSACTION|SAVING|Relationship|Customer|Welcome|Account|Branch|Page\s*\d+|--\s*\d+\s+of\s+\d+\s*--)/i.test(line)) continue;

    // Pattern 1: Standard SBI table row:
    // Date Narration [Ref] Credit Debit Balance
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

      // Accurately determine cash flow type based on description, narration, and column semantics
      const determinedType = determineCashFlowType({
        text: line,
        desc,
        debit,
        credit
      });
      
      let type = determinedType;
      let amount = 0;
      if (type === 'income') {
        amount = credit > 0 ? credit : debit;
      } else {
        amount = debit > 0 ? debit : credit;
      }

      transactions.push({
        tempId: `sbi-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: desc.trim(),
        merchantName: extractMerchantFromNarration(desc, 'State Bank of India'),
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

    // Pattern 2: Multi-line / alternative SBI row starting with date
    const datePrefixMatch = line.match(/^(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/);
    if (datePrefixMatch) {
      const numbers = [...line.matchAll(/([\d,]+\.\d{2})/g)].map(m => m[1]);
      if (numbers.length >= 2) {
        const balStr = numbers[numbers.length - 1];
        const prevNumStr = numbers[numbers.length - 2];
        const balance = parseCleanAmount(balStr);
        const amount = parseCleanAmount(prevNumStr);
        const type = determineCashFlowType({ text: line, desc: line, rawAmountStr: prevNumStr });

        transactions.push({
          tempId: `sbi-${Date.now()}-${idCounter++}`,
          date: standardizeDate(datePrefixMatch[1]),
          description: line,
          merchantName: extractMerchantFromNarration(line, 'State Bank of India'),
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

// ─── 3. ICICI BANK ───
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
    if (/^(?:Statement of Transactions|Your Base Branch|Sincerely|Team ICICI|This is a system|Never share|www\.icici|Please call|Legends for|Page\s*\d+|--\s*\d+\s+of\s+\d+\s*--)/i.test(trimmed)) continue;
    if (/^(?:RCHG|DTAX|BPAY|IDTX|BBPS|INFT|BIL|ONL|NEFT|PAVC|PAC|LNPY|CCWD|PAYC|IMPS|VAT|INF|EBA|SMO|VPS|TOP|BCTT|UCCBRN|LCCBRN|N chg|MMT|T Chg|SGB)\s*[-:]/i.test(trimmed)) continue;
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
    const match = entry.match(/^(?:(\d+)\s+)?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\s+(.+)$/);
    if (!match) continue;

    const [, sNo, dateStr, rest] = match;
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
      const amtStr = amountMatches[amountMatches.length - 2][1];
      amount = parseCleanAmount(amtStr);
      desc = rest.slice(0, rest.lastIndexOf(amtStr)).trim();

      if (prevBalance !== null) {
        const diff = balance - prevBalance;
        if (Math.abs(diff - amount) < 0.05) {
          type = 'income';
        } else if (Math.abs(diff + amount) < 0.05) {
          type = 'expense';
        }
      }

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
      merchantName: extractMerchantFromNarration(desc, 'ICICI Bank'),
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
    if (/^(?:ACCOUNT STATEMENT|Last \d+ Transactions|ACCOUNT DETAILS|Account Holder|Account Type|Account Number|Customer's Address|Branch Name|IFSC|Account Currency|ACCOUNT SUMMARY|Opening Balance|Total Credits|Total Debits|Ending Balance|ACCOUNT ACTIVITY|Indian Bank|\*\*|Total\s+INR)/i.test(trimmed)) continue;

    // Page break or table header closes current entry if it already has amounts
    if (/^(?:--\s*\d+\s+of\s+\d+\s*--|Date\s+Transaction\s+Details)/i.test(trimmed)) {
      if (currentEntry) {
        if (/(?:INR\s*)?([\d,]+(?:\.\d{2})?|-)\s+(?:INR\s*)?([\d,]+(?:\.\d{2})?|-)\s+(?:INR\s*)?([\d,]+(?:\.\d{2})?)$/i.test(currentEntry)) {
          groupedEntries.push(currentEntry);
          currentEntry = '';
        }
      }
      continue;
    }

    const isDateStart = /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(trimmed);
    if (isDateStart) {
      if (currentEntry) groupedEntries.push(currentEntry);
      currentEntry = trimmed;
    } else if (currentEntry) {
      currentEntry += ' ' + trimmed;
    }
  }
  if (currentEntry) groupedEntries.push(currentEntry);

  for (const entry of groupedEntries) {
    const match = entry.match(/^(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+(.+)$/);
    if (!match) continue;

    const [, dateStr, rest] = match;
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

// ─── 20. BANK OF INDIA (BOI) ───
export const parseBoiStatement = createStandardTableParser(
  'Bank of India',
  /(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})\s+(.+?)\s+([A-Za-z0-9]+|-)?\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})/,
  1, 2, 3, 4, 5, 6
);

// ─── 21. INDIAN OVERSEAS BANK (IOB) ───
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
    if (/^(?:Page\s*\d+|Report Generation|STATEMENT OF THE ACCOUNT|CUSTOMER DETAILS|Customer ID|Branch Address|Account No|Branch Code|Customer's Address|Address of Customer|\*\*This is a computer)/i.test(trimmed)) continue;
    if (/^(?:Date\(Value Date\)|Date\(Value|Particulars|Ref No\.|Transaction Type|Debit\(Rs\)|Credit\(Rs\)|Balance\(Rs\))/i.test(trimmed)) continue;

    if (/^(?:[\d,]+\.\d{2}\s+[\d,]+\.\d{2}|Effective available balance|--\s*\d+\s+of\s+\d+\s*--)/i.test(trimmed)) {
      if (currentEntry) {
        groupedEntries.push(currentEntry);
        currentEntry = '';
      }
      continue;
    }

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
    const dateMatch = entry.match(/^(\d{1,2}-[A-Za-z]{3}-\d{2,4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})(?:\s*\(\d{1,2}-[A-Za-z]{3}-\d{2,4}\))?\s+(.+)$/);
    if (!dateMatch) continue;

    const [, dateStr, rest] = dateMatch;
    const colsMatch = rest.match(/([\d,]+(?:\.\d{2})?|-)\s+([\d,]+(?:\.\d{2})?|-)\s+([\d,]+(?:\.\d{2})?)$/);
    if (!colsMatch) continue;

    const [fullCols, debitStr, creditStr, balStr] = colsMatch;
    const debit = parseCleanAmount(debitStr);
    const credit = parseCleanAmount(creditStr);
    const balance = parseCleanAmount(balStr);

    if (debit === 0 && credit === 0) continue;

    const type = credit > 0 ? 'income' : 'expense';
    const amount = type === 'income' ? credit : debit;

    let descPart = rest.slice(0, rest.length - fullCols.length).trim();
    descPart = descPart.replace(/\s+(?:Transfer|Clearing|Cash|ATM|NEFT|RTGS|UPI|IMPS|POS)$/i, '').trim();

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
      merchantName: extractMerchantFromNarration(descPart, 'Indian Overseas Bank'),
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
  const blocks = text.split(/(?=(?:Paid to|Payment to|Money sent to|Received from|Money received from|Refund from|Cashback from|Cashback|\+\s*₹|-\s*₹|\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+(?:Paid|Received)))/i);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || isSummaryOrNonTransactionLine('', '', trimmed)) continue;

    const amtMatch = trimmed.match(/(?:[-+]?\s*(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d{2})?))|([\d,]+\.\d{2})/i);
    if (!amtMatch) continue;

    const amount = parseCleanAmount(amtMatch[1] || amtMatch[0]);
    if (amount <= 0) continue;

    // Determine type with accurate cash flow semantics
    const type = determineCashFlowType({
      text: trimmed,
      rawAmountStr: amtMatch[0]
    });

    const dateMatch = trimmed.match(/([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4}|\d{1,2}\s+[A-Za-z]{3,9},?\s*\d{4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/i);
    const dateStr = dateMatch ? dateMatch[1] : '';

    let partyName = 'UPI Transfer';
    const nameMatch = trimmed.match(/(?:Paid to|Received from|Payment to|Money sent to|Transfer to|Refund from|Cashback from)\s*([^\n\r•,]+)/i);
    if (nameMatch) {
      partyName = nameMatch[1].replace(/(?:₹|INR|Rs\.?).*$/, '').trim();
    }

    if (!partyName || isSummaryOrNonTransactionLine(partyName, partyName, trimmed)) continue;

    const refMatch = trimmed.match(/(?:UPI Ref ID|UPI transaction ID|Google transaction ID|UTR|Ref No)[:\s]+([A-Za-z0-9]+)/i);
    const refNo = refMatch ? refMatch[1].trim() : undefined;

    const desc = `${type === 'income' ? (partyName.toLowerCase().includes('received') ? partyName : 'Received from ' + partyName) : (partyName.toLowerCase().includes('paid') ? partyName : 'Paid to ' + partyName)}`;

    transactions.push({
      tempId: `gpay-${Date.now()}-${idCounter++}`,
      date: standardizeDate(dateStr),
      description: desc,
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

  if (transactions.length > 0) return filterOutSummaryRows(transactions);

  // Strategy B: Line-by-line GPay / UPI Statement table records
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || isSummaryOrNonTransactionLine('', '', trimmed)) continue;

    const dateMatch = trimmed.match(/([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4}|\d{1,2}\s+[A-Za-z]{3,9},?\s*\d{4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/i);
    const amtMatch = trimmed.match(/(?:[-+]?\s*(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d{2})?))|([\d,]+\.\d{2})/i);

    if (dateMatch && amtMatch) {
      const amount = parseCleanAmount(amtMatch[1] || amtMatch[0]);
      if (amount > 0) {
        const type = determineCashFlowType({
          text: trimmed,
          rawAmountStr: amtMatch[0]
        });

        let desc = trimmed
          .replace(dateMatch[0], '')
          .replace(amtMatch[0], '')
          .replace(/\b(?:COMPLETED|SUCCESS|SUCCESSFUL|DEBITED|CREDITED|PAID|RECEIVED|UPI)\b/gi, '')
          .trim();
        if (!desc) desc = type === 'income' ? 'UPI Inflow' : 'UPI Outflow';

        if (isSummaryOrNonTransactionLine(desc, '', trimmed)) continue;

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

  return filterOutSummaryRows(transactions);
}

// ─── 36. PHONEPE STATEMENT PARSER ───
export function parsePhonePeStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  // Strategy 1: Tabular row matching
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || isSummaryOrNonTransactionLine('', '', line)) continue;

    const match = line.match(/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}|\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(DEBIT|CREDIT|DEBITED|CREDITED)\s+(?:[-+]?\s*(?:₹|INR|Rs\.?)?\s*([\d,]+(?:\.\d{2})?))/i);
    if (match) {
      const [, dateStr, details, drCr, amtStr] = match;
      const amount = parseCleanAmount(amtStr);
      if (amount <= 0) continue;

      const type = determineCashFlowType({
        text: line,
        desc: details,
        drCr,
        rawAmountStr: amtStr
      });

      if (isSummaryOrNonTransactionLine(details, '', line)) continue;

      transactions.push({
        tempId: `phonepe-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateStr),
        description: details.trim(),
        merchantName: details.replace(/^(Paid to|Received from|Payment to|Transfer to)\s+/i, '').trim(),
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

  if (transactions.length > 0) return filterOutSummaryRows(transactions);

  // Strategy 2: Multi-line transaction blocks for PhonePe App PDF Export
  const blocks = text.split(/(?=(?:\d{1,2}\s+[A-Za-z]{3}(?:,?\s*\d{4})?|\d{2}\/\d{2}\/\d{4})\s+(?:Paid to|Received from|Payment to|Transfer to|Money sent to))/i);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || isSummaryOrNonTransactionLine('', '', trimmed)) continue;

    const dateMatch = trimmed.match(/(\d{1,2}\s+[A-Za-z]{3}(?:,?\s*\d{4})?|\d{2}\/\d{2}\/\d{4})/i);
    const amtMatch = trimmed.match(/(?:[-+]?\s*(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d{2})?))|([\d,]+\.\d{2})/i);
    const drCrMatch = trimmed.match(/\b(DEBIT|CREDIT|DEBITED|CREDITED)\b/i);

    if (dateMatch && amtMatch) {
      const amount = parseCleanAmount(amtMatch[1] || amtMatch[0]);
      if (amount <= 0) continue;

      const type = determineCashFlowType({
        text: trimmed,
        drCr: drCrMatch ? drCrMatch[1] : '',
        rawAmountStr: amtMatch[0]
      });

      const descMatch = trimmed.match(/(?:Paid to|Received from|Payment to|Transfer to|Money sent to)\s*([^\n\r]+)/i);
      const party = descMatch ? descMatch[1].trim() : 'PhonePe Transfer';

      if (isSummaryOrNonTransactionLine(party, party, trimmed)) continue;

      const refMatch = trimmed.match(/(?:Transaction ID|UPI Ref No|UTR)[:\s]+([A-Za-z0-9]+)/i);
      const refNo = refMatch ? refMatch[1].trim() : undefined;

      transactions.push({
        tempId: `phonepe-block-${Date.now()}-${idCounter++}`,
        date: standardizeDate(dateMatch[1]),
        description: `${type === 'income' ? 'Received from' : 'Paid to'} ${party}`,
        merchantName: party,
        category: categorizeByNarration(party),
        type,
        amount,
        debit: type === 'expense' ? amount : 0,
        credit: type === 'income' ? amount : 0,
        referenceNumber: refNo,
        confidenceScore: 0.98,
        bankName: 'PhonePe (UPI)',
        approved: true
      });
    }
  }

  return filterOutSummaryRows(transactions);
}

// ─── 37. PAYTM WALLET / PAYMENTS BANK ───
export function parsePaytmStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || isSummaryOrNonTransactionLine('', '', trimmed)) continue;

    const match = trimmed.match(/(\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{4})\s+(.+?)\s+([A-Za-z0-9_]+)?\s+(?:Rs\.?|₹)?\s*([\d,]+\.?\d*)\s*(Cr|Dr)?/i);
    if (match) {
      const [, dateStr, details, txnId, amtStr, crDr] = match;
      const amount = parseCleanAmount(amtStr);
      if (amount <= 0) continue;
      if (isSummaryOrNonTransactionLine(details, '', trimmed)) continue;

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
  return filterOutSummaryRows(transactions);
}

// ─── 38. UNIVERSAL INDIAN BANK & UPI STATEMENT PARSER ───
export function parseUniversalStatement(text) {
  const transactions = [];
  const lines = text.split(/\r?\n/);
  let idCounter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 8) continue;
    if (isSummaryOrNonTransactionLine('', '', trimmed)) continue;

    // Matches standard table rows starting with a Date
    const dateMatch = trimmed.match(/^(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/);
    if (!dateMatch) continue;

    const rest = trimmed.slice(dateMatch[0].length).trim();
    const amounts = [...rest.matchAll(/(?:[-+]?\s*(?:₹|INR|Rs\.?)?\s*([\d,]+\.\d{2}))/g)];
    if (amounts.length === 0) continue;

    const targetAmtStr = amounts[0][1];
    const amount = parseCleanAmount(targetAmtStr);
    if (amount <= 0) continue;

    let desc = rest.replace(/(?:[-+]?\s*(?:₹|INR|Rs\.?)?\s*[\d,]+\.\d{2})/g, '').replace(/\b(?:CR|DR|DEBIT|CREDIT|DEBITED|CREDITED|COMPLETED|SUCCESS|SUCCESSFUL)\b/gi, '').trim();

    const type = determineCashFlowType({
      text: trimmed,
      desc,
      rawAmountStr: amounts[0][0]
    });

    if (!desc || desc.length < 2) desc = type === 'income' ? 'Direct Inflow' : 'Direct Outflow';

    if (isSummaryOrNonTransactionLine(desc, '', trimmed)) continue;

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

  return filterOutSummaryRows(transactions);
}

export function bufferToPureUint8Array(buf) {
  if (!buf) return new Uint8Array(0);
  if (buf instanceof Uint8Array && !Buffer.isBuffer(buf)) return buf;
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; i++) {
    view[i] = buf[i];
  }
  return view;
}

// ─── HIGH LEVEL DISPATCHER WITH ALL 37 INSTITUTIONS ───
export async function parsePdfBufferWithNativeRegex(fileBuffer) {
  try {
    let extractedText = '';
    const pureUint8 = bufferToPureUint8Array(fileBuffer);

    const PDFParser = await getPDFParse();
    if (PDFParser) {
      const parser = new PDFParser(pureUint8);
      const textResult = await parser.getText();
      extractedText = typeof textResult === 'string' ? textResult : (textResult?.text || '');
    }

    const text = normalizeDevanagari(extractedText);

    if (!text || text.trim().length < 20) {
      return null; // Empty or scanned image PDF -> fallback to Vision OCR
    }

    const lower = text.toLowerCase();

    // Direct keyword match checks for high accuracy
    const bankRules = [
      { keywords: ['phonepe', 'phone pe'], fn: parsePhonePeStatement, name: 'phonepe' },
      { keywords: ['google pay', 'gpay', 'tez', 'google payments'], fn: parseGooglePayStatement, name: 'gpay' },
      { keywords: ['paytm', 'one97', 'paytm payments'], fn: parsePaytmStatement, name: 'paytm' },
      { keywords: ['hdfc bank', 'hdfcbank'], fn: parseHdfcStatement, name: 'hdfc' },
      { keywords: ['state bank of india', 'onlinesbi', 'sbi'], fn: parseSbiStatement, name: 'sbi' },
      { keywords: ['icici bank', 'icicibank', 'icici'], fn: parseIciciStatement, name: 'icici' },
      { keywords: ['axis bank', 'axisbank'], fn: parseAxisStatement, name: 'axis' },
      { keywords: ['kotak mahindra', 'kotak bank', 'kotak'], fn: parseKotakStatement, name: 'kotak' },
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
    ];

    let bestMatch = null;
    for (const rule of bankRules) {
      if (rule.keywords.some(k => lower.includes(k))) {
        const res = rule.fn(text);
        const filtered = filterOutSummaryRows(res);
        if (filtered.length > 0) {
          if (!bestMatch || filtered.length > bestMatch.transactions.length) {
            bestMatch = { parser: `${rule.name}_native_regex`, transactions: filtered };
          }
        }
      }
    }

    if (bestMatch && bestMatch.transactions.length > 0) {
      return bestMatch;
    }


    // Universal statement parser
    const universalRes = parseUniversalStatement(text);
    const filteredUniversal = filterOutSummaryRows(universalRes);
    if (filteredUniversal.length > 0) {
      return { parser: 'universal_statement_regex', transactions: filteredUniversal };
    }

    // Fallback: test all native parsers in priority sequence
    for (const rule of bankRules) {
      const res = rule.fn(text);
      const filtered = filterOutSummaryRows(res);
      if (filtered.length >= 2) {
        return { parser: `${rule.name}_native_regex`, transactions: filtered };
      }
    }

    return null; // Fall back to Gemini Multimodal Vision OCR
  } catch (err) {
    console.warn('[PDF Regex Parser] Local parsing skipped, falling back to Vision OCR:', err.message);
    return null;
  }
}
