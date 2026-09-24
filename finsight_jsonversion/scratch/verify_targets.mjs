import fs from 'fs';

const htmlPath = 'backend/public/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Check hamburger insertion target
const topbarTarget = '<header class="dash-topbar">\n      <div class="flex items-center gap-4">\n        <div class="nav-brand"';
console.log('Topbar target exists:', html.includes(topbarTarget));

// 2. Check sidebar target
const sidebarTarget = '<aside class="dash-sidebar">';
console.log('Sidebar target exists:', html.includes(sidebarTarget));

// 3. Check mobile nav target
const mobNavTarget = '<nav class="dash-mobile-nav" id="dashMobileNav">';
console.log('Mob nav target exists:', html.includes(mobNavTarget));

// 4. Check media query target
const mediaQueryTarget = '@media (max-width: 960px) {\n      .hero-space-grid { display: flex !important; flex-direction: column !important; gap: 2rem !important; }';
console.log('Media query target exists:', html.includes(mediaQueryTarget));

// 5. Check showSection target
const showSecTarget = 'function showSection(secName) {';
console.log('showSection target exists:', html.includes(showSecTarget));
