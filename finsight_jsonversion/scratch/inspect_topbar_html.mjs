import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

const topbarIndex = html.indexOf('<header class="dash-topbar">');
console.log('=== dash-topbar HTML ===');
console.log(html.slice(topbarIndex, topbarIndex + 2500));
