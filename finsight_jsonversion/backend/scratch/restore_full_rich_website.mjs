import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');

const fullRichLandingSections = `
<!-- FLOATING GLASS PILL NAVBAR (REQUIREMENT 19) -->
<div class="navbar-wrap">
  <nav class="navbar" id="mainNav">
    <a class="nav-brand" href="#">
      <img class="nav-logo" src="/logo.png" alt="HisabHero">
      <span class="nav-wordmark">Hisab<span>Hero</span></span>
    </a>
    <ul class="nav-links">
      <li><a href="#ocr-story" data-i18n="nav_ocr">OCR Engine</a></li>
      <li><a href="#ai-story" data-i18n="nav_ai">AI CFO</a></li>
      <li><a href="#reasons" data-i18n="nav_strengths">Strengths</a></li>
      <li><a href="#security-story" data-i18n="nav_merkle">Merkle Vault</a></li>
      <li><a href="#reviews" data-i18n="nav_reviews">Reviews</a></li>
      <li><a href="#contact" data-i18n="nav_contact">Contact</a></li>
    </ul>
    <div class="nav-actions" id="navActions">
      <div class="lang-dropdown" id="langDropdown">
        <button class="btn btn-secondary btn-sm lang-btn" onclick="toggleLangMenu(event)" type="button">
          <span id="currentLangLabel">🌐 English</span>
          <span style="font-size: .65rem; color: var(--text-muted); margin-left: 2px;">▼</span>
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
      <button class="btn btn-secondary btn-sm btn-magnetic" onclick="openModal('loginModal')" data-i18n="nav_signin">Sign In</button>
      <button class="btn btn-primary btn-sm btn-magnetic" onclick="openModal('signupModal')" data-i18n="nav_create">Create Account →</button>
    </div>
  </nav>
</div>

<div id="landingView">
  <!-- CINEMATIC 3D PERSPECTIVE HERO SCENE (REQUIREMENT 3, 4, 5, 6) -->
  <div class="perspective-container" id="heroScene">
    <div class="container">
      <div class="hero-content-box">
        <div class="hero-badge-pulse">
          <span class="pulse-dot"></span> <span data-i18n="hero_badge">PATENT-GRADE FINANCIAL ENGINE V5.5</span>
        </div>
        <h1 data-i18n="hero_h1">Powered by Quality.<br><span class="accent">Committed to Efficiency.</span></h1>
        <p class="hero-sub" data-i18n="hero_sub">Turning research-backed financial intelligence into automated, audit-proof growth for MSMEs, freelancers, and enterprise corporations.</p>
        
        <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; flex-wrap: wrap;">
          <button class="btn btn-primary btn-lg btn-magnetic" onclick="openModal('signupModal')" data-i18n="nav_create">
            <span>Create Account</span>
            <span class="btn-arrow">→</span>
          </button>
          <button class="btn btn-secondary btn-lg btn-magnetic" onclick="openModal('loginModal')" data-i18n="nav_signin">
            <span>Sign In</span>
          </button>
        </div>
      </div>

      <!-- MOBILE APP SHOWCASE CARD & SCREEN PREVIEW -->
      <div class="hero-dash-wrap" id="heroDashWrap">
        <div class="hero-dash-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 3rem 2.5rem;">
          
          <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2.5rem; align-items: center;">
            <!-- LEFT: Mobile App Feature Story -->
            <div style="text-align: left;">
              <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; background: rgba(16,185,129,0.15); color: #10b981; font-weight: 800; font-size: .75rem; text-transform: uppercase; margin-bottom: 1rem;">
                <span class="pulse-dot" style="width: 6px; height: 6px;"></span> OFFICIAL HISABHERO MOBILE APP (v5.5.0)
              </div>

              <h2 style="font-size: 2.2rem; font-weight: 900; line-height: 1.25; margin-bottom: 1rem; color: #fff;" data-i18n="mobile_title">
                Smart Financial Accounting Right in Your Pocket
              </h2>

              <p style="color: rgba(255,255,255,0.75); font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.75rem;" data-i18n="mobile_sub">
                Take control of your personal expenses, multi-branch business workspaces, 1-tap GST receipt OCR, and AI CFO queries anywhere, anytime.
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div style="background: rgba(255,255,255,0.06); padding: 1rem; border-radius: var(--radius); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 1rem; font-weight: 800; color: #fff; margin-bottom: 4px;" data-i18n="mobile_f1_title">📸 1-Tap Camera OCR</div>
                  <div style="font-size: .8rem; color: rgba(255,255,255,0.65);" data-i18n="mobile_f1_sub">Point & scan receipts to extract GSTIN, merchant & totals</div>
                </div>
                <div style="background: rgba(255,255,255,0.06); padding: 1rem; border-radius: var(--radius); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 1rem; font-weight: 800; color: #fff; margin-bottom: 4px;" data-i18n="mobile_f2_title">🤖 Mobile AI CFO</div>
                  <div style="font-size: .8rem; color: rgba(255,255,255,0.65);" data-i18n="mobile_f2_sub">Instant working capital, runway & tax guidance</div>
                </div>
                <div style="background: rgba(255,255,255,0.06); padding: 1rem; border-radius: var(--radius); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 1rem; font-weight: 800; color: #fff; margin-bottom: 4px;" data-i18n="mobile_f3_title">🏢 Workspace Switcher</div>
                  <div style="font-size: .8rem; color: rgba(255,255,255,0.65);" data-i18n="mobile_f3_sub">Mandatory personal workspace & business team accounts</div>
                </div>
                <div style="background: rgba(255,255,255,0.06); padding: 1rem; border-radius: var(--radius); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 1rem; font-weight: 800; color: #fff; margin-bottom: 4px;" data-i18n="mobile_f4_title">⚡ Offline-First Sync</div>
                  <div style="font-size: .8rem; color: rgba(255,255,255,0.65);" data-i18n="mobile_f4_sub">Record data without internet, auto-syncs live to MongoDB</div>
                </div>
              </div>

              <!-- APP DOWNLOAD BUTTONS -->
              <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <a href="/HisabHero-v5.5.0-Enterprise-Release.apk" download class="btn btn-primary btn-magnetic" style="background: #10b981; color: #fff; padding: .85rem 1.75rem; font-weight: 800; border-radius: 999px; text-decoration: none;" data-i18n="mobile_btn_play">
                  <span>📱 Download App from Play Store (v5.5.0)</span>
                </a>
              </div>
            </div>

            <!-- RIGHT: Mobile Screen Visualizer Mockup -->
            <div style="position: relative; display: flex; justify-content: center; align-items: center;">
              <div style="width: 270px; height: 530px; background: #000; border-radius: 40px; border: 4px solid #334155; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.7); overflow: hidden; position: relative; padding: 12px 10px;">
                <div style="width: 90px; height: 16px; background: #1e293b; border-radius: 999px; margin: 0 auto 10px auto;"></div>
                
                <div style="background: #0f172a; border-radius: 28px; height: calc(100% - 26px); padding: 16px 12px; color: #fff; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                      <div style="font-size: 11px; font-weight: 800; color: #38bdf8;">HISABHERO ENTERPRISE</div>
                      <div style="width: 8px; height: 8px; border-radius: 4px; background: #10b981;"></div>
                    </div>

                    <div style="background: #1e293b; border-radius: 16px; padding: 12px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.08);">
                      <div style="font-size: 10px; color: #94a3b8; font-weight: 700;">LIVE FINANCIAL HEALTH</div>
                      <div style="font-size: 22px; font-weight: 900; color: #10b981; margin: 4px 0;">88/100</div>
                      <div style="font-size: 9px; color: #cbd5e1;">▲ +14% vs Previous Month (Excellent)</div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                      <div style="background: #1e293b; border-radius: 12px; padding: 10px 8px;">
                        <div style="font-size: 9px; color: #94a3b8;">INCOME</div>
                        <div style="font-size: 13px; font-weight: 900; color: #10b981;">₹1,45,000</div>
                      </div>
                      <div style="background: #1e293b; border-radius: 12px; padding: 10px 8px;">
                        <div style="font-size: 9px; color: #94a3b8;">EXPENSE</div>
                        <div style="font-size: 13px; font-weight: 900; color: #ef4444;">₹54,200</div>
                      </div>
                    </div>

                    <div style="background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); border-radius: 12px; padding: 10px; font-size: 10px; color: #38bdf8;">
                      🤖 <strong>AI CFO:</strong> ₹12,400 unutilized ITC ready to claim.
                    </div>
                  </div>

                  <div style="background: #38bdf8; color: #0f172a; padding: 8px; border-radius: 999px; text-align: center; font-size: 11px; font-weight: 900;">
                    + 1-Tap Camera Scan
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- SECTION 1: LIVE OCR SCANNING SIMULATOR (REQUIREMENT 7) -->
  <section class="section" id="ocr-story">
    <div class="container">
      <div class="section-tag" data-i18n="nav_ocr">OCR Engine</div>
      <h2 class="section-title" data-i18n="ocr_title">Upload → AI Understands → Transaction Created</h2>
      <p class="section-sub" data-i18n="ocr_sub">Watch how HisabHero scans vendor invoices and receipts in real time to generate audit-proof financial records.</p>
      
      <div class="ocr-interactive-card" style="background: #fff; border-radius: var(--radius-xl); border: 1px solid var(--border); box-shadow: var(--shadow-hero); padding: 2.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center;">
        <div style="border: 2px dashed var(--primary-light); background: var(--primary-xlight); border-radius: var(--radius-lg); padding: 2.5rem 1.5rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: .5rem;">📄</div>
          <div style="font-weight: 800; font-size: 1.15rem; color: var(--text); margin-bottom: 4px;">Smart GST Invoice OCR</div>
          <div style="font-size: .85rem; color: var(--text-muted); margin-bottom: 1.25rem;">Extracts GSTIN, invoice date, line items, CGST/SGST/IGST & totals in 1.2 seconds</div>
          <button class="btn btn-primary btn-sm btn-magnetic" onclick="simulateOcrScan()">⚡ Run Live OCR Scan</button>
        </div>

        <div style="background: #0f172a; color: #fff; border-radius: var(--radius-lg); padding: 1.75rem;" id="ocrConsole">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-bottom: 12px;">
            <span>OCR JSON ENGINE V5.5</span>
            <span style="color: #10b981;">● STATUS: READY</span>
          </div>
          <div style="font-family: monospace; font-size: 13px; color: #38bdf8; line-height: 1.6;" id="ocrConsoleOutput">
            // Click 'Run Live OCR Scan' to test patent-grade receipt extraction.<br>
            {<br>
            &nbsp;&nbsp;"merchant": "Reliance Retail Ltd",<br>
            &nbsp;&nbsp;"gstin": "27AAACR5055K1Z8",<br>
            &nbsp;&nbsp;"amount": 4250.00,<br>
            &nbsp;&nbsp;"tax": 765.00,<br>
            &nbsp;&nbsp;"category": "Office Supplies",<br>
            &nbsp;&nbsp;"auditVerified": true<br>
            }
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SECTION 2: AI CFO CONVERSATION STORYTELLING (REQUIREMENT 8) -->
  <section class="section" id="ai-story" style="background: #f1f5f9;">
    <div class="container">
      <div class="section-tag" data-i18n="nav_ai">AI CFO</div>
      <h2 class="section-title" data-i18n="ai_title">Ask Anything About Your Finances.</h2>
      <p class="section-sub">Your dedicated AI financial companion reads your ledger streams in real time to deliver proactive insights and working capital forecasts.</p>

      <div style="max-width: 800px; margin: 0 auto; background: #fff; border-radius: var(--radius-xl); border: 1px solid var(--border); box-shadow: var(--shadow-hero); padding: 2.5rem;">
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <!-- USER PROMPT -->
          <div style="align-self: flex-end; background: var(--primary); color: #fff; border-radius: 18px 18px 4px 18px; padding: 1rem 1.25rem; max-width: 80%; font-weight: 500; font-size: .95rem; box-shadow: 0 4px 14px rgba(79,70,229,0.25);" data-i18n="ai_prompt">
            "How can I optimize our working capital runway for next month?"
          </div>

          <!-- AI RESPONSE -->
          <div style="align-self: flex-start; background: #0f172a; color: #f8fafc; border-radius: 18px 18px 18px 4px; padding: 1.5rem; max-width: 85%; font-size: .95rem; line-height: 1.6; border: 1px solid #1e293b;">
            <div style="font-size: 11px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px; margin-bottom: 8px;" data-i18n="ai_rec_label">🤖 AI CFO RECOMMENDATION</div>
            <div data-i18n="ai_rec_sub">
              By filing your GSTR-1 by the 11th, you can reclaim <strong>₹12,400 in unutilized Input Tax Credit (ITC)</strong>. Additionally, sending 1-click WhatsApp payment reminders to Apex Global will accelerate ₹45,000 in receivables.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SECTION 3: TOP SIX REASONS BENTO GRID (REQUIREMENT 9) -->
  <section class="section" id="reasons">
    <div class="container">
      <div class="section-tag" data-i18n="bento_tag">Core Capabilities</div>
      <h2 class="section-title" data-i18n="bento_title">Top Six Reasons to Choose HisabHero</h2>
      <p class="section-sub" data-i18n="bento_sub">Our capabilities span from personal budget management to enterprise-grade multi-branch accounting.</p>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
        <div class="feature-card" style="background: #fff; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm);">
          <div style="font-size: 2rem; margin-bottom: .75rem;">🌐</div>
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: .5rem;" data-i18n="bento_c1_title">🇮🇳 8 Indian & Global Languages</h3>
          <p style="font-size: .88rem; color: var(--text-muted); line-height: 1.6;" data-i18n="bento_c1_sub">Complete multilingual voice OCR & financial interface support across English, Tamil (தமிழ்), Hindi (हिंदी), Marathi (मराठी), Gujarati (ગુજરાતી), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), and Bengali (বাংলা).</p>
        </div>

        <div class="feature-card" style="background: #fff; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm);">
          <div style="font-size: 2rem; margin-bottom: .75rem;">🏢</div>
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: .5rem;" data-i18n="bento_c2_title">Enterprise Business Operations</h3>
          <p style="font-size: .88rem; color: var(--text-muted); line-height: 1.6;" data-i18n="bento_c2_sub">Multi-tenant workspaces with multi-owner approval thresholds, granular RBAC permissions, and team member collaboration.</p>
        </div>

        <div class="feature-card" style="background: #fff; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm);">
          <div style="font-size: 2rem; margin-bottom: .75rem;">🤖</div>
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: .5rem;" data-i18n="bento_c3_title">Dedicated AI CFO Companion</h3>
          <p style="font-size: .88rem; color: var(--text-muted); line-height: 1.6;" data-i18n="bento_c3_sub">Your built-in AI companion powered by Google Gemini reads your financial transaction streams to answer questions and forecast cash flow.</p>
        </div>

        <div class="feature-card" style="background: #fff; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm);">
          <div style="font-size: 2rem; margin-bottom: .75rem;">🔒</div>
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: .5rem;">Merkle Tree Audit Ledger</h3>
          <p style="font-size: .88rem; color: var(--text-muted); line-height: 1.6;">Cryptographically chained SHA-256 blocks guarantee tamper-proof audit trails for GST and tax authorities.</p>
        </div>

        <div class="feature-card" style="background: #fff; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm);">
          <div style="font-size: 2rem; margin-bottom: .75rem;">📈</div>
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: .5rem;">Live Real-Time P&L Reports</h3>
          <p style="font-size: .88rem; color: var(--text-muted); line-height: 1.6;">Instant Profit & Loss statements, balance sheets, and cash burn projections ready for 1-click PDF export.</p>
        </div>

        <div class="feature-card" style="background: #fff; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm);">
          <div style="font-size: 2rem; margin-bottom: .75rem;">📲</div>
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: .5rem;">Offline-First Mobile Sync</h3>
          <p style="font-size: .88rem; color: var(--text-muted); line-height: 1.6;">Continue bookkeeping smoothly even without internet. Automatically syncs seamlessly with the cloud when reconnected.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- SECTION 4: MERKLE TREE TAMPER-PROOF AUDIT VAULT (REQUIREMENT 10) -->
  <section class="section" id="security-story" style="background: #0f172a; color: #fff;">
    <div class="container">
      <div class="section-tag" style="background: rgba(56,189,248,0.15); color: #38bdf8;" data-i18n="nav_merkle">Merkle Vault</div>
      <h2 class="section-title" style="color: #fff;" data-i18n="merkle_title">Merkle Tree Tamper-Proof Audit Vault</h2>
      <p class="section-sub" style="color: #94a3b8;" data-i18n="merkle_sub">Blockchain-level immutability inside standard databases without gas fees or latency.</p>

      <div style="background: #1e293b; border-radius: var(--radius-xl); border: 1px solid rgba(255,255,255,0.1); padding: 2.5rem; text-align: center;">
        <div style="font-size: 1.15rem; font-weight: 800; color: #38bdf8; margin-bottom: .5rem;">CRYPTOGRAPHIC MERKLE ROOT CHAIN</div>
        <div style="font-family: monospace; font-size: 14px; color: #10b981; background: #0f172a; padding: 12px; border-radius: var(--radius); display: inline-block; margin-bottom: 1.5rem;">
          Root Hash: 0x7f9a2b84c1e63d09a5b78f24610e2c918a3d5f47e2b109c4d8a7f6e5c4b3a210 ✓ VERIFIED
        </div>
        <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
          <div style="background: rgba(255,255,255,0.04); padding: 1rem 1.5rem; border-radius: var(--radius);">
            <div style="font-size: 1.5rem; font-weight: 900; color: #fff;">100,031+</div>
            <div style="font-size: 11px; color: #94a3b8;">Chained Transactions</div>
          </div>
          <div style="background: rgba(255,255,255,0.04); padding: 1rem 1.5rem; border-radius: var(--radius);">
            <div style="font-size: 1.5rem; font-weight: 900; color: #10b981;">0</div>
            <div style="font-size: 11px; color: #94a3b8;">Discrepancies / Anomalies</div>
          </div>
          <div style="background: rgba(255,255,255,0.04); padding: 1rem 1.5rem; border-radius: var(--radius);">
            <div style="font-size: 1.5rem; font-weight: 900; color: #38bdf8;">100%</div>
            <div style="font-size: 11px; color: #94a3b8;">Audit Compliance</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SECTION 5: VERIFIED FEEDBACK & REVIEWS (REQUIREMENT 11) -->
  <section class="section" id="reviews">
    <div class="container">
      <div class="section-tag" data-i18n="rev_tag">Verified Feedback</div>
      <h2 class="section-title" data-i18n="rev_title">What Financial Leaders Say</h2>
      <p class="section-sub">Trusted by over 10,000+ businesses, Chartered Accountants, and freelancers across India.</p>

      <div style="text-align: center; margin-bottom: 2.5rem;">
        <button class="btn btn-primary btn-magnetic" onclick="openWriteReviewModal()" data-i18n="rev_btn">✍️ Write a Review</button>
      </div>

      <div class="reviews-grid" id="reviewsGrid">
        <!-- Live Verified Reviews loaded by JS -->
      </div>
    </div>
  </section>

  <!-- SECTION 6: CONTACT & ENTERPRISE SUPPORT (REQUIREMENT 12) -->
  <section class="section" id="contact" style="background: #f8fafc;">
    <div class="container">
      <div class="section-tag" data-i18n="nav_contact">Contact</div>
      <h2 class="section-title" data-i18n="contact_title">Get in Touch with HisabHero</h2>
      <p class="section-sub" data-i18n="contact_sub">Have questions about our financial engine or custom enterprise deployment? Contact us anytime.</p>

      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: var(--radius-xl); border: 1px solid var(--border); box-shadow: var(--shadow-hero); padding: 2.5rem;">
        <div id="contactMsg" class="form-msg"></div>
        <form id="contactForm" onsubmit="handleContactSubmit(event)">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="contactName" placeholder="Rahul Sharma" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="contactEmail" placeholder="rahul@company.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-input" id="contactSubject" placeholder="Enterprise ERP Integration / Support" required>
          </div>
          <div class="form-group">
            <label class="form-label">Message</label>
            <textarea class="form-input" id="contactText" rows="4" placeholder="Tell us about your requirements..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-magnetic" id="contactSubmit">
            <span>Send Message 💬</span>
          </button>
        </form>
      </div>
    </div>
  </section>

  <!-- FULL FOOTER -->
  <footer style="background: #0f172a; color: #fff; padding: 4rem 2rem 2rem 2rem; border-top: 1px solid #1e293b;">
    <div class="container" style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 3rem; margin-bottom: 3rem;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 1rem;">
          <img src="/logo.png" style="width: 32px; height: 32px; border-radius: 50%;" alt="HisabHero">
          <span style="font-family: 'Outfit', sans-serif; font-size: 1.35rem; font-weight: 900; color: #fff;">Hisab<span style="color: #38bdf8;">Hero</span></span>
        </div>
        <p style="font-size: .88rem; color: #94a3b8; line-height: 1.6; max-width: 300px;">
          Patent-Grade Financial & ERP Platform powered by AI CFO Intelligence, 1-Tap Camera OCR, and Merkle Vault.
        </p>
      </div>
      <div>
        <div style="font-weight: 800; font-size: .95rem; margin-bottom: 1rem; color: #fff;">Platform</div>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: .88rem; color: #94a3b8;">
          <li><a href="#ocr-story" style="color: inherit; text-decoration: none;">OCR Engine</a></li>
          <li><a href="#ai-story" style="color: inherit; text-decoration: none;">AI CFO</a></li>
          <li><a href="#security-story" style="color: inherit; text-decoration: none;">Merkle Vault</a></li>
          <li><a href="/HisabHero-v5.5.0-Enterprise-Release.apk" download style="color: #10b981; text-decoration: none; font-weight: 700;">Android APK</a></li>
        </ul>
      </div>
      <div>
        <div style="font-weight: 800; font-size: .95rem; margin-bottom: 1rem; color: #fff;">Company</div>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: .88rem; color: #94a3b8;">
          <li><a href="#reasons" style="color: inherit; text-decoration: none;">Strengths</a></li>
          <li><a href="#reviews" style="color: inherit; text-decoration: none;">Reviews</a></li>
          <li><a href="#contact" style="color: inherit; text-decoration: none;">Contact Support</a></li>
        </ul>
      </div>
      <div>
        <div style="font-weight: 800; font-size: .95rem; margin-bottom: 1rem; color: #fff;">Security</div>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: .88rem; color: #94a3b8;">
          <li>🔒 256-Bit SSL Encrypted</li>
          <li>🛡️ SHA-256 Merkle Chained</li>
          <li>🏛️ GST & IRN Compliant</li>
        </ul>
      </div>
    </div>

    <div class="container" style="border-top: 1px solid #1e293b; padding-top: 2rem; display: flex; justify-content: space-between; align-items: center; font-size: .8rem; color: #64748b; flex-wrap: wrap; gap: 1rem;">
      <div>© 2026 HisabHero Technologies Inc. • Powered by Quality. Committed to Efficiency.</div>
      <div>Patent-Grade Financial Engine V5.5</div>
    </div>
  </footer>
</div>
`;

let content = fs.readFileSync(indexPath, 'utf8');

// Replace everything between <body> and <div id="dashboardView" with fullRichLandingSections
const bodyStart = content.indexOf('<body>');
const dashStart = content.indexOf('<div id="dashboardView"');

if (bodyStart !== -1 && dashStart !== -1) {
  content = content.substring(0, bodyStart + 6) + '\n\n' + fullRichLandingSections + '\n\n' + content.substring(dashStart);
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log("Successfully restored complete rich website landing page with all 6 sections and cinematic hero!");
} else {
  console.error("Could not find body or dashboardView");
}
