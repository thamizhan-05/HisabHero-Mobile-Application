import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Check showSection function definition
const showSecIndex = html.indexOf('function showSection(');
console.log('=== showSection function ===');
console.log(html.slice(showSecIndex, showSecIndex + 600));
