import fs from 'fs';
const content = fs.readFileSync('backend/public/index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('async function fetch') || line.includes('function fetch') || line.includes('function initDashboard') || line.includes('apiGet(')) {
    console.log((idx+1) + ': ' + line.trim().substring(0, 100));
  }
});
