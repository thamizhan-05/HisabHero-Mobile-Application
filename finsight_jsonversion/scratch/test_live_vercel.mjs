import fs from 'fs';
import jwt from 'jsonwebtoken';

async function testVercelPreview() {
  const filePath = 'C:/Users/selva/Downloads/OpTransactionHistory19-09-2026.pdf-12-37-35.pdf';
  const fileBuffer = fs.readFileSync(filePath);

  const JWT_SECRET = process.env.JWT_SECRET || 'hisabhero_jwt_super_secret_key_2026';
  const token = jwt.sign({ userId: '6a982bb9-0fad-4fc4-b3e2-199100000001' }, JWT_SECRET, { expiresIn: '1d' });

  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), 'OpTransactionHistory19-09-2026.pdf-12-37-35.pdf');
  formData.append('workspaceId', '6a982bb9-0fad-4fc4-b3e2-199100000002');

  console.log('Sending upload preview request to https://hisabhero.vercel.app/api/upload/preview...');
  const res = await fetch('https://hisabhero.vercel.app/api/upload/preview', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'X-Workspace-Id': '6a982bb9-0fad-4fc4-b3e2-199100000002'
    },
    body: formData
  });

  console.log('Response status:', res.status);
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    console.log('Success:', data.success);
    console.log('Parser used:', data.parserUsed);
    console.log('Total inflow: Rs.', data.totalInflow);
    console.log('Total outflow: Rs.', data.totalOutflow);
    console.log('Extracted transactions count:', data.transactions?.length);
    console.log('Transactions:');
    (data.transactions || []).forEach((t, i) => {
      console.log(`  [${i+1}] ${t.date} | Rs.${t.amount} (${t.type}) | ${t.merchantName} | ${t.description.substring(0, 50)}...`);
    });
  } catch(e) {
    console.log('Raw response:', text.substring(0, 500));
  }
}

testVercelPreview().catch(console.error);
