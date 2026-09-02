import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function benchmarkSpeed() {
  console.log('⚡ Benchmarking Statement PDF Extraction Speed...\n');

  const filePath = path.join(process.cwd(), '..', '..', 'gpay_statement_20260201_20260228.pdf');
  let buffer;
  if (fs.existsSync(filePath)) {
    buffer = fs.readFileSync(filePath);
  } else {
    // Look in current or parent dirs
    const candidates = [
      'gpay_statement_20260201_20260228.pdf',
      '../gpay_statement_20260201_20260228.pdf',
      '../../gpay_statement_20260201_20260228.pdf'
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        buffer = fs.readFileSync(c);
        break;
      }
    }
  }

  if (!buffer) {
    console.error('File not found for benchmark');
    return;
  }

  // Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'selvathevar10042005@gmail.com',
      password: 'Stvr2005$',
      deviceId: 'speed_test_dev',
      deviceName: 'Speed Tester'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const wsId = loginData.user.activeWorkspace.id;

  const blob = new Blob([buffer], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', blob, 'gpay_statement_20260201_20260228.pdf');

  const start = performance.now();
  const res = await fetch('http://localhost:5000/api/upload/preview', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': wsId
    },
    body: formData
  });
  const data = await res.json();
  const duration = (performance.now() - start).toFixed(1);

  console.log(`⏱️ Extraction Completed in: ${duration} ms!`);
  console.log(`📊 Extracted Transactions: ${data.count} items`);
  console.log(`⚡ Parser Used: ${data.parserUsed}`);
  console.log(`💰 Inflow: +₹${data.totalInflow} | Outflow: -₹${data.totalOutflow} | Net: ₹${data.net}`);

  if (Number(duration) < 1000) {
    console.log('\n🚀 ULTRA FAST SPEED VERIFIED (<1000ms)!');
  }
}

benchmarkSpeed().catch(console.error);
