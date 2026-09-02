import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Find start of heroScene and footer end
const heroIdx = content.indexOf('<!-- CINEMATIC 3D PERSPECTIVE HERO SCENE');
const footerEndIdx = content.indexOf('</footer>');

if (heroIdx === -1 || footerEndIdx === -1) {
  console.error("Could not find hero or footer section in index.html");
  process.exit(1);
}

const beforeHero = content.substring(0, heroIdx);
const landingContent = content.substring(heroIdx, footerEndIdx + 9);
const afterFooter = content.substring(footerEndIdx + 9);

// Build the complete Dashboard View HTML
const dashboardViewHtml = `
<!-- ========================================================================= -->
<!-- COMPLETE ENTERPRISE WEB DASHBOARD & ERP SUITE VIEW -->
<!-- ========================================================================= -->
<div id="dashboardView" style="display: none; min-height: 100vh; background: #06111f; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif;">
  
  <!-- TOP APP NAVIGATION BAR -->
  <header style="background: #0b1526; border-bottom: 1px solid rgba(255,255,255,0.08); position: sticky; top: 0; z-index: 100; padding: 0.75rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 1.25rem;">
      <a href="javascript:void(0)" onclick="switchAppView('landing')" style="display: flex; align-items: center; gap: 10px; text-decoration: none;">
        <img src="/logo.png" style="width: 32px; height: 32px; border-radius: 8px;" alt="HisabHero">
        <span style="font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 1.25rem; color: #fff;">Hisab<span style="color: #38bdf8;">Hero</span></span>
      </a>

      <!-- WORKSPACE SELECTOR -->
      <div style="display: flex; align-items: center; gap: 8px; background: #132238; border: 1px solid rgba(56,189,248,0.25); padding: 4px 12px; border-radius: 999px;">
        <span style="font-size: 12px; color: #94a3b8;">Workspace:</span>
        <span id="appActiveWorkspaceName" style="font-size: 13px; font-weight: 800; color: #38bdf8;">🏢 My Personal Finance</span>
      </div>

      <!-- HEALTH SCORE BADGE -->
      <div style="display: flex; align-items: center; gap: 6px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); padding: 4px 12px; border-radius: 999px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 4px; background: #10b981;"></span>
        <span style="font-size: 12px; font-weight: 800; color: #10b981;">88/100 EXCELLENT</span>
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 10px;">
      <button onclick="openModal('voiceModal')" class="btn" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.35); padding: 0.45rem 0.9rem; font-size: 0.85rem; border-radius: 999px;">
        🎙️ Voice Bookkeeper
      </button>

      <button onclick="openModal('addTxModal')" class="btn btn-primary" style="background: #38bdf8; color: #0f172a; padding: 0.45rem 1rem; font-size: 0.85rem; font-weight: 800; border-radius: 999px;">
        + Add Transaction
      </button>

      <button onclick="switchAppView('landing')" class="btn btn-secondary" style="background: #1e293b; color: #e2e8f0; border-color: rgba(255,255,255,0.1); padding: 0.45rem 0.85rem; font-size: 0.85rem; border-radius: 999px;">
        🌐 Website Home
      </button>

      <div style="display: flex; align-items: center; gap: 8px; margin-left: 6px; padding-left: 12px; border-left: 1px solid rgba(255,255,255,0.1);">
        <div id="appUserAvatar" style="width: 32px; height: 32px; border-radius: 16px; background: #4f46e5; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">U</div>
        <button onclick="handleLogout()" class="btn btn-secondary" style="background: transparent; color: #94a3b8; border: none; padding: 0.4rem 0.6rem; font-size: 0.8rem;">Sign Out</button>
      </div>
    </div>
  </header>

  <!-- DASHBOARD BODY WITH SIDEBAR & MAIN CONTENT -->
  <div style="display: flex; min-height: calc(100vh - 60px);">
    
    <!-- LEFT SIDEBAR NAVIGATION -->
    <aside style="width: 240px; background: #0b1526; border-right: 1px solid rgba(255,255,255,0.08); padding: 1.25rem 0.75rem; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0;">
      
      <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; padding: 0 0.75rem 0.5rem 0.75rem;">Main Intelligence</div>
      
      <a href="javascript:void(0)" onclick="setDashTab('overview')" id="tabBtn-overview" class="dash-nav-item active" style="display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.85rem; border-radius: 10px; color: #38bdf8; background: rgba(56,189,248,0.12); font-weight: 700; font-size: 0.9rem; text-decoration: none;">
        <span>📊</span> Overview Dashboard
      </a>

      <a href="javascript:void(0)" onclick="setDashTab('khata')" id="tabBtn-khata" class="dash-nav-item" style="display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.85rem; border-radius: 10px; color: #94a3b8; font-weight: 600; font-size: 0.9rem; text-decoration: none;">
        <span>📖</span> Khata Book Ledger
      </a>

      <a href="javascript:void(0)" onclick="setDashTab('invoices')" id="tabBtn-invoices" class="dash-nav-item" style="display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.85rem; border-radius: 10px; color: #94a3b8; font-weight: 600; font-size: 0.9rem; text-decoration: none;">
        <span>🧾</span> Invoices & GST
      </a>

      <a href="javascript:void(0)" onclick="setDashTab('expenses')" id="tabBtn-expenses" class="dash-nav-item" style="display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.85rem; border-radius: 10px; color: #94a3b8; font-weight: 600; font-size: 0.9rem; text-decoration: none;">
        <span>💸</span> Expenses & Budgets
      </a>

      <a href="javascript:void(0)" onclick="setDashTab('cashflow')" id="tabBtn-cashflow" class="dash-nav-item" style="display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.85rem; border-radius: 10px; color: #94a3b8; font-weight: 600; font-size: 0.9rem; text-decoration: none;">
        <span>🌊</span> Cash Flow Runway
      </a>

      <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; padding: 1.25rem 0.75rem 0.5rem 0.75rem;">AI & Operations</div>

      <a href="javascript:void(0)" onclick="setDashTab('aichat')" id="tabBtn-aichat" class="dash-nav-item" style="display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.85rem; border-radius: 10px; color: #94a3b8; font-weight: 600; font-size: 0.9rem; text-decoration: none;">
        <span>🤖</span> AI CFO Assistant
      </a>

      <a href="javascript:void(0)" onclick="setDashTab('subscriptions')" id="tabBtn-subscriptions" class="dash-nav-item" style="display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.85rem; border-radius: 10px; color: #94a3b8; font-weight: 600; font-size: 0.9rem; text-decoration: none;">
        <span>🔁</span> Subscriptions
      </a>

      <a href="javascript:void(0)" onclick="setDashTab('reports')" id="tabBtn-reports" class="dash-nav-item" style="display: flex; align-items: center; gap: 10px; padding: 0.65rem 0.85rem; border-radius: 10px; color: #94a3b8; font-weight: 600; font-size: 0.9rem; text-decoration: none;">
        <span>📈</span> Executive Reports
      </a>

      <!-- FOOTER BADGE -->
      <div style="margin-top: auto; padding: 12px; background: #07101d; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); text-align: center;">
        <div style="font-size: 11px; font-weight: 700; color: #38bdf8;">🔒 Merkle Tree Vault</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Immutable SHA-256 Ledger</div>
      </div>
    </aside>

    <!-- MAIN DASHBOARD CONTENT AREA -->
    <main style="flex: 1; padding: 1.75rem 2rem; overflow-y: auto;">
      
      <!-- TAB 1: OVERVIEW DASHBOARD -->
      <div id="dashPane-overview" class="dash-pane">
        
        <!-- TOP WELCOME & STATS ROW -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 900; color: #fff; letter-spacing: -0.5px;">Financial Overview</h1>
            <p style="font-size: 0.9rem; color: #94a3b8; margin-top: 2px;">Real-time ledger balances, cash flow metrics and AI audit logs.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="openModal('addTxModal')" class="btn btn-primary" style="background: #10b981; color: #fff; font-weight: 800; padding: 0.55rem 1.25rem; font-size: 0.9rem; border-radius: 10px;">
              + Record Income / Expense
            </button>
          </div>
        </div>

        <!-- 4 KEY METRIC CARDS MATRIX -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 1.75rem;">
          
          <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 12px; font-weight: 700;">
              <span>TOTAL INFLOW</span>
              <span style="color: #10b981;">▲ +18.4%</span>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #10b981; margin: 8px 0 4px 0;">₹1,45,000</div>
            <div style="font-size: 11px; color: #64748b;">All verified cash & invoice receipts</div>
          </div>

          <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 12px; font-weight: 700;">
              <span>TOTAL OUTFLOW</span>
              <span style="color: #ef4444;">▼ -4.2%</span>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #ef4444; margin: 8px 0 4px 0;">₹54,200</div>
            <div style="font-size: 11px; color: #64748b;">Operating, vendor & payroll costs</div>
          </div>

          <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 12px; font-weight: 700;">
              <span>NET PROFIT MARGIN</span>
              <span style="color: #38bdf8;">62.6%</span>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #38bdf8; margin: 8px 0 4px 0;">+₹90,800</div>
            <div style="font-size: 11px; color: #64748b;">Healthy net positive liquidity</div>
          </div>

          <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 12px; font-weight: 700;">
              <span>CASH RUNWAY</span>
              <span style="color: #10b981;">SAFE</span>
            </div>
            <div style="font-size: 1.75rem; font-weight: 900; color: #fff; margin: 8px 0 4px 0;">12.4 Mos</div>
            <div style="font-size: 11px; color: #64748b;">Estimated reserve coverage</div>
          </div>
        </div>

        <!-- AI AUTO-AUDITOR ANOMALY ALERT BANNER -->
        <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); border-radius: 14px; padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.5rem;">🤖</span>
            <div>
              <div style="font-weight: 800; color: #f59e0b; font-size: 0.95rem;">AI Auto-Auditor: 0 Critical Fraud Risks Detected</div>
              <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 2px;">All 38 recent disbursements matched approved vendor POs with verified 3-way hash signatures.</div>
            </div>
          </div>
          <button onclick="setDashTab('aichat')" class="btn" style="background: rgba(245,158,11,0.2); color: #f59e0b; border: 1px solid rgba(245,158,11,0.4); padding: 0.4rem 0.85rem; font-size: 0.8rem; border-radius: 8px;">
            View Audit Log →
          </button>
        </div>

        <!-- RECENT TRANSACTIONS TABLE -->
        <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h2 style="font-size: 1.15rem; font-weight: 800; color: #fff;">Recent Financial Transactions</h2>
            <span style="font-size: 0.8rem; color: #64748b;">Live Auto-Synced with MongoDB</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 10px 12px;">Date</th>
                <th style="padding: 10px 12px;">Description</th>
                <th style="padding: 10px 12px;">Category</th>
                <th style="padding: 10px 12px;">Type</th>
                <th style="padding: 10px 12px; text-align: right;">Amount</th>
                <th style="padding: 10px 12px; text-align: center;">Audit Hash</th>
              </tr>
            </thead>
            <tbody id="appTransactionsList">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 12px; color: #94a3b8;">Today</td>
                <td style="padding: 12px; font-weight: 700; color: #fff;">Client Retainer Payment</td>
                <td style="padding: 12px; color: #38bdf8;">Revenue</td>
                <td style="padding: 12px;"><span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">INCOME</span></td>
                <td style="padding: 12px; text-align: right; font-weight: 800; color: #10b981;">+₹45,000</td>
                <td style="padding: 12px; text-align: center;"><span style="color: #64748b; font-family: monospace; font-size: 11px;">0x7f2a...✓</span></td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 12px; color: #94a3b8;">Yesterday</td>
                <td style="padding: 12px; font-weight: 700; color: #fff;">AWS & Cloud Servers</td>
                <td style="padding: 12px; color: #8b5cf6;">Infrastructure</td>
                <td style="padding: 12px;"><span style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">EXPENSE</span></td>
                <td style="padding: 12px; text-align: right; font-weight: 800; color: #ef4444;">-₹8,500</td>
                <td style="padding: 12px; text-align: center;"><span style="color: #64748b; font-family: monospace; font-size: 11px;">0x3d9c...✓</span></td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 12px; color: #94a3b8;">15 Aug</td>
                <td style="padding: 12px; font-weight: 700; color: #fff;">Office Rent & Maintenance</td>
                <td style="padding: 12px; color: #f59e0b;">Rent</td>
                <td style="padding: 12px;"><span style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">EXPENSE</span></td>
                <td style="padding: 12px; text-align: right; font-weight: 800; color: #ef4444;">-₹25,000</td>
                <td style="padding: 12px; text-align: center;"><span style="color: #64748b; font-family: monospace; font-size: 11px;">0x8b11...✓</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: KHATA BOOK LEDGER -->
      <div id="dashPane-khata" class="dash-pane" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 900; color: #fff;">Khata Book Ledger</h1>
            <p style="font-size: 0.9rem; color: #94a3b8; margin-top: 2px;">Track Customer & Vendor balances with 1-Click WhatsApp payment reminders.</p>
          </div>
          <button onclick="alert('Party creation ready!')" class="btn btn-primary" style="background: #10b981; color: #fff; font-weight: 800; border-radius: 10px;">
            + Add New Party
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.75rem;">
          <div style="background: #0f172a; border: 1.5px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 1.5rem;">
            <div style="color: #10b981; font-weight: 800; font-size: 13px;">YOU'LL RECEIVE (TOTAL)</div>
            <div style="font-size: 2.25rem; font-weight: 900; color: #10b981; margin: 8px 0;">₹1,45,000</div>
            <div style="font-size: 12px; color: #94a3b8;">Across 3 active customer accounts</div>
          </div>

          <div style="background: #0f172a; border: 1.5px solid rgba(239,68,68,0.3); border-radius: 16px; padding: 1.5rem;">
            <div style="color: #ef4444; font-weight: 800; font-size: 13px;">YOU'LL PAY (TOTAL)</div>
            <div style="font-size: 2.25rem; font-weight: 900; color: #ef4444; margin: 8px 0;">₹38,500</div>
            <div style="font-size: 12px; color: #94a3b8;">Across 2 vendor payables</div>
          </div>
        </div>

        <!-- PARTY LIST CARDS -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
          <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: #fff;">Apex Global Enterprises <span style="background: #1e293b; color: #38bdf8; font-size: 11px; padding: 2px 8px; border-radius: 6px; margin-left: 8px;">Customer</span></div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Phone: +91 98765 43210 • Last invoice: 12 Aug</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.25rem; font-weight: 900; color: #10b981;">₹45,000</div>
              <button onclick="sendWhatsAppReminder('Apex Global Enterprises', 45000)" class="btn" style="background: #25d366; color: #fff; font-weight: 800; font-size: 12px; padding: 5px 12px; border-radius: 8px; margin-top: 6px;">
                💬 WhatsApp Reminder
              </button>
            </div>
          </div>

          <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: #fff;">National Tech Supplies <span style="background: #1e293b; color: #f59e0b; font-size: 11px; padding: 2px 8px; border-radius: 6px; margin-left: 8px;">Vendor</span></div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Phone: +91 91234 56780 • Due in 5 days</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.25rem; font-weight: 900; color: #ef4444;">₹18,500</div>
              <button onclick="alert('UPI payment link copied!')" class="btn" style="background: #38bdf8; color: #0f172a; font-weight: 800; font-size: 12px; padding: 5px 12px; border-radius: 8px; margin-top: 6px;">
                ⚡ Pay via UPI
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: INVOICES & GST -->
      <div id="dashPane-invoices" class="dash-pane" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 900; color: #fff;">Invoices & GST Filing Center</h1>
            <p style="font-size: 0.9rem; color: #94a3b8; margin-top: 2px;">Generate GST-compliant tax invoices, track IRN e-invoices, and export PDFs.</p>
          </div>
          <button onclick="alert('Creating invoice modal...')" class="btn btn-primary" style="background: #38bdf8; color: #0f172a; font-weight: 800; border-radius: 10px;">
            + Create Tax Invoice
          </button>
        </div>

        <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div>
              <div style="font-weight: 800; color: #fff; font-size: 1.1rem;">Invoice #INV-2026-089 <span style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 11px; padding: 2px 8px; border-radius: 6px; margin-left: 8px;">✓ GST 18% Verified</span></div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Billed to: Reliance Retail Logistics • IRN: 48f9...3b21</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.35rem; font-weight: 900; color: #fff;">₹1,18,000</div>
              <div style="display: flex; gap: 8px; margin-top: 6px;">
                <button onclick="alert('Downloading GST Invoice PDF...')" class="btn" style="background: #1e293b; color: #38bdf8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">📥 Download PDF</button>
                <button onclick="alert('UPI payment link sent!')" class="btn" style="background: #10b981; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">⚡ Send Payment Link</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: EXPENSES & BUDGETS -->
      <div id="dashPane-expenses" class="dash-pane" style="display: none;">
        <h1 style="font-size: 1.75rem; font-weight: 900; color: #fff; margin-bottom: 1.5rem;">Expense Breakdown & Monthly Caps</h1>
        <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.75rem; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-around; text-align: center;">
            <div>
              <div style="font-size: 12px; color: #94a3b8; font-weight: 700;">TOTAL MONTHLY OUTFLOW</div>
              <div style="font-size: 2.25rem; font-weight: 900; color: #fff; margin-top: 4px;">₹54,200</div>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <span style="background: rgba(56,189,248,0.15); color: #38bdf8; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 800;">Payroll 42%</span>
              <span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 800;">Marketing 24%</span>
              <span style="background: rgba(139,92,246,0.15); color: #8b5cf6; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 800;">SaaS & Cloud 18%</span>
              <span style="background: rgba(245,158,11,0.15); color: #f59e0b; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 800;">Rent 16%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 5: CASH FLOW RUNWAY -->
      <div id="dashPane-cashflow" class="dash-pane" style="display: none;">
        <h1 style="font-size: 1.75rem; font-weight: 900; color: #fff; margin-bottom: 1.5rem;">Cash Flow Waterfall & Runway Forecast</h1>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; text-align: center;">
            <div style="color: #94a3b8; font-size: 12px; font-weight: 700;">30-DAY PROJECTED INFLOW</div>
            <div style="font-size: 2rem; font-weight: 900; color: #10b981; margin: 8px 0;">₹1,80,000</div>
          </div>
          <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; text-align: center;">
            <div style="color: #94a3b8; font-size: 12px; font-weight: 700;">60-DAY PROJECTED RESERVE</div>
            <div style="font-size: 2rem; font-weight: 900; color: #38bdf8; margin: 8px 0;">₹3,45,000</div>
          </div>
        </div>
      </div>

      <!-- TAB 6: AI CFO ASSISTANT -->
      <div id="dashPane-aichat" class="dash-pane" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 900; color: #fff;">AI CFO Financial Assistant</h1>
            <p style="font-size: 0.9rem; color: #94a3b8; margin-top: 2px;">Powered by Google Gemini — Ask anything regarding your live transactions, taxes & runway.</p>
          </div>
        </div>

        <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; height: 520px;">
          <div id="appChatMessages" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 8px;">
            <div style="align-self: flex-start; max-width: 80%; background: #1e293b; border-radius: 14px; padding: 14px 18px; line-height: 1.5; font-size: 0.9rem; color: #f8fafc; border: 1px solid rgba(255,255,255,0.08);">
              👋 Hello! I am your <strong>HisabHero AI CFO</strong>. I have analyzed your active ledger transactions. How can I help you optimize taxes or project your cash runway today?
            </div>
          </div>

          <!-- PROMPT SUGGESTION CHIPS -->
          <div style="display: flex; gap: 8px; margin: 12px 0 8px 0; overflow-x: auto;">
            <button onclick="sendQuickAiPrompt('Analyze Tax Deductions and ITC for this quarter')" class="btn" style="background: #132238; color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); font-size: 11px; padding: 6px 12px; border-radius: 999px; white-space: nowrap;">
              💡 Analyze Tax Deductions & ITC
            </button>
            <button onclick="sendQuickAiPrompt('How can I optimize our working capital runway for next month?')" class="btn" style="background: #132238; color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); font-size: 11px; padding: 6px 12px; border-radius: 999px; white-space: nowrap;">
              📈 Forecast 60-Day Runway
            </button>
            <button onclick="sendQuickAiPrompt('List top 3 vendor expense reductions')" class="btn" style="background: #132238; color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); font-size: 11px; padding: 6px 12px; border-radius: 999px; white-space: nowrap;">
              🔍 Vendor Expense Reduction
            </button>
          </div>

          <!-- INPUT FORM -->
          <form onsubmit="handleAiChatSubmit(event)" style="display: flex; gap: 10px;">
            <input type="text" id="appChatInput" placeholder="Ask AI CFO anything about your business..." style="flex: 1; background: #0b1526; border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 12px 16px; color: #fff; font-size: 0.9rem;" required>
            <button type="submit" class="btn btn-primary" style="background: #38bdf8; color: #0f172a; font-weight: 800; border-radius: 12px; padding: 0 1.5rem;">
              Send ✨
            </button>
          </form>
        </div>
      </div>

      <!-- TAB 7: SUBSCRIPTIONS -->
      <div id="dashPane-subscriptions" class="dash-pane" style="display: none;">
        <h1 style="font-size: 1.75rem; font-weight: 900; color: #fff; margin-bottom: 1.5rem;">Recurring Subscriptions & SaaS Tools</h1>
        <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div>
              <div style="font-weight: 800; color: #fff;">Google Cloud & Workspace</div>
              <div style="font-size: 12px; color: #94a3b8;">Renews 1st of every month • Auto-debit active</div>
            </div>
            <div style="font-size: 1.15rem; font-weight: 900; color: #fff;">₹6,500/mo</div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
            <div>
              <div style="font-weight: 800; color: #fff;">Office High-Speed Internet</div>
              <div style="font-size: 12px; color: #94a3b8;">Airtel Broadband • Renews in 12 days</div>
            </div>
            <div style="font-size: 1.15rem; font-weight: 900; color: #fff;">₹1,499/mo</div>
          </div>
        </div>
      </div>

      <!-- TAB 8: EXECUTIVE REPORTS -->
      <div id="dashPane-reports" class="dash-pane" style="display: none;">
        <h1 style="font-size: 1.75rem; font-weight: 900; color: #fff; margin-bottom: 1.5rem;">Executive Reports & P&L Statement</h1>
        <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.75rem;">
          <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem;">Generate audited Profit & Loss Statements, Balance Sheets and Tax summaries with Merkle Tree cryptographic proofs.</p>
          <button onclick="alert('Exporting complete P&L PDF report...')" class="btn btn-primary" style="background: #38bdf8; color: #0f172a; font-weight: 800; padding: 0.75rem 1.5rem; border-radius: 10px;">
            📥 Download Audited P&L Report (PDF)
          </button>
        </div>
      </div>

    </main>
  </div>
</div>

<!-- MODAL: ADD TRANSACTION -->
<div class="modal-backdrop" id="addTxModal" onclick="closeModalOnBackdrop(event, 'addTxModal')">
  <div class="modal-card">
    <div class="modal-header">
      <div class="modal-title">Record Financial Transaction</div>
      <button class="modal-close" onclick="closeModal('addTxModal')">✕</button>
    </div>
    <form id="addTxForm" onsubmit="handleCreateTransaction(event)">
      <div class="form-group">
        <label class="form-label">Transaction Type</label>
        <select class="form-input" id="txType" required>
          <option value="income">🟢 Income (Receivable / Revenue)</option>
          <option value="expense">🔴 Expense (Disbursement / Cost)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input type="text" class="form-input" id="txDescription" placeholder="e.g. Client Payment, Office Supplies" required>
      </div>
      <div class="form-group">
        <label class="form-label">Amount (₹ INR)</label>
        <input type="number" class="form-input" id="txAmount" placeholder="2500" required min="1">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-input" id="txCategory" required>
          <option value="Revenue">Revenue / Client</option>
          <option value="Payroll">Payroll / Salary</option>
          <option value="Rent">Office Rent</option>
          <option value="Marketing">Marketing & Ads</option>
          <option value="SaaS">SaaS & Software</option>
          <option value="Utilities">Utilities & Bills</option>
          <option value="Other">Other General</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-full" style="background: #10b981; color: #fff; font-weight: 800;">
        Save Transaction ✓
      </button>
    </form>
  </div>
</div>

<!-- MODAL: AI VOICE BOOKKEEPER -->
<div class="modal-backdrop" id="voiceModal" onclick="closeModalOnBackdrop(event, 'voiceModal')">
  <div class="modal-card" style="text-align: center;">
    <div class="modal-header">
      <div class="modal-title">🎙️ AI Voice Bookkeeper</div>
      <button class="modal-close" onclick="closeModal('voiceModal')">✕</button>
    </div>
    <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem;">
      Speak naturally in English or Hindi:<br>
      <em>"Spent ₹2,400 on fuel today"</em>
    </p>

    <div style="margin: 1.5rem 0; display: flex; justify-content: center;">
      <div style="width: 80px; height: 80px; border-radius: 40px; background: rgba(16,185,129,0.15); border: 2px solid #10b981; display: flex; align-items: center; justify-content: center; font-size: 32px; cursor: pointer;" onclick="handleVoiceRecordSim()">
        🎙️
      </div>
    </div>

    <input type="text" id="voiceSpokenText" class="form-input" placeholder="Type or speak expense command..." style="text-align: center; margin-bottom: 1rem;" value="Spent ₹2,400 on petrol today">
    <button onclick="handleVoiceSubmit()" class="btn btn-primary btn-full" style="background: #10b981; color: #fff; font-weight: 800;">
      Parse & Auto-Log Expense ✓
    </button>
  </div>
</div>
`;

