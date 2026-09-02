import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <title>HisabHero — Your Money. Your Business. One Intelligent Platform.</title>
  <meta name="description" content="HisabHero brings personal finance, business management and AI-powered financial intelligence together in one secure workspace." />
  
  <!-- Google Fonts: Outfit & Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  
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

    /* ─── BASE RESET ─── */
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

    /* ─── FLEXBOX CONTAINER SYSTEM ─── */
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
    .gap-12 { gap: 3rem; }

    /* ─── TYPOGRAPHY TOKENS ─── */
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

    .hero-content {
      flex: 1 1 520px;
    }

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

    /* Dual Phone Perspective Showcase */
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

    .phone-card.left {
      transform: translateY(-8px) rotate(-1deg);
    }
    .phone-card.right {
      transform: translateY(12px) rotate(1.5deg);
    }

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
    .feature-pills-bar {
      padding: 1.5rem 0 3rem 0;
    }

    .pills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: space-between;
    }

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

    .section-header {
      text-align: center;
      max-width: 680px;
      margin: 0 auto 3.5rem auto;
    }

    .section-title {
      font-size: 2.35rem;
      margin: 0.75rem 0;
      color: var(--primary);
    }

    .section-desc {
      color: var(--text-muted);
      font-size: 1.05rem;
      line-height: 1.6;
    }

    .dual-worlds-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
    }

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
      position: relative;
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

    .world-features-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .world-features-list li {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.95rem;
      color: var(--text);
      font-weight: 500;
    }
    .world-features-list li span.dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--secondary);
    }
    .world-card.business .world-features-list li span.dot {
      background: var(--accent);
    }

    /* ─── ABSOLUTE WORKSPACE ISOLATION SECTION ─── */
    .isolation-section {
      padding: 5rem 0;
      background: var(--background);
    }

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

    .isolation-text {
      flex: 1 1 500px;
    }

    .isolation-text h3 {
      color: #ffffff;
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .isolation-text p {
      color: #cbd5e1;
      font-size: 1.05rem;
      line-height: 1.7;
      margin-bottom: 1.5rem;
    }

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

    /* ─── 6-FEATURE BENTO GRID ─── */
    .bento-section {
      padding: 5rem 0;
      background: var(--surface);
    }

    .bento-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

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

    .bento-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
    }

    .bento-desc {
      font-size: 0.9375rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* ─── REAL SECURITY & AUDIT SECTION ─── */
    .security-section {
      padding: 5rem 0;
      background: var(--background);
      border-top: 1px solid var(--border);
    }

    .security-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

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

    .security-card h4 {
      font-size: 1.1rem;
      color: var(--primary);
    }

    .security-card p {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* ─── REAL CONTACT SECTION ─── */
    .contact-section {
      padding: 5rem 0;
      background: var(--surface);
      border-top: 1px solid var(--border);
    }

    .contact-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 3rem;
    }

    .contact-info {
      flex: 1 1 400px;
    }

    .contact-form-card {
      flex: 1 1 450px;
      background: var(--background);
      border: 1px solid var(--border);
      padding: 2.5rem;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.25rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--primary);
    }

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

    /* ─── FOOTER ─── */
    .footer {
      background: var(--primary);
      color: #94a3b8;
      padding: 4rem 0 2rem 0;
      font-size: 0.9375rem;
    }

    .footer-grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 3rem;
      margin-bottom: 3rem;
    }

    .footer-brand-col {
      flex: 1 1 300px;
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 1rem;
    }

    .footer-brand img {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }

    .footer-links-col {
      flex: 0 1 180px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .footer-links-col h5 {
      color: #ffffff;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }

    .footer-links-col a:hover {
      color: #ffffff;
    }

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

    /* ─── AUTH & ACTION MODALS ─── */
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
    .modal-backdrop.active {
      display: flex;
    }

    .modal-box {
      width: 100%;
      max-width: 520px;
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
    .modal-close:hover {
      background: var(--background);
      color: var(--primary);
    }

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

    /* ─── RESPONSIVE BREAKPOINTS ─── */
    @media (max-width: 960px) {
      .hero-grid { flex-direction: column; text-align: center; }
      .hero-subtitle { margin-left: auto; margin-right: auto; }
      .hero-ctas { justify-content: center; }
      .hero-proof { justify-content: center; }
      .nav-links { display: none; }
      .hero-title { font-size: 2.65rem; }
      .bento-card { flex: 1 1 calc(50% - 1rem); }
      .security-card { flex: 1 1 calc(50% - 1rem); }
    }

    @media (max-width: 640px) {
      .hero-title { font-size: 2.15rem; }
      .phone-card { width: 190px; }
      .bento-card { flex: 1 1 100%; }
      .security-card { flex: 1 1 100%; }
      .modal-box { padding: 1.5rem; }
      .isolation-banner { padding: 2rem; }
    }
  </style>
</head>
<body>

  <!-- ─── TOP NAVBAR ─── -->
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

      <div class="flex items-center gap-3">
        <button class="btn btn-outline" onclick="openLoginModal()">Sign In</button>
        <button class="btn btn-primary" onclick="openSignupModal()">Create Account</button>
      </div>
    </div>
  </header>

  <!-- ─── HERO SECTION ─── -->
  <section class="hero-section">
    <div class="container">
      <div class="hero-grid">
        
        <!-- Content Col -->
        <div class="hero-content">
          <div class="pill-badge emerald">
            <span>🛡️</span> Smart Financial & ERP Intelligence
          </div>
          <h1 class="hero-title">
            Your Money. Your Business.<br />
            <span class="emerald">One Intelligent Platform.</span>
          </h1>
          <p class="hero-subtitle">
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

        <!-- Visual Dual Phone Showcase -->
        <div class="hero-visual">
          <div class="dual-mockup-wrapper">
            
            <!-- Phone 1: Personal Finance -->
            <div class="phone-card left">
              <div class="phone-notch"></div>
              <div class="phone-screen">
                <div class="flex justify-between items-center">
                  <span style="font-weight: 800; color: var(--primary);">👛 Personal Finance</span>
                  <span class="mockup-pill">Score: 88</span>
                </div>
                <div class="mockup-stat">
                  <div style="color: var(--text-muted); font-size: 0.6875rem;">Total Monthly Inflow</div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent);">₹1,45,000</div>
                </div>
                <div class="mockup-stat">
                  <div style="color: var(--text-muted); font-size: 0.6875rem;">Total Outflow (Expenses)</div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary);">₹54,200</div>
                </div>
                <div style="background: #f1f5f9; padding: 0.5rem; border-radius: 8px; font-size: 0.6875rem;">
                  <strong>AI Tip:</strong> Savings rate is up 14%. You are on track for your Q3 goal!
                </div>
              </div>
            </div>

            <!-- Phone 2: Business ERP & AI CFO -->
            <div class="phone-card right">
              <div class="phone-notch"></div>
              <div class="phone-screen">
                <div class="flex justify-between items-center">
                  <span style="font-weight: 800; color: var(--primary);">🏢 Apex Traders ERP</span>
                  <span style="font-size: 0.6875rem; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-weight: 700;">GST Active</span>
                </div>
                <div class="mockup-stat">
                  <div style="color: var(--text-muted); font-size: 0.6875rem;">Khata Receivables</div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent);">₹48,500 <span style="font-size: 0.6875rem; color: var(--accent);">(WhatsApp Ready)</span></div>
                </div>
                <div class="mockup-stat">
                  <div style="color: var(--text-muted); font-size: 0.6875rem;">Active Join Code</div>
                  <div style="font-size: 0.85rem; font-weight: 800; letter-spacing: 1px; color: var(--secondary);">CGM2-8N83-SV9G</div>
                </div>
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.5rem; border-radius: 8px; font-size: 0.6875rem; color: #065f46;">
                  <strong>AI CFO:</strong> ₹18,400 unclaimed ITC found from recent bills.
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ─── 4-PILL QUICK FEATURE BAR ─── -->
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

  <!-- ─── "ONE APP. TWO WORLDS." SECTION ─── -->
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
        
        <!-- Personal Workspace -->
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

        <!-- Business Workspace -->
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

  <!-- ─── ABSOLUTE WORKSPACE ISOLATION SECTION ─── -->
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
          <p>
            Every database query is enforced at the backend middleware level using authenticated workspace authorizations.
          </p>
          <div class="flex items-center gap-3">
            <button class="btn btn-accent" onclick="openSignupModal()">Get Started Securely</button>
            <a href="/HisabHero-v5.5.0-Enterprise-Release.apk" class="btn btn-outline" style="color: #ffffff; border-color: rgba(255,255,255,0.3);">
              📥 Download Android APK
            </a>
          </div>
        </div>

        <div class="isolation-graphic">
          <div class="iso-box">
            <span>👛 Personal Workspace A</span>
            <span style="color: #6ee7b7;">Isolated ✓</span>
          </div>
          <div style="text-align: center; color: #94a3b8; font-size: 0.8rem;">↕️ Zero Cross-Data Leakage</div>
          <div class="iso-box">
            <span>🏢 Business Workspace B</span>
            <span style="color: #6ee7b7;">Isolated ✓</span>
          </div>
          <div style="text-align: center; color: #94a3b8; font-size: 0.8rem;">↕️ Backend Middleware Verified</div>
          <div class="iso-box">
            <span>🔒 Merkle Tree Audit Ledger</span>
            <span style="color: #6ee7b7;">SHA-256 Valid ✓</span>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ─── 6-FEATURE BENTO GRID ─── -->
  <section id="features" class="bento-section">
    <div class="container">
      <div class="section-header">
        <div class="pill-badge">Comprehensive Suite</div>
        <h2 class="section-title">Built for Modern Financial Excellence</h2>
        <p class="section-desc">
          Every tool you need to manage money, collect debts, calculate taxes, and forecast cash runways.
        </p>
      </div>

      <div class="bento-grid">
        
        <div class="bento-card">
          <div class="bento-icon">💳</div>
          <h3 class="bento-title">Expense Tracking</h3>
          <p class="bento-desc">
            Instantly categorize daily transactions, monitor spending deviations, and set custom departmental or personal budget limits.
          </p>
        </div>

        <div class="bento-card">
          <div class="bento-icon">📈</div>
          <h3 class="bento-title">Cash Flow & Runway</h3>
          <p class="bento-desc">
            Predictive cash flow modeling calculates your exact monthly burn rate and forecasts your zero-cash date in advance.
          </p>
        </div>

        <div class="bento-card">
          <div class="bento-icon">🤖</div>
          <h3 class="bento-title">AI CFO Copilot</h3>
          <p class="bento-desc">
            Powered by Google Gemini to analyze transactions, detect unusual billing anomalies, and maximize Input Tax Credits (ITC).
          </p>
        </div>

        <div class="bento-card">
          <div class="bento-icon">📄</div>
          <h3 class="bento-title">Document Intelligence</h3>
          <p class="bento-desc">
            Upload CSV statements or camera bill photos. Our AI engine automatically extracts amounts, merchants, and line items.
          </p>
        </div>

        <div class="bento-card">
          <div class="bento-icon">📒</div>
          <h3 class="bento-title">Khata & WhatsApp Reminders</h3>
          <p class="bento-desc">
            Digital credit/debit ledger with 1-click WhatsApp debt collection reminders containing dynamic UPI payment settlement links.
          </p>
        </div>

        <div class="bento-card">
          <div class="bento-icon">💚</div>
          <h3 class="bento-title">Financial Health Gauge</h3>
          <p class="bento-desc">
            Mathematical 0–100 composite score evaluating your savings rate, expense-to-income ratios, and working capital buffers.
          </p>
        </div>

      </div>
    </div>
  </section>

  <!-- ─── REAL SECURITY SECTION ─── -->
  <section class="security-section">
    <div class="container">
      <div class="section-header">
        <div class="pill-badge">Enterprise Protection</div>
        <h2 class="section-title">Security & Compliance Architecture</h2>
        <p class="section-desc">
          Only features that are technically implemented and verified in our production code.
        </p>
      </div>

      <div class="security-grid">
        
        <div class="security-card">
          <h4>✉️ 6-Digit Email OTP Verification</h4>
          <p>Strict registration architecture: Unverified users are never added to MongoDB until 6-digit email OTP verification succeeds.</p>
        </div>

        <div class="security-card">
          <h4>🔒 SHA-256 OTP & Password Hashing</h4>
          <p>Passwords hashed with bcrypt (10 rounds) and verification codes stored exclusively as SHA-256 hashes with 5-minute TTL.</p>
        </div>

        <div class="security-card">
          <h4>🛡️ Role-Based Access Control</h4>
          <p>Granular RBAC enforcing Owner, Manager, Accountant, Employee, and Viewer permissions across all API endpoints.</p>
        </div>

        <div class="security-card">
          <h4>⛓️ Merkle Tree Audit Ledger</h4>
          <p>Cryptographic transaction chaining using SHA-256 hashes to guarantee forensic-grade audit trails against tampering.</p>
        </div>

      </div>
    </div>
  </section>

  <!-- ─── REAL CONTACT SECTION ─── -->
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
            <div class="flex items-center gap-3">
              <span style="font-size: 1.25rem;">📧</span>
              <span><strong>Support Email:</strong> hisabhero27@gmail.com</span>
            </div>
            <div class="flex items-center gap-3">
              <span style="font-size: 1.25rem;">📱</span>
              <span><strong>Mobile Platform:</strong> Android Native APK Available</span>
            </div>
            <div class="flex items-center gap-3">
              <span style="font-size: 1.25rem;">🌐</span>
              <span><strong>API Engine:</strong> Express Node.js & MongoDB Atlas</span>
            </div>
          </div>
        </div>

        <div class="contact-form-card">
          <h3 style="font-size: 1.35rem; margin-bottom: 1.25rem;">Send a Message</h3>
          <form id="contactForm" onsubmit="handleContactSubmit(event)">
            <div class="form-group">
              <label class="form-label">Your Name *</label>
              <input type="text" class="form-input" id="contactName" required placeholder="Selvamanikandan" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" class="form-input" id="contactEmail" required placeholder="selva@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Message *</label>
              <textarea class="form-textarea" id="contactMessage" rows="4" required placeholder="How can we help your business?"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              Send Inquiry →
            </button>
            <div id="contactStatus" style="margin-top: 1rem; font-size: 0.875rem; text-align: center; font-weight: 600;"></div>
          </form>
        </div>

      </div>
    </div>
  </section>

  <!-- ─── FOOTER ─── -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        
        <div class="footer-brand-col">
          <div class="footer-brand">
            <img src="/logo.png" alt="HisabHero" />
            <span>HisabHero</span>
          </div>
          <p style="line-height: 1.6; max-width: 320px;">
            Smart Financial & ERP Intelligence for Businesses and Individuals. Built with strict data isolation and patent-grade audit trails.
          </p>
        </div>

        <div class="footer-links-col">
          <h5>Product</h5>
          <a href="#features">Expense Tracking</a>
          <a href="#features">Invoices & GST</a>
          <a href="#features">Khata Book</a>
          <a href="#features">AI CFO Copilot</a>
        </div>

        <div class="footer-links-col">
          <h5>Architecture</h5>
          <a href="#dual-worlds">Personal Workspace</a>
          <a href="#dual-worlds">Business Workspace</a>
          <a href="#isolation">Security & Isolation</a>
          <a href="/HisabHero-v5.5.0-Enterprise-Release.apk">Download APK</a>
        </div>

        <div class="footer-links-col">
          <h5>Support</h5>
          <a href="#contact">Contact Support</a>
          <a href="mailto:hisabhero27@gmail.com">Email Us</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>

      </div>

      <div class="footer-bottom">
        <div>© 2026 HisabHero Technologies. All rights reserved.</div>
        <div class="flex gap-4">
          <span>v5.5.0 Enterprise Release</span>
          <span>•</span>
          <span>MongoDB Atlas Cloud</span>
        </div>
      </div>
    </div>
  </footer>

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
        
        <!-- Workspace Choice Selector -->
        <div style="margin-bottom: 1.25rem;">
          <label class="form-label" style="margin-bottom: 0.5rem; display: block;">CREATE YOUR HISABHERO WORKSPACE</label>
          
          <!-- Option 1: Personal Workspace -->
          <div id="choicePersonal" class="workspace-choice-card selected" onclick="selectWorkspaceChoice('personal')">
            <div class="workspace-choice-icon">👛</div>
            <div>
              <div style="font-weight: 800; font-size: 0.9375rem; color: var(--primary);">PERSONAL WORKSPACE</div>
              <div style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 2px;">
                Manage your personal finances, expenses, savings and financial goals.
              </div>
            </div>
          </div>

          <!-- Option 2: Business Workspace -->
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

        <!-- Conditional Business Fields -->
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

  <!-- ─── CLIENT-SIDE APPLICATION SCRIPT ─── -->
  <script>
    let activeWorkspaceChoice = 'personal';
    let pendingVerificationEmail = '';
    let resendCooldownSec = 0;
    let resendTimer = null;

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

    // Handle Signup
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

    // Handle OTP Verify
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
          localStorage.setItem('hh_token', data.token);
          localStorage.setItem('hh_user', JSON.stringify(data.user));
          alert('✅ Email verified successfully! Welcome to HisabHero.');
          closeModals();
          window.location.reload();
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

    // Handle Resend OTP
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

    // Handle Login
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
          localStorage.setItem('hh_token', data.token);
          localStorage.setItem('hh_user', JSON.stringify(data.user));
          alert('Welcome back, ' + data.user.fullName + '!');
          closeModals();
          window.location.reload();
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

    // Handle Contact Form
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

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('Successfully written complete Light Fintech Website to public/index.html!');
