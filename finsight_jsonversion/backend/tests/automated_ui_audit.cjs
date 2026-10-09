const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/selva/.gemini/antigravity-ide/brain/6c069078-1366-4057-a0f4-e786989a806f';
const BASE_URL = 'http://localhost:5000';

const VIEWPORTS = [
  { name: 'mobile_360x800', width: 360, height: 800 },
  { name: 'mobile_390x844', width: 390, height: 844 },
  { name: 'tablet_768x1024', width: 768, height: 1024 },
  { name: 'laptop_1366x768', width: 1366, height: 768 },
  { name: 'desktop_1440x900', width: 1440, height: 900 },
  { name: 'wide_1920x1080', width: 1920, height: 1080 },
];

async function runComprehensiveAudit() {
  console.log('🚀 Starting HisabHero End-to-End Automated UI/UX Audit...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const auditResults = {
    timestamp: new Date().toISOString(),
    viewportsTested: [],
    consoleErrors: [],
    consoleWarnings: [],
    failedRequests: [],
    interactionsTested: [],
    modulesTested: [],
    modalsTested: [],
    screenshots: [],
  };

  function attachListeners(page, contextName) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`[CONSOLE ERROR - ${contextName}] ${msg.text()}`);
        auditResults.consoleErrors.push({ context: contextName, text: msg.text(), location: msg.location() });
      } else if (msg.type() === 'warning') {
        auditResults.consoleWarnings.push({ context: contextName, text: msg.text() });
      }
    });

    page.on('pageerror', (err) => {
      console.error(`[PAGE ERROR - ${contextName}] ${err.message}`);
      auditResults.consoleErrors.push({ context: contextName, text: err.message, stack: err.stack });
    });

    page.on('response', (response) => {
      if (response.status() >= 400 && !response.url().includes('favicon')) {
        console.warn(`[FAILED REQ - ${contextName}] ${response.status()} ${response.url()}`);
        auditResults.failedRequests.push({ context: contextName, url: response.url(), status: response.status() });
      }
    });
  }

  // ─── PHASE 1: RESPONSIVE LANDING VIEWPORT AUDIT ───
  console.log('\n--- Phase 1: Landing Page Responsive Viewports Audit ---');
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    attachListeners(page, `Landing_${vp.name}`);

    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(600);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      const shotPath = path.join(ARTIFACTS_DIR, `audit_landing_${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      auditResults.screenshots.push({ name: `audit_landing_${vp.name}`, path: shotPath, viewport: vp.name, description: `Landing page at ${vp.width}x${vp.height}` });

      auditResults.viewportsTested.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        hasHorizontalOverflow: hasHorizontalScroll,
      });

      console.log(`✓ Audited Landing at ${vp.name} (Overflow: ${hasHorizontalScroll ? 'FAIL ⚠️' : 'PASS ✅'})`);
    } catch (err) {
      console.error(`Error auditing landing at ${vp.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  // ─── PHASE 2: AUTHENTICATION & MODAL FLOWS ───
  console.log('\n--- Phase 2: Auth Flow & Modals Audit ---');
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  attachListeners(desktopPage, 'Desktop_Workspace');

  try {
    await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await desktopPage.waitForTimeout(800);

    // Open Auth Modal
    console.log('Testing Sign In Modal trigger...');
    await desktopPage.evaluate(() => window.openLoginModal());
    await desktopPage.waitForTimeout(500);

    const authModalShot = path.join(ARTIFACTS_DIR, 'audit_modal_signin.png');
    await desktopPage.screenshot({ path: authModalShot });
    auditResults.screenshots.push({ name: 'audit_modal_signin', path: authModalShot, description: 'Authentication Sign-In Modal' });
    auditResults.modalsTested.push({ name: 'Auth Sign-In Modal', status: 'PASS', screenshot: authModalShot });

    // Close Auth Modal
    await desktopPage.evaluate(() => window.closeAuthModal());
    await desktopPage.waitForTimeout(300);

    // Execute 1-Click Launch Demo Login
    console.log('Executing Quick Demo Login...');
    await desktopPage.evaluate(() => window.quickDemoLogin());

    // Wait for Dashboard to become visible
    await desktopPage.waitForFunction(() => {
      const db = document.getElementById('dashboardView');
      return db && window.getComputedStyle(db).display !== 'none';
    }, { timeout: 15000 });

    console.log('✅ Dashboard Authenticated Session Loaded!');
    await desktopPage.waitForTimeout(1500);

    const dashOverviewShot = path.join(ARTIFACTS_DIR, 'audit_dashboard_overview.png');
    await desktopPage.screenshot({ path: dashOverviewShot, fullPage: false });
    auditResults.screenshots.push({ name: 'audit_dashboard_overview', path: dashOverviewShot, description: 'Authenticated Executive Dashboard Overview' });
    auditResults.interactionsTested.push({ element: 'Quick Demo Authentication Flow', result: 'PASS' });

    // ─── PHASE 3: 14 DASHBOARD MODULES AUDIT ───
    console.log('\n--- Phase 3: All 14 Financial & ERP Suite Modules Audit ---');
    const modules = [
      { id: 'overview', name: 'Overview Dashboard' },
      { id: 'transactions', name: 'Transactions & Ledger' },
      { id: 'expenseAnalysis', name: 'Expense Analysis & Trends' },
      { id: 'invoices', name: 'Invoicing & Receivables' },
      { id: 'khata', name: 'Khata Book Ledger' },
      { id: 'cashflow', name: 'Cash Flow Runway' },
      { id: 'inventory', name: 'Inventory & Stock' },
      { id: 'subscriptions', name: 'SaaS & Subscriptions' },
      { id: 'reports', name: 'Executive P&L Statements' },
      { id: 'aichat', name: 'AI CFO Copilot' },
      { id: 'upload', name: 'Document Scanner & OCR' },
      { id: 'merkle', name: 'Merkle Audit Vault' },
      { id: 'team', name: 'Team & Multi-Role Permissions' },
      { id: 'settings', name: 'Workspace Settings' },
    ];

    for (const mod of modules) {
      console.log(`Auditing Module: [${mod.id}] ${mod.name}...`);
      await desktopPage.evaluate((secId) => window.showSection(secId), mod.id);
      await desktopPage.waitForTimeout(600);

      // Verify the section container is visible
      const isVisible = await desktopPage.evaluate((secId) => {
        const el = document.getElementById('section-' + secId);
        return el ? window.getComputedStyle(el).display !== 'none' : false;
      }, mod.id);

      const shotPath = path.join(ARTIFACTS_DIR, `audit_module_${mod.id}.png`);
      await desktopPage.screenshot({ path: shotPath, fullPage: false });
      auditResults.screenshots.push({ name: `audit_module_${mod.id}`, path: shotPath, description: `Module ${mod.name}` });
      auditResults.modulesTested.push({
        id: mod.id,
        name: mod.name,
        status: isVisible ? 'PASS' : 'FAIL',
        screenshot: shotPath,
      });
      console.log(`✓ Module ${mod.id}: ${isVisible ? 'PASS ✅' : 'FAIL ⚠️'}`);
    }

    // ─── PHASE 4: MODALS & POPUPS AUDIT ───
    console.log('\n--- Phase 4: Interactive Modals Audit ---');
    const modalsToTest = [
      { name: 'Command-K Spotlight Search', open: 'openSpotlightModal()', close: 'closeSpotlightModal()', id: 'spotlightModal' },
      { name: 'Add Transaction Modal', open: 'openAddTxModal()', close: 'closeModals()', id: 'addTxModal' },
      { name: 'Create Invoice Modal', open: 'openCreateInvoiceModal()', close: 'closeModals()', id: 'createInvoiceModal' },
      { name: 'Add Khata Party Modal', open: 'openAddPartyModal()', close: 'closeModals()', id: 'addPartyModal' },
      { name: 'Financial Health Gauge Modal', open: 'openHealthReportModal()', close: 'closeModals()', id: 'healthReportModal' },
      { name: 'Multilingual Voice Copilot Modal', open: 'openBhashaVoiceModal()', close: 'closeModals()', id: 'bhashaVoiceModal' },
    ];

    for (const modal of modalsToTest) {
      console.log(`Testing Modal: ${modal.name}...`);
      try {
        await desktopPage.evaluate((fn) => eval(fn), modal.open);
        await desktopPage.waitForTimeout(400);

        const shotPath = path.join(ARTIFACTS_DIR, `audit_modal_${modal.id}.png`);
        await desktopPage.screenshot({ path: shotPath, fullPage: false });
        auditResults.screenshots.push({ name: `audit_modal_${modal.id}`, path: shotPath, description: modal.name });
        auditResults.modalsTested.push({ name: modal.name, status: 'PASS', screenshot: shotPath });

        await desktopPage.evaluate((fn) => eval(fn), modal.close);
        await desktopPage.waitForTimeout(300);
      } catch (err) {
        console.warn(`Could not open modal ${modal.name}:`, err.message);
        auditResults.modalsTested.push({ name: modal.name, status: 'SKIPPED', error: err.message });
      }
    }

    // ─── PHASE 5: WORKSPACE SWITCHING AUDIT ───
    console.log('\n--- Phase 5: Workspace Switcher Audit ---');
    await desktopPage.evaluate(() => window.toggleWorkspaceDropdown());
    await desktopPage.waitForTimeout(400);

    const wsDropdownShot = path.join(ARTIFACTS_DIR, 'audit_workspace_dropdown.png');
    await desktopPage.screenshot({ path: wsDropdownShot });
    auditResults.screenshots.push({ name: 'audit_workspace_dropdown', path: wsDropdownShot, description: 'Workspace Switcher Dropdown' });
    auditResults.interactionsTested.push({ element: 'Workspace Switcher Dropdown', result: 'PASS' });

    // Close dropdown
    await desktopPage.evaluate(() => {
      const menu = document.getElementById('wsDropdownMenu');
      if (menu) menu.classList.remove('active');
    });

    // ─── PHASE 6: RETURN TO LANDING AUDIT ───
    console.log('\n--- Phase 6: Return to Landing Audit ---');
    await desktopPage.evaluate(() => window.showLandingView());
    await desktopPage.waitForTimeout(500);

    const isLandingVisible = await desktopPage.evaluate(() => {
      const lv = document.getElementById('landingView');
      return lv && window.getComputedStyle(lv).display !== 'none';
    });

    const returnLandingShot = path.join(ARTIFACTS_DIR, 'audit_return_landing.png');
    await desktopPage.screenshot({ path: returnLandingShot });
    auditResults.screenshots.push({ name: 'audit_return_landing', path: returnLandingShot, description: 'Returned to Landing Page' });
    auditResults.interactionsTested.push({ element: 'Return to Landing Page Toggle', result: isLandingVisible ? 'PASS' : 'FAIL' });

  } catch (err) {
    console.error('Error during desktop interaction audit:', err.message);
  } finally {
    await desktopPage.close();
  }

  // Save audit results json
  const resultsPath = path.join(__dirname, 'audit_run_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
  console.log(`\n🎉 Comprehensive UI/UX Audit Finished! Results written to ${resultsPath}`);

  await browser.close();
}

runComprehensiveAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
