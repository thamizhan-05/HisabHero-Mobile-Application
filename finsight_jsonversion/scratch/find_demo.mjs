import fs from 'fs';
const content = fs.readFileSync('backend/public/index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('demo') || line.includes('sample') || line.includes('loadDemo') || line.includes('seed')) {
    console.log((idx+1) + ': ' + line.trim().substring(0, 100));
  }
});