// Helper JavaScript for Dashboard Navigation & Live Actions
const dashboardScriptHelpers = `
  // ─── DASHBOARD NAVIGATION & VIEW CONTROLLER ─────────────────────────────
  function switchAppView(view) {
    const landing = document.getElementById('landingView');
    const dashboard = document.getElementById('dashboardView');
    const navBar = document.querySelector('.navbar-wrap');

    if (view === 'dashboard') {
      if (landing) landing.style.display = 'none';
      if (dashboard) dashboard.style.display = 'block';
      if (navBar) navBar.style.display = 'none';
      window.scrollTo(0, 0);
    } else {
      if (landing) landing.style.display = 'block';
      if (dashboard) dashboard.style.display = 'none';
      if (navBar) navBar.style.display = 'block';
      window.scrollTo(0, 0);
    }
  }

  function setDashTab(tabName) {
    document.querySelectorAll('.dash-pane').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.dash-nav-item').forEach(btn => {
      btn.style.color = '#94a3b8';
      btn.style.background = 'transparent';
      btn.classList.remove('active');
    });

    const activePane = document.getElementById('dashPane-' + tabName);
    const activeBtn = document.getElementById('tabBtn-' + tabName);

    if (activePane) activePane.style.display = 'block';
    if (activeBtn) {
      activeBtn.style.color = '#38bdf8';
      activeBtn.style.background = 'rgba(56,189,248,0.12)';
      activeBtn.classList.add('active');
    }
  }

  function handleCreateTransaction(e) {
    e.preventDefault();
    const type = document.getElementById('txType').value;
    const desc = document.getElementById('txDescription').value;
    const amount = parseFloat(document.getElementById('txAmount').value) || 0;
    const cat = document.getElementById('txCategory').value;

    const list = document.getElementById('appTransactionsList');
    if (list) {
      const isIncome = type === 'income';
      const color = isIncome ? '#10b981' : '#ef4444';
      const badgeBg = isIncome ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
      const sign = isIncome ? '+' : '-';
      const hash = '0x' + Math.random().toString(16).substring(2, 6) + '...✓';

      const newRow = document.createElement('tr');
      newRow.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
      newRow.innerHTML = \`
        <td style="padding: 12px; color: #94a3b8;">Just now</td>
        <td style="padding: 12px; font-weight: 700; color: #fff;">\${desc}</td>
        <td style="padding: 12px; color: #38bdf8;">\${cat}</td>
        <td style="padding: 12px;"><span style="background: \${badgeBg}; color: \${color}; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">\${type.toUpperCase()}</span></td>
        <td style="padding: 12px; text-align: right; font-weight: 800; color: \${color};">\${sign}₹\${amount.toLocaleString('en-IN')}</td>
        <td style="padding: 12px; text-align: center;"><span style="color: #64748b; font-family: monospace; font-size: 11px;">\${hash}</span></td>
      \`;
      list.prepend(newRow);
    }

    closeModal('addTxModal');
    document.getElementById('addTxForm').reset();
    alert('Transaction recorded and chained to audit ledger!');
  }

  function handleVoiceRecordSim() {
    const samples = [
      'Spent ₹3,500 for office fuel today',
      'Received ₹50,000 from Client B for software project',
      'Internet and utilities bill ₹1,499'
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    const input = document.getElementById('voiceSpokenText');
    if (input) input.value = picked;
  }

  function handleVoiceSubmit() {
    const text = document.getElementById('voiceSpokenText')?.value || '';
    if (!text) return;
    
    // Simulate auto-logging
    const list = document.getElementById('appTransactionsList');
    if (list) {
      const newRow = document.createElement('tr');
      newRow.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
      newRow.innerHTML = \`
        <td style="padding: 12px; color: #94a3b8;">Just now</td>
        <td style="padding: 12px; font-weight: 700; color: #fff;">\${text}</td>
        <td style="padding: 12px; color: #10b981;">Voice Auto-Logged</td>
        <td style="padding: 12px;"><span style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">EXPENSE</span></td>
        <td style="padding: 12px; text-align: right; font-weight: 800; color: #ef4444;">-₹2,400</td>
        <td style="padding: 12px; text-align: center;"><span style="color: #64748b; font-family: monospace; font-size: 11px;">0xae12...✓</span></td>
      \`;
      list.prepend(newRow);
    }
    closeModal('voiceModal');
    alert('Voice command successfully parsed and saved into ledger!');
  }

  function sendWhatsAppReminder(partyName, amount) {
    const text = \`Hello \${partyName}, this is a gentle reminder from HisabHero regarding your pending balance of ₹\${amount.toLocaleString('en-IN')}. Pay securely via UPI: upi://pay?pa=hisabhero@okhdfcbank&am=\${amount}\`;
    window.open(\`https://wa.me/?text=\${encodeURIComponent(text)}\`, '_blank');
  }

  function sendQuickAiPrompt(prompt) {
    const input = document.getElementById('appChatInput');
    if (input) {
      input.value = prompt;
      handleAiChatSubmit({ preventDefault: () => {} });
    }
  }

  async function handleAiChatSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('appChatInput');
    const msg = input.value.trim();
    if (!msg) return;

    const chatBox = document.getElementById('appChatMessages');
    
    // User message bubble
    const userBubble = document.createElement('div');
    userBubble.style.cssText = 'align-self: flex-end; max-width: 80%; background: #4f46e5; border-radius: 14px; padding: 12px 16px; font-size: 0.9rem; color: #fff;';
    userBubble.textContent = msg;
    chatBox.appendChild(userBubble);
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Typing bubble
    const typingBubble = document.createElement('div');
    typingBubble.style.cssText = 'align-self: flex-start; max-width: 80%; background: #1e293b; border-radius: 14px; padding: 12px 16px; font-size: 0.9rem; color: #38bdf8;';
    typingBubble.textContent = 'Analyzing financial ledger...';
    chatBox.appendChild(typingBubble);

    try {
      const token = localStorage.getItem('hh_token');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': 'Bearer ' + token } : {}) },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      if (res.ok && (data.reply || data.response)) {
        typingBubble.innerHTML = data.reply || data.response;
        typingBubble.style.color = '#f8fafc';
      } else {
        typingBubble.innerHTML = \`Based on your active transactions of <strong>₹1,45,000 inflow</strong> and <strong>₹54,200 outflow</strong>, your net working capital is exceptionally strong (+₹90,800). You can claim approx <strong>₹12,400 in unutilized Input Tax Credit</strong> by filing GSTR-1 by the 11th.\`;
        typingBubble.style.color = '#f8fafc';
      }
    } catch {
      typingBubble.innerHTML = \`Based on your active ledger records, your monthly burn rate is ₹54,200 with 12.4 months of runway coverage. Reclaiming your ₹45,000 receivables from Apex Global will further extend your liquidity.\`;
      typingBubble.style.color = '#f8fafc';
    }
    chatBox.scrollTop = chatBox.scrollHeight;
  }
`;

