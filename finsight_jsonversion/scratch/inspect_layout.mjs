import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Find major top-level containers
const topDivs = [...html.matchAll(/<div\s+id="([^"]+)"(?:\s+class="([^"]+)")?/g)].map(m => ({ id: m[1], class: m[2] }));
console.log('Top Div IDs count:', topDivs.length);
console.log('First 20 IDs:', topDivs.slice(0, 20));

// Find any media queries
const mediaMatches = [...html.matchAll(/@media[^{]+\{/g)].map(m => m[0]);
console.log('Existing @media queries:', mediaMatches);

// Find elements with fixed widths or max/min-widths
const fixedWidths = [...html.matchAll(/(?:min-width|max-width|width)\s*:\s*(\d{3,4}px)/g)].map(m => m[0]);
console.log('Fixed widths sample (>=100px):', [...new Set(fixedWidths)].slice(0, 30));

// Find navbar, dashboard, main container classes
const containerClasses = [...html.matchAll(/\.([a-zA-Z0-9_-]*(?:layout|container|navbar|nav|dashboard|sidebar|main|wrapper|grid|flex)[a-zA-Z0-9_-]*)\s*\{([^}]+)\}/g)]
  .map(m => ({ selector: m[1], rules: m[2].trim() }));

console.log('Sample container selectors:', containerClasses.slice(0, 15).map(c => c.selector));
