import fs from 'fs';

const content = fs.readFileSync('backend/server.js', 'utf8');
const lines = content.split('\n');

console.log('Total lines in server.js:', lines.length);

lines.forEach((line, idx) => {
  if (line.match(/app\.(get|post|put|delete|patch)\(/)) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