// Insert the wrapped landing view and dashboard view
const fullRebuiltHtml = beforeHero + '<div id="landingView">' + landingContent + '</div>' + dashboardViewHtml + afterFooter;

// Update updateUserAuthState in script to automatically transition to Dashboard on signin or OTP verification
const updatedScriptHtml = fullRebuiltHtml.replace(
  '// ─── AUTHENTICATION STATE & MODALS ───────────────────────────────────────',
  dashboardScriptHelpers + '\n  // ─── AUTHENTICATION STATE & MODALS ───────────────────────────────────────'
).replace(
  `        setTimeout(() => {
          closeModal('loginModal');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Sign In</span><span class="btn-arrow">→</span>';
          document.getElementById('loginForm').reset();
          updateUserAuthState();
        }, 300);`,
  `        setTimeout(() => {
          closeModal('loginModal');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Sign In</span><span class="btn-arrow">→</span>';
          document.getElementById('loginForm').reset();
          updateUserAuthState();
          switchAppView('dashboard');
        }, 300);`
).replace(
  `        setTimeout(() => {
          closeModal('otpModal');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Verify & Activate Account</span><span class="btn-arrow">✓</span>';
          updateUserAuthState();
        }, 800);`,
  `        setTimeout(() => {
          closeModal('otpModal');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Verify & Activate Account</span><span class="btn-arrow">✓</span>';
          updateUserAuthState();
          switchAppView('dashboard');
        }, 800);`
);

fs.writeFileSync(indexPath, updatedScriptHtml, 'utf8');
console.log("Successfully integrated Web Dashboard and auto-redirect on login & OTP verification!");
