import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

let idx = 0;
while ((idx = html.indexOf('dash-mobile-nav', idx)) !== -1) {
  console.log('=== dash-mobile-nav at index', idx, '===');
  console.log(html.slice(Math.max(0, idx - 50), Math.min(html.length, idx + 800)));
  idx += 15;
}
