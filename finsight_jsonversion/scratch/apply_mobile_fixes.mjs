import fs from 'fs';

const htmlPath = 'backend/public/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Inject Hamburger button in .dash-topbar
const topbarFind = '<header class="dash-topbar">\r\n      <div class="flex items-center gap-4">';
const topbarReplace = `<header class="dash-topbar">
      <div class="flex items-center gap-3">
        <!-- 📱 Mobile Hamburger Menu Toggle -->
        <button class="dash-mobile-hamburger" id="dashMobileHamburger" onclick="toggleMobileSidebar()" aria-label="Toggle Navigation Menu">
          <span class="hamburger-bar"></span>
          <span class="hamburger-bar"></span>
          <span class="hamburger-bar"></span>
        </button>`;

if (html.includes(topbarFind)) {
  html = html.replace(topbarFind, topbarReplace);
  console.log('✅ Injected mobile hamburger button');
} else {
  // Try fallback with \n
  const topbarFindLf = '<header class="dash-topbar">\n      <div class="flex items-center gap-4">';
  if (html.includes(topbarFindLf)) {
    html = html.replace(topbarFindLf, topbarReplace);
    console.log('✅ Injected mobile hamburger button (LF)');
  } else {
    console.error('❌ Failed to find topbar target');
  }
}

// 2. Inject Backdrop and Mobile Drawer Header in .dash-sidebar
const sidebarFind = '<aside class="dash-sidebar">';
const sidebarReplace = `<!-- 📱 Mobile Drawer Backdrop Overlay -->
      <div id="mobileSidebarBackdrop" class="mobile-sidebar-backdrop" onclick="toggleMobileSidebar(false)"></div>

      <aside class="dash-sidebar">
        <!-- 📱 Mobile Drawer Header -->
        <div class="mobile-sidebar-header">
          <div class="flex items-center gap-2">
            <img src="/logo.png" alt="HisabHero" style="width: 24px; height: 24px; border-radius: 6px;" />
            <span style="font-weight: 800; font-size: 1.05rem; color: var(--primary);">Hisab<span style="color: var(--secondary);">Hero</span></span>
          </div>
          <button class="mobile-sidebar-close-btn" onclick="toggleMobileSidebar(false)" aria-label="Close Navigation">✕</button>
        </div>`;

if (html.includes(sidebarFind)) {
  html = html.replace(sidebarFind, sidebarReplace);
  console.log('✅ Injected mobile drawer header and backdrop');
} else {
  console.error('❌ Failed to find sidebar target');
}

// 3. Upgrade .dash-mobile-nav
const mobNavStart = '<nav class="dash-mobile-nav" id="dashMobileNav">';
const mobNavEnd = '</nav>';
const mobNavIdx = html.indexOf(mobNavStart);
const mobNavEndIdx = html.indexOf(mobNavEnd, mobNavIdx);

if (mobNavIdx !== -1 && mobNavEndIdx !== -1) {
  const oldNav = html.slice(mobNavIdx, mobNavEndIdx + mobNavEnd.length);
  const newNav = `<nav class="dash-mobile-nav" id="dashMobileNav">
      <button class="mobile-nav-btn active" id="mobNavOverview" onclick="showSection('overview')">
        <span>📊</span> <span>Overview</span>
      </button>
      <button class="mobile-nav-btn" id="mobNavCashflow" onclick="showSection('cashflow')">
        <span>⚡</span> <span>Radar</span>
      </button>
      <button class="mobile-nav-btn fab-center" id="mobNavAdd" onclick="openAddTxModal()" aria-label="Add Transaction">
        <span class="fab-icon">+</span>
      </button>
      <button class="mobile-nav-btn" id="mobNavKhata" onclick="showSection('khata')">
        <span>🤝</span> <span>Khata</span>
      </button>
      <button class="mobile-nav-btn" id="mobNavMore" onclick="toggleMobileSidebar(true)">
        <span>☰</span> <span>All Apps</span>
      </button>
    </nav>`;
  html = html.replace(oldNav, newNav);
  console.log('✅ Upgraded mobile bottom navigation bar');
} else {
  console.error('❌ Failed to find mobNav target');
}

