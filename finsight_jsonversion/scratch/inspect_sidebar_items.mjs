import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

const sidebarIndex = html.indexOf('<aside class="dash-sidebar"');
const endSidebar = html.indexOf('</aside>', sidebarIndex);
console.log('=== Full dash-sidebar HTML ===');
console.log(html.slice(sidebarIndex, endSidebar + 10));
