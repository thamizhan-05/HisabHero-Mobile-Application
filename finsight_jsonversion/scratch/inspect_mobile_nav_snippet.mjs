import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

const navIndex = html.indexOf('id="dashMobileNav"');
console.log('=== dashMobileNav snippet ===');
console.log(html.slice(navIndex - 100, navIndex + 1200));
