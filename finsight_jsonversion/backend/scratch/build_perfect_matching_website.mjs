import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HisabHero - Take Control of Your Finances</title>
  <meta name="description" content="HisabHero helps you track expenses, manage money, understand your financial health and make smarter decisions — all in one simple app.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg: #ffffff;
      --bg-alt: #f8fafc;
      --card: #ffffff;
      --emerald: #059669;
      --emerald-dark: #047857;
      --emerald-light: #d1fae5;
      --emerald-xlight: #ecfdf5;
      --cyan: #0ea5e9;
      --purple: #8b5cf6;
      --purple-light: #f3e8ff;
      --text: #0f172a;
      --text-secondary: #475569;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --border-light: #f1f5f9;
      --radius-sm: 8px;
      --radius: 14px;
      --radius-lg: 20px;
      --radius-xl: 28px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
      --shadow-md: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02);
      --shadow-lg: 0 20px 35px -8px rgba(0,0,0,0.08), 0 10px 15px -5px rgba(0,0,0,0.04);
      --shadow-hero: 0 25px 50px -12px rgba(5,150,105,0.18);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow-x: hidden;
    }

    h1, h2, h3, h4, h5 {
      font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.025em;
    }

    .container {
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ─── TOP NAVBAR ─── */
    .site-header {
      position: sticky;
      top: 0;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-light);
      z-index: 500;
      padding: 14px 0;
    }
    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .brand-logo img {
      width: 36px;
      height: 36px;
      border-radius: 9px;
    }
    .brand-name {
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 900;
      color: var(--text);
      letter-spacing: -0.5px;
    }
    .brand-name span {
      color: var(--emerald);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 28px;
      list-style: none;
    }
    .nav-links a {
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.92rem;
      text-decoration: none;
      transition: color 0.2s;
    }
    .nav-links a:hover {
      color: var(--emerald);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* ─── BUTTONS ─── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.92rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1.5px solid transparent;
      font-family: inherit;
    }
    .btn:hover {
      transform: translateY(-1px);
    }
    .btn-emerald {
      background: var(--emerald);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(5,150,105,0.3);
    }
    .btn-emerald:hover {
      background: var(--emerald-dark);
      box-shadow: 0 6px 20px rgba(5,150,105,0.4);
    }
    .btn-outline {
      background: #ffffff;
      color: var(--text);
      border-color: var(--border);
    }
    .btn-outline:hover {
      border-color: var(--emerald);
      color: var(--emerald);
      background: var(--emerald-xlight);
    }
    .btn-lg {
      padding: 14px 28px;
      font-size: 1rem;
      border-radius: 12px;
    }

    /* ─── LANGUAGE DROPDOWN ─── */
    .lang-dropdown { position: relative; display: inline-block; }
    .lang-btn {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 7px 14px;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .lang-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 6px;
      box-shadow: var(--shadow-lg);
      display: none;
      min-width: 175px;
      z-index: 1000;
    }
    .lang-menu.active { display: block; }
    .lang-item {
      padding: 8px 12px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      border-radius: 8px;
      cursor: pointer;
    }
    .lang-item:hover { background: var(--emerald-xlight); color: var(--emerald); }
    .lang-item.active { background: var(--emerald-xlight); color: var(--emerald); font-weight: 800; }

    /* ─── HERO SECTION ─── */
    .hero-section {
      padding: 60px 0 70px 0;
      background: radial-gradient(circle at 80% 20%, rgba(16,185,129,0.08) 0%, transparent 60%),
                  radial-gradient(circle at 10% 80%, rgba(14,165,233,0.06) 0%, transparent 50%);
      position: relative;
      overflow: hidden;
    }
    .hero-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.95fr;
      gap: 40px;
      align-items: center;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--emerald-xlight);
      border: 1px solid rgba(5,150,105,0.25);
      color: var(--emerald);
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 800;
      margin-bottom: 20px;
    }
    .hero-title {
      font-size: 3.4rem;
      line-height: 1.12;
      margin-bottom: 18px;
      letter-spacing: -1.2px;
    }
    .hero-title .accent {
      color: var(--emerald);
    }
    .hero-sub {
      font-size: 1.15rem;
      color: var(--text-secondary);
      line-height: 1.65;
      margin-bottom: 28px;
      max-width: 520px;
    }
    .hero-ctas {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 28px;
    }
    .hero-checklist {
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-secondary);
      flex-wrap: wrap;
    }
    .hero-checklist span {
      color: var(--emerald);
      margin-right: 4px;
    }

    /* ─── DUAL PHONE MOCKUPS IN HERO ─── */
    .hero-phones-wrap {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .floating-shape {
      position: absolute;
      border-radius: 18px;
      padding: 10px;
      background: #ffffff;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      animation: float 4s ease-in-out infinite alternate;
    }
    @keyframes float {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-8px); }
    }

    .phone-mockup-1 {
      width: 250px;
      background: #0f172a;
      border-radius: 36px;
      border: 5px solid #1e293b;
      padding: 10px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      position: relative;
      z-index: 2;
    }
    .phone-mockup-2 {
      width: 230px;
      background: #0f172a;
      border-radius: 34px;
      border: 5px solid #1e293b;
      padding: 10px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2);
      position: absolute;
      right: -20px;
      top: 30px;
      z-index: 1;
    }
    .phone-screen {
      background: #06111f;
      border-radius: 26px;
      padding: 14px 12px;
      color: #ffffff;
    }

    /* ─── 4-PILL QUICK FEATURE BAR ─── */
    .features-bar {
      padding: 20px 0 40px 0;
    }
    .pill-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .feature-pill-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: var(--shadow-sm);
      transition: all 0.25s ease;
    }
    .feature-pill-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
      border-color: rgba(5,150,105,0.3);
    }
    .pill-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .pill-title {
      font-weight: 800;
      font-size: 0.92rem;
      color: var(--text);
    }
    .pill-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 1px;
    }

    /* ─── WHY HISABHERO SECTION ─── */
    .why-section {
      padding: 70px 0;
      text-align: center;
      background: var(--bg-alt);
    }
    .section-heading {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    .section-subtitle {
      font-size: 1.05rem;
      color: var(--text-secondary);
      margin-bottom: 45px;
    }
    .why-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
    }
    .why-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px 16px;
      text-align: center;
      box-shadow: var(--shadow-sm);
      transition: all 0.25s ease;
    }
    .why-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: rgba(5,150,105,0.3);
    }
    .why-icon-box {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      margin: 0 auto 16px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .why-title {
      font-size: 1rem;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .why-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.45;
    }

    /* ─── SMART MONEY MANAGEMENT SECTION ─── */
    .two-worlds-section {
      padding: 80px 0;
    }
    .two-worlds-grid {
      display: grid;
      grid-template-columns: 0.95fr 1.05fr;
      gap: 50px;
      align-items: center;
    }
    .workspaces-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }
    .workspace-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      box-shadow: var(--shadow-sm);
    }
    .workspace-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .workspace-card-title {
      font-size: 1.05rem;
      font-weight: 800;
    }
    .workspace-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.88rem;
      color: var(--text-secondary);
      font-weight: 600;
    }
    .workspace-list li {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .workspace-list li span {
      color: var(--emerald);
      font-weight: 800;
    }

    /* ─── HOW IT WORKS SECTION ─── */
    .how-section {
      padding: 70px 0;
      background: var(--bg-alt);
      text-align: center;
    }
    .steps-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      margin-top: 40px;
    }
    .step-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 28px 24px;
      flex: 1;
      max-width: 320px;
      text-align: center;
      box-shadow: var(--shadow-sm);
    }
    .step-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: var(--emerald-xlight);
      color: var(--emerald);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      margin: 0 auto 16px auto;
    }
    .step-name {
      font-size: 1.05rem;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .step-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .step-arrow {
      font-size: 1.5rem;
      color: #94a3b8;
    }

    /* ─── READY CTA BANNER ─── */
    .cta-banner-section {
      padding: 60px 0;
    }
    .cta-banner-box {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid rgba(5,150,105,0.25);
      border-radius: 24px;
      padding: 36px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 30px -5px rgba(5,150,105,0.12);
    }
    .cta-banner-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .cta-banner-icon {
      font-size: 40px;
    }
    .cta-banner-title {
      font-size: 1.5rem;
      font-weight: 900;
      color: #064e3b;
      margin-bottom: 4px;
    }
    .cta-banner-sub {
      font-size: 0.95rem;
      color: #047857;
      font-weight: 500;
    }
    .app-badges {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .store-badge-btn {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 700;
      transition: transform 0.2s;
    }
    .store-badge-btn:hover {
      transform: translateY(-2px);
    }

    /* ─── SITE FOOTER ─── */
    .site-footer {
      background: #ffffff;
      border-top: 1px solid var(--border);
      padding: 30px 0;
      font-size: 0.88rem;
      color: var(--text-muted);
    }
    .footer-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .footer-links {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .footer-links a {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 600;
    }
    .footer-links a:hover {
      color: var(--emerald);
    }

    /* ─── AUTH MODALS ─── */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15,23,42,0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      z-index: 1000; display: none; align-items: center; justify-content: center; padding: 1.5rem;
    }
    .modal-backdrop.active { display: flex; }
    .modal-card {
      background: #fff; border-radius: var(--radius-xl); padding: 2.25rem;
      width: 100%; max-width: 440px; box-shadow: var(--shadow-hero);
      transform: scale(0.95); transition: transform 0.3s ease;
    }
    .modal-backdrop.active .modal-card { transform: scale(1); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .modal-title { font-size: 1.5rem; font-weight: 800; color: var(--text); }
    .modal-close { background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); }

    .form-group { margin-bottom: 1.25rem; }
    .form-label { display: block; font-size: .85rem; font-weight: 700; color: var(--text); margin-bottom: 6px; }
    .form-input { width: 100%; padding: .8rem 1rem; border-radius: var(--radius); border: 1.5px solid var(--border); font-size: .95rem; font-family: inherit; outline: none; }
    .form-input:focus { border-color: var(--emerald); }
    .form-msg { padding: .75rem 1rem; border-radius: var(--radius); font-size: .85rem; margin-bottom: 1rem; display: none; }
    .form-error-msg { background: #fee2e2; color: #ef4444; }
  </style>
</head>
<body>

<!-- ─── TOP NAVBAR ─── -->
<header class="site-header">
  <div class="container nav-inner">
    <a href="#" class="brand-logo">
      <img src="/logo.png" alt="HisabHero Logo">
      <span class="brand-name">Hisab<span>Hero</span></span>
    </a>

    <ul class="nav-links">
      <li><a href="#home">Home</a></li>
      <li><a href="#features">Features</a></li>
      <li><a href="#workspaces">Security</a></li>
      <li><a href="#how-it-works">About</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>

    <div class="nav-actions" id="navActions">
      <div class="lang-dropdown" id="langDropdown">
        <button class="lang-btn" onclick="toggleLangMenu(event)" type="button">
          <span id="currentLangLabel">🌐 English</span>
          <span style="font-size: .65rem; color: var(--text-muted);">▼</span>
        </button>
        <div class="lang-menu" id="langMenu">
          <div class="lang-item active" onclick="selectWebsiteLanguage('en', '🌐 English')">🌐 English</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('ta', '🇮🇳 Tamil (தமிழ்)')">🇮🇳 Tamil (தமிழ்)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('hi', '🇮🇳 Hindi (हिंदी)')">🇮🇳 Hindi (हिंदी)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('mr', '🇮🇳 Marathi (मराठी)')">🇮🇳 Marathi (मराठी)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('gu', '🇮🇳 Gujarati (ગુજરાતી)')">🇮🇳 Gujarati (ગુજરાતી)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('te', '🇮🇳 Telugu (తెలుగు)')">🇮🇳 Telugu (తెలుగు)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('kn', '🇮🇳 Kannada (ಕನ್ನಡ)')">🇮🇳 Kannada (ಕನ್ನಡ)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('bn', '🇮🇳 Bengali (বাংলা)')">🇮🇳 Bengali (বাংলা)</div>
        </div>
      </div>

      <button class="btn btn-outline" onclick="openModal('loginModal')">Sign In</button>
      <button class="btn btn-emerald" onclick="openModal('signupModal')">Download App</button>
    </div>
  </div>
</header>

<div id="landingView">
  
  <!-- ─── HERO SECTION ─── -->
  <section class="hero-section" id="home">
    <div class="container hero-grid">
      
      <!-- LEFT HERO TEXT -->
      <div>
        <div class="hero-badge">
          <span>🛡️</span> Your Financial Hero
        </div>

        <h1 class="hero-title">
          Take Control of Your <span class="accent">Finances.</span>
        </h1>

        <p class="hero-sub">
          HisabHero helps you track expenses, manage money, understand your financial health and make smarter decisions — all in one simple app.
        </p>

        <div class="hero-ctas">
          <button class="btn btn-emerald btn-lg" onclick="openModal('signupModal')">
            <span>📥 Get Started</span>
          </button>
          <a href="#features" class="btn btn-outline btn-lg">
            Learn More
          </a>
        </div>

        <div class="hero-checklist">
          <div><span>✓</span> Personal Finance</div>
          <div><span>✓</span> Business Finance</div>
          <div><span>✓</span> AI Insights</div>
        </div>
      </div>

      <!-- RIGHT HERO DUAL PHONE PREVIEWS -->
      <div class="hero-phones-wrap">
        <!-- Floating 3D Badge Icons -->
        <div class="floating-shape" style="top: 10px; left: -10px;">
          <span style="font-size: 22px;">👛</span>
        </div>
        <div class="floating-shape" style="top: 180px; left: -25px; animation-delay: -1.5s;">
          <span style="font-size: 22px;">📈</span>
        </div>
        <div class="floating-shape" style="bottom: 40px; left: 10px; animation-delay: -2.5s;">
          <span style="font-size: 22px;">💳</span>
        </div>

        <!-- Phone 1: Dashboard View -->
        <div class="phone-mockup-1">
          <div class="phone-screen">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px;">
              <img src="/logo.png" style="width: 18px; height: 18px; border-radius: 4px;">
              <span style="font-size: 11px; font-weight: 800;">HisabHero</span>
            </div>

            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 2px;">Good morning, Selva!</div>
            
            <div style="background: #132238; border-radius: 14px; padding: 10px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.06);">
              <div style="display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8;">
                <span>Total Balance 💰</span>
                <span style="color: #10b981;">+12.8%</span>
              </div>
              <div style="font-size: 18px; font-weight: 900; color: #fff; margin: 2px 0;">₹84,500</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
              <div style="background: #1e293b; border-radius: 10px; padding: 6px 8px;">
                <div style="font-size: 8px; color: #94a3b8;">Income</div>
                <div style="font-size: 11px; font-weight: 800; color: #10b981;">₹28,000</div>
              </div>
              <div style="background: #1e293b; border-radius: 10px; padding: 6px 8px;">
                <div style="font-size: 8px; color: #94a3b8;">Expenses</div>
                <div style="font-size: 11px; font-weight: 800; color: #ef4444;">₹19,500</div>
              </div>
            </div>

            <div style="font-size: 9px; font-weight: 700; color: #94a3b8; margin-bottom: 4px;">Cash Flow</div>
            <div style="height: 24px; background: rgba(16,185,129,0.15); border-radius: 6px; margin-bottom: 8px; border: 1px dashed #10b981;"></div>

            <div style="font-size: 9px; font-weight: 700; color: #94a3b8; margin-bottom: 4px;">Recent Transactions</div>
            <div style="font-size: 9px; display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span>🍔 Food & Dining</span>
              <span style="color: #ef4444; font-weight: 700;">-₹450</span>
            </div>
            <div style="font-size: 9px; display: flex; justify-content: space-between; padding: 3px 0;">
              <span>💼 Salary</span>
              <span style="color: #10b981; font-weight: 700;">+₹25,000</span>
            </div>
          </div>
        </div>

        <!-- Phone 2: AI CFO View -->
        <div class="phone-mockup-2">
          <div class="phone-screen">
            <div style="font-size: 11px; font-weight: 800; color: #38bdf8; margin-bottom: 8px;">🤖 AI CFO</div>
            
            <div style="background: #1e293b; border-radius: 12px; padding: 8px 10px; font-size: 9px; line-height: 1.4; color: #f8fafc; margin-bottom: 8px;">
              <strong>Hi Selva! 👋</strong><br>I've analyzed your finances.
            </div>

            <div style="background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 8px 10px; font-size: 8.5px; color: #cbd5e1; margin-bottom: 10px;">
              <div style="color: #10b981; font-weight: 800; margin-bottom: 2px;">💡 Hero Insight</div>
              Your expenses increased 14% this month. Would you like category-wise details?
              <div style="background: #10b981; color: #fff; padding: 3px 6px; border-radius: 4px; display: inline-block; font-weight: 800; margin-top: 4px;">Show Details</div>
            </div>

            <div style="background: #132238; border-radius: 999px; padding: 5px 8px; font-size: 8px; color: #64748b; display: flex; justify-content: space-between;">
              <span>Ask anything...</span>
              <span style="color: #10b981;">➤</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ─── 4-PILL QUICK FEATURE BAR ─── -->
  <section class="features-bar" id="features">
    <div class="container">
      <div class="pill-grid">
        <div class="feature-pill-card">
          <div class="pill-icon" style="background: #ecfdf5; color: #059669;">💳</div>
          <div>
            <div class="pill-title">Track Expenses</div>
            <div class="pill-sub">Know where your money goes</div>
          </div>
        </div>

        <div class="feature-pill-card">
          <div class="pill-icon" style="background: #f3e8ff; color: #7c3aed;">💼</div>
          <div>
            <div class="pill-title">Manage Income</div>
            <div class="pill-sub">Keep a complete record</div>
          </div>
        </div>

        <div class="feature-pill-card">
          <div class="pill-icon" style="background: #fff7ed; color: #ea580c;">✨</div>
          <div>
            <div class="pill-title">AI Financial Assistant</div>
            <div class="pill-sub">Get smart money tips</div>
          </div>
        </div>

        <div class="feature-pill-card">
          <div class="pill-icon" style="background: #eff6ff; color: #2563eb;">🏢</div>
          <div>
            <div class="pill-title">Business Workspace</div>
            <div class="pill-sub">Manage your business finances</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ─── WHY HISABHERO SECTION ─── -->
  <section class="why-section">
    <div class="container">
      <h2 class="section-heading">Why HisabHero?</h2>
      <p class="section-subtitle">Everything you need to manage money — personally or for your business.</p>

      <div class="why-grid">
        <div class="why-card">
          <div class="why-icon-box" style="background: #ecfdf5; color: #059669;">💳</div>
          <div class="why-title">Expense Tracking</div>
          <div class="why-desc">Understand where your money goes.</div>
        </div>

        <div class="why-card">
          <div class="why-icon-box" style="background: #eff6ff; color: #2563eb;">📈</div>
          <div class="why-title">Cash Flow</div>
          <div class="why-desc">See how money moves through your finances.</div>
        </div>

        <div class="why-card">
          <div class="why-icon-box" style="background: #ecfdf5; color: #059669;">✨</div>
          <div class="why-title">AI Insights</div>
          <div class="why-desc">Get smart tips to save and grow.</div>
        </div>

        <div class="why-card">
          <div class="why-icon-box" style="background: #eff6ff; color: #2563eb;">📄</div>
          <div class="why-title">Document Intelligence</div>
          <div class="why-desc">Turn receipts &amp; invoices into transactions.</div>
        </div>

        <div class="why-card">
          <div class="why-icon-box" style="background: #f3e8ff; color: #7c3aed;">🏢</div>
          <div class="why-title">Business Management</div>
          <div class="why-desc">Handle invoices, payroll and more.</div>
        </div>

        <div class="why-card">
          <div class="why-icon-box" style="background: #ecfdf5; color: #059669;">💚</div>
          <div class="why-title">Financial Health</div>
          <div class="why-desc">See the bigger picture of your wellbeing.</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ─── SMART MONEY MANAGEMENT: ONE APP. TWO WORLDS. ─── -->
  <section class="two-worlds-section" id="workspaces">
    <div class="container two-worlds-grid">
      
      <!-- LEFT PHONE MOCKUP WITH FLOATING HEALTH CARD -->
      <div style="position: relative; display: flex; justify-content: center;">
        <div class="floating-shape" style="top: 35%; left: 0px; background: #ecfdf5; border-color: rgba(5,150,105,0.3); padding: 14px 18px; border-radius: 20px;">
          <div style="font-size: 24px; text-align: center; margin-bottom: 2px;">💚</div>
          <div style="font-size: 12px; font-weight: 800; color: #065f46;">Financial Health</div>
          <div style="font-size: 11px; font-weight: 700; color: #059669;">Excellent</div>
          <div style="font-size: 9px; color: #047857;">Keep going!</div>
        </div>

        <div style="width: 270px; background: #0f172a; border-radius: 38px; border: 5px solid #1e293b; padding: 12px; box-shadow: var(--shadow-lg);">
          <div class="phone-screen">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 11px;">
              <span>← Expenses</span>
              <span>⋮</span>
            </div>

            <div style="display: flex; gap: 6px; margin-bottom: 14px; font-size: 9px;">
              <span style="background: #10b981; color: #fff; padding: 3px 8px; border-radius: 6px; font-weight: 700;">All</span>
              <span style="background: #1e293b; color: #94a3b8; padding: 3px 8px; border-radius: 6px;">Food</span>
              <span style="background: #1e293b; color: #94a3b8; padding: 3px 8px; border-radius: 6px;">Transport</span>
              <span style="background: #1e293b; color: #94a3b8; padding: 3px 8px; border-radius: 6px;">Bills</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 10px;">
              <div style="background: #1e293b; padding: 8px 10px; border-radius: 10px; display: flex; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700;">🍔 Food & Dining</div>
                  <div style="font-size: 8px; color: #94a3b8;">12 May 2026</div>
                </div>
                <div style="font-weight: 800; color: #ef4444;">₹450</div>
              </div>

              <div style="background: #1e293b; padding: 8px 10px; border-radius: 10px; display: flex; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700;">🚗 Transport</div>
                  <div style="font-size: 8px; color: #94a3b8;">11 May 2026</div>
                </div>
                <div style="font-weight: 800; color: #10b981;">+₹25,000</div>
              </div>

              <div style="background: #1e293b; padding: 8px 10px; border-radius: 10px; display: flex; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700;">🛍️ Shopping</div>
                  <div style="font-size: 8px; color: #94a3b8;">10 May 2026</div>
                </div>
                <div style="font-weight: 800; color: #ef4444;">₹2,350</div>
              </div>

              <div style="background: #1e293b; padding: 8px 10px; border-radius: 10px; display: flex; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700;">🧾 Bills</div>
                  <div style="font-size: 8px; color: #94a3b8;">09 May 2026</div>
                </div>
                <div style="font-weight: 800; color: #ef4444;">₹1,200</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT CONTENT -->
      <div>
        <h2 style="font-size: 2.5rem; margin-bottom: 6px;">Smart Money Management.</h2>
        <p style="font-size: 1.25rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 24px;">One app. Two worlds.</p>

        <div class="workspaces-container">
          <div class="workspace-card">
            <div class="workspace-card-header">
              <span style="font-size: 22px;">👛</span>
              <div class="workspace-card-title">Personal Workspace</div>
            </div>
            <ul class="workspace-list">
              <li><span>✓</span> Track income &amp; expenses</li>
              <li><span>✓</span> Set budgets &amp; goals</li>
              <li><span>✓</span> Monitor cash flow</li>
              <li><span>✓</span> Get AI financial guidance</li>
            </ul>
          </div>

          <div class="workspace-card">
            <div class="workspace-card-header">
              <span style="font-size: 22px;">🏢</span>
              <div class="workspace-card-title">Business Workspace</div>
            </div>
            <ul class="workspace-list">
              <li><span>✓</span> Create invoices &amp; bills</li>
              <li><span>✓</span> Manage inventory &amp; assets</li>
              <li><span>✓</span> Payroll &amp; approvals</li>
              <li><span>✓</span> Team collaboration</li>
            </ul>
          </div>
        </div>

        <button class="btn btn-emerald btn-lg" onclick="openModal('signupModal')">
          Start Your HisabHero Journey
        </button>
      </div>

    </div>
  </section>

  <!-- ─── HOW IT WORKS SECTION ─── -->
  <section class="how-section" id="how-it-works">
    <div class="container">
      <h2 class="section-heading">How It Works</h2>
      <p class="section-subtitle">Simple steps to better financial control.</p>

      <div class="steps-row">
        <div class="step-card">
          <div class="step-icon-wrap">👤</div>
          <div class="step-name">1. Create Your Account</div>
          <div class="step-desc">Start with your Personal Workspace in 30 seconds.</div>
        </div>

        <div class="step-arrow">→</div>

        <div class="step-card">
          <div class="step-icon-wrap">💳</div>
          <div class="step-name">2. Manage Your Finances</div>
          <div class="step-desc">Track transactions, documents, Khata and budgets.</div>
        </div>

        <div class="step-arrow">→</div>

        <div class="step-card">
          <div class="step-icon-wrap">📈</div>
          <div class="step-name">3. Grow with Smart Insights</div>
          <div class="step-desc">Use AI-powered insights to make better decisions.</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ─── READY CTA BANNER ─── -->
  <section class="cta-banner-section" id="contact">
    <div class="container">
      <div class="cta-banner-box">
        <div class="cta-banner-left">
          <div class="cta-banner-icon">🚀</div>
          <div>
            <div class="cta-banner-title">Ready to take control of your finances?</div>
            <div class="cta-banner-sub">Download HisabHero and start managing your money smarter today.</div>
          </div>
        </div>

        <div class="app-badges">
          <a href="/HisabHero-v5.5.0-Enterprise-Release.apk" download class="store-badge-btn">
            <span style="font-size: 20px;">🤖</span>
            <div style="text-align: left;">
              <div style="font-size: 9px; text-transform: uppercase;">GET IT ON</div>
              <div style="font-size: 13px; font-weight: 900;">Google Play</div>
            </div>
          </a>

          <a href="javascript:void(0)" onclick="openModal('signupModal')" class="store-badge-btn">
            <span style="font-size: 20px;">🍎</span>
            <div style="text-align: left;">
              <div style="font-size: 9px; text-transform: uppercase;">Download on the</div>
              <div style="font-size: 13px; font-weight: 900;">App Store</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- ─── SITE FOOTER ─── -->
  <footer class="site-footer">
    <div class="container footer-inner">
      <div style="display: flex; align-items: center; gap: 8px;">
        <img src="/logo.png" style="width: 28px; height: 28px; border-radius: 6px;" alt="HisabHero">
        <span style="font-weight: 900; color: var(--text); font-size: 1.15rem;">Hisab<span style="color: var(--emerald);">Hero</span></span>
        <span style="font-size: 0.82rem; color: var(--text-muted); margin-left: 8px;">Your intelligent financial companion.</span>
      </div>

      <div class="footer-links">
        <a href="#features">Features</a>
        <span>|</span>
        <a href="#workspaces">Security</a>
        <span>|</span>
        <a href="#how-it-works">About</a>
        <span>|</span>
        <a href="#contact">Contact</a>
        <span>|</span>
        <a href="javascript:void(0)" onclick="alert('Privacy policy details')">Privacy Policy</a>
        <span>|</span>
        <a href="javascript:void(0)" onclick="alert('Terms of service')">Terms of Service</a>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; font-size: 0.85rem;">
        <span>Follow Us</span>
        <span style="cursor: pointer;">🌐</span>
        <span style="cursor: pointer;">💬</span>
        <span style="cursor: pointer;">📷</span>
        <span style="cursor: pointer;">💼</span>
      </div>
    </div>
  </footer>

</div>

<!-- ─── AUTH MODALS ─── -->

<!-- MODAL: SIGN UP -->
<div class="modal-backdrop" id="signupModal" onclick="closeModalOnBackdrop(event, 'signupModal')">
  <div class="modal-card">
    <div class="modal-header">
      <div class="modal-title">Create Account</div>
      <button class="modal-close" onclick="closeModal('signupModal')">✕</button>
    </div>
    <div class="form-msg form-error-msg" id="signupError"></div>
    <form id="signupForm" onsubmit="handleSignupSubmit(event)">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-input" id="signupName" placeholder="e.g. Selva Kumar" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" class="form-input" id="signupEmail" placeholder="e.g. selva@example.com" required>
      </div>
      <div class="form-group">
        <label class="form-label">Password (min 6 characters)</label>
        <input type="password" class="form-input" id="signupPassword" placeholder="••••••••" required minlength="6">
      </div>
      <button type="submit" class="btn btn-emerald" style="width: 100%; padding: 12px; border-radius: 12px;" id="signupSubmit">
        <span>Create Account</span>
        <span>→</span>
      </button>
    </form>
    <div style="text-align: center; margin-top: 1.25rem; font-size: .85rem; color: var(--text-muted);">
      Already have an account? <a href="javascript:void(0)" onclick="closeModal('signupModal'); openModal('loginModal')" style="color: var(--emerald); font-weight: 700; text-decoration: none;">Sign In</a>
    </div>
  </div>
</div>

<!-- MODAL: EMAIL OTP VERIFICATION -->
<div class="modal-backdrop" id="otpModal" onclick="closeModalOnBackdrop(event, 'otpModal')">
  <div class="modal-card" style="text-align: center;">
    <div class="modal-header">
      <div class="modal-title">Verify Your Email</div>
      <button class="modal-close" onclick="closeModal('otpModal')">✕</button>
    </div>
    <div style="font-size: 3rem; margin-bottom: .5rem;">📬</div>
    <p style="font-size: .95rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
      We sent a 6-digit verification code to<br>
      <strong id="otpEmailTarget" style="color: var(--emerald);">user@example.com</strong>
    </p>
    <div class="form-msg form-error-msg" id="otpError"></div>
    <form id="otpForm" onsubmit="handleOtpVerify(event)">
      <div class="form-group">
        <input type="text" class="form-input" id="otpInputCode" placeholder="Enter 6-digit OTP" maxlength="6" style="text-align: center; font-size: 1.6rem; letter-spacing: 6px; font-weight: 900;" required>
      </div>
      <button type="submit" class="btn btn-emerald" style="width: 100%; padding: 12px; border-radius: 12px;" id="otpSubmitBtn">
        <span>Verify &amp; Activate Account</span>
        <span>✓</span>
      </button>
    </form>
    <div style="margin-top: 1rem; font-size: .85rem;">
      <button type="button" onclick="handleResendOtp()" id="resendOtpBtn" style="background: none; border: none; color: var(--emerald); font-weight: 700; cursor: pointer; text-decoration: underline;">
        🔄 Resend Code
      </button>
    </div>
  </div>
</div>

<!-- MODAL: SIGN IN -->
<div class="modal-backdrop" id="loginModal" onclick="closeModalOnBackdrop(event, 'loginModal')">
  <div class="modal-card">
    <div class="modal-header">
      <div class="modal-title">Welcome Back</div>
      <button class="modal-close" onclick="closeModal('loginModal')">✕</button>
    </div>
    <div class="form-msg form-error-msg" id="loginError"></div>
    <form id="loginForm" onsubmit="handleLoginSubmit(event)">
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" class="form-input" id="loginEmail" placeholder="e.g. selva@example.com" required>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" class="form-input" id="loginPassword" placeholder="••••••••" required>
      </div>
      <button type="submit" class="btn btn-emerald" style="width: 100%; padding: 12px; border-radius: 12px;" id="loginSubmit">
        <span>Sign In</span>
        <span>→</span>
      </button>
    </form>
    <div style="text-align: center; margin-top: 1.25rem; font-size: .85rem; color: var(--text-muted);">
      Don't have an account? <a href="javascript:void(0)" onclick="closeModal('loginModal'); openModal('signupModal')" style="color: var(--emerald); font-weight: 700; text-decoration: none;">Create Free Account</a>
    </div>
  </div>
</div>

<script>
  let activePendingEmail = '';

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }
  function closeModalOnBackdrop(e, id) {
    if (e.target.id === id) closeModal(id);
  }

  function toggleLangMenu(e) {
    e.stopPropagation();
    document.getElementById('langMenu')?.classList.toggle('active');
  }
  document.addEventListener('click', () => {
    document.getElementById('langMenu')?.classList.remove('active');
  });

  function selectWebsiteLanguage(code, label) {
    const lbl = document.getElementById('currentLangLabel');
    if (lbl) lbl.textContent = label;
    document.querySelectorAll('.lang-item').forEach(el => el.classList.remove('active'));
    event?.target?.classList?.add('active');
  }

  function updateUserAuthState() {
    const token = localStorage.getItem('hh_token');
    const userStr = localStorage.getItem('hh_user');
    const navActions = document.getElementById('navActions');
    if (!navActions) return;

    const langDropdownHtml = \`
      <div class="lang-dropdown" id="langDropdown">
        <button class="lang-btn" onclick="toggleLangMenu(event)" type="button">
          <span id="currentLangLabel">🌐 English</span>
          <span style="font-size: .65rem; color: var(--text-muted);">▼</span>
        </button>
        <div class="lang-menu" id="langMenu">
          <div class="lang-item active" onclick="selectWebsiteLanguage('en', '🌐 English')">🌐 English</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('ta', '🇮🇳 Tamil (தமிழ்)')">🇮🇳 Tamil (தமிழ்)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('hi', '🇮🇳 Hindi (हिंदी)')">🇮🇳 Hindi (हिंदी)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('mr', '🇮🇳 Marathi (मराठी)')">🇮🇳 Marathi (मराठी)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('gu', '🇮🇳 Gujarati (ગુજરાતી)')">🇮🇳 Gujarati (ગુજરાતી)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('te', '🇮🇳 Telugu (తెలుగు)')">🇮🇳 Telugu (తెలుగు)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('kn', '🇮🇳 Kannada (ಕನ್ನಡ)')">🇮🇳 Kannada (ಕನ್ನಡ)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('bn', '🇮🇳 Bengali (বাংলা)')">🇮🇳 Bengali (বাংলা)</div>
        </div>
      </div>
    \`;

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const name = user.fullName || user.name || (user.email ? user.email.split('@')[0] : 'User');
        const initial = name.charAt(0).toUpperCase();

        navActions.innerHTML = \`
          \${langDropdownHtml}
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(5,150,105,0.08); padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(5,150,105,0.2);">
            <div style="width: 26px; height: 26px; border-radius: 13px; background: var(--emerald); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800;">
              \${initial}
            </div>
            <span style="font-size: 13px; font-weight: 700; color: var(--text);">\${name}</span>
          </div>
          <button class="btn btn-outline" onclick="handleLogout()" style="padding: 6px 14px; font-size: 0.82rem;">Sign Out</button>
        \`;
        return;
      } catch {}
    }

    navActions.innerHTML = \`
      \${langDropdownHtml}
      <button class="btn btn-outline" onclick="openModal('loginModal')">Sign In</button>
      <button class="btn btn-emerald" onclick="openModal('signupModal')">Download App</button>
    \`;
  }

  function handleLogout() {
    localStorage.removeItem('hh_token');
    localStorage.removeItem('hh_user');
    updateUserAuthState();
  }

  async function handleSignupSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errorEl = document.getElementById('signupError');
    const submitBtn = document.getElementById('signupSubmit');

    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Creating Account...</span>';

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        activePendingEmail = email;
        document.getElementById('otpEmailTarget').textContent = email;
        closeModal('signupModal');
        document.getElementById('signupForm').reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span><span>→</span>';
        openModal('otpModal');
      } else {
        errorEl.textContent = data.error || 'Failed to create account. Please try again.';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span><span>→</span>';
      }
    } catch {
      errorEl.textContent = 'Server connection error. Please ensure backend is running.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Create Account</span><span>→</span>';
    }
  }

  async function handleOtpVerify(e) {
    e.preventDefault();
    const code = document.getElementById('otpInputCode').value.trim();
    const errorEl = document.getElementById('otpError');
    const submitBtn = document.getElementById('otpSubmitBtn');

    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verifying Code...</span>';

    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activePendingEmail, code })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) localStorage.setItem('hh_token', data.token);
        if (data.user) localStorage.setItem('hh_user', JSON.stringify(data.user));

        submitBtn.innerHTML = '<span>Verified &amp; Activated! ✓</span>';
        setTimeout(() => {
          closeModal('otpModal');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Verify &amp; Activate Account</span><span>✓</span>';
          updateUserAuthState();
          alert('Account verified successfully! Welcome to HisabHero.');
        }, 600);
      } else {
        errorEl.textContent = data.error || 'Invalid or expired OTP code.';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Verify &amp; Activate Account</span><span>✓</span>';
      }
    } catch {
      errorEl.textContent = 'Server error during OTP verification.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Verify &amp; Activate Account</span><span>✓</span>';
    }
  }

  async function handleResendOtp() {
    if (!activePendingEmail) return;
    const btn = document.getElementById('resendOtpBtn');
    btn.disabled = true;
    btn.textContent = 'Sending new code...';
    try {
      const res = await fetch('/api/auth/resend-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activePendingEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('A new 6-digit verification code has been dispatched to ' + activePendingEmail);
      } else {
        alert(data.error || 'Failed to resend code.');
      }
    } catch {
      alert('Error connecting to server.');
    }
    btn.disabled = false;
    btn.textContent = '🔄 Resend Code';
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const submitBtn = document.getElementById('loginSubmit');

    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Signing In...</span>';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('hh_token', data.token);
        if (data.user) localStorage.setItem('hh_user', JSON.stringify(data.user));

        submitBtn.innerHTML = '<span>Success! ✓</span>';
        setTimeout(() => {
          closeModal('loginModal');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Sign In</span><span>→</span>';
          document.getElementById('loginForm').reset();
          updateUserAuthState();
        }, 300);
      } else {
        errorEl.textContent = data.error || 'Invalid email or password.';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In</span><span>→</span>';
      }
    } catch {
      errorEl.textContent = 'Server error during sign in.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In</span><span>→</span>';
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    updateUserAuthState();
  });
</script>

</body>
</html>`;

fs.writeFileSync(indexPath, fullHtml, 'utf8');
console.log("Successfully rebuilt website to match user reference image precisely with user logo!");
