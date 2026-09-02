import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Find start of landingView and dashboardView
const landingViewStart = content.indexOf('<div id="landingView">');
const dashboardViewStart = content.indexOf('<div id="dashboardView"');

if (landingViewStart === -1 || dashboardViewStart === -1) {
  console.error("Could not find landingView or dashboardView");
  process.exit(1);
}

const beforeLanding = content.substring(0, landingViewStart);
const fromDashboard = content.substring(dashboardViewStart);

// Build the ultra-clean, minimal landing page HTML
const simpleLandingHtml = `<div id="landingView" style="min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; background: radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.12) 0%, #06111f 70%); color: #f8fafc; overflow: hidden; position: relative;">

  <!-- TOP MINIMAL NAVBAR (LOGO + LANGUAGE + AUTH) -->
  <header style="padding: 1.25rem 2rem; display: flex; align-items: center; justify-content: space-between; max-width: 1200px; width: 100%; margin: 0 auto; z-index: 10;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <img src="/logo.png" alt="HisabHero Logo" style="width: 38px; height: 38px; border-radius: 10px; box-shadow: 0 4px 14px rgba(56,189,248,0.3);">
      <span style="font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 1.4rem; color: #fff; letter-spacing: -0.5px;">Hisab<span style="color: #38bdf8;">Hero</span></span>
    </div>

    <div style="display: flex; align-items: center; gap: 12px;" id="navActions">
      <div class="lang-dropdown" id="langDropdown">
        <button class="btn btn-secondary btn-sm lang-btn" onclick="toggleLangMenu(event)" type="button" style="background: #0f172a; color: #e2e8f0; border-color: rgba(255,255,255,0.15); padding: 0.45rem 0.9rem; border-radius: 999px;">
          <span id="currentLangLabel">🌐 English</span>
          <span style="font-size: .65rem; color: #94a3b8; margin-left: 4px;">▼</span>
        </button>
        <div class="lang-menu" id="langMenu" style="background: #0f172a; border-color: rgba(255,255,255,0.15); box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <div class="lang-item active" onclick="selectWebsiteLanguage('en', '🌐 English')" style="color: #e2e8f0;">🌐 English</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('ta', '🇮🇳 Tamil (தமிழ்)')" style="color: #e2e8f0;">🇮🇳 Tamil (தமிழ்)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('hi', '🇮🇳 Hindi (हिंदी)')" style="color: #e2e8f0;">🇮🇳 Hindi (हिंदी)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('mr', '🇮🇳 Marathi (मराठी)')" style="color: #e2e8f0;">🇮🇳 Marathi (मराठी)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('gu', '🇮🇳 Gujarati (ગુજરાતી)')" style="color: #e2e8f0;">🇮🇳 Gujarati (ગુજરાતી)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('te', '🇮🇳 Telugu (తెలుగు)')" style="color: #e2e8f0;">🇮🇳 Telugu (తెలుగు)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('kn', '🇮🇳 Kannada (ಕನ್ನಡ)')" style="color: #e2e8f0;">🇮🇳 Kannada (ಕನ್ನಡ)</div>
          <div class="lang-item" onclick="selectWebsiteLanguage('bn', '🇮🇳 Bengali (বাংলা)')" style="color: #e2e8f0;">🇮🇳 Bengali (বাংলা)</div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="openModal('loginModal')" data-i18n="nav_signin" style="background: #0f172a; color: #e2e8f0; border-color: rgba(255,255,255,0.15); border-radius: 999px; font-weight: 700; padding: 0.45rem 1.1rem;">Sign In</button>
      <button class="btn btn-primary btn-sm" onclick="openModal('signupModal')" data-i18n="nav_create" style="background: #38bdf8; color: #0f172a; border-radius: 999px; font-weight: 800; padding: 0.45rem 1.25rem;">Create Account →</button>
    </div>
  </header>

  <!-- CENTERED HERO: LOGO + TAGLINE + CREATE ACCOUNT & SIGN IN -->
  <main style="flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; padding: 2rem 1.5rem; z-index: 5;">
    <div style="max-width: 680px; width: 100%; display: flex; flex-direction: column; align-items: center;">
      
      <!-- GLOWING 3D LOGO EMBLEM -->
      <div style="position: relative; margin-bottom: 2rem;">
        <div style="position: absolute; inset: -15px; background: radial-gradient(circle, rgba(56,189,248,0.4) 0%, rgba(79,70,229,0) 70%); border-radius: 50%; filter: blur(20px); pointer-events: none;"></div>
        <img src="/logo.png" alt="HisabHero Logo" style="width: 110px; height: 110px; border-radius: 28px; box-shadow: 0 16px 36px -6px rgba(56,189,248,0.35); position: relative; border: 2px solid rgba(255,255,255,0.15);">
      </div>

      <!-- MAIN APP TITLE -->
      <h1 style="font-size: 3.5rem; font-weight: 900; color: #fff; letter-spacing: -1.5px; margin-bottom: 1rem; line-height: 1.1;">
        Hisab<span style="color: #38bdf8;">Hero</span>
      </h1>

      <!-- SINGLE CLEAN TAGLINE -->
      <p style="font-size: 1.35rem; color: #94a3b8; font-weight: 500; line-height: 1.5; margin-bottom: 2.5rem; max-width: 540px;" data-i18n="hero_sub">
        Smart Financial &amp; ERP Intelligence for Businesses and Individuals.
      </p>

      <!-- TWO PRIMARY ACTION BUTTONS (CREATE ACCOUNT & SIGN IN) -->
      <div style="display: flex; gap: 1rem; width: 100%; max-width: 440px; justify-content: center; margin-bottom: 2rem;">
        <button onclick="openModal('signupModal')" class="btn btn-primary btn-lg" style="flex: 1; background: #38bdf8; color: #0f172a; font-weight: 800; font-size: 1.05rem; padding: 1rem 1.5rem; border-radius: 14px; box-shadow: 0 8px 24px rgba(56,189,248,0.35);" data-i18n="nav_create">
          <span>Create Account</span>
          <span class="btn-arrow">→</span>
        </button>

        <button onclick="openModal('loginModal')" class="btn btn-secondary btn-lg" style="flex: 1; background: #0f172a; color: #f8fafc; border: 1.5px solid rgba(255,255,255,0.15); font-weight: 800; font-size: 1.05rem; padding: 1rem 1.5rem; border-radius: 14px;" data-i18n="nav_signin">
          <span>Sign In</span>
        </button>
      </div>

      <!-- ANDROID APK DOWNLOAD LINK -->
      <a href="/HisabHero-v5.5.0-Enterprise-Release.apk" download style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #10b981; font-weight: 700; text-decoration: none; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 8px 18px; border-radius: 999px; transition: background 0.2s;">
        <span>📱</span> Download Android APK (v5.5.0)
      </a>

    </div>
  </main>

  <!-- CLEAN MINIMAL FOOTER -->
  <footer style="padding: 1.5rem; text-align: center; font-size: 0.85rem; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); z-index: 5;">
    <div>© 2026 HisabHero Technologies Inc. • Powered by Quality. Committed to Efficiency.</div>
  </footer>

</div>
`;

// Remove the old floating navbar element from beforeLanding
let cleanedBeforeLanding = beforeLanding.replace(/<div class="navbar-wrap"[\s\S]*?<\/div>\s*<\/div>/, '');

const finalHtml = cleanedBeforeLanding + simpleLandingHtml + fromDashboard;
fs.writeFileSync(indexPath, finalHtml, 'utf8');
console.log("Successfully rebuilt simple and clean landing page with Logo, Tagline, Create Account and Sign In!");
