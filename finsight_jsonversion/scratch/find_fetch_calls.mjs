import fs from 'fs';
const content = fs.readFileSync('backend/public/index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('fetch(') || line.includes('api/transactions')) {
    console.log((idx+1) + ': ' + line.trim().substring(0, 110));
  }
});
