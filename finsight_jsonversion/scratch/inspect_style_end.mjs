import fs from 'fs';

const html = fs.readFileSync('backend/public/index.html', 'utf8');

// Find the end of the <style> block
const styleCloseIndex = html.indexOf('</style>');
console.log('=== CSS before </style> (last 2000 chars) ===');
console.log(html.slice(styleCloseIndex - 2000, styleCloseIndex));
