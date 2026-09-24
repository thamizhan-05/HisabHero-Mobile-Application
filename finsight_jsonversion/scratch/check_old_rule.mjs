import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

let idx = 0;
while ((idx = html.indexOf('.dash-sidebar { display: none !important; }', idx)) !== -1) {
  console.log('Found old rule at:', idx);
  idx += 30;
}
