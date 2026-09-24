import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Find all inline styles with width > 300px
const matches = [...html.matchAll(/style="[^"]*width:\s*([4-9]\d\d|\d{4,})px[^"]*"/g)].map(m => m[0]);
console.log('Inline fixed widths > 399px count:', matches.length);
matches.slice(0, 15).forEach(m => console.log(m));

// Find all inline grid-template-columns
const gridMatches = [...html.matchAll(/style="[^"]*grid-template-columns:[^"]*"/g)].map(m => m[0]);
console.log('Inline grid styles count:', gridMatches.length);
gridMatches.forEach(g => console.log(g));
