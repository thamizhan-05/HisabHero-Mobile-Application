import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Check elements inside landingView
const landingStart = html.indexOf('id="landingView"');
const landingEnd = html.indexOf('id="dashboardView"');
const landingHtml = html.slice(landingStart, landingEnd);

// Find any fixed widths >= 500px in landingHtml
const landingFixedWidths = [...landingHtml.matchAll(/(?:width|max-width|min-width):\s*(\d{3,4})px/g)].map(m => ({ full: m[0], val: parseInt(m[1]) }));
console.log('Landing fixed widths >= 400px:', landingFixedWidths.filter(w => w.val >= 400));
