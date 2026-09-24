import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Search for where dash-sidebar is defined
let idx = 0;
while ((idx = html.indexOf('.dash-sidebar', idx)) !== -1) {
  console.log('=== .dash-sidebar at index', idx, '===');
  console.log(html.slice(Math.max(0, idx - 100), Math.min(html.length, idx + 400)));
  idx += 13;
}