// 4. Update showSection and inject toggleMobileSidebar JS
const showSecFind = 'function showSection(secName) {';
const showSecReplace = `function toggleMobileSidebar(forceState) {
      const sidebar = document.querySelector('.dash-sidebar');
      const backdrop = document.getElementById('mobileSidebarBackdrop');
      const hamburger = document.getElementById('dashMobileHamburger');
      if (!sidebar) return;
      const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('mobile-open');
      if (isOpen) {
        sidebar.classList.add('mobile-open');
        if (backdrop) backdrop.classList.add('active');
        if (hamburger) hamburger.classList.add('active');
        document.body.classList.add('mobile-drawer-locked');
      } else {
        sidebar.classList.remove('mobile-open');
        if (backdrop) backdrop.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
        document.body.classList.remove('mobile-drawer-locked');
      }
    }

    function showSection(secName) {
      if (typeof toggleMobileSidebar === 'function' && window.innerWidth <= 960) {
        toggleMobileSidebar(false);
      }`;

if (html.includes(showSecFind)) {
  html = html.replace(showSecFind, showSecReplace);
  console.log('✅ Injected toggleMobileSidebar and updated showSection');
} else {
  console.error('❌ Failed to find showSection target');
}

// 5. Update mobNav active state in showSection
const mobNavActiveFind = `if (secName === 'overview') document.getElementById('mobNavOverview')?.classList.add('active');
      else if (secName === 'upload') document.getElementById('mobNavDocs')?.classList.add('active');
      else if (secName === 'transactions') document.getElementById('mobNavTx')?.classList.add('active');
      else if (secName === 'invoices') document.getElementById('mobNavInvoices')?.classList.add('active');
      else if (secName === 'settings') document.getElementById('mobNavSettings')?.classList.add('active');`;

const mobNavActiveReplace = `if (secName === 'overview') document.getElementById('mobNavOverview')?.classList.add('active');
      else if (secName === 'cashflow') document.getElementById('mobNavCashflow')?.classList.add('active');
      else if (secName === 'khata') document.getElementById('mobNavKhata')?.classList.add('active');
      else if (secName === 'invoices') document.getElementById('mobNavKhata')?.classList.add('active');`;

// Try with \r\n and \n
const mobNavActiveFindCrLf = mobNavActiveFind.replace(/\n/g, '\r\n');
if (html.includes(mobNavActiveFindCrLf)) {
  html = html.replace(mobNavActiveFindCrLf, mobNavActiveReplace.replace(/\n/g, '\r\n'));
  console.log('✅ Updated mobile nav active tab switcher (CRLF)');
} else if (html.includes(mobNavActiveFind)) {
  html = html.replace(mobNavActiveFind, mobNavActiveReplace);
  console.log('✅ Updated mobile nav active tab switcher (LF)');
}

