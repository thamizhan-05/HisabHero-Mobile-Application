import { parsePhonePeStatement, parseGooglePayStatement, parseUniversalStatement, filterOutSummaryRows } from '../services/pdfParsers.js';

console.log('🧪 Testing PDF & UPI Statement Parser Summary Exclusions...\n');

// 1. PhonePe Sample with Summary Header and genuine transactions
const phonePeSample = `
PhonePe Transaction Statement
Statement Period: 01 Jan 2024 to 31 Jan 2024
Total Money Sent: ₹ 14,500.00
Total Money Received: ₹ 25,000.00
Opening Balance: ₹ 5,000.00
Closing Balance: ₹ 15,500.00

15 Jan 2024  Paid to Swiggy  DEBIT  ₹ 450.00
14 Jan 2024  Received from Client Retainer  CREDIT  ₹ 25,000.00
10 Jan 2024  Paid to Uber India  DEBIT  ₹ 320.00
05 Jan 2024  Paid to AWS Cloud Hosting  DEBIT  ₹ 13,730.00
`;

const phonePeResults = parsePhonePeStatement(phonePeSample);
console.log('📱 PhonePe Extracted Transactions count:', phonePeResults.length);
console.log(phonePeResults.map(t => `  • [${t.type.toUpperCase()}] ${t.date} | ${t.description} -> ₹${t.amount}`));

// Assertions for PhonePe
const hasTotalSent = phonePeResults.some(t => /total/i.test(t.description) || /total/i.test(t.merchantName));
if (hasTotalSent) {
  throw new Error('❌ FAILED: Total Money Sent/Received was captured as a transaction in PhonePe!');
}
if (phonePeResults.length !== 4) {
  throw new Error(`❌ Expected 4 transactions, but got ${phonePeResults.length}`);
}
console.log('✅ PhonePe Summary Exclusion: PASSED (0 summary rows captured, 4/4 real transactions)\n');

// 2. Google Pay Sample with Summary Header
const gpaySample = `
Google Pay Statement
Summary for Jan 2024
Total Sent: ₹ 8,500.00
Total Received: ₹ 12,000.00

Paid to Zomato Online
Jan 20, 2024
₹ 650.00
Completed • UPI Ref ID: 402012345678

Received from Alice Smith
Jan 18, 2024
₹ 12,000.00
Completed • UPI Ref ID: 401812345678

Paid to Reliance Fresh
Jan 12, 2024
₹ 7,850.00
Completed • UPI Ref ID: 401212345678
`;

const gpayResults = parseGooglePayStatement(gpaySample);
console.log('🌐 Google Pay Extracted Transactions count:', gpayResults.length);
console.log(gpayResults.map(t => `  • [${t.type.toUpperCase()}] ${t.date} | ${t.description} -> ₹${t.amount}`));

const hasGpayTotal = gpayResults.some(t => /total/i.test(t.description) || /total/i.test(t.merchantName));
if (hasGpayTotal) {
  throw new Error('❌ FAILED: Total Sent/Received was captured as a transaction in GPay!');
}
if (gpayResults.length !== 3) {
  throw new Error(`❌ Expected 3 transactions, but got ${gpayResults.length}`);
}
console.log('✅ Google Pay Summary Exclusion: PASSED (0 summary rows captured, 3/3 real transactions)\n');

// 3. Bank Statement Table with Footer Total Row
const bankTableSample = `
Date        Narration                  Chq No   Withdrawal  Deposit     Balance
01/01/2024  OPENING BALANCE            -        -           -           50,000.00
05/01/2024  NEFT CR-ACME CORP          -        -           45,000.00   95,000.00
10/01/2024  UPI/DR/SWIGGY              -        450.00      -           94,550.00
25/01/2024  OFFICE RENT LEASE          -        35,000.00   -           59,550.00
31/01/2024  TOTAL TRANSACTIONS / TOTAL -        35,450.00   45,000.00   59,550.00
31/01/2024  CLOSING BALANCE            -        -           -           59,550.00
`;

const universalResults = parseUniversalStatement(bankTableSample);
console.log('🏦 Universal Bank Extracted Transactions count:', universalResults.length);
console.log(universalResults.map(t => `  • [${t.type.toUpperCase()}] ${t.date} | ${t.description} -> ₹${t.amount}`));

const hasBankSummary = universalResults.some(t => /total|opening balance|closing balance/i.test(t.description));
if (hasBankSummary) {
  throw new Error('❌ FAILED: Summary/Balance row was captured as a transaction!');
}
if (universalResults.length !== 3) {
  throw new Error(`❌ Expected 3 transactions, but got ${universalResults.length}`);
}
console.log('✅ Universal Bank Statement Summary Exclusion: PASSED (0 summary rows captured, 3/3 real transactions)\n');

console.log('🎉 ALL TESTS PASSED: SUMMARY TOTALS & SENT AMOUNTS 100% EXCLUDED FROM PARSED TRANSACTIONS!');
