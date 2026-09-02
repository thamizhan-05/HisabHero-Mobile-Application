import fs from 'fs';
import path from 'path';

const assetsDir = 'c:/Users/selva/Desktop/HisabHero/mobile/assets';
const files = fs.readdirSync(assetsDir);
console.log('Assets list:', files);

// Let's create an HTML file in backend/public to preview all asset images side by side!
const previewHtml = `<!DOCTYPE html>
<html>
<head>
<title>Asset Preview</title>
<style>
body { background: #1a1a2e; color: #fff; font-family: sans-serif; padding: 20px; }
.grid { display: flex; flex-wrap: wrap; gap: 20px; }
.card { background: #16213e; border-radius: 12px; padding: 15px; text-align: center; }
.card.light { background: #f8fafc; color: #000; }
img { max-width: 200px; max-height: 200px; border-radius: 8px; }
</style>
</head>
<body>
<h1>HisabHero Assets Visual Inspection</h1>
<div class="grid">
${files.filter(f => f.endsWith('.png')).map(f => `
  <div class="card">
    <h3>${f} (Dark BG)</h3>
    <img src="/asset_preview/${f}" />
  </div>
  <div class="card light">
    <h3>${f} (Light BG)</h3>
    <img src="/asset_preview/${f}" />
  </div>
`).join('')}
</div>
</body>
</html>`;

fs.writeFileSync('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/asset_preview.html', previewHtml);
console.log('Wrote asset_preview.html');
