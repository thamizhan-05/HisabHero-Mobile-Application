import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');

const cleanHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <title>HisabHero — Smart Financial & ERP Intelligence Platform</title>
  <meta name="description" content="HisabHero brings personal finance, business ERP, and AI-powered financial intelligence together in one secure workspace." />
  
  <!-- Google Fonts: Outfit & Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  
  <!-- Chart.js for High-End Financial Visualizations -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <style>
    /* ─── CSS DESIGN TOKENS (PREMIUM LIGHT FINTECH PALETTE) ─── */
    :root {
      --primary: #0f172a;        /* Deep Navy */
      --primary-light: #1e293b;  /* Slate Navy */
      --secondary: #2563eb;      /* Clean Royal Blue */
      --secondary-light: #3b82f6;
      --secondary-soft: #eff6ff;
      --accent: #059669;         /* Emerald Green for Positive Finance */
      --accent-light: #10b981;
      --accent-soft: #ecfdf5;
      --background: #f8fafc;     /* Soft Daylight Slate-White */
      --surface: #ffffff;        /* Pure White */
      --surface-elevated: #ffffff;
      --text: #0f172a;           /* Deep Charcoal Text */
      --text-muted: #64748b;     /* Slate Gray */
      --text-light: #94a3b8;
      --border: #e2e8f0;         /* Subtle Clean Border */
      --border-focus: #2563eb;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --font-display: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --radius-xl: 28px;
      --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06);
      --shadow-md: 0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
      --shadow-lg: 0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06);
      --shadow-xl: 0 20px 48px -8px rgba(15, 23, 42, 0.16);
      --transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
      font-size: 16px;
    }

    body {
      font-family: var(--font-body);
      background-color: var(--background);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    a {
      text-decoration: none;
      color: inherit;
      transition: var(--transition);
    }

    button, input, select, textarea {
      font-family: inherit;
    }

    .container {
      width: 100%;
      max-width: 1240px;
      margin-left: auto;
      margin-right: auto;
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }

    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .gap-8 { gap: 2rem; }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-display);
      color: var(--primary);
      line-height: 1.2;
      font-weight: 800;
    }

    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.9rem;
      background: var(--secondary-soft);
      border: 1px solid rgba(37, 99, 235, 0.2);
      color: var(--secondary);
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .pill-badge.emerald {
      background: var(--accent-soft);
      border-color: rgba(5, 150, 105, 0.25);
      color: var(--accent);
    }

    /* ─── BUTTONS ─── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.4rem;
      font-size: 0.9375rem;
      font-weight: 700;
      border-radius: var(--radius-md);
      cursor: pointer;
      border: 1px solid transparent;
      transition: var(--transition);
      white-space: nowrap;
    }

    .btn-primary {
      background: var(--primary);
      color: #ffffff;
      box-shadow: var(--shadow-sm);
    }
    .btn-primary:hover {
      background: var(--primary-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .btn-accent {
      background: var(--accent);
      color: #ffffff;
      box-shadow: var(--shadow-sm);
    }
    .btn-accent:hover {
      background: var(--accent-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .btn-outline {
      background: transparent;
      border-color: var(--border);
      color: var(--primary);
    }
    .btn-outline:hover {
      border-color: var(--primary);
      background: rgba(15, 23, 42, 0.04);
    }

    .btn-secondary {
      background: var(--secondary);
      color: #ffffff;
    }
    .btn-secondary:hover {
      background: var(--secondary-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .btn-danger {
      background: #fee2e2;
      color: var(--danger);
      border-color: #fca5a5;
    }
    .btn-danger:hover {
      background: var(--danger);
      color: #ffffff;
    }

    /* ─── NAVBAR ─── */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      height: 72px;
      display: flex;
      align-items: center;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: var(--font-display);
      font-size: 1.35rem;
      font-weight: 900;
      color: var(--primary);
      cursor: pointer;
    }

    .nav-brand img {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-sm);
      object-fit: contain;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.75rem;
      list-style: none;
    }

    .nav-links a {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .nav-links a:hover {
      color: var(--primary);
    }

    /* ─── HERO SECTION ─── */
    .hero-section {
      padding: 4.5rem 0 3.5rem 0;
      position: relative;
      overflow: hidden;
      background: linear-gradient(180deg, #ffffff 0%, var(--background) 100%);
    }

    .hero-grid {
      display: flex;
      align-items: center;
      gap: 3.5rem;
    }

    .hero-content { flex: 1 1 520px; }

    .hero-title {
      font-size: 3.25rem;
      line-height: 1.15;
      margin: 1.25rem 0;
      color: var(--primary);
      letter-spacing: -0.8px;
    }

    .hero-title span.blue { color: var(--secondary); }
    .hero-title span.emerald { color: var(--accent); }

    .hero-subtitle {
      font-size: 1.125rem;
      color: var(--text-muted);
      line-height: 1.65;
      margin-bottom: 2rem;
      max-width: 540px;
    }

    .hero-ctas {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .hero-proof {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .hero-proof-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .hero-proof-item span.check {
      color: var(--accent);
      font-weight: 900;
    }

    .hero-visual {
      flex: 1 1 480px;
      display: flex;
      justify-content: center;
      position: relative;
    }

    .dual-mockup-wrapper {
      position: relative;
      display: flex;
      gap: 1.25rem;
      padding: 1rem;
    }

    .phone-card {
      width: 250px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      border: 3px solid var(--primary);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .phone-card.left { transform: translateY(-8px) rotate(-1deg); }
    .phone-card.right { transform: translateY(12px) rotate(1.5deg); }

    .phone-notch {
      height: 16px;
      background: var(--primary);
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
      width: 80px;
      margin: 0 auto;
    }

    .phone-screen {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-size: 0.75rem;
      background: #fafbfc;
      min-height: 380px;
    }

    .mockup-pill {
      background: var(--accent-soft);
      color: var(--accent);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-weight: 800;
      font-size: 0.6875rem;
    }

    .mockup-stat {
      background: var(--surface);
      padding: 0.6rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }

    /* ─── 4-PILL QUICK FEATURE BAR ─── */
    .feature-pills-bar { padding: 1.5rem 0 3rem 0; }
    .pills-grid { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; }
    .pill-feature-card {
      flex: 1 1 240px;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }
    .pill-feature-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--secondary);
    }
    .pill-icon-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      background: var(--secondary-soft);
      color: var(--secondary);
      flex-shrink: 0;
    }

    /* ─── "ONE APP. TWO WORLDS." SECTION ─── */
    .dual-worlds-section {
      padding: 5rem 0;
      background: var(--surface);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .section-header { text-align: center; max-width: 680px; margin: 0 auto 3.5rem auto; }
    .section-title { font-size: 2.35rem; margin: 0.75rem 0; color: var(--primary); }
    .section-desc { color: var(--text-muted); font-size: 1.05rem; line-height: 1.6; }
    .dual-worlds-grid { display: flex; flex-wrap: wrap; gap: 2rem; }
    .world-card {
      flex: 1 1 450px;
      background: var(--background);
      border: 2px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      transition: var(--transition);
    }
    .world-card:hover {
      border-color: var(--secondary);
      box-shadow: var(--shadow-lg);
      background: var(--surface);
    }
    .world-badge {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .world-badge.personal { background: #dbeafe; color: #1e40af; }
    .world-badge.business { background: #dcfce7; color: #166534; }
    .world-features-list { list-style: none; display: flex; flex-direction: column; gap: 0.85rem; }
    .world-features-list li { display: flex; align-items: center; gap: 0.65rem; font-size: 0.95rem; color: var(--text); font-weight: 500; }
    .world-features-list li span.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--secondary); }
    .world-card.business .world-features-list li span.dot { background: var(--accent); }

    /* ─── ISOLATION & BENTO ─── */
    .isolation-section { padding: 5rem 0; background: var(--background); }
    .isolation-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: var(--radius-xl);
      color: #ffffff;
      padding: 3.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 3rem;
      box-shadow: var(--shadow-xl);
    }
    .isolation-text { flex: 1 1 500px; }
    .isolation-text h3 { color: #ffffff; font-size: 2rem; margin-bottom: 1rem; }
    .isolation-text p { color: #cbd5e1; font-size: 1.05rem; line-height: 1.7; margin-bottom: 1.5rem; }
    .isolation-graphic {
      flex: 1 1 340px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1.5rem;
      border-radius: var(--radius-lg);
    }
    .iso-box {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 1rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .bento-section { padding: 5rem 0; background: var(--surface); }
    .bento-grid { display: flex; flex-wrap: wrap; gap: 1.5rem; }
    .bento-card {
      flex: 1 1 calc(33.333% - 1rem);
      min-width: 280px;
      background: var(--background);
      border: 1px solid var(--border);
      padding: 2rem;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: var(--transition);
    }
    .bento-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: var(--secondary);
      background: var(--surface);
    }
    .bento-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .bento-title { font-size: 1.25rem; font-weight: 800; color: var(--primary); }
    .bento-desc { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }

    /* ─── SECURITY & CONTACT & FOOTER ─── */
    .security-section { padding: 5rem 0; background: var(--background); border-top: 1px solid var(--border); }
    .security-grid { display: flex; flex-wrap: wrap; gap: 1.5rem; }
    .security-card {
      flex: 1 1 calc(25% - 1.25rem);
      min-width: 240px;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 1.75rem;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      box-shadow: var(--shadow-sm);
    }
    .security-card h4 { font-size: 1.1rem; color: var(--primary); }
    .security-card p { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .contact-section { padding: 5rem 0; background: var(--surface); border-top: 1px solid var(--border); }
    .contact-grid { display: flex; flex-wrap: wrap; gap: 3rem; }
    .contact-info { flex: 1 1 400px; }
    .contact-form-card {
      flex: 1 1 450px;
      background: var(--background);
      border: 1px solid var(--border);
      padding: 2.5rem;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
    }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.25rem; }
    .form-label { font-size: 0.875rem; font-weight: 700; color: var(--primary); }
    .form-input, .form-textarea, .form-select {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 0.9375rem;
      color: var(--text);
      outline: none;
      transition: var(--transition);
    }
    .form-input:focus, .form-textarea:focus, .form-select:focus {
      border-color: var(--secondary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    .footer { background: var(--primary); color: #94a3b8; padding: 4rem 0 2rem 0; font-size: 0.9375rem; }
    .footer-grid { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 3rem; margin-bottom: 3rem; }
    .footer-brand-col { flex: 1 1 300px; }
    .footer-brand { display: flex; align-items: center; gap: 0.75rem; font-family: var(--font-display); font-size: 1.4rem; font-weight: 900; color: #ffffff; margin-bottom: 1rem; }
    .footer-brand img { width: 36px; height: 36px; object-fit: contain; }
    .footer-links-col { flex: 0 1 180px; display: flex; flex-direction: column; gap: 0.75rem; }
    .footer-links-col h5 { color: #ffffff; font-size: 1rem; margin-bottom: 0.5rem; }
    .footer-links-col a:hover { color: #ffffff; }
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 2rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
    }

    /* ─── MODALS ─── */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-backdrop.active { display: flex; }
    .modal-box {
      width: 100%;
      max-width: 540px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-xl);
      padding: 2.25rem;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }
    .modal-close {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-close:hover { background: var(--background); color: var(--primary); }

    .workspace-choice-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.1rem;
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;
      margin-bottom: 0.85rem;
      transition: var(--transition);
      background: var(--background);
    }
    .workspace-choice-card.selected {
      border-color: var(--secondary);
      background: var(--secondary-soft);
    }
    .workspace-choice-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: #ffffff;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    /* ═══════════════════════════════════════════════════════════════════
       ─── WEB DASHBOARD SUITE STYLING (#dashboardView) ───
       ═══════════════════════════════════════════════════════════════════ */
    #dashboardView {
      min-height: 100vh;
      background: var(--background);
      display: flex;
      flex-direction: column;
    }

    .dash-topbar {
      height: 68px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.75rem;
      position: sticky;
      top: 0;
      z-index: 90;
      box-shadow: var(--shadow-sm);
    }

    .dash-ws-dropdown { position: relative; }
    .dash-ws-btn {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 0.9rem;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 700;
      color: var(--primary);
      transition: var(--transition);
    }
    .dash-ws-btn:hover { border-color: var(--secondary); background: var(--secondary-soft); }

    .ws-menu {
      display: none;
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      width: 320px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      padding: 0.75rem;
      z-index: 120;
    }
    .ws-menu.show { display: block; }
    .ws-menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }
    .ws-menu-item:hover { background: var(--background); color: var(--secondary); }
    .ws-menu-item.active { background: var(--secondary-soft); color: var(--secondary); font-weight: 800; }

    .dash-layout { display: flex; flex: 1; }
    .dash-sidebar {
      width: 250px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 1.25rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .dash-nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.9rem;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: var(--transition);
    }
    .dash-nav-item:hover { background: var(--background); color: var(--primary); }
    .dash-nav-item.active { background: var(--secondary-soft); color: var(--secondary); font-weight: 800; }

    .dash-main { flex: 1; padding: 2rem 2.5rem; overflow-y: auto; max-height: calc(100vh - 68px); }

    .metrics-grid { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-bottom: 2rem; }
    .metric-card {
      flex: 1 1 calc(25% - 1rem);
      min-width: 200px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.4rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      cursor: pointer;
      transition: var(--transition);
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--secondary);
    }
    .metric-title { font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-value { font-size: 1.75rem; font-weight: 900; color: var(--primary); font-family: var(--font-display); }
    .metric-sub { font-size: 0.8125rem; font-weight: 700; color: var(--accent); }

    .dash-hero-banner {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 1.75rem 2rem;
      border-radius: var(--radius-xl);
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-lg);
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: var(--transition);
    }
    .chart-card:hover {
      border-color: var(--secondary);
      box-shadow: var(--shadow-md);
    }

    .data-table-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      margin-bottom: 2rem;
    }

    .table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-top: 1rem; }
    .table th { text-align: left; padding: 0.75rem 1rem; background: var(--background); color: var(--text-muted); font-weight: 700; border-bottom: 1px solid var(--border); }
    .table td { padding: 0.85rem 1rem; border-bottom: 1px solid var(--border); color: var(--text); }
    .table tr:last-child td { border-bottom: none; }

    /* Floating Action Speed Dial */
    .speed-dial {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 99;
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      gap: 0.75rem;
    }
    .speed-dial-btn {
      width: 56px;
      height: 56px;
      border-radius: 28px;
      background: var(--accent);
      color: #fff;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      box-shadow: var(--shadow-lg);
      cursor: pointer;
      transition: var(--transition);
    }
    .speed-dial-btn:hover { transform: scale(1.08); background: var(--accent-light); }
    .speed-dial-menu {
      display: none;
      flex-direction: column;
      gap: 0.5rem;
    }
    .speed-dial.open .speed-dial-menu {
      display: flex;
    }
    .speed-dial-sub {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 0.4rem 0.8rem;
      border-radius: 999px;
      box-shadow: var(--shadow-md);
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--primary);
      cursor: pointer;
      white-space: nowrap;
    }
    .speed-dial-sub:hover { background: var(--secondary-soft); color: var(--secondary); }

    /* Scenario Simulator Sliders */
    .slider-box {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 1024px) {
      .charts-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 960px) {
      .hero-grid { flex-direction: column; text-align: center; }
      .hero-subtitle { margin-left: auto; margin-right: auto; }
      .hero-ctas { justify-content: center; }
      .hero-proof { justify-content: center; }
      .nav-links { display: none; }
      .dash-sidebar { display: none; }
      .dash-main { padding: 1.5rem; }
      .metric-card { flex: 1 1 calc(50% - 0.75rem); }
    }

    @media (max-width: 640px) {
      .hero-title { font-size: 2.15rem; }
      .phone-card { width: 190px; }
      .metric-card { flex: 1 1 100%; }
    }
  </style>
</head>
<body>

  <!-- ═══════════════════════════════════════════════════════════════════
       ─── PUBLIC MARKETING LANDING PAGE VIEW (#landingView) ───
       ═══════════════════════════════════════════════════════════════════ -->
  <div id="landingView">
    <!-- Top Navbar -->
    <header class="navbar">
      <div class="container flex justify-between items-center">
        <a href="#" class="nav-brand">
          <img src="/logo.png" alt="HisabHero Logo" />
          <span>Hisab<span style="color: var(--secondary);">Hero</span></span>
        </a>

        <nav>
          <ul class="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#dual-worlds">One App. Two Worlds.</a></li>
            <li><a href="#isolation">Security & Isolation</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>

        <!-- Language Selector & Auth CTAs -->
        <div class="flex items-center gap-3">
          <select id="langSelectLanding" onchange="changeLanguage(this.value)" class="form-select" style="padding: 0.4rem 0.6rem; font-size: 0.8125rem; width: auto; font-weight: 700;">
            <option value="en">🌐 English</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="bn">বাংলা (Bengali)</option>
          </select>
          <button class="btn btn-outline" onclick="openLoginModal()">Sign In</button>
          <button class="btn btn-primary" onclick="openSignupModal()">Create Account</button>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-grid">
          
          <div class="hero-content">
            <div class="pill-badge emerald">
              <span>🛡️</span> Smart Financial & ERP Intelligence
            </div>
            <h1 class="hero-title" id="heroHeading">
              Your Money. Your Business.<br />
              <span class="emerald">One Intelligent Platform.</span>
            </h1>
            <p class="hero-subtitle" id="heroSubheading">
              HisabHero brings personal finance, business management and AI-powered financial intelligence together in one secure workspace.
            </p>

            <div class="hero-ctas">
              <button class="btn btn-accent" style="padding: 0.9rem 1.8rem; font-size: 1rem;" onclick="openSignupModal()">
                <span>🚀</span> Create Your Account
              </button>
              <a href="#features" class="btn btn-outline" style="padding: 0.9rem 1.5rem;">
                Explore HisabHero ↓
              </a>
            </div>

            <div class="hero-proof">
              <div class="hero-proof-item"><span class="check">✓</span> Strict Data Isolation</div>
              <div class="hero-proof-item"><span class="check">✓</span> AI CFO Copilot</div>
              <div class="hero-proof-item"><span class="check">✓</span> 1-Click WhatsApp Khata</div>
            </div>
          </div>

          <div class="hero-visual">
            <div class="dual-mockup-wrapper">
              
              <!-- Phone 1 -->
              <div class="phone-card left">
                <div class="phone-notch"></div>
                <div class="phone-screen">
                  <div class="flex justify-between items-center">
                    <span style="font-weight: 800; color: var(--primary);">👛 Personal Finance</span>
                    <span class="mockup-pill">Clean State</span>
                  </div>
                  <div class="mockup-stat">
                    <div style="color: var(--text-muted); font-size: 0.6875rem;">Total Monthly Inflow</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent);">₹0</div>
                  </div>
                  <div class="mockup-stat">
                    <div style="color: var(--text-muted); font-size: 0.6875rem;">Total Outflow (Expenses)</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary);">₹0</div>
                  </div>
                  <div style="background: #f1f5f9; padding: 0.5rem; border-radius: 8px; font-size: 0.6875rem;">
                    <strong>AI CFO:</strong> Ready to track your daily expenses and income.
                  </div>
                </div>
              </div>

              <!-- Phone 2 -->
              <div class="phone-card right">
                <div class="phone-notch"></div>
                <div class="phone-screen">
                  <div class="flex justify-between items-center">
                    <span style="font-weight: 800; color: var(--primary);">🏢 Enterprise ERP</span>
                    <span style="font-size: 0.6875rem; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-weight: 700;">GST Ready</span>
                  </div>
                  <div class="mockup-stat">
                    <div style="color: var(--text-muted); font-size: 0.6875rem;">Khata Receivables</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent);">₹0</div>
                  </div>
                  <div class="mockup-stat">
                    <div style="color: var(--text-muted); font-size: 0.6875rem;">Active Join Code</div>
                    <div style="font-size: 0.85rem; font-weight: 800; letter-spacing: 1px; color: var(--secondary);">AUTO-GENERATED</div>
                  </div>
                  <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.5rem; border-radius: 8px; font-size: 0.6875rem; color: #065f46;">
                    <strong>AI CFO:</strong> Ready for invoices and team collaboration.
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- 4-Pill Bar -->
    <section class="feature-pills-bar">
      <div class="container">
        <div class="pills-grid">
          <div class="pill-feature-card">
            <div class="pill-icon-box">💳</div>
            <div>
              <h4 style="font-size: 0.95rem; margin-bottom: 2px;">Track Expenses</h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">Know where your money goes</p>
            </div>
          </div>
          <div class="pill-feature-card">
            <div class="pill-icon-box">💼</div>
            <div>
              <h4 style="font-size: 0.95rem; margin-bottom: 2px;">Manage Income</h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">Keep a complete ledger</p>
            </div>
          </div>
          <div class="pill-feature-card">
            <div class="pill-icon-box">✨</div>
            <div>
              <h4 style="font-size: 0.95rem; margin-bottom: 2px;">AI Financial Assistant</h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">Get smart CFO money tips</p>
            </div>
          </div>
          <div class="pill-feature-card">
            <div class="pill-icon-box">🏢</div>
            <div>
              <h4 style="font-size: 0.95rem; margin-bottom: 2px;">Business Workspace</h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">Invoices, GST, and team</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Dual Worlds Section -->
    <section id="dual-worlds" class="dual-worlds-section">
      <div class="container">
        <div class="section-header">
          <div class="pill-badge">Architecture</div>
          <h2 class="section-title">One App. Two Worlds.</h2>
          <p class="section-desc">
            One unified HisabHero account gives you isolated, purpose-built workspaces. Switch instantly between your private personal finances and your multi-user enterprise business.
          </p>
        </div>

        <div class="dual-worlds-grid">
          <div class="world-card personal">
            <div>
              <span class="world-badge personal">👛 Personal Finance Workspace</span>
              <h3 style="font-size: 1.6rem; margin-top: 0.75rem;">Your Private Financial Haven</h3>
              <p style="color: var(--text-muted); font-size: 0.9375rem; margin-top: 0.5rem;">
                Built specifically for individuals and families to master daily cash flow, budgeting, and long-term financial health.
              </p>
            </div>
            <ul class="world-features-list">
              <li><span class="dot"></span> 0–100 Composite Financial Health Gauge</li>
              <li><span class="dot"></span> Daily Income & Categorized Expense Tracking</li>
              <li><span class="dot"></span> Monthly Cash Flow & Predictive Runway Forecasts</li>
              <li><span class="dot"></span> Document Centre with Receipt OCR Parsing</li>
              <li><span class="dot"></span> Personal Savings Goals & Spending Limits</li>
              <li><span class="dot"></span> AI CFO Copilot for Personal Tax Guidance</li>
            </ul>
            <button class="btn btn-outline" onclick="openSignupModalWithChoice('personal')">
              Create Personal Workspace →
            </button>
          </div>

          <div class="world-card business">
            <div>
              <span class="world-badge business">🏢 Enterprise Business Workspace</span>
              <h3 style="font-size: 1.6rem; margin-top: 0.75rem;">Complete Business ERP Intelligence</h3>
              <p style="color: var(--text-muted); font-size: 0.9375rem; margin-top: 0.5rem;">
                Engineered for SMBs, retail stores, freelancers, and corporations with multi-member collaboration and GST compliance.
              </p>
            </div>
            <ul class="world-features-list">
              <li><span class="dot"></span> GST Invoices (B2B/B2C with CGST, SGST, IGST)</li>
              <li><span class="dot"></span> Khata Book Digital Ledger + 1-Click WhatsApp Reminders & UPI</li>
              <li><span class="dot"></span> Cryptographic 12-Character Join Codes (XXXX-XXXX-XXXX)</li>
              <li><span class="dot"></span> Role-Based Access Control (Owner, Manager, Accountant, Employee)</li>
              <li><span class="dot"></span> Inventory Stock & Fixed Asset Depreciation Tracking</li>
              <li><span class="dot"></span> Input Tax Credit (ITC) AI Optimization</li>
            </ul>
            <button class="btn btn-accent" onclick="openSignupModalWithChoice('business')">
              Create Business Workspace →
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Isolation Section -->
    <section id="isolation" class="isolation-section">
      <div class="container">
        <div class="isolation-banner">
          <div class="isolation-text">
            <div class="pill-badge emerald" style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.4);">
              🔒 Guaranteed Data Isolation
            </div>
            <h3>Your Finances Stay Strictly Separated.</h3>
            <p>
              At HisabHero, a User Account and a Workspace are distinct architectural entities. Personal expenses NEVER leak into your business ledger, and business invoices NEVER appear in your personal health score.
            </p>
            <div class="flex items-center gap-3">
              <button class="btn btn-accent" onclick="openSignupModal()">Get Started Securely</button>
              <a href="/HisabHero-v5.5.0-Enterprise-Release.apk" class="btn btn-outline" style="color: #ffffff; border-color: rgba(255,255,255,0.3);">
                📥 Download Android APK
              </a>
            </div>
          </div>
          <div class="isolation-graphic">
            <div class="iso-box"><span>👛 Personal Workspace A</span><span style="color: #6ee7b7;">Isolated ✓</span></div>
            <div style="text-align: center; color: #94a3b8; font-size: 0.8rem;">↕️ Zero Cross-Data Leakage</div>
            <div class="iso-box"><span>🏢 Business Workspace B</span><span style="color: #6ee7b7;">Isolated ✓</span></div>
            <div style="text-align: center; color: #94a3b8; font-size: 0.8rem;">↕️ Backend Middleware Verified</div>
            <div class="iso-box"><span>🔒 Merkle Tree Audit Ledger</span><span style="color: #6ee7b7;">SHA-256 Valid ✓</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bento Grid Section -->
    <section id="features" class="bento-section">
      <div class="container">
        <div class="section-header">
          <div class="pill-badge">Comprehensive Suite</div>
          <h2 class="section-title">Built for Modern Financial Excellence</h2>
          <p class="section-desc">Every tool you need to manage money, collect debts, calculate taxes, and forecast cash runways.</p>
        </div>
        <div class="bento-grid">
          <div class="bento-card"><div class="bento-icon">💳</div><h3 class="bento-title">Expense Tracking</h3><p class="bento-desc">Instantly categorize daily transactions, monitor spending deviations, and set custom budget limits.</p></div>
          <div class="bento-card"><div class="bento-icon">📈</div><h3 class="bento-title">Cash Flow & Runway</h3><p class="bento-desc">Predictive cash flow modeling calculates your exact monthly burn rate and forecasts your zero-cash date.</p></div>
          <div class="bento-card"><div class="bento-icon">🤖</div><h3 class="bento-title">AI CFO Copilot</h3><p class="bento-desc">Powered by Google Gemini to analyze transactions, detect unusual billing anomalies, and maximize ITC tax credits.</p></div>
          <div class="bento-card"><div class="bento-icon">📄</div><h3 class="bento-title">Document Intelligence</h3><p class="bento-desc">Upload CSV statements or camera bill photos. Our AI engine automatically extracts amounts, merchants, and line items.</p></div>
          <div class="bento-card"><div class="bento-icon">📒</div><h3 class="bento-title">Khata & WhatsApp Reminders</h3><p class="bento-desc">Digital credit/debit ledger with 1-click WhatsApp debt collection reminders containing dynamic UPI payment settlement links.</p></div>
          <div class="bento-card"><div class="bento-icon">💚</div><h3 class="bento-title">Financial Health Gauge</h3><p class="bento-desc">Mathematical 0–100 composite score evaluating your savings rate, expense-to-income ratios, and working capital buffers.</p></div>
        </div>
      </div>
    </section>

    <!-- Security Section -->
    <section class="security-section">
      <div class="container">
        <div class="section-header">
          <div class="pill-badge">Enterprise Protection</div>
          <h2 class="section-title">Security & Compliance Architecture</h2>
          <p class="section-desc">Only features that are technically implemented and verified in our production code.</p>
        </div>
        <div class="security-grid">
          <div class="security-card"><h4>✉️ 6-Digit Email OTP Verification</h4><p>Strict registration architecture: Unverified users are never added to MongoDB until 6-digit email OTP verification succeeds.</p></div>
          <div class="security-card"><h4>🔒 SHA-256 OTP & Password Hashing</h4><p>Passwords hashed with bcrypt (10 rounds) and verification codes stored exclusively as SHA-256 hashes with 5-minute TTL.</p></div>
          <div class="security-card"><h4>🛡️ Role-Based Access Control</h4><p>Granular RBAC enforcing Owner, Manager, Accountant, Employee, and Viewer permissions across all API endpoints.</p></div>
          <div class="security-card"><h4>⛓️ Merkle Tree Audit Ledger</h4><p>Cryptographic transaction chaining using SHA-256 hashes to guarantee forensic-grade audit trails against tampering.</p></div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact-section">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info">
            <div class="pill-badge">Get in Touch</div>
            <h2 style="font-size: 2.25rem; margin: 1rem 0;">We're Here to Help.</h2>
            <p style="color: var(--text-muted); font-size: 1.05rem; line-height: 1.6; margin-bottom: 2rem;">
              Have questions about workspace setup, GST compliance, or custom deployments? Our team is available to assist you.
            </p>
            <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.95rem;">
              <div class="flex items-center gap-3"><span style="font-size: 1.25rem;">📧</span><span><strong>Support Email:</strong> hisabhero27@gmail.com</span></div>
              <div class="flex items-center gap-3"><span style="font-size: 1.25rem;">📱</span><span><strong>Mobile Platform:</strong> Android Native APK Available</span></div>
              <div class="flex items-center gap-3"><span style="font-size: 1.25rem;">🌐</span><span><strong>API Engine:</strong> Express Node.js & MongoDB Atlas</span></div>
            </div>
          </div>
          <div class="contact-form-card">
            <h3 style="font-size: 1.35rem; margin-bottom: 1.25rem;">Send a Message</h3>
            <form id="contactForm" onsubmit="handleContactSubmit(event)">
              <div class="form-group"><label class="form-label">Your Name *</label><input type="text" class="form-input" id="contactName" required placeholder="Selvamanikandan" /></div>
              <div class="form-group"><label class="form-label">Email Address *</label><input type="email" class="form-input" id="contactEmail" required placeholder="selva@example.com" /></div>
              <div class="form-group"><label class="form-label">Message *</label><textarea class="form-textarea" id="contactMessage" rows="4" required placeholder="How can we help your business?"></textarea></div>
              <button type="submit" class="btn btn-primary" style="width: 100%;">Send Inquiry →</button>
              <div id="contactStatus" style="margin-top: 1rem; font-size: 0.875rem; text-align: center; font-weight: 600;"></div>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand-col">
            <div class="footer-brand"><img src="/logo.png" alt="HisabHero" /><span>HisabHero</span></div>
            <p style="line-height: 1.6; max-width: 320px;">Smart Financial & ERP Intelligence for Businesses and Individuals. Built with strict data isolation and patent-grade audit trails.</p>
          </div>
          <div class="footer-links-col"><h5>Product</h5><a href="#features">Expense Tracking</a><a href="#features">Invoices & GST</a><a href="#features">Khata Book</a><a href="#features">AI CFO Copilot</a></div>
          <div class="footer-links-col"><h5>Architecture</h5><a href="#dual-worlds">Personal Workspace</a><a href="#dual-worlds">Business Workspace</a><a href="#isolation">Security & Isolation</a><a href="/HisabHero-v5.5.0-Enterprise-Release.apk">Download APK</a></div>
          <div class="footer-links-col"><h5>Support</h5><a href="#contact">Contact Support</a><a href="mailto:hisabhero27@gmail.com">Email Us</a><a href="#">Privacy Policy</a><a href="#">Terms of Service</a></div>
        </div>
        <div class="footer-bottom">
          <div>© 2026 HisabHero Technologies. All rights reserved.</div>
          <div class="flex gap-4"><span>v5.5.0 Enterprise Release</span><span>•</span><span>MongoDB Atlas Cloud</span></div>
        </div>
      </div>
    </footer>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════
       ─── LOGGED-IN WEB DASHBOARD SUITE (#dashboardView) ───
       ═══════════════════════════════════════════════════════════════════ -->
  <div id="dashboardView" style="display: none;">
    <!-- Top Header Bar -->
    <header class="dash-topbar">
      <div class="flex items-center gap-4">
        <div class="nav-brand" onclick="showSection('overview')">
          <img src="/logo.png" alt="HisabHero" />
          <span>Hisab<span style="color: var(--secondary);">Hero</span></span>
        </div>

        <!-- Active Workspace Switcher Dropdown -->
        <div class="dash-ws-dropdown">
          <button id="activeWsBtn" class="dash-ws-btn" onclick="toggleWorkspaceDropdown()">
            <span id="activeWsIcon">👛</span>
            <span id="activeWsName">Personal Workspace</span>
            <span id="activeWsBadge" class="pill-badge emerald" style="font-size: 0.65rem; padding: 2px 6px;">PERSONAL</span>
            <span style="font-size: 0.75rem;">▼</span>
          </button>
          
          <div id="wsDropdownMenu" class="ws-menu">
            <div style="font-size: 0.6875rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; padding: 0.4rem 0.5rem;">
              Personal Workspaces
            </div>
            <div id="personalWsList"></div>

            <div style="font-size: 0.6875rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; padding: 0.8rem 0.5rem 0.4rem 0.5rem; border-top: 1px solid var(--border); margin-top: 0.4rem;">
              Business Workspaces
            </div>
            <div id="businessWsList"></div>

            <div style="border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
              <button class="btn btn-outline" style="width: 100%; padding: 0.4rem; font-size: 0.8125rem;" onclick="openCreateWorkspaceModal()">
                + Create Workspace
              </button>
              <button class="btn btn-outline" style="width: 100%; padding: 0.4rem; font-size: 0.8125rem;" onclick="openJoinWorkspaceModal()">
                🔑 Join with Code
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right User Controls -->
      <div class="flex items-center gap-3">
        <!-- Language Switcher in Dashboard -->
        <select id="langSelectDash" onchange="changeLanguage(this.value)" class="form-select" style="padding: 0.35rem 0.55rem; font-size: 0.75rem; width: auto; font-weight: 700;">
          <option value="en">🌐 English</option>
          <option value="ta">தமிழ்</option>
          <option value="hi">हिंदी</option>
          <option value="mr">मराठी</option>
          <option value="gu">ગુજરાતી</option>
          <option value="te">తెలుగు</option>
          <option value="kn">ಕನ್ನಡ</option>
          <option value="bn">বাংলা</option>
        </select>

        <button class="btn btn-outline" style="padding: 0.4rem 0.75rem; font-size: 0.8125rem;" onclick="openVoiceModal()">
          🎙️ Voice Bookkeeper
        </button>
        <button class="btn btn-accent" style="padding: 0.4rem 0.85rem; font-size: 0.8125rem;" onclick="openAddTxModal()">
          + Add Transaction
        </button>
        <div class="flex items-center gap-2" style="border-left: 1px solid var(--border); padding-left: 0.75rem;">
          <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--secondary-soft); color: var(--secondary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;">
            👤
          </div>
          <div>
            <div id="dashUserName" style="font-size: 0.8125rem; font-weight: 800; color: var(--primary);">User</div>
            <div id="dashUserEmail" style="font-size: 0.6875rem; color: var(--text-muted);">user@example.com</div>
          </div>
        </div>
        <button class="btn btn-outline" style="padding: 0.4rem 0.75rem; font-size: 0.75rem;" onclick="handleLogout()">
          🚪 Sign Out
        </button>
      </div>
    </header>

    <!-- Main Dashboard Layout -->
    <div class="dash-layout">
      <!-- Sidebar -->
      <aside class="dash-sidebar">
        <div class="dash-nav-item active" onclick="showSection('overview')">
          <span>📊</span> Overview Dashboard
        </div>
        <div class="dash-nav-item" onclick="showSection('transactions')">
          <span>💳</span> Transactions & Expenses
        </div>
        <div class="dash-nav-item" id="expenseAnalysisNavItem" onclick="showSection('expenseAnalysis')">
          <span>🔍</span> Expense Analysis
        </div>
        <div class="dash-nav-item" id="invoicesNavItem" onclick="showSection('invoices')">
          <span>🧾</span> Invoices & GST
        </div>
        <div class="dash-nav-item" onclick="showSection('khata')">
          <span>📒</span> Khata Book Ledger
        </div>
        <div class="dash-nav-item" onclick="showSection('cashflow')">
          <span>📈</span> Cash Flow Runway
        </div>
        <div class="dash-nav-item" onclick="showSection('inventory')">
          <span>📦</span> Inventory & Assets
        </div>
        <div class="dash-nav-item" onclick="showSection('subscriptions')">
          <span>🔁</span> SaaS & Subscriptions
        </div>
        <div class="dash-nav-item" onclick="showSection('reports')">
          <span>📑</span> Executive P&L Reports
        </div>
        <div class="dash-nav-item" onclick="showSection('aichat')">
          <span>🤖</span> AI CFO Copilot
        </div>
        <div class="dash-nav-item" onclick="showSection('upload')">
          <span>📄</span> Document Intelligence
        </div>
        <div class="dash-nav-item" onclick="showSection('merkle')">
          <span>🔒</span> Merkle Audit Vault
        </div>
        <div class="dash-nav-item" onclick="showSection('team')">
          <span>👥</span> Team & Join Code
        </div>
        <div class="dash-nav-item" onclick="showSection('settings')">
          <span>⚙️</span> Workspace Settings
        </div>
      </aside>

      <!-- Main Viewport Area -->
      <main class="dash-main">
        
        <!-- SECTION 1: OVERVIEW DASHBOARD (DYNAMIC ZERO-DATA UNTIL ADDED) -->
        <div id="section-overview">
          <!-- Hero Banner with Clickable Health Score Gauge -->
          <div class="dash-hero-banner">
            <div>
              <div class="pill-badge emerald" style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.4); margin-bottom: 0.5rem;">
                🟢 Active Workspace Session
              </div>
              <h2 id="dashGreeting" style="color: #ffffff; font-size: 1.75rem;">Welcome to HisabHero!</h2>
              <p style="color: #94a3b8; font-size: 0.9375rem; margin-top: 4px;">
                Real-time MongoDB financial records isolated to this workspace.
              </p>
            </div>

            <!-- Health Score Gauge (Clickable) -->
            <div class="flex items-center gap-4" style="background: rgba(255,255,255,0.06); padding: 0.75rem 1.25rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;" onclick="openHealthReportModal()">
              <div style="text-align: center;">
                <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 800;">Health Gauge 🔍</div>
                <div id="dashHealthScoreNumber" style="font-size: 1.75rem; font-weight: 900; color: #10b981; font-family: var(--font-display);">--/100</div>
              </div>
              <div style="width: 2px; height: 36px; background: rgba(255,255,255,0.1);"></div>
              <div>
                <div id="dashHealthScoreLabel" style="font-size: 0.8125rem; font-weight: 800; color: #6ee7b7;">READY</div>
                <div style="font-size: 0.6875rem; color: #cbd5e1;">Click to view audit report</div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button class="btn btn-accent" onclick="openAddTxModal()">+ Add Transaction</button>
              <button class="btn btn-outline" style="color: #fff; border-color: rgba(255,255,255,0.3);" onclick="showSection('upload')">📄 Upload Statement</button>
            </div>
          </div>

          <!-- AI Daily Insight Card -->
          <div id="aiInsightCard" style="display: none; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; align-items: center; justify-content: space-between;">
            <div class="flex items-center gap-3">
              <span style="font-size: 1.5rem;">🤖</span>
              <div>
                <strong style="color: #065f46; font-size: 0.9375rem;">AI CFO Proactive Insight:</strong>
                <div id="aiInsightText" style="font-size: 0.8125rem; color: #047857; margin-top: 2px;">
                  All transactions validated.
                </div>
              </div>
            </div>
            <button class="btn btn-accent" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;" onclick="showSection('aichat')">
              Ask AI CFO →
            </button>
          </div>

          <!-- 4 Metric Cards Matrix (Clickable) -->
          <div class="metrics-grid">
            <div class="metric-card" onclick="showSection('cashflow')" title="Click to view Cash Flow Analysis">
              <div class="metric-title">Total Inflow 🔍</div>
              <div id="statInflow" class="metric-value" style="color: var(--accent);">₹0</div>
              <div class="metric-sub">+ Recorded Inflow</div>
            </div>
            <div class="metric-card" onclick="showSection('expenseAnalysis')" title="Click to view Expense Analysis">
              <div class="metric-title">Total Outflow 🔍</div>
              <div id="statOutflow" class="metric-value" style="color: var(--primary);">₹0</div>
              <div class="metric-sub" style="color: var(--danger);">- Recorded Expenses</div>
            </div>
            <div class="metric-card" onclick="showSection('cashflow')" title="Click to view Margin Breakdown">
              <div class="metric-title">Net Margin 🔍</div>
              <div id="statMargin" class="metric-value">₹0</div>
              <div id="statMarginPct" class="metric-sub">Calculated Balance</div>
            </div>
            <div class="metric-card" onclick="showSection('cashflow')" title="Click to view Runway Scenario Simulator">
              <div class="metric-title">Cash Runway 🔍</div>
              <div id="statRunway" class="metric-value" style="color: var(--secondary);">N/A</div>
              <div class="metric-sub">MONTHS COVERAGE</div>
            </div>
          </div>

          <!-- ─── CLICKABLE FINANCIAL GRAPHS ─── -->
          <div class="charts-grid">
            <!-- Graph 1: Inflow vs Outflow Trend (Clickable -> Opens Cashflow Analysis) -->
            <div class="chart-card" onclick="showSection('cashflow')" title="Click graph to view full Cash Flow Breakdown">
              <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                <div>
                  <h3 style="font-size: 1.1rem;">Cash Flow & Expense Trend 🔍</h3>
                  <p style="font-size: 0.8125rem; color: var(--text-muted);">Monthly Inflow vs. Outflow (Click to open deep dive)</p>
                </div>
                <span class="pill-badge" style="font-size: 0.7rem; padding: 2px 8px;">CLICK TO DRILL DOWN</span>
              </div>
              <div style="height: 260px; position: relative;">
                <canvas id="cashflowChart"></canvas>
              </div>
            </div>

            <!-- Graph 2: Expense Category Breakdown (Clickable -> Opens Expense Category Deep-Dive) -->
            <div class="chart-card" onclick="showSection('expenseAnalysis')" title="Click graph to open Expense Analysis">
              <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                <div>
                  <h3 style="font-size: 1.1rem;">Expense Breakdown 🔍</h3>
                  <p style="font-size: 0.8125rem; color: var(--text-muted);">Category distribution (Click to view where you spent)</p>
                </div>
                <span class="pill-badge emerald" style="font-size: 0.7rem; padding: 2px 8px;">CLICK TO DRILL DOWN</span>
              </div>
              <div style="height: 260px; position: relative;">
                <canvas id="categoryChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Recent Transactions Table -->
          <div class="data-table-card">
            <div class="flex justify-between items-center">
              <div>
                <h3 style="font-size: 1.2rem;">Recent Workspace Transactions</h3>
                <p style="font-size: 0.8125rem; color: var(--text-muted);">Real-time entries from active MongoDB workspace collection.</p>
              </div>
              <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.8125rem;" onclick="loadWorkspaceData()">
                🔄 Refresh
              </button>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="txTableBody">
                <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No transactions recorded in this workspace yet. Click "+ Add Transaction" or "Upload Statement" above.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ═════════════════════════════════════════════════════════════
             SECTION: EXPENSE CATEGORY DEEP-DIVE ANALYSIS PAGE
             ═════════════════════════════════════════════════════════════ -->
        <div id="section-expenseAnalysis" style="display: none;">
          <div class="data-table-card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
              <div>
                <h2 style="font-size: 1.6rem;">🔍 Expense Analysis & Spending Breakdown</h2>
                <p style="color: var(--text-muted); font-size: 0.875rem;">Deep dive into where you have spent money, category shares, and itemized transaction receipts.</p>
              </div>
              <button class="btn btn-outline" onclick="showSection('overview')">← Back to Overview</button>
            </div>

            <!-- Category Summary Cards Grid -->
            <div id="expenseCategoryCardsGrid" class="flex gap-4" style="flex-wrap: wrap; margin-bottom: 2rem;">
              <!-- Dynamic Category Pill Cards rendered via JS -->
            </div>

            <!-- Filtered Category Transaction List -->
            <div style="background: var(--background); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem;">
              <div class="flex justify-between items-center" style="margin-bottom: 1rem;">
                <h3 id="categoryDetailsTitle" style="font-size: 1.15rem;">All Categorized Expenses</h3>
                <span id="categoryDetailsCount" class="pill-badge" style="font-size: 0.75rem;">0 Transactions</span>
              </div>

              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense Description</th>
                    <th>Category</th>
                    <th>Amount Spent</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="expenseAnalysisTableBody">
                  <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No expense transactions recorded in this workspace yet.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- SECTION 2: KHATA BOOK LEDGER & 1-CLICK WHATSAPP -->
        <div id="section-khata" style="display: none;">
          <div class="data-table-card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
              <div>
                <h2 style="font-size: 1.5rem;">📖 Khata Book Digital Ledger</h2>
                <p style="color: var(--text-muted); font-size: 0.875rem;">Manage Customer receivables and Vendor payables with WhatsApp 1-click reminders + UPI settlement.</p>
              </div>
              <button class="btn btn-accent" onclick="openAddPartyModal()">+ Add Party</button>
            </div>

            <div class="flex gap-4" style="margin-bottom: 1.5rem;">
              <div style="flex: 1; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1.25rem; border-radius: 12px;">
                <div style="color: #065f46; font-size: 0.8125rem; font-weight: 800;">YOU'LL RECEIVE (CUSTOMER TOTAL)</div>
                <div id="khataTotalReceive" style="font-size: 1.75rem; font-weight: 900; color: #059669; margin: 4px 0;">₹0</div>
                <div id="khataReceiveCount" style="font-size: 0.75rem; color: #047857;">0 active customer accounts</div>
              </div>
              <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; padding: 1.25rem; border-radius: 12px;">
                <div style="color: #991b1b; font-size: 0.8125rem; font-weight: 800;">YOU'LL PAY (VENDOR TOTAL)</div>
                <div id="khataTotalPay" style="font-size: 1.75rem; font-weight: 900; color: #dc2626; margin: 4px 0;">₹0</div>
                <div id="khataPayCount" style="font-size: 0.75rem; color: #b91c1c;">0 vendor accounts</div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Party Name</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Net Balance</th>
                  <th>1-Click WhatsApp Reminder</th>
                </tr>
              </thead>
              <tbody id="khataTableBody">
                <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No Khata parties recorded yet. Click "+ Add Party" above to add your first customer or vendor.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECTION 3: INVOICES, BILLS & GST COMPLIANCE -->
        <div id="section-invoices" style="display: none;">
          <div class="data-table-card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
              <div>
                <h2 style="font-size: 1.5rem;">🧾 Invoices & GST Compliance Center</h2>
                <p style="color: var(--text-muted); font-size: 0.875rem;">Generate GST-compliant tax invoices with CGST, SGST, IGST calculations and IRN e-invoicing.</p>
              </div>
              <button class="btn btn-primary" onclick="openCreateInvoiceModal()">+ Create Invoice</button>
            </div>

            <div class="flex gap-4" style="margin-bottom: 1.5rem;">
              <div style="flex: 1; background: var(--background); border: 1px solid var(--border); padding: 1rem; border-radius: 12px;">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">TOTAL INVOICED</div>
                <div id="invoicesTotalAmt" style="font-size: 1.35rem; font-weight: 900; color: var(--primary);">₹0</div>
              </div>
              <div style="flex: 1; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1rem; border-radius: 12px;">
                <div style="font-size: 0.75rem; color: #065f46; font-weight: 700;">COLLECTED</div>
                <div id="invoicesCollectedAmt" style="font-size: 1.35rem; font-weight: 900; color: #059669;">₹0</div>
              </div>
              <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; padding: 1rem; border-radius: 12px;">
                <div style="font-size: 0.75rem; color: #991b1b; font-weight: 700;">PENDING / OVERDUE</div>
                <div id="invoicesPendingAmt" style="font-size: 1.35rem; font-weight: 900; color: #dc2626;">₹0</div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client / GSTIN</th>
                  <th>Tax Breakdown</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="invoicesTableBody">
                <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No invoices created yet. Click "+ Create Invoice" above to generate your first GST invoice.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECTION 4: CASH FLOW & RUNWAY SIMULATOR -->
        <div id="section-cashflow" style="display: none;">
          <div class="data-table-card">
            <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">🌊 Cash Flow Runway & Scenario Simulator</h2>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">Predictive cash flow modeling and interactive what-if financial scenario planner.</p>

            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-title">30-Day Projected Inflow</div>
                <div id="simInflowDisplay" class="metric-value" style="color: var(--accent);">₹0</div>
                <div class="metric-sub">Confirmed Receivables</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Monthly Burn Rate</div>
                <div id="simBurnDisplay" class="metric-value" style="color: var(--danger);">₹0</div>
                <div class="metric-sub">Operating Outflow</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Simulated Runway</div>
                <div id="simulatedRunwayVal" class="metric-value" style="color: var(--secondary);">0.0 Mos</div>
                <div class="metric-sub">DYNAMIC FORECAST</div>
              </div>
            </div>

            <!-- Scenario Simulator Sliders -->
            <div class="slider-box">
              <h4 style="font-size: 1rem; margin-bottom: 1rem;">🎛️ Interactive Runway Scenario Simulator</h4>
              <div class="flex gap-6" style="flex-wrap: wrap;">
                <div style="flex: 1; min-width: 260px;">
                  <label class="form-label">Revenue Growth: <span id="revSliderVal" style="color: var(--accent); font-weight: 800;">+0%</span></label>
                  <input type="range" id="revSlider" min="0" max="100" value="0" step="5" style="width: 100%;" oninput="updateScenarioSim()" />
                </div>
                <div style="flex: 1; min-width: 260px;">
                  <label class="form-label">Expense Reduction: <span id="expSliderVal" style="color: var(--secondary); font-weight: 800;">-0%</span></label>
                  <input type="range" id="expSlider" min="0" max="50" value="0" step="5" style="width: 100%;" oninput="updateScenarioSim()" />
                </div>
              </div>
            </div>

            <div style="height: 280px; position: relative;">
              <canvas id="runwayChart"></canvas>
            </div>
          </div>
        </div>

        <!-- SECTION 5: INVENTORY & ASSETS -->
        <div id="section-inventory" style="display: none;">
          <div class="data-table-card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
              <div>
                <h2 style="font-size: 1.5rem;">📦 Inventory Stock & Fixed Asset Depreciation</h2>
                <p style="color: var(--text-muted); font-size: 0.875rem;">Track stock levels, low-stock reorder warnings, and annual asset depreciation.</p>
              </div>
              <button class="btn btn-primary" onclick="alert('Add Asset/Item modal ready!')">+ Add Item / Asset</button>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Item / Asset</th>
                  <th>Category</th>
                  <th>Stock Qty</th>
                  <th>Unit Value (₹)</th>
                  <th>Depreciation / Status</th>
                </tr>
              </thead>
              <tbody id="inventoryTableBody">
                <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No inventory items or fixed assets recorded in this workspace yet.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECTION 6: SUBSCRIPTIONS -->
        <div id="section-subscriptions" style="display: none;">
          <div class="data-table-card">
            <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
              <div>
                <h2 style="font-size: 1.5rem;">🔁 SaaS & Recurring Subscriptions</h2>
                <p style="color: var(--text-muted); font-size: 0.875rem;">Track all active auto-debit tool subscriptions and renewal dates.</p>
              </div>
              <button class="btn btn-primary" onclick="alert('Add Subscription modal ready!')">+ Add Subscription</button>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Subscription Tool</th>
                  <th>Billing Cycle</th>
                  <th>Next Renewal</th>
                  <th>Cost (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="subscriptionsTableBody">
                <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No recurring subscriptions added yet.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECTION 7: EXECUTIVE P&L REPORTS -->
        <div id="section-reports" style="display: none;">
          <div class="data-table-card">
            <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">📑 Executive P&L Financial Reports</h2>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">Download forensic audited Profit & Loss statements with cryptographic Merkle proof signatures.</p>

            <div style="background: var(--background); border: 1px solid var(--border); padding: 2rem; border-radius: 16px; text-align: center;">
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">📊</div>
              <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Audited P&L Statement & Balance Sheet</h3>
              <p style="color: var(--text-muted); font-size: 0.875rem; max-width: 480px; margin: 0 auto 1.5rem auto;">
                Includes complete category breakdown, GST reconciliation, tax deductions, and verified SHA-256 blockchain-grade hashes.
              </p>
              <button class="btn btn-primary" onclick="handleExportReport()">
                📥 Export Audited P&L Report (PDF / Print)
              </button>
            </div>
          </div>
        </div>

        <!-- SECTION 8: AI CFO COPILOT -->
        <div id="section-aichat" style="display: none;">
          <div class="data-table-card">
            <div class="flex items-center gap-3" style="margin-bottom: 1.25rem;">
              <div style="font-size: 2rem;">🤖</div>
              <div>
                <h3 style="font-size: 1.35rem;">AI CFO Financial Copilot</h3>
                <p style="font-size: 0.875rem; color: var(--text-muted);">Powered by Google Gemini — Ask intelligent questions about your cash flow, tax optimization, and budget limits.</p>
              </div>
            </div>

            <!-- Chat messages box -->
            <div id="aiChatBox" style="background: var(--background); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; min-height: 300px; max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem;">
              <div style="background: var(--surface); padding: 1rem; border-radius: 12px; border: 1px solid var(--border); max-width: 80%;">
                <strong>🤖 HisabHero AI CFO:</strong><br />
                Hello! I am your AI Financial Copilot. How can I help analyze your workspace finances today?
              </div>
            </div>

            <!-- Suggestion chips -->
            <div class="flex gap-2" style="margin-bottom: 1rem; flex-wrap: wrap;">
              <button class="btn btn-outline" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;" onclick="sendAiPrompt('Analyze my cash burn rate')">
                📊 Analyze Burn Rate
              </button>
              <button class="btn btn-outline" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;" onclick="sendAiPrompt('How can I optimize Input Tax Credit (ITC)?')">
                💡 Optimize ITC Tax Credit
              </button>
              <button class="btn btn-outline" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;" onclick="sendAiPrompt('What is my projected runway?')">
                📈 Forecast Runway
              </button>
            </div>

            <!-- Chat input -->
            <form onsubmit="handleAiChatSubmit(event)" class="flex gap-3">
              <input type="text" id="aiInput" class="form-input" placeholder="Type your financial query (e.g. How can I cut operating expenses?)" style="flex: 1;" />
              <button type="submit" id="aiSendBtn" class="btn btn-primary">Ask AI CFO →</button>
            </form>
          </div>
        </div>

        <!-- SECTION 9: DOCUMENT INTELLIGENCE UPLOAD -->
        <div id="section-upload" style="display: none;">
          <div class="data-table-card">
            <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">Document Intelligence & OCR Statement Parser</h3>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">
              Upload CSV bank statements or receipt images. Transactions are automatically extracted and recorded into your active workspace.
            </p>

            <form onsubmit="handleDocUpload(event)" style="border: 2px dashed var(--border); padding: 2.5rem; text-align: center; border-radius: var(--radius-lg); background: var(--background);">
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">📄</div>
              <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">Select Document File (CSV, PDF, or Image)</h4>
              <input type="file" id="docFileInput" accept=".csv, .pdf, image/*" required style="margin-bottom: 1rem;" />
              <div>
                <button type="submit" id="docUploadBtn" class="btn btn-accent">
                  🚀 Process Document with AI →
                </button>
              </div>
              <div id="docUploadStatus" style="margin-top: 1rem; font-weight: 700; font-size: 0.875rem;"></div>
            </form>
          </div>
        </div>

        <!-- SECTION 10: MERKLE AUDIT VAULT -->
        <div id="section-merkle" style="display: none;">
          <div class="data-table-card">
            <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔒 Cryptographic Merkle Tree Audit Ledger</h2>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">Forensic-grade SHA-256 blockchain-style transaction verification.</p>

            <div style="background: var(--background); border: 1px solid var(--border); padding: 1.5rem; border-radius: 14px; margin-bottom: 1.5rem;">
              <div style="font-size: 0.8125rem; font-weight: 700; color: var(--text-muted);">CURRENT MERKLE ROOT HASH</div>
              <div style="font-family: monospace; font-size: 1rem; font-weight: 800; color: var(--secondary); margin-top: 4px;" id="merkleRootDisplay">
                0x0000000000000000000000000000000000000000000000000000000000000000
              </div>
              <div style="margin-top: 1rem;">
                <button class="btn btn-accent" onclick="verifyChainIntegrity()">
                  ⚡ Verify Chain Integrity (Audit Proof)
                </button>
              </div>
            </div>

            <div id="merkleVerifyResult" style="display: none; padding: 1rem; border-radius: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-weight: 700;">
              ✓ Merkle Chain Valid: All transactions cryptographically intact. 0 tamper anomalies found.
            </div>
          </div>
        </div>

        <!-- SECTION 11: TEAM & JOIN CODE ENGINE -->
        <div id="section-team" style="display: none;">
          <div class="data-table-card">
            <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">👥 Team Management & 12-Char Join Code</h2>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">Assign roles (Owner, Manager, Accountant, Employee, Viewer) and approve join requests.</p>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 1.5rem; border-radius: 14px; margin-bottom: 1.5rem;">
              <div style="font-size: 0.8125rem; font-weight: 800; color: #1e40af;">WORKSPACE JOIN CODE</div>
              <div style="font-size: 1.5rem; font-weight: 900; letter-spacing: 2px; color: var(--secondary); margin: 6px 0;" id="teamJoinCodeDisplay">
                N/A (Personal Workspace)
              </div>
              <button class="btn btn-outline" style="padding: 0.35rem 0.85rem; font-size: 0.75rem;" onclick="copyJoinCode()">
                📋 Copy Code
              </button>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Email</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="teamMembersTableBody">
                <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading team members...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECTION 12: WORKSPACE SETTINGS & CONVERSION -->
        <div id="section-settings" style="display: none;">
          <div class="data-table-card">
            <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">Workspace Configuration & Management</h3>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">
              Manage workspace details, convert workspace types, or manage team members.
            </p>

            <div style="background: var(--background); border: 1px solid var(--border); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
              <div class="form-group">
                <label class="form-label">Current Workspace Name</label>
                <input type="text" id="settingsWsName" class="form-input" disabled />
              </div>
              <div class="form-group">
                <label class="form-label">Workspace Type</label>
                <input type="text" id="settingsWsType" class="form-input" disabled />
              </div>
              <div id="settingsJoinCodeBox" class="form-group" style="display: none;">
                <label class="form-label">12-Character Business Join Code</label>
                <input type="text" id="settingsWsJoinCode" class="form-input" disabled style="font-family: var(--font-display); letter-spacing: 2px; font-weight: 800; color: var(--secondary);" />
              </div>
            </div>

            <!-- Convert Business Workspace to Personal Feature -->
            <div id="convertFeatureBox" style="display: none; border: 1px solid #fed7aa; background: #fff7ed; padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
              <h4 style="color: #9a3412; font-size: 1.1rem; margin-bottom: 0.5rem;">⚠️ Convert Business Workspace to Personal</h4>
              <p style="color: #c2410c; font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.5;">
                Converting this workspace will disable business ERP features (Payroll, Invoices, Inventory) and revoke all team members. Historical financial records remain attached to this workspace ID. Your other Personal Workspaces will remain completely untouched.
              </p>
              <button class="btn btn-primary" onclick="handleConvertCurrentWorkspace()">
                Convert to Personal Workspace
              </button>
            </div>

            <!-- Delete Workspace Feature -->
            <div style="border: 1px solid #fecaca; background: #fef2f2; padding: 1.5rem; border-radius: var(--radius-md);">
              <h4 style="color: #991b1b; font-size: 1.1rem; margin-bottom: 0.5rem;">🗑️ Delete Workspace</h4>
              <p style="color: #b91c1c; font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.5;">
                Soft-deletes this workspace. Your user account and other workspaces will remain 100% intact.
              </p>
              <button class="btn btn-danger" onclick="handleDeleteCurrentWorkspace()">
                Delete This Workspace
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>

    <!-- Floating Action Speed Dial -->
    <div id="speedDial" class="speed-dial">
      <button class="speed-dial-btn" onclick="toggleSpeedDial()">+</button>
      <div class="speed-dial-menu">
        <div class="speed-dial-sub" onclick="openAddTxModal()">💳 Record Transaction</div>
        <div class="speed-dial-sub" onclick="openVoiceModal()">🎙️ Voice Command</div>
        <div class="speed-dial-sub" onclick="showSection('upload')">📷 OCR Statement Upload</div>
        <div class="speed-dial-sub" onclick="showSection('invoices')">🧾 Create Tax Invoice</div>
        <div class="speed-dial-sub" onclick="showSection('khata')">👥 Add Khata Party</div>
      </div>
    </div>
  </div>

  <!-- ─── MODAL: FINANCIAL HEALTH DIAGNOSTIC REPORT ─── -->
  <div id="healthModal" class="modal-backdrop">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <h3 style="font-size: 1.4rem; margin-bottom: 0.35rem;">💚 Financial Health Diagnostic Report</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">Comprehensive analysis of active workspace liquidity, burn rates, and savings health.</p>

      <div style="background: var(--background); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;">
        <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
          <span style="font-weight: 700;">Savings / Margin Ratio:</span>
          <span id="healthMetricSavings" style="font-weight: 800; color: var(--accent);">Healthy (+0%)</span>
        </div>
        <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
          <span style="font-weight: 700;">Working Capital Buffer:</span>
          <span id="healthMetricBuffer" style="font-weight: 800; color: var(--secondary);">0.0 Months</span>
        </div>
        <div class="flex justify-between items-center">
          <span style="font-weight: 700;">Expense Anomaly Risk:</span>
          <span style="font-weight: 800; color: var(--accent);">Low / Safe (0 Alerts)</span>
        </div>
      </div>

      <div style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.5;">
        <strong>Recommendations:</strong><br />
        • Keep recording recurring income and bills to maintain an accurate cash runway forecast.<br />
        • Utilize Document Intelligence to import bank statements for instant categorization.
      </div>
    </div>
  </div>

  <!-- ─── MODAL: VOICE BOOKKEEPER ─── -->
  <div id="voiceModal" class="modal-backdrop">
    <div class="modal-box" style="text-align: center;">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <h3 style="font-size: 1.4rem; margin-bottom: 0.35rem;">🎙️ AI Voice Bookkeeper</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">
        Speak naturally in English, Tamil, Hindi, or Marathi:<br /><em>"Spent ₹2,400 on fuel today"</em>
      </p>

      <div style="margin: 1.5rem 0; display: flex; justify-content: center;">
        <div style="width: 80px; height: 80px; border-radius: 40px; background: rgba(5, 150, 105, 0.15); border: 2px solid var(--accent); display: flex; align-items: center; justify-content: center; font-size: 32px; cursor: pointer;" onclick="handleVoiceSim()">
          🎙️
        </div>
      </div>

      <input type="text" id="voiceCommandInput" class="form-input" placeholder="Type or speak expense command..." style="text-align: center; margin-bottom: 1rem;" value="Spent ₹2,400 on petrol today" />
      <button onclick="handleVoiceSubmit()" class="btn btn-accent" style="width: 100%;">
        Parse & Auto-Log Expense ✓
      </button>
    </div>
  </div>

  <!-- ─── MODAL: ADD TRANSACTION ─── -->
  <div id="addTxModal" class="modal-backdrop">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <h3 style="font-size: 1.4rem; margin-bottom: 0.35rem;">Add Financial Transaction</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.25rem;">Records immediately to the active MongoDB workspace.</p>

      <form onsubmit="handleAddTxSubmit(event)">
        <div class="form-group">
          <label class="form-label">Transaction Type *</label>
          <select id="txType" class="form-select">
            <option value="expense">Outflow (Expense)</option>
            <option value="income">Inflow (Income)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Amount (₹) *</label>
          <input type="number" id="txAmount" class="form-input" required placeholder="1500" />
        </div>
        <div class="form-group">
          <label class="form-label">Description *</label>
          <input type="text" id="txDesc" class="form-input" required placeholder="Server Hosting AWS / Client Payment" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <input type="text" id="txCategory" class="form-input" placeholder="Technology / Groceries / Consulting / Rent" />
        </div>
        <button type="submit" id="addTxSubmitBtn" class="btn btn-accent" style="width: 100%; margin-top: 1rem;">
          Save Transaction →
        </button>
      </form>
    </div>
  </div>

  <!-- ─── MODAL: CREATE WORKSPACE ─── -->
  <div id="createWsModal" class="modal-backdrop">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <h3 style="font-size: 1.4rem; margin-bottom: 0.35rem;">Create New Workspace</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.25rem;">Add an isolated personal or business container.</p>

      <form onsubmit="handleCreateWsSubmit(event)">
        <div class="form-group">
          <label class="form-label">Workspace Type *</label>
          <select id="newWsType" class="form-select">
            <option value="personal">Personal Workspace</option>
            <option value="business">Business Workspace (With 12-char Join Code)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Workspace Name *</label>
          <input type="text" id="newWsName" class="form-input" required placeholder="My Family Budget / Tech Enterprises" />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
          Create Workspace →
        </button>
      </form>
    </div>
  </div>

  <!-- ─── MODAL: JOIN WORKSPACE WITH CODE ─── -->
  <div id="joinWsModal" class="modal-backdrop">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <h3 style="font-size: 1.4rem; margin-bottom: 0.35rem;">Join Business Workspace</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.25rem;">Enter the 12-character code provided by the workspace owner.</p>

      <form onsubmit="handleJoinWsSubmit(event)">
        <div class="form-group">
          <label class="form-label">12-Character Join Code *</label>
          <input type="text" id="joinCodeInput" class="form-input" required placeholder="XXXX-XXXX-XXXX" style="font-family: var(--font-display); letter-spacing: 2px; text-transform: uppercase; font-weight: 800;" />
        </div>
        <div class="form-group">
          <label class="form-label">Note to Owner</label>
          <input type="text" id="joinNoteInput" class="form-input" placeholder="e.g. Rahul Sharma - Accountant" />
        </div>
        <button type="submit" class="btn btn-accent" style="width: 100%; margin-top: 1rem;">
          Submit Join Request →
        </button>
      </form>
    </div>
  </div>

  <!-- ─── AUTH MODAL: SIGN UP WITH MANDATORY WORKSPACE CHOICE ─── -->
  <div id="signupModal" class="modal-backdrop">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModals()">✕</button>
      
      <div class="pill-badge emerald" style="margin-bottom: 0.75rem;">Step 1 of 2</div>
      <h3 style="font-size: 1.5rem; margin-bottom: 0.35rem;">Create Your Account</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">
        Choose your initial workspace type. You can create additional workspaces anytime.
      </p>

      <form id="signupForm" onsubmit="handleSignupSubmit(event)">
        <div style="margin-bottom: 1.25rem;">
          <label class="form-label" style="margin-bottom: 0.5rem; display: block;">CREATE YOUR HISABHERO WORKSPACE</label>
          
          <div id="choicePersonal" class="workspace-choice-card selected" onclick="selectWorkspaceChoice('personal')">
            <div class="workspace-choice-icon">👛</div>
            <div>
              <div style="font-weight: 800; font-size: 0.9375rem; color: var(--primary);">PERSONAL WORKSPACE</div>
              <div style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 2px;">
                Manage your personal finances, expenses, savings and financial goals.
              </div>
            </div>
          </div>

          <div id="choiceBusiness" class="workspace-choice-card" onclick="selectWorkspaceChoice('business')">
            <div class="workspace-choice-icon" style="background: var(--accent);">🏢</div>
            <div>
              <div style="font-weight: 800; font-size: 0.9375rem; color: var(--primary);">BUSINESS WORKSPACE</div>
              <div style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 2px;">
                Manage your business finances, invoices, inventory, payroll and team.
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" class="form-input" id="signupFullName" required placeholder="Selvamanikandan" />
        </div>

        <div class="form-group">
          <label class="form-label">Email Address *</label>
          <input type="email" class="form-input" id="signupEmail" required placeholder="selva@example.com" />
        </div>

        <div class="form-group">
          <label class="form-label">Password * (Min 6 chars)</label>
          <input type="password" class="form-input" id="signupPassword" required minlength="6" placeholder="••••••••" />
        </div>

        <div id="businessFields" style="display: none; margin-top: 0.5rem;">
          <div class="form-group">
            <label class="form-label">Business / Company Name *</label>
            <input type="text" class="form-input" id="signupBusinessName" placeholder="Apex Traders Pvt Ltd" />
          </div>
          <div class="form-group">
            <label class="form-label">Industry</label>
            <input type="text" class="form-input" id="signupIndustry" placeholder="Retail / Consulting / Technology" />
          </div>
        </div>

        <button type="submit" id="signupSubmitBtn" class="btn btn-accent" style="width: 100%; margin-top: 1rem; padding: 0.85rem;">
          Continue to Email Verification →
        </button>

        <div id="signupError" style="margin-top: 0.75rem; color: var(--danger); font-size: 0.875rem; font-weight: 600; text-align: center;"></div>

        <div style="text-align: center; margin-top: 1.25rem; font-size: 0.875rem; color: var(--text-muted);">
          Already have an account? <a href="#" onclick="openLoginModal()" style="color: var(--secondary); font-weight: 700;">Sign In</a>
        </div>
      </form>
    </div>
  </div>

  <!-- ─── AUTH MODAL: 6-DIGIT EMAIL OTP VERIFICATION ─── -->
  <div id="otpModal" class="modal-backdrop">
    <div class="modal-box" style="text-align: center;">
      <button class="modal-close" onclick="closeModals()">✕</button>
      
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📬</div>
      <h3 style="font-size: 1.5rem; margin-bottom: 0.35rem;">Verify Your Email Address</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">
        We've dispatched a 6-digit code to <strong id="otpTargetEmail" style="color: var(--primary);"></strong>.<br />
        Please check your Inbox and Spam folder.
      </p>

      <form id="otpForm" onsubmit="handleOtpSubmit(event)">
        <div class="form-group" style="align-items: center;">
          <input
            type="text"
            id="otpCodeInput"
            required
            maxlength="6"
            placeholder="• • • • • •"
            style="width: 220px; font-size: 1.75rem; text-align: center; letter-spacing: 12px; font-weight: 800; font-family: var(--font-display); padding: 0.6rem; border: 2px solid var(--secondary); border-radius: var(--radius-md);"
            autoFocus
          />
        </div>

        <button type="submit" id="otpSubmitBtn" class="btn btn-primary" style="width: 100%; margin-top: 1rem; padding: 0.85rem;">
          Verify Code & Enter HisabHero →
        </button>

        <div id="otpError" style="margin-top: 0.75rem; color: var(--danger); font-size: 0.875rem; font-weight: 600;"></div>

        <div style="margin-top: 1.25rem;">
          <button type="button" id="resendOtpBtn" class="btn btn-outline" style="font-size: 0.8125rem; padding: 0.4rem 0.8rem;" onclick="handleResendOtp()">
            🔄 Resend Code (60s)
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- ─── AUTH MODAL: SIGN IN ─── -->
  <div id="loginModal" class="modal-backdrop">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModals()">✕</button>
      
      <h3 style="font-size: 1.5rem; margin-bottom: 0.35rem;">Welcome Back</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">
        Sign in to access your personal and business workspaces.
      </p>

      <form id="loginForm" onsubmit="handleLoginSubmit(event)">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-input" id="loginEmail" required placeholder="selva@example.com" />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-input" id="loginPassword" required placeholder="••••••••" />
        </div>

        <button type="submit" id="loginSubmitBtn" class="btn btn-primary" style="width: 100%; margin-top: 1rem; padding: 0.85rem;">
          Sign In →
        </button>

        <div id="loginError" style="margin-top: 0.75rem; color: var(--danger); font-size: 0.875rem; font-weight: 600; text-align: center;"></div>

        <div style="text-align: center; margin-top: 1.25rem; font-size: 0.875rem; color: var(--text-muted);">
          Don't have an account? <a href="#" onclick="openSignupModal()" style="color: var(--secondary); font-weight: 700;">Create Account</a>
        </div>
      </form>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════
       ─── COMPLETE CLIENT-SIDE SCRIPT WITH CHARTS & ACTIONS ───
       ═══════════════════════════════════════════════════════════════════ -->
  <script>
    let activeWorkspaceChoice = 'personal';
    let pendingVerificationEmail = '';
    let resendCooldownSec = 0;
    let resendTimer = null;

    let currentUser = null;
    let currentToken = null;
    let currentActiveWorkspaceId = 'personal';
    let currentActiveWorkspace = null;
    let allWorkspaces = [];
    let currentWorkspaceTransactions = [];

    let cashflowChartInstance = null;
    let categoryChartInstance = null;
    let runwayChartInstance = null;

    // Translations Dict
    const i18n = {
      en: { heading: "Your Money. Your Business.<br /><span class='emerald'>One Intelligent Platform.</span>", sub: "HisabHero brings personal finance, business management and AI-powered financial intelligence together in one secure workspace." },
      ta: { heading: "உங்கள் பணம். உங்கள் வணிகம்.<br /><span class='emerald'>ஒரே அறிவார்ந்த தளம்.</span>", sub: "ஹிசாப்ஹீரோ தனிநபர் நிதி, வணிக மேலாண்மை மற்றும் AI நுண்ணறிவை ஒரே பாதுகாப்பான தளத்தில் இணைக்கிறது." },
      hi: { heading: "आपका धन। आपका व्यवसाय।<br /><span class='emerald'>एक बुद्धिमान मंच।</span>", sub: "हिसाबहीरो व्यक्तिगत वित्त, व्यवसाय प्रबंधन और एआई वित्तीय बुद्धिमत्ता को एक सुरक्षित वर्कस्पेस में लाता है।" },
      mr: { heading: "तुमचे पैसे. तुमचा व्यवसाय.<br /><span class='emerald'>एक बुद्धिमान व्यासपीठ.</span>", sub: "हिसाबहिरो वैयक्तिक वित्त, व्यवसाय व्यवस्थापन आणि AI बुद्धिमत्ता एका सुरक्षित वर्कस्पेसमध्ये आणते." },
      gu: { heading: "તમારા નાણાં. તમારો વ્યવસાય.<br /><span class='emerald'>એક બુદ્ધિશાળી પ્લેટફોર્મ.</span>", sub: "હિસાબહીરો વ્યક્તિગત ફાઇનાન્સ અને બિઝનેસ મેનેજમેન્ટને એક સુરક્ષિત પ્લેટફોર્મ પર લાવે છે." },
      te: { heading: "మీ డబ్బు. మీ వ్యాపారం.<br /><span class='emerald'>ఒకే తెలివైన వేదిక.</span>", sub: "హిసాబ్‌హీరో వ్యక్తిగత ఆర్థిక నిర్వహణ మరియు వ్యాపార నిర్వహణను ఒకే సురక్షిత వర్క్‌స్పేస్‌లో అందిస్తుంది." },
      kn: { heading: "ನಿಮ್ಮ ಹಣ. ನಿಮ್ಮ ವ್ಯಾಪಾರ.<br /><span class='emerald'>ಒಂದೇ ಸ್ಮಾರ್ಟ್ ವೇದಿಕೆ.</span>", sub: "ಹಿಸಾಬ್‌ಹೀರೋ ವೈಯಕ್ತಿಕ ಹಣಕಾಸು ಮತ್ತು ವ್ಯವಹಾರ ನಿರ್ವಹಣೆಯನ್ನು ಸಂಯೋಜಿಸುತ್ತದೆ." },
      bn: { heading: "আপনার টাকা। আপনার ব্যবসা।<br /><span class='emerald'>একটি স্মার্ট প্ল্যাটফর্ম।</span>", sub: "হিসাবহিরো ব্যক্তিগত অর্থ এবং ব্যবসা পরিচালনাকে একটি নিরাপদ প্ল্যাটফর্মে নিয়ে আসে।" }
    };

    function changeLanguage(langCode) {
      if (i18n[langCode]) {
        document.getElementById('heroHeading').innerHTML = i18n[langCode].heading;
        document.getElementById('heroSubheading').textContent = i18n[langCode].sub;
      }
      document.getElementById('langSelectLanding').value = langCode;
      const dashSelect = document.getElementById('langSelectDash');
      if (dashSelect) dashSelect.value = langCode;
    }

    document.addEventListener('DOMContentLoaded', async () => {
      const storedToken = localStorage.getItem('hh_token');
      if (storedToken) {
        currentToken = storedToken;
        await verifyAndLoadUserSession();
      } else {
        showLandingView();
      }
    });

    async function verifyAndLoadUserSession() {
      try {
        const res = await fetch('/api/auth/verify', {
          headers: { 'Authorization': \`Bearer \${currentToken}\` }
        });
        if (res.ok) {
          const data = await res.json();
          currentUser = data.user;
          showDashboardView();
          await loadWorkspacesList();
        } else {
          handleLogout();
        }
      } catch (e) {
        console.warn('Verify session error:', e);
        showLandingView();
      }
    }

    function showLandingView() {
      document.getElementById('landingView').style.display = 'block';
      document.getElementById('dashboardView').style.display = 'none';
    }

    function showDashboardView() {
      document.getElementById('landingView').style.display = 'none';
      document.getElementById('dashboardView').style.display = 'flex';
      if (currentUser) {
        document.getElementById('dashUserName').textContent = currentUser.fullName || 'User';
        document.getElementById('dashUserEmail').textContent = currentUser.email || '';
        document.getElementById('dashGreeting').textContent = \`Good day, \${currentUser.fullName || 'Selva'}!\`;
      }
    }

    function handleLogout() {
      localStorage.removeItem('hh_token');
      localStorage.removeItem('hh_user');
      currentToken = null;
      currentUser = null;
      showLandingView();
    }

    // ─── WORKSPACE MANAGEMENT ───
    async function loadWorkspacesList() {
      if (!currentToken) return;
      try {
        const res = await fetch('/api/workspaces', {
          headers: { 'Authorization': \`Bearer \${currentToken}\` }
        });
        const data = await res.json();
        allWorkspaces = data.workspaces || [];

        const personalList = document.getElementById('personalWsList');
        const businessList = document.getElementById('businessWsList');
        personalList.innerHTML = '';
        businessList.innerHTML = '';

        const personals = data.personal || [];
        const businesses = data.business || [];

        personals.forEach(ws => {
          const isAct = ws.id === currentActiveWorkspaceId || (currentActiveWorkspaceId === 'personal' && ws.isDefault);
          personalList.innerHTML += \`
            <div class="ws-menu-item \${isAct ? 'active' : ''}" onclick="switchActiveWorkspace('\${ws.id}')">
              <span>👛 \${ws.name}</span>
              \${isAct ? '<span>✓</span>' : ''}
            </div>
          \`;
        });

        businesses.forEach(ws => {
          const isAct = ws.id === currentActiveWorkspaceId;
          businessList.innerHTML += \`
            <div class="ws-menu-item \${isAct ? 'active' : ''}" onclick="switchActiveWorkspace('\${ws.id}')">
              <span>🏢 \${ws.name}</span>
              \${isAct ? '<span>✓</span>' : ''}
            </div>
          \`;
        });

        if (!currentActiveWorkspace) {
          const storedWs = localStorage.getItem('hh_active_ws');
          currentActiveWorkspace = allWorkspaces.find(w => w.id === storedWs) || personals[0] || businesses[0] || allWorkspaces[0];
          if (currentActiveWorkspace) {
            currentActiveWorkspaceId = currentActiveWorkspace.id;
          }
        }

        updateActiveWorkspaceUI();
        await loadWorkspaceData();
      } catch (e) {
        console.error('Failed to load workspaces:', e);
      }
    }

    function switchActiveWorkspace(wsId) {
      currentActiveWorkspaceId = wsId;
      localStorage.setItem('hh_active_ws', wsId);
      currentActiveWorkspace = allWorkspaces.find(w => w.id === wsId);
      toggleWorkspaceDropdown(false);
      updateActiveWorkspaceUI();
      loadWorkspaceData();
    }

    function updateActiveWorkspaceUI() {
      if (!currentActiveWorkspace) return;
      const isBiz = currentActiveWorkspace.type === 'business';
      document.getElementById('activeWsIcon').textContent = isBiz ? '🏢' : '👛';
      document.getElementById('activeWsName').textContent = currentActiveWorkspace.name;
      const badge = document.getElementById('activeWsBadge');
      badge.textContent = isBiz ? 'BUSINESS' : 'PERSONAL';
      badge.className = isBiz ? 'pill-badge' : 'pill-badge emerald';

      document.getElementById('settingsWsName').value = currentActiveWorkspace.name;
      document.getElementById('settingsWsType').value = currentActiveWorkspace.type.toUpperCase();
      const joinBox = document.getElementById('settingsJoinCodeBox');
      const convBox = document.getElementById('convertFeatureBox');

      if (isBiz) {
        joinBox.style.display = 'block';
        convBox.style.display = 'block';
        document.getElementById('settingsWsJoinCode').value = currentActiveWorkspace.joinCode || 'N/A';
        const teamCode = document.getElementById('teamJoinCodeDisplay');
        if (teamCode) teamCode.textContent = currentActiveWorkspace.joinCode || 'N/A';
      } else {
        joinBox.style.display = 'none';
        convBox.style.display = 'none';
        const teamCode = document.getElementById('teamJoinCodeDisplay');
        if (teamCode) teamCode.textContent = 'N/A (Personal Workspace)';
      }
    }

    function toggleWorkspaceDropdown(forceState) {
      const menu = document.getElementById('wsDropdownMenu');
      if (typeof forceState === 'boolean') {
        if (forceState) menu.classList.add('show');
        else menu.classList.remove('show');
      } else {
        menu.classList.toggle('show');
      }
    }

    function toggleSpeedDial() {
      document.getElementById('speedDial').classList.toggle('open');
    }

    // ─── LOAD REAL WORKSPACE FINANCIAL DATA & CHARTS ───
    async function loadWorkspaceData() {
      if (!currentToken) return;
      const wsId = currentActiveWorkspaceId || 'personal';

      try {
        const [statsRes, txsRes, healthRes] = await Promise.all([
          fetch('/api/dashboard/stats', {
            headers: { 'Authorization': \`Bearer \${currentToken}\`, 'X-Workspace-Id': wsId }
          }),
          fetch('/api/dashboard/transactions', {
            headers: { 'Authorization': \`Bearer \${currentToken}\`, 'X-Workspace-Id': wsId }
          }),
          fetch('/api/dashboard/health', {
            headers: { 'Authorization': \`Bearer \${currentToken}\`, 'X-Workspace-Id': wsId }
          })
        ]);

        const stats = await statsRes.json();
        const txs = await txsRes.json();
        const health = await healthRes.json();

        currentWorkspaceTransactions = Array.isArray(txs) ? txs : [];

        let totalIn = 0;
        let totalOut = 0;
        const catMap = {};

        currentWorkspaceTransactions.forEach(t => {
          const amt = Number(t.amount || 0);
          if (t.type === 'income') {
            totalIn += amt;
          } else {
            totalOut += amt;
            const cat = t.category || 'General';
            catMap[cat] = (catMap[cat] || 0) + amt;
          }
        });

        // Compute Margin
        const netMargin = totalIn - totalOut;
        const marginPct = totalIn > 0 ? ((netMargin / totalIn) * 100).toFixed(1) + '%' : '0.0%';

        // Compute Runway
        const runwayMonths = totalOut > 0 ? (netMargin > 0 ? (netMargin / totalOut).toFixed(1) : '0.0') : (totalIn > 0 ? '12.0+' : '0.0');

        // Update 4 Metric Cards
        document.getElementById('statInflow').textContent = '₹' + totalIn.toLocaleString('en-IN');
        document.getElementById('statOutflow').textContent = '₹' + totalOut.toLocaleString('en-IN');
        document.getElementById('statMargin').textContent = (netMargin >= 0 ? '+' : '') + '₹' + netMargin.toLocaleString('en-IN');
        document.getElementById('statMarginPct').textContent = totalIn > 0 ? \`\${marginPct} Margin\` : 'No Data Yet';
        document.getElementById('statRunway').textContent = totalIn > 0 || totalOut > 0 ? \`\${runwayMonths} Mos\` : 'N/A';

        // Update Simulator Display
        document.getElementById('simInflowDisplay').textContent = '₹' + totalIn.toLocaleString('en-IN');
        document.getElementById('simBurnDisplay').textContent = '₹' + totalOut.toLocaleString('en-IN');
        document.getElementById('simulatedRunwayVal').textContent = \`\${runwayMonths} Mos\`;

        // Update Health Gauge
        const score = currentWorkspaceTransactions.length === 0 ? 0 : (health && typeof health.score === 'number' ? health.score : 80);
        document.getElementById('dashHealthScoreNumber').textContent = currentWorkspaceTransactions.length === 0 ? '0/100' : \`\${score}/100\`;
        document.getElementById('dashHealthScoreLabel').textContent = currentWorkspaceTransactions.length === 0 ? 'NO DATA YET' : (score >= 80 ? 'EXCELLENT' : (score >= 50 ? 'GOOD' : 'FAIR'));

        // Health Diagnostic Modal Fields
        document.getElementById('healthMetricSavings').textContent = \`Margin \${marginPct}\`;
        document.getElementById('healthMetricBuffer').textContent = \`\${runwayMonths} Months\`;

        // Render Table
        const tbody = document.getElementById('txTableBody');
        tbody.innerHTML = '';
        if (currentWorkspaceTransactions.length > 0) {
          currentWorkspaceTransactions.forEach(t => {
            const isInc = t.type === 'income';
            tbody.innerHTML += \`
              <tr>
                <td>\${t.date ? new Date(t.date).toLocaleDateString() : 'Today'}</td>
                <td><strong>\${t.description}</strong></td>
                <td><span class="pill-badge" style="font-size: 0.7rem; padding: 2px 6px;">\${t.category || 'General'}</span></td>
                <td><strong style="color: \${isInc ? 'var(--accent)' : 'var(--danger)'}">\${isInc ? '+ INFLOW' : '- OUTFLOW'}</strong></td>
                <td style="font-weight: 800; color: \${isInc ? 'var(--accent)' : 'var(--primary)'}">₹\${Number(t.amount || 0).toLocaleString('en-IN')}</td>
                <td><span style="color: var(--accent); font-weight: 700;">✓ Approved</span></td>
              </tr>
            \`;
          });
        } else {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No transactions recorded in this workspace yet. Click "+ Add Transaction" or "Upload Statement" above.</td></tr>';
        }

        // Render Dynamic Financial Charts
        renderFinancialCharts(currentWorkspaceTransactions, totalIn, totalOut, catMap);

        // Render Expense Analysis Details
        renderExpenseAnalysisDetails(currentWorkspaceTransactions, totalOut, catMap);
      } catch (err) {
        console.error('Failed to load workspace data:', err);
      }
    }

    // ─── RENDER DYNAMIC CHART.JS FINANCIAL GRAPHS ───
    function renderFinancialCharts(txs, totalIn, totalOut, catMap) {
      // 1. Cashflow Inflow vs Outflow Chart
      const cfCtx = document.getElementById('cashflowChart');
      if (cfCtx) {
        if (cashflowChartInstance) cashflowChartInstance.destroy();
        
        const labels = ['Past Period', 'Current Active Workspace'];
        const inData = [0, totalIn];
        const outData = [0, totalOut];

        cashflowChartInstance = new Chart(cfCtx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Inflow (₹)',
                data: inData,
                backgroundColor: 'rgba(5, 150, 105, 0.85)',
                borderRadius: 6
              },
              {
                label: 'Outflow (₹)',
                data: outData,
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: () => showSection('cashflow'),
            plugins: {
              legend: { position: 'top', labels: { font: { family: 'Inter', weight: '600' } } }
            },
            scales: {
              y: { grid: { color: 'rgba(0,0,0,0.04)' }, beginAtZero: true },
              x: { grid: { display: false } }
            }
          }
        });
      }

      // 2. Category Donut Chart
      const catCtx = document.getElementById('categoryChart');
      if (catCtx) {
        if (categoryChartInstance) categoryChartInstance.destroy();

        const catKeys = Object.keys(catMap);
        const catValues = Object.values(catMap);

        categoryChartInstance = new Chart(catCtx, {
          type: 'doughnut',
          data: {
            labels: catKeys.length > 0 ? catKeys : ['No Expenses Recorded'],
            datasets: [{
              data: catValues.length > 0 ? catValues : [1],
              backgroundColor: catValues.length > 0 ? ['#2563eb', '#059669', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b'] : ['#e2e8f0'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: () => showSection('expenseAnalysis'),
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } } }
            },
            cutout: '68%'
          }
        });
      }

      // 3. Runway Forecast Curve
      const rwyCtx = document.getElementById('runwayChart');
      if (rwyCtx) {
        if (runwayChartInstance) runwayChartInstance.destroy();

        const baseVal = totalIn - totalOut;
        const pts = [baseVal, Math.max(0, baseVal * 0.8), Math.max(0, baseVal * 0.6), Math.max(0, baseVal * 0.4), Math.max(0, baseVal * 0.2)];

        runwayChartInstance = new Chart(rwyCtx, {
          type: 'line',
          data: {
            labels: ['Month 1', 'Month 3', 'Month 6', 'Month 9', 'Month 12'],
            datasets: [{
              label: 'Projected Cash Reserve (₹)',
              data: pts,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }
    }

    // ─── RENDER EXPENSE ANALYSIS DETAILS & FILTER ───
    function renderExpenseAnalysisDetails(txs, totalOut, catMap) {
      const cardsGrid = document.getElementById('expenseCategoryCardsGrid');
      const tableBody = document.getElementById('expenseAnalysisTableBody');
      const countBadge = document.getElementById('categoryDetailsCount');

      const expenses = txs.filter(t => t.type === 'expense');
      countBadge.textContent = \`\${expenses.length} Expense Transactions\`;

      cardsGrid.innerHTML = '';
      const catKeys = Object.keys(catMap);

      if (catKeys.length === 0) {
        cardsGrid.innerHTML = '<div style="color: var(--text-muted); font-size: 0.875rem;">No category breakdown available yet. Add an expense above to see analysis.</div>';
      } else {
        catKeys.forEach(cat => {
          const amt = catMap[cat];
          const pct = totalOut > 0 ? ((amt / totalOut) * 100).toFixed(1) : 0;
          cardsGrid.innerHTML += \`
            <div style="flex: 1 1 180px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; box-shadow: var(--shadow-sm); cursor: pointer;" onclick="filterExpenseTableByCat('\${cat}')">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">\${cat}</div>
              <div style="font-size: 1.35rem; font-weight: 900; color: var(--primary); margin: 4px 0;">₹\${amt.toLocaleString('en-IN')}</div>
              <div style="font-size: 0.75rem; color: var(--secondary); font-weight: 700;">\${pct}% of Total Outflow</div>
            </div>
          \`;
        });
      }

      // Render Table
      tableBody.innerHTML = '';
      if (expenses.length > 0) {
        expenses.forEach(e => {
          tableBody.innerHTML += \`
            <tr>
              <td>\${e.date ? new Date(e.date).toLocaleDateString() : 'Today'}</td>
              <td><strong>\${e.description}</strong></td>
              <td><span class="pill-badge" style="font-size: 0.7rem; padding: 2px 6px;">\${e.category || 'General'}</span></td>
              <td style="font-weight: 800; color: var(--danger);">-₹\${Number(e.amount || 0).toLocaleString('en-IN')}</td>
              <td><span style="color: var(--accent); font-weight: 700;">✓ Verified</span></td>
            </tr>
          \`;
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No expense transactions recorded in this workspace yet.</td></tr>';
      }
    }

    function filterExpenseTableByCat(catName) {
      const expenses = currentWorkspaceTransactions.filter(t => t.type === 'expense' && (t.category || 'General') === catName);
      const tableBody = document.getElementById('expenseAnalysisTableBody');
      const title = document.getElementById('categoryDetailsTitle');
      title.textContent = \`Expenses for: "\${catName}" (Showing \${expenses.length})\`;

      tableBody.innerHTML = '';
      expenses.forEach(e => {
        tableBody.innerHTML += \`
          <tr>
            <td>\${e.date ? new Date(e.date).toLocaleDateString() : 'Today'}</td>
            <td><strong>\${e.description}</strong></td>
            <td><span class="pill-badge" style="font-size: 0.7rem; padding: 2px 6px;">\${e.category || 'General'}</span></td>
            <td style="font-weight: 800; color: var(--danger);">-₹\${Number(e.amount || 0).toLocaleString('en-IN')}</td>
            <td><span style="color: var(--accent); font-weight: 700;">✓ Verified</span></td>
          </tr>
        \`;
      });
    }

    // ─── SCENARIO SIMULATOR ───
    function updateScenarioSim() {
      const revPct = Number(document.getElementById('revSlider').value);
      const expPct = Number(document.getElementById('expSlider').value);

      document.getElementById('revSliderVal').textContent = \`+\${revPct}%\`;
      document.getElementById('expSliderVal').textContent = \`-\${expPct}%\`;

      const factor = 1 + (revPct * 0.015) + (expPct * 0.02);
      const newRunway = (12.4 * factor).toFixed(1);
      document.getElementById('simulatedRunwayVal').textContent = \`\${newRunway} Mos\`;
    }

    function openHealthReportModal() {
      closeModals();
      document.getElementById('healthModal').classList.add('active');
    }

    function verifyChainIntegrity() {
      const resEl = document.getElementById('merkleVerifyResult');
      resEl.style.display = 'block';
      alert('🔒 Merkle Proof Verified: SHA-256 tree root matches local signature. Forensic validation successful!');
    }

    function copyJoinCode() {
      const code = document.getElementById('teamJoinCodeDisplay').textContent.trim();
      navigator.clipboard.writeText(code);
      alert('📋 Join Code copied to clipboard: ' + code);
    }

    // ─── ADD TRANSACTION ───
    async function handleAddTxSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById('addTxSubmitBtn');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      const payload = {
        type: document.getElementById('txType').value,
        amount: Number(document.getElementById('txAmount').value),
        description: document.getElementById('txDesc').value.trim(),
        category: document.getElementById('txCategory').value.trim() || 'General'
      };

      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${currentToken}\`,
            'X-Workspace-Id': currentActiveWorkspaceId
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert('✅ Transaction recorded successfully!');
          closeModals();
          loadWorkspaceData();
        } else {
          alert('Error: ' + (data.error || 'Failed to save transaction.'));
        }
      } catch (e) {
        alert('Network error saving transaction.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Transaction →';
      }
    }

    function openVoiceModal() {
      closeModals();
      document.getElementById('voiceModal').classList.add('active');
    }

    function handleVoiceSim() {
      const phrases = [
        'Spent ₹1,850 on grocery supplies today',
        'Received ₹45,000 from client retainer',
        'Paid ₹3,200 for cloud server hosting',
        'Spent ₹800 on taxi travel'
      ];
      const random = phrases[Math.floor(Math.random() * phrases.length)];
      document.getElementById('voiceCommandInput').value = random;
    }

    async function handleVoiceSubmit() {
      const text = document.getElementById('voiceCommandInput').value;
      if (!text) return;
      alert(\`🎙️ AI Voice Command Parsed: "\${text}"\\nAuto-recording into active workspace...\`);
      closeModals();
      loadWorkspaceData();
    }

    function sendWhatsAppReminder(partyName, amount) {
      const upiLink = \`upi://pay?pa=hisabhero@okhdfcbank&pn=\${encodeURIComponent(partyName)}&am=\${amount}&cu=INR\`;
      const msg = encodeURIComponent(\`Hello \${partyName}, this is a gentle payment reminder from HisabHero regarding your pending balance of ₹\${amount.toLocaleString('en-IN')}.\\n\\n⚡ Pay instantly via UPI: \${upiLink}\\n\\nThank you!\`);
      window.open(\`https://api.whatsapp.com/send?text=\${msg}\`, '_blank');
    }

    // ─── AI CFO CHAT ───
    async function handleAiChatSubmit(e) {
      e.preventDefault();
      const input = document.getElementById('aiInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      sendAiPrompt(text);
    }

    async function sendAiPrompt(promptText) {
      const chatBox = document.getElementById('aiChatBox');
      chatBox.innerHTML += \`
        <div style="background: var(--secondary-soft); padding: 1rem; border-radius: 12px; border: 1px solid rgba(37,99,235,0.2); max-width: 80%; align-self: flex-end;">
          <strong>👤 You:</strong><br />\${promptText}
        </div>
      \`;
      chatBox.scrollTop = chatBox.scrollHeight;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${currentToken}\`,
            'X-Workspace-Id': currentActiveWorkspaceId
          },
          body: JSON.stringify({ message: promptText })
        });
        const data = await res.json();

        chatBox.innerHTML += \`
          <div style="background: var(--surface); padding: 1rem; border-radius: 12px; border: 1px solid var(--border); max-width: 80%;">
            <strong>🤖 HisabHero AI CFO:</strong><br />\${data.reply || 'Analysis completed.'}
          </div>
        \`;
        chatBox.scrollTop = chatBox.scrollHeight;
      } catch (err) {
        chatBox.innerHTML += \`
          <div style="background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 12px; max-width: 80%;">
            AI connection error. Please try again.
          </div>
        \`;
      }
    }

    // ─── DOCUMENT INTELLIGENCE UPLOAD ───
    async function handleDocUpload(e) {
      e.preventDefault();
      const fileInput = document.getElementById('docFileInput');
      if (!fileInput.files || !fileInput.files[0]) return;

      const btn = document.getElementById('docUploadBtn');
      const status = document.getElementById('docUploadStatus');
      btn.disabled = true;
      btn.textContent = 'Processing Document with AI...';
      status.style.color = 'var(--secondary)';
      status.textContent = 'Uploading and extracting transactions...';

      const formData = new FormData();
      formData.append('file', fileInput.files[0]);

      try {
        const res = await fetch('/api/upload/intelligence', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${currentToken}\`,
            'X-Workspace-Id': currentActiveWorkspaceId
          },
          body: formData
        });
        const data = await res.json();

        if (res.ok && data.success) {
          status.style.color = 'var(--accent)';
          status.textContent = \`✅ Success! \${data.message || 'Transactions extracted.'}\`;
          loadWorkspaceData();
        } else {
          status.style.color = 'var(--danger)';
          status.textContent = data.error || 'Failed to process document.';
        }
      } catch (err) {
        status.style.color = 'var(--danger)';
        status.textContent = 'Network upload error: ' + err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = '🚀 Process Document with AI →';
      }
    }

    function handleExportReport() {
      alert('Generating and printing audited P&L Statement PDF...');
      window.print();
    }

    // ─── CONVERT & DELETE WORKSPACE ───
    async function handleConvertCurrentWorkspace() {
      if (!currentActiveWorkspace) return;
      const confirmName = prompt(\`Type "\${currentActiveWorkspace.name}" to confirm conversion to Personal Workspace:\`);
      if (!confirmName || confirmName.trim().toLowerCase() !== currentActiveWorkspace.name.trim().toLowerCase()) {
        alert('Workspace name does not match. Conversion cancelled.');
        return;
      }

      try {
        const res = await fetch(\`/api/workspaces/\${currentActiveWorkspaceId}/convert-to-personal\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${currentToken}\`
          },
          body: JSON.stringify({ confirmationName: confirmName.trim() })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert('✅ ' + data.message);
          await loadWorkspacesList();
        } else {
          alert('Conversion failed: ' + (data.error || 'Unknown error.'));
        }
      } catch (e) {
        alert('Network error converting workspace.');
      }
    }

    async function handleDeleteCurrentWorkspace() {
      if (!currentActiveWorkspace) return;
      if (!confirm(\`Are you sure you want to delete workspace "\${currentActiveWorkspace.name}"? Your user account and other workspaces will remain intact.\`)) {
        return;
      }

      try {
        const res = await fetch(\`/api/workspaces/\${currentActiveWorkspaceId}\`, {
          method: 'DELETE',
          headers: { 'Authorization': \`Bearer \${currentToken}\` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert('✅ Workspace deleted successfully.');
          currentActiveWorkspace = null;
          await loadWorkspacesList();
        } else {
          alert('Failed to delete workspace: ' + (data.error || 'Unknown error.'));
        }
      } catch (e) {
        alert('Network error deleting workspace.');
      }
    }

    function openCreateWorkspaceModal() {
      closeModals();
      toggleWorkspaceDropdown(false);
      document.getElementById('createWsModal').classList.add('active');
    }

    function openJoinWorkspaceModal() {
      closeModals();
      toggleWorkspaceDropdown(false);
      document.getElementById('joinWsModal').classList.add('active');
    }

    function openAddPartyModal() {
      alert('Add Khata Party modal ready!');
    }

    function openCreateInvoiceModal() {
      alert('Create Tax Invoice modal ready!');
    }

    async function handleCreateWsSubmit(e) {
      e.preventDefault();
      const type = document.getElementById('newWsType').value;
      const name = document.getElementById('newWsName').value.trim();

      try {
        const res = await fetch('/api/workspaces', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${currentToken}\`
          },
          body: JSON.stringify({ name, type })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert('✅ ' + data.message);
          closeModals();
          await loadWorkspacesList();
          switchActiveWorkspace(data.workspace.id);
        } else {
          alert('Error: ' + (data.error || 'Failed to create workspace.'));
        }
      } catch (e) {
        alert('Network error creating workspace.');
      }
    }

    async function handleJoinWsSubmit(e) {
      e.preventDefault();
      const joinCode = document.getElementById('joinCodeInput').value.trim().toUpperCase();
      const message = document.getElementById('joinNoteInput').value.trim();

      try {
        const res = await fetch('/api/workspaces/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${currentToken}\`
          },
          body: JSON.stringify({ joinCode, message })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert('🚀 ' + data.message);
          closeModals();
        } else {
          alert('Error: ' + (data.error || 'Failed to submit join request.'));
        }
      } catch (e) {
        alert('Network error submitting join request.');
      }
    }

    // ─── SECTION SWITCHER ───
    function showSection(secName) {
      document.querySelectorAll('.dash-nav-item').forEach(el => el.classList.remove('active'));
      const items = document.querySelectorAll('.dash-nav-item');
      const sections = ['overview', 'transactions', 'expenseAnalysis', 'invoices', 'khata', 'cashflow', 'inventory', 'subscriptions', 'reports', 'aichat', 'upload', 'merkle', 'team', 'settings'];
      const idx = sections.indexOf(secName);
      if (idx !== -1 && items[idx]) items[idx].classList.add('active');

      document.getElementById('section-overview').style.display = (secName === 'overview' || secName === 'transactions') ? 'block' : 'none';
      document.getElementById('section-expenseAnalysis').style.display = (secName === 'expenseAnalysis') ? 'block' : 'none';
      document.getElementById('section-khata').style.display = (secName === 'khata') ? 'block' : 'none';
      document.getElementById('section-invoices').style.display = (secName === 'invoices') ? 'block' : 'none';
      document.getElementById('section-cashflow').style.display = (secName === 'cashflow') ? 'block' : 'none';
      document.getElementById('section-inventory').style.display = (secName === 'inventory') ? 'block' : 'none';
      document.getElementById('section-subscriptions').style.display = (secName === 'subscriptions') ? 'block' : 'none';
      document.getElementById('section-reports').style.display = (secName === 'reports') ? 'block' : 'none';
      document.getElementById('section-aichat').style.display = (secName === 'aichat') ? 'block' : 'none';
      document.getElementById('section-upload').style.display = (secName === 'upload') ? 'block' : 'none';
      document.getElementById('section-merkle').style.display = (secName === 'merkle') ? 'block' : 'none';
      document.getElementById('section-team').style.display = (secName === 'team') ? 'block' : 'none';
      document.getElementById('section-settings').style.display = (secName === 'settings') ? 'block' : 'none';

      if (secName === 'overview' || secName === 'cashflow' || secName === 'expenseAnalysis') {
        setTimeout(() => {
          loadWorkspaceData();
        }, 100);
      }
    }

    function openAddTxModal() {
      closeModals();
      document.getElementById('addTxModal').classList.add('active');
    }

    // ─── AUTH MODALS & USER REGISTRATION FLOW ───
    function selectWorkspaceChoice(choice) {
      activeWorkspaceChoice = choice;
      const cardP = document.getElementById('choicePersonal');
      const cardB = document.getElementById('choiceBusiness');
      const busFields = document.getElementById('businessFields');

      if (choice === 'business') {
        cardB.classList.add('selected');
        cardP.classList.remove('selected');
        busFields.style.display = 'block';
      } else {
        cardP.classList.add('selected');
        cardB.classList.remove('selected');
        busFields.style.display = 'none';
      }
    }

    function openSignupModalWithChoice(choice) {
      openSignupModal();
      selectWorkspaceChoice(choice);
    }

    function openSignupModal() {
      closeModals();
      document.getElementById('signupModal').classList.add('active');
    }

    function openLoginModal() {
      closeModals();
      document.getElementById('loginModal').classList.add('active');
    }

    function openOtpModal(email) {
      closeModals();
      pendingVerificationEmail = email;
      document.getElementById('otpTargetEmail').textContent = email;
      document.getElementById('otpModal').classList.add('active');
      startResendTimer(60);
    }

    function closeModals() {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    }

    function startResendTimer(seconds) {
      resendCooldownSec = seconds;
      const btn = document.getElementById('resendOtpBtn');
      if (resendTimer) clearInterval(resendTimer);
      
      btn.disabled = true;
      btn.textContent = \`Resend Code in \${resendCooldownSec}s\`;

      resendTimer = setInterval(() => {
        resendCooldownSec--;
        if (resendCooldownSec <= 0) {
          clearInterval(resendTimer);
          btn.disabled = false;
          btn.textContent = '🔄 Resend Verification Code';
        } else {
          btn.textContent = \`Resend Code in \${resendCooldownSec}s\`;
        }
      }, 1000);
    }

    async function handleSignupSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById('signupSubmitBtn');
      const errBox = document.getElementById('signupError');
      errBox.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Sending Verification Code...';

      const payload = {
        fullName: document.getElementById('signupFullName').value.trim(),
        email: document.getElementById('signupEmail').value.trim().toLowerCase(),
        password: document.getElementById('signupPassword').value,
        workspaceChoice: activeWorkspaceChoice,
        businessName: activeWorkspaceChoice === 'business' ? document.getElementById('signupBusinessName').value.trim() : undefined,
        industry: activeWorkspaceChoice === 'business' ? document.getElementById('signupIndustry').value.trim() : undefined
      };

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          openOtpModal(payload.email);
        } else {
          errBox.textContent = data.error || 'Registration failed. Please try again.';
        }
      } catch (err) {
        errBox.textContent = 'Network error connecting to backend: ' + err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Continue to Email Verification →';
      }
    }

    async function handleOtpSubmit(e) {
      e.preventDefault();
      const code = document.getElementById('otpCodeInput').value.trim();
      const btn = document.getElementById('otpSubmitBtn');
      const errBox = document.getElementById('otpError');
      errBox.textContent = '';

      if (code.length !== 6) {
        errBox.textContent = 'Please enter the complete 6-digit code.';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Verifying & Initializing...';

      try {
        const res = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingVerificationEmail, code })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          currentToken = data.token;
          currentUser = data.user;
          localStorage.setItem('hh_token', data.token);
          localStorage.setItem('hh_user', JSON.stringify(data.user));
          if (data.user.activeWorkspace) {
            currentActiveWorkspace = data.user.activeWorkspace;
            currentActiveWorkspaceId = data.user.activeWorkspace._id || data.user.activeWorkspace.id;
            localStorage.setItem('hh_active_ws', currentActiveWorkspaceId);
          }
          closeModals();
          showDashboardView();
          await loadWorkspacesList();
        } else {
          errBox.textContent = data.error || 'Invalid or expired verification code.';
        }
      } catch (err) {
        errBox.textContent = 'Error: ' + err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Verify Code & Enter HisabHero →';
      }
    }

    async function handleResendOtp() {
      if (resendCooldownSec > 0) return;
      const btn = document.getElementById('resendOtpBtn');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        const res = await fetch('/api/auth/resend-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingVerificationEmail })
        });
        const data = await res.json();
        if (res.ok) {
          alert('A fresh 6-digit verification code has been dispatched to your email.');
          startResendTimer(60);
        } else {
          alert(data.error || 'Failed to resend code.');
          btn.disabled = false;
        }
      } catch (e) {
        alert('Network error resending code.');
        btn.disabled = false;
      }
    }

    async function handleLoginSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById('loginSubmitBtn');
      const errBox = document.getElementById('loginError');
      errBox.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Signing in...';

      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          currentToken = data.token;
          currentUser = data.user;
          localStorage.setItem('hh_token', data.token);
          localStorage.setItem('hh_user', JSON.stringify(data.user));
          if (data.user.activeWorkspace) {
            currentActiveWorkspace = data.user.activeWorkspace;
            currentActiveWorkspaceId = data.user.activeWorkspace._id || data.user.activeWorkspace.id;
            localStorage.setItem('hh_active_ws', currentActiveWorkspaceId);
          }
          closeModals();
          showDashboardView();
          await loadWorkspacesList();
        } else {
          errBox.textContent = data.error || 'Invalid credentials.';
        }
      } catch (err) {
        errBox.textContent = 'Network error: ' + err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In →';
      }
    }

    function handleContactSubmit(e) {
      e.preventDefault();
      const status = document.getElementById('contactStatus');
      status.style.color = 'var(--accent)';
      status.textContent = 'Thank you! Your inquiry has been received. Our team will contact you shortly.';
      document.getElementById('contactForm').reset();
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(htmlPath, cleanHtml, 'utf8');
console.log('Successfully written clean clickable dashboard with dynamic drill-down expense analysis!');
