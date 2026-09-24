export function extractMerchantAndCaption(narration, bankName = '') {
  if (!narration) return { merchant: `${bankName} Transaction`, caption: '' };
  const clean = narration.trim();

  // Pattern: UPI/624643439226/DR/Flipkart Payme /YES/UPI
  // or UPI/661371343856/DR/ RSM MALL LLP /YES/milk
  if (/^UPI\//i.test(clean)) {
    const parts = clean.split('/').map(p => p.trim());

    // Case 1: UPI/<RRN>/DR or CR/<MERCHANT>/...
    if (parts.length >= 4 && /^\d+$/.test(parts[1]) && /^(?:DR|CR)$/i.test(parts[2])) {
      const merchant = parts[3];
      let caption = '';
      if (parts.length >= 6 && parts[5] && !/^(?:UPI|NA|NULL|NONE)$/i.test(parts[5])) {
        caption = parts[5];
      }
      return { merchant, caption };
    }

    // Case 2: UPI/DR or CR/<RRN>/<MERCHANT>/...
    if (parts.length >= 4 && /^(?:DR|CR)$/i.test(parts[1])) {
      const merchant = /^\d+$/.test(parts[2]) ? parts[3] : parts[2];
      let caption = '';
      if (parts.length >= 6 && parts[5] && !/^(?:UPI|NA|NULL|NONE)$/i.test(parts[5])) {
        caption = parts[5];
      } else if (parts.length >= 5 && parts[4] && !/^(?:UPI|NA|NULL|NONE)$/i.test(parts[4])) {
        caption = parts[4];
      }
      return { merchant, caption };
    }

    // Case 3: UPI/<RRN>/<MERCHANT>/...
    if (parts.length >= 3 && /^\d+$/.test(parts[1])) {
      const merchant = parts[2];
      let caption = '';
      if (parts.length >= 4 && parts[3] && !/^(?:UPI|NA|NULL|NONE)$/i.test(parts[3])) {
        caption = parts[3];
      }
      return { merchant, caption };
    }

    // Case 4: UPI/<MERCHANT>/<VPA>/<REMARK>/...
    if (parts.length >= 2 && !/^\d+$/.test(parts[1]) && !/^(?:DR|CR)$/i.test(parts[1])) {
      const merchant = parts[1];
      let caption = '';
      if (parts.length >= 4 && parts[3] && !/^(?:UPI|NA|NULL|NONE)$/i.test(parts[3])) {
        caption = parts[3];
      }
      return { merchant, caption };
    }
  }

  // Bil Payment BIL/ONL/001249237107/sitaben sh/TBR0GB
  if (/BIL\/ONL\//i.test(clean)) {
    const parts = clean.split('/').map(p => p.trim());
    if (parts.length >= 4 && parts[3]) {
      return { merchant: parts[3], caption: '' };
    }
  }

  // Cash Deposit
  if (/CASH\s*DEP/i.test(clean)) {
    return { merchant: 'Cash Deposit', caption: 'Cash Deposit' };
  }

  // NEFT
  if (/NEFT/i.test(clean)) {
    const parts = clean.split(/[-\/]/).map(p => p.trim());
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part && !/^\d+$/.test(part) && !/^(?:NEFT|ICIC|IN\d+|INDIA|OVERSEAS|BANK|BIL)$/i.test(part) && part.length > 2) {
        return { merchant: part, caption: '' };
      }
    }
  }

  // iDirect
  if (/iDirect/i.test(clean)) {
    return { merchant: 'ICICI Direct', caption: 'Investments' };
  }

  // General fallback
  const firstToken = clean.split(/[\/\-]/)[0].trim();
  return { merchant: firstToken || `${bankName} Narration`, caption: '' };
}

const CATEGORY_RULES = [
  {
    category: 'Groceries',
    keywords: [
      'milk', 'curd', 'dairy', 'paneer', 'butter', 'cheese', 'ghee', 'egg', 'eggs', 'bread',
      'vegetable', 'vegetables', 'veggie', 'veggies', 'fruit', 'fruits', 'apple', 'banana',
      'meat', 'chicken', 'fish', 'mutton', 'prawn', 'ration', 'grocery', 'groceries',
      'supermarket', 'hypermarket', 'kirana', 'provisions', 'dmart', 'd-mart', 'zepto',
      'blinkit', 'instamart', 'bigbasket', 'bb daily', 'dunzo', 'spencers', 'more retail',
      'nature basket', 'reliance fresh', 'reliance smart', 'mall'
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
  }
];

export function categorizeSmart(narration = '', merchant = '', caption = '') {
  // 1. User caption has highest priority
  if (caption && caption.trim()) {
    const cLower = caption.toLowerCase();
    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some(k => cLower.includes(k))) {
        return rule.category;
      }
    }
  }

  // 2. Merchant name
  if (merchant && merchant.trim()) {
    const mLower = merchant.toLowerCase();
    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some(k => mLower.includes(k))) {
        return rule.category;
      }
    }
  }

  // 3. Full narration text
  if (narration && narration.trim()) {
    const nLower = narration.toLowerCase();
    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some(k => nLower.includes(k))) {
        return rule.category;
      }
    }
  }

  // 4. Fallback if cannot categorise or caption not given
  return 'General';
}

// Run test cases
const testNarrations = [
  'UPI/624643439226/DR/Flipkart Payme /YES/UPI',
  'UPI/661371343856/DR/ RSM MALL LLP /YES/milk',
  'UPI/661371343856/DR/John Doe/YES/UPI',
  'UPI/112233445566/DR/Shiv Auto/SBI/petrol',
  'UPI/112233445566/DR/Swiggy/HDFC/dinner',
  'UPI/112233445566/DR/Corner Shop/SBI/lunch',
  'UPI/123456789012/DR/Apollo Pharmacy/ICICI/cold medicine',
  'UPI/555444333222/DR/Sharmaji/SBI/house rent',
  'Bil Payment BIL/ONL/001249237107/sitaben sh/TBR0GB',
  'Credit trxn CAM/03272SRY/CASH DEP-Other/10-09-26/6652',
  'ULAGAMMAL BIL/NEFT/IN12625755586308/ULAGAMMAL/INDI',
  'iDirect trxn EBA/MFP-8511616813-205534063-S-231200',
  'RAJALAKSHM UPI/RAJALAKSHM/XX5550@axl/Payment fr/UN'
];

console.log('=== UPI & Bank Narration Classification Results ===\n');
for (const n of testNarrations) {
  const { merchant, caption } = extractMerchantAndCaption(n, 'Bank');
  const cat = categorizeSmart(n, merchant, caption);
  console.log(`Narration: ${n}`);
  console.log(`  => Merchant: [${merchant}] | Caption: [${caption || '(none)'}]`);
  console.log(`  => Category: [${cat}]\n`);
}
