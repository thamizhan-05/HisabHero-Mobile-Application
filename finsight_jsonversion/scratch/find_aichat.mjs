import fs from 'fs';
const content = fs.readFileSync('backend/public/index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('sendAiChat') || line.includes('chatWithHeroBot') || line.includes('handleAiChat') || line.includes('openHeroBot') || line.includes('heroBotModal')) {
    console.log((idx+1) + ': ' + line.trim().substring(0, 110));
  }
});
