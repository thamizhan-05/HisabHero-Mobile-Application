import fs from 'fs';

const htmlPath = 'backend/public/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

const oldLine = '.dash-sidebar { display: none !important; }';
if (html.includes(oldLine)) {
  html = html.replace(oldLine, '/* .dash-sidebar transformed to mobile off-canvas drawer */');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ Removed conflicting .dash-sidebar display:none rule');
} else {
  console.log('Old rule not found');
}