// 6. Comprehensive Responsive CSS injection
const responsiveCss = `
    /* ══════════════════════════════════════════════════════════════════════
       📱 ULTRA-ROBUST PHONE & TABLET RESPONSIVE FLEXBOX & DRAWER ENGINE
       ══════════════════════════════════════════════════════════════════════ */
    
    /* Mobile Drawer Backdrop */
    .mobile-sidebar-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 9998;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .mobile-sidebar-backdrop.active {
      display: block;
      opacity: 1;
    }
    body.mobile-drawer-locked {
      overflow: hidden !important;
    }

    /* Mobile Hamburger Button */
    .dash-mobile-hamburger {
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 36px;
      height: 36px;
      background: var(--surface-elevated, #162032);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      padding: 6px;
      gap: 4px;
      color: var(--text);
      flex-shrink: 0;
    }
    .dash-mobile-hamburger .hamburger-bar {
      display: block;
      width: 18px;
      height: 2px;
      background: var(--text);
      border-radius: 2px;
      transition: all 0.2s ease;
    }
    .dash-mobile-hamburger.active .hamburger-bar:nth-child(1) {
      transform: translateY(6px) rotate(45deg);
    }
    .dash-mobile-hamburger.active .hamburger-bar:nth-child(2) {
      opacity: 0;
    }
    .dash-mobile-hamburger.active .hamburger-bar:nth-child(3) {
      transform: translateY(-6px) rotate(-45deg);
    }

    .mobile-sidebar-header {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.5rem 1rem 0.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 0.75rem;
    }
    .mobile-sidebar-close-btn {
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      color: var(--text);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      cursor: pointer;
    }

    /* Media query for screens <= 960px */
    @media (max-width: 960px) {
      /* Topbar Mobile Phone Layout */
      .dash-topbar {
        height: 58px !important;
        padding: 0 0.85rem !important;
        gap: 0.4rem !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 100 !important;
        width: 100% !important;
        max-width: 100vw !important;
        box-sizing: border-box !important;
        overflow-x: clip !important;
      }
      .dash-mobile-hamburger {
        display: flex !important;
      }
      .dash-topbar .nav-brand span {
        font-size: 1.1rem !important;
      }
      .dash-topbar .nav-brand img {
        width: 26px !important;
        height: 26px !important;
      }
      .dash-ws-btn {
        padding: 0.35rem 0.55rem !important;
        font-size: 0.75rem !important;
        gap: 0.3rem !important;
        max-width: 130px !important;
      }
      .dash-ws-btn #activeWsName {
        max-width: 65px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      .dash-ws-btn #activeWsBadge {
        display: none !important;
      }

      /* Compact right action buttons on mobile */
      #hhGuideMenuBtn { display: none !important; }
      .dash-topbar button[onclick="openSpotlightModal()"] { display: none !important; }
      .dash-topbar button[onclick="handleLogout()"] { display: none !important; }
      .dash-topbar .flex.items-center.gap-2[style*="border-left"] div:last-child { display: none !important; }
      .dash-topbar .flex.items-center.gap-2[style*="border-left"] {
        border-left: none !important;
        padding-left: 0 !important;
      }
      #topVoiceText, #topAddTxText {
        display: none !important;
      }
      .dash-topbar button[onclick="openVoiceModal()"] {
        padding: 0.4rem 0.55rem !important;
        font-size: 1rem !important;
      }
      .dash-topbar button[onclick="openAddTxModal()"] {
        padding: 0.4rem 0.65rem !important;
        font-size: 0.95rem !important;
        font-weight: 800 !important;
      }

      /* Off-Canvas Navigation Drawer for Mobile */
      .dash-sidebar {
        display: flex !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 285px !important;
        max-width: 85vw !important;
        height: 100vh !important;
        height: 100dvh !important;
        background: var(--surface, #0f172a) !important;
        box-shadow: 20px 0 50px rgba(0, 0, 0, 0.75) !important;
        z-index: 9999 !important;
        transform: translateX(-105%) !important;
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
        padding: 1rem 0.85rem !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
      }
      .dash-sidebar.mobile-open {
        transform: translateX(0) !important;
      }
      .mobile-sidebar-header {
        display: flex !important;
      }
      .dash-sidebar .dash-nav-item {
        padding: 0.75rem 0.9rem !important;
        font-size: 0.92rem !important;
        border-radius: 10px !important;
      }

      /* Layout & Main Container Fluidity */
      .dash-layout {
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
        min-width: 0 !important;
      }
      .dash-main {
        flex: 1 !important;
        width: 100% !important;
        max-width: 100vw !important;
        padding: 0.85rem !important;
        padding-bottom: 85px !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
        min-width: 0 !important;
      }

      /* Hero Banner on Mobile */
      .dash-hero-banner {
        flex-direction: column !important;
        align-items: flex-start !important;
        padding: 1.25rem 1rem !important;
        gap: 1rem !important;
        border-radius: 16px !important;
        margin-bottom: 1.25rem !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .dash-hero-banner > div:last-child {
        width: 100% !important;
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 0.5rem !important;
      }
      .dash-hero-banner > div:last-child button {
        flex: 1 1 calc(50% - 0.5rem) !important;
        justify-content: center !important;
      }

      /* Auto-Collapse ALL Multi-Column Grids on Mobile */
      [style*="display: grid"],
      .grid,
      .dashboard-grid,
      .analytics-grid,
      .charts-grid,
      .stat-grid {
        grid-template-columns: 1fr !important;
        gap: 0.85rem !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      /* Flex Wrap Universally on Phone */
      .flex, [class*="flex-"] {
        flex-wrap: wrap !important;
        max-width: 100% !important;
      }

      /* Universal Card Boundaries */
      .dash-card, .card, .glass-panel, [class*="Card"], [class*="-card"] {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        min-width: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }

      /* Data Tables Horizontal Scroll */
      table {
        width: 100% !important;
        min-width: 520px !important;
      }
      .table-container,
      .table-responsive,
      [style*="overflow-x"],
      section table {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        border-radius: 12px !important;
      }

      /* Mobile Bottom Navigation Bar */
      .dash-mobile-nav {
        display: flex !important;
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 62px !important;
        background: rgba(11, 17, 32, 0.96) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border-top: 1px solid var(--border) !important;
        z-index: 999 !important;
        justify-content: space-around !important;
        align-items: center !important;
        padding: 0 0.35rem !important;
        box-sizing: border-box !important;
      }
      .mobile-nav-btn {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 3px !important;
        background: transparent !important;
        border: none !important;
        color: var(--text-muted) !important;
        font-size: 0.72rem !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        padding: 6px 2px !important;
        border-radius: 8px !important;
        text-align: center !important;
      }
      .mobile-nav-btn span:first-child {
        font-size: 1.15rem !important;
      }
      .mobile-nav-btn.active {
        color: var(--secondary) !important;
      }
      .mobile-nav-btn.fab-center {
        position: relative !important;
        top: -12px !important;
        background: linear-gradient(135deg, #10b981, #059669) !important;
        width: 48px !important;
        height: 48px !important;
        max-width: 48px !important;
        border-radius: 50% !important;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.45) !important;
        color: #ffffff !important;
        border: 2px solid var(--surface) !important;
      }
      .mobile-nav-btn.fab-center .fab-icon {
        font-size: 1.6rem !important;
        font-weight: 900 !important;
        line-height: 1 !important;
        color: #ffffff !important;
      }

      /* Modal Sizing on Mobile */
      .modal-backdrop, .spotlight-backdrop {
        padding: 10px !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .modal-card, .modal-box, .spotlight-box, [class*="modal-content"], [id$="Modal"] > div > div {
        width: 95vw !important;
        max-width: 95vw !important;
        box-sizing: border-box !important;
        max-height: 90vh !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        padding: 1.25rem 1rem !important;
        border-radius: 18px !important;
      }

      /* Filter Bars & Action Rows on Mobile */
      .filter-bar, [class*="action-row"], [class*="actions-row"] {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 0.65rem !important;
      }
      .filter-bar input, .filter-bar select, .filter-bar button {
        width: 100% !important;
      }
    }
`;

// Insert the responsive CSS right before </style>
const styleEnd = html.indexOf('</style>');
if (styleEnd !== -1) {
  html = html.slice(0, styleEnd) + responsiveCss + '\n  ' + html.slice(styleEnd);
  console.log('✅ Injected comprehensive mobile responsive CSS');
} else {
  console.error('❌ Failed to find </style>');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('🎉 Successfully saved mobile responsive updates to index.html');
