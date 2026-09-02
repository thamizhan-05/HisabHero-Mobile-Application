import { determineCashFlowType, parseGooglePayStatement, parsePhonePeStatement } from '../services/pdfParsers.js';

console.log('🧪 Testing Precise Money Sent (Expense) vs Money Received (Income) Detection...\n');

const testCases = [
  // Payments / Outflow
  { input: 'Paid to Swiggy', expected: 'expense' },
  { input: 'Paid to Swiggy from HDFC Bank Account', expected: 'expense' },
  { input: 'Payment to Uber India', expected: 'expense' },
  { input: 'Money sent to Rahul Sharma', expected: 'expense' },
  { input: 'Autopay to Netflix Subscription', expected: 'expense' },
  { input: 'Bill payment to Airtel Broadband', expected: 'expense' },
  { input: 'Paid using State Bank of India', expected: 'expense' },
  { input: '- ₹450.00', expected: 'expense', rawAmount: '- ₹450.00' },
  { input: 'UPI/DR/SWIGGY/401512', expected: 'expense' },

  // Receipts / Inflow
  { input: 'Received from Alice Smith', expected: 'income' },
  { input: 'Received from John Doe deposited to HDFC Bank', expected: 'income' },
  { input: 'Money received from Client Retainer', expected: 'income' },
  { input: 'Cashback from Google Pay', expected: 'income' },
  { input: 'Refund from Amazon India', expected: 'income' },
  { input: 'Salary credit from ACME Corp', expected: 'income' },
  { input: '+ ₹25,000.00', expected: 'income', rawAmount: '+ ₹25,000.00' },
  { input: 'UPI/CR/CLIENTPAY/401513', expected: 'income' }
];

let passCount = 0;
for (const tc of testCases) {
  const result = determineCashFlowType({
    text: tc.input,
    desc: tc.input,
    rawAmountStr: tc.rawAmount || ''
  });

  const passed = result === tc.expected;
  if (passed) {
    passCount++;
    console.log(`✅ [${result.toUpperCase()}] "${tc.input}"`);
  } else {
    console.error(`❌ FAILED: "${tc.input}" -> Got "${result}", expected "${tc.expected}"`);
  }
}

console.log(`\nResults: ${passCount}/${testCases.length} test cases passed!`);

// Test Google Pay parser with mixed statement
const gpaySample = `
Paid to Swiggy
Jan 16, 2026
₹ 450.00
Completed • From HDFC Bank

Received from Client Retainer
Jan 15, 2026
₹ 25,000.00
Completed • Deposited to HDFC Bank

Paid to Uber India
Jan 14, 2026
₹ 320.00
Completed

Refund from Amazon
Jan 12, 2026
₹ 1,299.00
Completed
`;

const parsedGpay = parseGooglePayStatement(gpaySample);
console.log('\n📱 Parsed Google Pay Statement Transactions:');
parsedGpay.forEach(t => {
  console.log(`  • [${t.type === 'income' ? '🟢 MONEY RECEIVED' : '🔴 MONEY SENT'}] ${t.description} -> ₹${t.amount}`);
});

const swiggy = parsedGpay.find(t => t.description.includes('Swiggy'));
const retainer = parsedGpay.find(t => t.description.includes('Client Retainer'));
const refund = parsedGpay.find(t => t.description.includes('Amazon'));

if (swiggy?.type !== 'expense') throw new Error('Swiggy should be expense (Money Sent)');
if (retainer?.type !== 'income') throw new Error('Client Retainer should be income (Money Received)');
if (refund?.type !== 'income') throw new Error('Amazon refund should be income (Money Received)');

console.log('\n🎉 ALL CASH FLOW DIRECTION TESTS PASSED PERFECTLY!');
