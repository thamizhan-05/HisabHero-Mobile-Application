import fs from 'fs';
const content = fs.readFileSync('backend/public/index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('function loadDashboardData') || line.includes('function renderTransactions') || line.includes('function updateDashboard')) {
    console.log((idx+1) + ': ' + line.trim().substring(0, 100));
  }
});
