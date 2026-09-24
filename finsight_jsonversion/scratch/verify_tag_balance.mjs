import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Verify tag balance
const openDivs = (html.match(/<div\b/g) || []).length;
const closeDivs = (html.match(/<\/div>/g) || []).length;
console.log('Divs:', { open: openDivs, close: closeDivs, balanced: openDivs === closeDivs });

const openNavs = (html.match(/<nav\b/g) || []).length;
const closeNavs = (html.match(/<\/nav>/g) || []).length;
console.log('Navs:', { open: openNavs, close: closeNavs, balanced: openNavs === closeNavs });

const openAsides = (html.match(/<aside\b/g) || []).length;
const closeAsides = (html.match(/<\/aside>/g) || []).length;
console.log('Asides:', { open: openAsides, close: closeAsides, balanced: openAsides === closeAsides });

const openHeaders = (html.match(/<header\b/g) || []).length;
const closeHeaders = (html.match(/<\/header>/g) || []).length;
console.log('Headers:', { open: openHeaders, close: closeHeaders, balanced: openHeaders === closeHeaders });
