import { standardizeDate } from '../backend/services/pdfParsers.js';

const sampleGPayBlock1 = `Paid to Indian Overseas Bank 2077
₹3,000.00
Feb 01, 2026, 10:15 AM
Completed • UPI transaction ID: 603311223344`;

const sampleGPayBlock2 = `Received from Selvamanikandan
+₹5,000.00
Jan 25, 2026, 04:30 PM
Completed • UPI transaction ID: 602511223344`;

const sampleGPayBlock3 = `Paid to GAYATRI FRESH SUPER MARKET
₹189.00
Jan 16, 2026, 04:48 PM
Completed • UPI transaction ID: 601648997733`;

function parseExactGPayBlock(block) {
  const trimmed = block.trim();
  const isReceived = /^(?:Received from|From\s*:|Refund from|Cashback)/i.test(trimmed) || /\+\s*(?:₹|INR|Rs\.?)/i.test(trimmed) || /\b(?:Received|Credited)\b/i.test(trimmed);
  const isPaid = /^(?:Paid to|Payment to|Money sent to|To\s*:)/i.test(trimmed) || /-\s*(?:₹|INR|Rs\.?)/i.test(trimmed);
  const type = isReceived ? 'income' : 'expense';

  const nameMatch = trimmed.match(/^(?:Paid to|Received from|Payment to|Money sent to|To\s*:|From\s*:)\s*([^\n\r]+)/i);
  let partyName = nameMatch ? nameMatch[1].trim() : 'Google Pay Transfer';
  partyName = partyName.replace(/(?:₹|INR|Rs\.?).*$/, '').trim();

  const amtMatch = trimmed.match(/(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/i) || trimmed.match(/([\d,]+\.\d{2})/);
  const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : 0;

  // Match: "Jan 16, 2026" OR "16 Jan 2026" OR "16/01/2026" OR "2026-01-16"
  const dateMatch = trimmed.match(/([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4}|\d{1,2}\s+[A-Za-z]{3,9},?\s*\d{4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/i);
  const dateStr = dateMatch ? dateMatch[1] : '';

  const refMatch = trimmed.match(/(?:UPI Ref ID|UPI transaction ID|Google transaction ID|UTR|Ref No)[:\s]+([A-Za-z0-9]+)/i);
  const refNo = refMatch ? refMatch[1].trim() : undefined;

  return {
    partyName,
    type,
    amount,
    dateStr,
    refNo
  };
}

console.log('Block 1:', parseExactGPayBlock(sampleGPayBlock1));
console.log('Block 2:', parseExactGPayBlock(sampleGPayBlock2));
console.log('Block 3:', parseExactGPayBlock(sampleGPayBlock3));
