import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Find all @media query blocks
const mediaBlocks = [];
const mediaRegex = /@media[^{]+\{/g;
let match;
while ((match = mediaRegex.exec(html)) !== null) {
  const start = match.index;
  let depth = 0;
  let end = start;
  for (let i = start; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  mediaBlocks.push(html.slice(start, end));
}

console.log('=== MEDIA BLOCKS COUNT ===', mediaBlocks.length);
mediaBlocks.forEach((b, i) => {
  console.log(`\n--- MEDIA BLOCK ${i + 1} (${b.slice(0, 40)}...) Length: ${b.length} ---`);
  console.log(b.slice(0, 300) + '...\n');
});

// Let's check how #dashboardView is structured in HTML
const dashIndex = html.indexOf('id="dashboardView"');
if (dashIndex !== -1) {
  console.log('=== DASHBOARD VIEW HTML START ===');
  console.log(html.slice(dashIndex - 50, dashIndex + 1200));
}
