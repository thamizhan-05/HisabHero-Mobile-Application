import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Find grid styles in dashboard
const gridStyles = [...html.matchAll(/(grid-template-columns|display:\s*grid)[^;]+;/g)].map(m => m[0]);
console.log('Grid styles count:', gridStyles.length);
console.log('Sample grid styles:', gridStyles.slice(0, 20));

// Check flex containers in dashboard sections
const flexStyles = [...html.matchAll(/class="([^"]*flex[^"]*)"/g)].map(m => m[1]);
console.log('Unique flex classes count:', new Set(flexStyles).size);

// Check table containers
const tableMatches = [...html.matchAll(/<table[^>]*>/g)].map(m => m[0]);
console.log('Tables count:', tableMatches.length);
