import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

const mIndex = html.indexOf('@media (max-width: 600px)');
console.log('=== Media 600px and beyond ===');
console.log(html.slice(mIndex, mIndex + 2000));
