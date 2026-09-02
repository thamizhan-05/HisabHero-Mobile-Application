import fs from 'fs';
const content = fs.readFileSync('backend/public/index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('id="heroBot') || line.includes('id="spotlight') || line.includes('openSpotlight') || line.includes('function showSection') || line.includes('id="section-') || line.includes('id="dashboardView') || line.includes('floating-bot')) {
    console.log((idx+1) + ': ' + line.trim().substring(0, 110));
  }
});
