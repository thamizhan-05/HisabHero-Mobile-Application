import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

const showSecIndex = html.indexOf('function showSection(');
console.log('=== showSection full ===');
console.log(html.slice(showSecIndex, showSecIndex + 1200));
