import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

const tIdx = html.indexOf('<header class="dash-topbar">');
console.log('Topbar snippet:\n' + JSON.stringify(html.slice(tIdx, tIdx + 120)));

const mIdx = html.indexOf('@media (max-width: 960px)');
console.log('\nMedia snippet:\n' + JSON.stringify(html.slice(mIdx, mIdx + 120)));
