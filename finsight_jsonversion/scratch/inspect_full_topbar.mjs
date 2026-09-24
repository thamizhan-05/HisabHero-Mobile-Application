import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

const topbarIndex = html.indexOf('<header class="dash-topbar">');
const endHeader = html.indexOf('</header>', topbarIndex);
console.log('=== Full dash-topbar HTML ===');
console.log(html.slice(topbarIndex, endHeader + 10));
