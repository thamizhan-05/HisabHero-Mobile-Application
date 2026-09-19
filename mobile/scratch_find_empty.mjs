import fs from 'fs';
const content = fs.readFileSync('mobile/src/components/DashboardScreen.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('EmptyState') || line.includes('No transactions') || line.includes('No financial data')) {
    console.log((idx+1) + ': ' + line.trim().substring(0, 110));
  }
});
