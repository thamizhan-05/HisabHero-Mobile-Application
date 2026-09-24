import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Look for media queries affecting .dash-topbar, .dash-main, grids, flex
const media768Matches = [];
const regex = /@media[^{]*\((?:max-width:\s*(?:768px|960px|600px|480px))\)[^{]*\{([\s\S]*?\n\s*\})/g;
let m;
while ((m = regex.exec(html)) !== null) {
  media768Matches.push({ header: m[0].slice(0, 40), content: m[1] });
}

console.log('Mobile media queries found:', media768Matches.length);
media768Matches.forEach((m, i) => {
  console.log(`\n--- MEDIA ${i+1}: ${m.header} ---`);
  console.log(m.content.slice(0, 500));
});

// Check .dash-topbar styles
const topbarIndex = html.indexOf('.dash-topbar {');
console.log('\n--- .dash-topbar CSS ---');
console.log(html.slice(topbarIndex, topbarIndex + 500));
