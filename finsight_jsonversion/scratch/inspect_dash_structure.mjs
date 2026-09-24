import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Find dashboard view CSS
const dashCss = [...html.matchAll(/\.dash-[a-zA-Z0-9_-]+\s*\{[^}]+\}/g)].map(m => m[0]);
console.log('Dash CSS count:', dashCss.length);
console.log('First 20 dash CSS rules:');
dashCss.slice(0, 20).forEach(c => console.log(c));

// Find HTML structure of dashboardView
const dashIndex = html.indexOf('id="dashboardView"');
console.log('\n=== DASHBOARD VIEW HTML (Next 3000 chars) ===');
console.log(html.slice(dashIndex, dashIndex + 3000));
