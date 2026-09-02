import fs from 'fs';
const content = fs.readFileSync('backend/public/index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('hero bot') || line.includes('floating') || line.includes('heroBot') || line.includes('openHeroBot') || line.includes('speed-dial')) {
    console.log((idx+1) + ': ' + line.trim().substring(0, 100));
  }
});
