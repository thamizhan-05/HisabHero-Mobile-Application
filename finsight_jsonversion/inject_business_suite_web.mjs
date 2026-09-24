import fs from 'fs';
import path from 'path';

const htmlPath = path.resolve('backend/public/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Add Voice Copilot button to Top Action Bar if not present
if (!html.includes('id="dashVoiceCopilotBtn"')) {
  const targetBtn = '<button class="btn btn-outline" id="dashUploadStatementBtn"';
  const voiceBtn = `<button class="btn" id="dashVoiceCopilotBtn" style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: #ffffff; font-weight: 800; border: none; box-shadow: 0 4px 15px rgba(16,185,129,0.35); display: flex; align-items: center; gap: 6px;" onclick="openBhashaVoiceModal()">
                <span>🎙️</span> <span>Voice Copilot (Bhasha AI)</span>
              </button>\n              `;
  html = html.replace(targetBtn, voiceBtn + targetBtn);
  console.log('✅ Added Voice Copilot button to header');
}

// 2. Add 30-Day Cash Crunch Radar to #section-cashflow
const cashCrunchHtml = `
            <!-- 🚨 30-DAY PREDICTIVE CASH CRUNCH EARLY WARNING RADAR -->
            <div id="cashCrunchRadarBox" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.06) 100%); border: 1.5px solid rgba(239, 68, 68, 0.35); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.75rem; position: relative; overflow: hidden;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.4rem;">🚨</span>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #f87171; margin: 0;">30-Day Cash Crunch Early Warning Radar</h3>
                    <span id="radarRiskBadge" class="pill-badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.4); font-size: 0.7rem; font-weight: 800;">CALCULATING...</span>
                  </div>
                  <p style="color: #cbd5e1; font-size: 0.85rem; margin-top: 4px; max-width: 650px;">
                    Forward-looking AI liquidity forecasting combining scheduled receivables, Khata aging, recurring EMI/Rent dates, and tax commitments.
                  </p>
                </div>
                <button class="btn btn-outline" style="border-color: #f87171; color: #fca5a5; font-size: 0.78rem; padding: 0.35rem 0.85rem;" onclick="loadCashFlowRadar(true)">
                  🔄 Refresh Radar
                </button>
              </div>

              <div class="metrics-grid" style="margin-bottom: 1rem;">
                <div class="metric-card" style="background: rgba(15, 23, 42, 0.6); border-color: rgba(239, 68, 68, 0.2);">
                  <div class="metric-title" style="color: #fca5a5;">Projected Deficit Date</div>
                  <div id="radarCrunchDate" class="metric-value" style="color: #f87171; font-size: 1.4rem;">Analyzing...</div>
                  <div id="radarDaysUntil" class="metric-sub" style="color: #f87171;">Countdown to liquidity gap</div>
                </div>
                <div class="metric-card" style="background: rgba(15, 23, 42, 0.6); border-color: rgba(239, 68, 68, 0.2);">
                  <div class="metric-title" style="color: #fca5a5;">Max Projected Deficit</div>
                  <div id="radarMaxDeficit" class="metric-value" style="color: #ef4444; font-size: 1.4rem;">₹0</div>
                  <div class="metric-sub">Required buffer to stay solvent</div>
                </div>
                <div class="metric-card" style="background: rgba(15, 23, 42, 0.6); border-color: rgba(16, 185, 129, 0.2);">
                  <div class="metric-title" style="color: #6ee7b7;">Estimated Cash Runway</div>
                  <div id="radarRunwayDays" class="metric-value" style="color: #10b981; font-size: 1.4rem;">-- Days</div>
                  <div class="metric-sub">At current daily burn rate</div>
                </div>
              </div>

              <!-- Mitigation Action Checklist -->
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem;">
                <div style="font-size: 0.8rem; font-weight: 800; color: #fca5a5; text-transform: uppercase; margin-bottom: 6px;">⚡ AI Recommended Immediate Actions:</div>
                <ul id="radarMitigationList" style="margin: 0; padding-left: 1.25rem; font-size: 0.85rem; color: #e2e8f0; line-height: 1.6;">
                  <li>Loading liquidity recovery recommendations...</li>
                </ul>
              </div>
            </div>
`;

if (!html.includes('id="cashCrunchRadarBox"')) {
  html = html.replace('<div class="metrics-grid">', cashCrunchHtml + '            <div class="metrics-grid">');
  console.log('✅ Added 30-Day Cash Crunch Radar to #section-cashflow');
}

// 3. Add Smart WhatsApp Recovery Banner to #section-khata
const khataRecoveryBanner = `
            <!-- ⚡ SMART WHATSAPP 3-STAGE PAYMENT RECOVERY ENGINE -->
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 2.2rem;">📲</div>
                <div>
                  <h4 style="font-size: 1.1rem; font-weight: 800; color: #34d399; margin: 0;">Smart WhatsApp Multi-Stage Payment Recovery</h4>
                  <p style="color: #94a3b8; font-size: 0.82rem; margin: 2px 0 0 0;">
                    3-tier automated collection sequence (Polite Heads-up → Due Date 1-Click UPI → Formal Overdue Legal Notice). Shortens DSO by 45%.
                  </p>
                </div>
              </div>
              <button class="btn btn-accent" style="padding: 0.5rem 1.1rem; font-size: 0.82rem; font-weight: 800; display: flex; align-items: center; gap: 6px;" onclick="openSmartRecoveryModal('Ramesh & Sons', 35000, '+919876543210', 'INV-882')">
                <span>⚡</span> Launch Smart Recovery Sequence
              </button>
            </div>
`;

if (!html.includes('Smart WhatsApp Multi-Stage Payment Recovery')) {
  html = html.replace('<div class="flex gap-4" style="margin-bottom: 1.5rem;">', khataRecoveryBanner + '            <div class="flex gap-4" style="margin-bottom: 1.5rem;">');
  console.log('✅ Added Smart WhatsApp Recovery to #section-khata');
}

// 4. Add Dead Stock & Reorder Engine to #section-inventory
const deadStockHtml = `
            <!-- 📦 DEAD CAPITAL & REORDER ENGINE -->
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                  <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                    <span>🧊</span> <span>Dead Stock & Working Capital Release Engine</span>
                  </h3>
                  <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 2px;">
                    Identifies capital locked in slow-moving SKUs (>60 days) and forecasts seasonal festival reorders.
                  </p>
                </div>
                <button class="btn btn-outline" style="font-size: 0.78rem; padding: 0.35rem 0.85rem;" onclick="loadDeadStockData()">
                  🔄 Refresh Inventory Audit
                </button>
              </div>

              <div class="flex gap-4" style="flex-wrap: wrap; margin-bottom: 1.25rem;">
                <div style="flex: 1 1 200px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 1rem;">
                  <div style="font-size: 0.75rem; font-weight: 700; color: #f87171;">LOCKED DEAD CAPITAL (>60 Days)</div>
                  <div id="deadStockValueDisplay" style="font-size: 1.5rem; font-weight: 900; color: #ef4444; margin: 4px 0;">₹2,23,500</div>
                  <div id="deadStockItemCount" style="font-size: 0.72rem; color: #fca5a5;">2 SKUs gathering dust</div>
                </div>
                <div style="flex: 1 1 200px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 1rem;">
                  <div style="font-size: 0.75rem; font-weight: 700; color: #6ee7b7;">POTENTIAL FREED CASH</div>
                  <div id="deadStockFreedDisplay" style="font-size: 1.5rem; font-weight: 900; color: #10b981; margin: 4px 0;">₹1,78,800</div>
                  <div style="font-size: 0.72rem; color: #a7f3d0;">Via 48h clearance sale markdown</div>
                </div>
                <div style="flex: 1 1 200px; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 1rem;">
                  <div style="font-size: 0.75rem; font-weight: 700; color: #7dd3fc;">UPCOMING REORDER ALERTS</div>
                  <div id="reorderAlertCount" style="font-size: 1.5rem; font-weight: 900; color: #38bdf8; margin: 4px 0;">1 SKU</div>
                  <div style="font-size: 0.72rem; color: #bae6fd;">Lead time buffer & festival demand</div>
                </div>
              </div>

              <!-- Dead Stock Items Table -->
              <div style="overflow-x: auto;">
                <table class="table" style="font-size: 0.85rem;">
                  <thead>
                    <tr>
                      <th>Product / SKU</th>
                      <th>Qty in Godown</th>
                      <th>Days Idle</th>
                      <th>Capital Locked</th>
                      <th>AI Action Recommendation</th>
                    </tr>
                  </thead>
                  <tbody id="deadStockTableBody">
                    <tr>
                      <td><strong>Weatherproof Exterior Paint 20L</strong> <br /><span style="font-size: 0.75rem; color: var(--text-muted);">PNT-EXT</span></td>
                      <td>35 buckets</td>
                      <td><span class="pill-badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171;">78 Days Idle</span></td>
                      <td style="font-weight: 800; color: #ef4444;">₹1,47,000</td>
                      <td><button class="btn btn-outline" style="font-size: 0.72rem; padding: 2px 8px; border-color: #f87171; color: #f87171;" onclick="alert('Flash Clearance Campaign generated for Exterior Paint with 25% discount link ready for WhatsApp distribution!')">🏷️ Run 25% Flash Sale</button></td>
                    </tr>
                    <tr>
                      <td><strong>Ceramic Floor Tiles 2x2 (Box)</strong> <br /><span style="font-size: 0.75rem; color: var(--text-muted);">TIL-CRM</span></td>
                      <td>90 boxes</td>
                      <td><span class="pill-badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171;">110 Days Idle</span></td>
                      <td style="font-weight: 800; color: #ef4444;">₹76,500</td>
                      <td><button class="btn btn-outline" style="font-size: 0.72rem; padding: 2px 8px; border-color: #f87171; color: #f87171;" onclick="alert('Bundle discount promotion generated!')">📦 Bundle Clearance</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
`;

if (!html.includes('Dead Stock & Working Capital Release Engine')) {
  html = html.replace('<table class="table">\n              <thead>\n                <tr>\n                  <th>Item / Asset</th>', deadStockHtml + '            <table class="table">\n              <thead>\n                <tr>\n                  <th>Item / Asset</th>');
  console.log('✅ Added Dead Stock Engine to #section-inventory');
}

// 5. Add GSTR-2B ITC Safeguard to #section-invoices
const gstr2bHtml = `
            <!-- 🛡️ GSTR-2B INPUT TAX CREDIT (ITC) SAFEGUARD -->
            <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%); border: 1.5px solid rgba(245, 158, 11, 0.35); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.3rem;">🛡️</span>
                    <h3 style="font-size: 1.2rem; font-weight: 800; color: #fbbf24; margin: 0;">GSTR-2B Input Tax Credit (ITC) Safeguard</h3>
                    <span class="pill-badge" style="background: rgba(245, 158, 11, 0.2); color: #fde68a; border-color: rgba(245, 158, 11, 0.4); font-size: 0.7rem; font-weight: 800;">AUTONOMOUS AUDIT</span>
                  </div>
                  <p style="color: #cbd5e1; font-size: 0.82rem; margin-top: 4px;">
                    Cross-matches purchase invoices against government GSTR-2B. Catches defaulting suppliers before payment to prevent tax credit blockage.
                  </p>
                </div>
                <button class="btn btn-outline" style="border-color: #fbbf24; color: #fde68a; font-size: 0.78rem; padding: 0.35rem 0.85rem;" onclick="loadGstr2bSafeguard()">
                  🔄 Reconcile GSTR-2B
                </button>
              </div>

              <div class="flex gap-4" style="flex-wrap: wrap; margin-bottom: 1rem;">
                <div style="flex: 1; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 0.85rem 1.25rem;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #6ee7b7;">ELIGIBLE MATCHED ITC</div>
                  <div id="itcMatchedDisplay" style="font-size: 1.4rem; font-weight: 900; color: #10b981; margin: 2px 0;">₹88,600</div>
                  <div style="font-size: 0.7rem; color: #a7f3d0;">Verified in portal</div>
                </div>
                <div style="flex: 1; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 0.85rem 1.25rem;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #fca5a5;">BLOCKED / AT-RISK ITC</div>
                  <div id="itcBlockedDisplay" style="font-size: 1.4rem; font-weight: 900; color: #ef4444; margin: 2px 0;">₹23,940</div>
                  <div style="font-size: 0.7rem; color: #f87171;">Unfiled by 2 vendors</div>
                </div>
              </div>

              <div style="background: rgba(15, 23, 42, 0.6); border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 0.75rem 1rem;">
                <div style="font-size: 0.78rem; font-weight: 800; color: #fde68a; margin-bottom: 8px;">⚠️ Defaulting Suppliers Missing in GSTR-2B:</div>
                <div id="defaultingVendorsList">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.82rem;">
                    <div>
                      <strong>Vikas Hardware & Steels</strong> (GSTIN: 27AAACV1234Q1Z1)<br />
                      <span style="color: #94a3b8; font-size: 0.75rem;">Inv #INV-889 • Blocked GST: ₹15,300</span>
                    </div>
                    <a href="https://wa.me/?text=Dear%20Vikas%20Hardware%2C%20Invoice%20%23INV-889%20is%20not%20reflected%20in%20our%20GSTR-2B.%20Please%20file%20GSTR-1%20so%20our%20ITC%20is%20not%20blocked." target="_blank" class="btn btn-outline" style="border-color: #25d366; color: #25d366; font-size: 0.72rem; padding: 2px 8px; text-decoration: none;">
                      💬 WhatsApp Notice
                    </a>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.82rem;">
                    <div>
                      <strong>Royal Electricals Ltd</strong> (GSTIN: 27AAGCR4433K1ZA)<br />
                      <span style="color: #94a3b8; font-size: 0.75rem;">Inv #INV-612 • Blocked GST: ₹8,640</span>
                    </div>
                    <a href="https://wa.me/?text=Dear%20Royal%20Electricals%2C%20Invoice%20%23INV-612%20is%20not%20reflected%20in%20our%20GSTR-2B.%20Please%20file%20GSTR-1%20so%20our%20ITC%20is%20not%20blocked." target="_blank" class="btn btn-outline" style="border-color: #25d366; color: #25d366; font-size: 0.72rem; padding: 2px 8px; text-decoration: none;">
                      💬 WhatsApp Notice
                    </a>
                  </div>
                </div>
              </div>
            </div>
`;

if (!html.includes('GSTR-2B Input Tax Credit (ITC) Safeguard')) {
  html = html.replace('<div class="flex gap-4" style="margin-bottom: 1.5rem;">\n              <div style="flex: 1; background: var(--background); border: 1px solid var(--border);', gstr2bHtml + '            <div class="flex gap-4" style="margin-bottom: 1.5rem;">\n              <div style="flex: 1; background: var(--background); border: 1px solid var(--border);');
  console.log('✅ Added GSTR-2B ITC Safeguard to #section-invoices');
}

// 6. Add Pagar Khata to #section-team
const pagarKhataHtml = `
            <!-- 👥 PAGAR KHATA: ATTENDANCE & DAILY WAGE ADVANCES -->
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                  <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                    <span>💼</span> <span>Pagar Khata (Attendance, Advances &amp; Salary Ledger)</span>
                  </h3>
                  <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 2px;">
                    Daily wage computation, overtime calculator, informal cash advance tracking with auto-deduction, and 1-click WhatsApp payslips.
                  </p>
                </div>
                <button class="btn btn-accent" style="font-size: 0.78rem; padding: 0.4rem 0.9rem;" onclick="openAddAdvanceModal()">
                  + Log Cash Advance
                </button>
              </div>

              <div class="flex gap-4" style="flex-wrap: wrap; margin-bottom: 1.25rem;">
                <div style="flex: 1; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 0.85rem 1.25rem;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #7dd3fc;">TOTAL NET PAYROLL DUE</div>
                  <div id="pagarTotalBudget" style="font-size: 1.45rem; font-weight: 900; color: #38bdf8; margin: 2px 0;">₹45,700</div>
                  <div style="font-size: 0.7rem; color: #bae6fd;">3 Active Staff</div>
                </div>
                <div style="flex: 1; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 0.85rem 1.25rem;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #fca5a5;">ADVANCES AUTO-DEDUCTED</div>
                  <div id="pagarTotalAdvances" style="font-size: 1.45rem; font-weight: 900; color: #ef4444; margin: 2px 0;">₹7,500</div>
                  <div style="font-size: 0.7rem; color: #f87171;">Pre-salary emergency advances</div>
                </div>
              </div>

              <div style="overflow-x: auto;">
                <table class="table" style="font-size: 0.85rem;">
                  <thead>
                    <tr>
                      <th>Employee / Role</th>
                      <th>Attendance</th>
                      <th>Earned Gross</th>
                      <th>Advances Deducted</th>
                      <th>Net Payable</th>
                      <th>1-Click WhatsApp Payslip</th>
                    </tr>
                  </thead>
                  <tbody id="pagarStaffTableBody">
                    <tr>
                      <td><strong>Ramesh Kumar</strong><br /><span style="font-size: 0.72rem; color: var(--text-muted);">Head Mason • ₹800/day</span></td>
                      <td><span class="pill-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">22 P | 2 HD | 8h OT</span></td>
                      <td style="font-weight: 700;">₹19,600</td>
                      <td style="color: #ef4444; font-weight: 700;">-₹5,500</td>
                      <td style="color: #10b981; font-weight: 900; font-size: 0.95rem;">₹14,100</td>
                      <td><a href="https://wa.me/?text=*PAYSLIP%20Ramesh%20Kumar*%20(HisabHero)%0ADays%20Worked%3A%2022%20P%20%7C%208h%20OT%0AEarned%3A%20%E2%82%B919%2C600%0ALess%20Advance%3A%20-%E2%82%B95%2C500%0ANET%20PAYABLE%3A%20%E2%82%B914%2C100" target="_blank" class="btn btn-outline" style="border-color: #25d366; color: #25d366; font-size: 0.72rem; padding: 2px 8px; text-decoration: none;">💬 Send Payslip</a></td>
                    </tr>
                    <tr>
                      <td><strong>Sunil Verma</strong><br /><span style="font-size: 0.72rem; color: var(--text-muted);">Forklift Operator • ₹600/day</span></td>
                      <td><span class="pill-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">24 P | 12h OT</span></td>
                      <td style="font-weight: 700;">₹15,750</td>
                      <td style="color: #ef4444; font-weight: 700;">-₹2,000</td>
                      <td style="color: #10b981; font-weight: 900; font-size: 0.95rem;">₹13,750</td>
                      <td><a href="https://wa.me/?text=*PAYSLIP%20Sunil%20Verma*%20(HisabHero)%0ANET%20PAYABLE%3A%20%E2%82%B913%2C750" target="_blank" class="btn btn-outline" style="border-color: #25d366; color: #25d366; font-size: 0.72rem; padding: 2px 8px; text-decoration: none;">💬 Send Payslip</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
`;

if (!html.includes('Pagar Khata (Attendance, Advances &amp; Salary Ledger)')) {
  html = html.replace('<table class="table">\n              <thead>\n                <tr>\n                  <th>Member Name</th>', pagarKhataHtml + '            <table class="table">\n              <thead>\n                <tr>\n                  <th>Member Name</th>');
  console.log('✅ Added Pagar Khata to #section-team');
}

// 7. Add Marketplace Settlement Auditor & Bank Credit Dossier to #section-reports
const reportsBusinessSuiteHtml = `
            <!-- 🏦 1-CLICK BANK-READY MSME CREDIT DOSSIER -->
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(56, 189, 248, 0.08) 100%); border: 1.5px solid rgba(16, 185, 129, 0.35); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.3rem;">🏦</span>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #34d399; margin: 0;">1-Click Bank-Ready MSME Credit Dossier</h3>
                    <span class="pill-badge" style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.4); font-size: 0.7rem; font-weight: 800;">UNDERWRITING CERTIFIED</span>
                  </div>
                  <p style="color: #cbd5e1; font-size: 0.82rem; margin-top: 4px; max-width: 650px;">
                    Pre-packages audited turnover, DSCR, Khata recovery velocity, and Merkle cryptographic proof into an instant loan application packet for Mudra, CGTMSE, or Bank OD.
                  </p>
                </div>
                <button class="btn btn-accent" style="font-size: 0.8rem; padding: 0.45rem 1rem;" onclick="loadCreditDossierModal()">
                  📜 Generate Bank Loan Packet
                </button>
              </div>

              <div class="flex gap-4" style="flex-wrap: wrap;">
                <div style="flex: 1; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem;">
                  <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 700;">CREDIT READINESS SCORE</div>
                  <div style="font-size: 1.6rem; font-weight: 900; color: #10b981; margin: 2px 0;">80 / 100</div>
                  <div style="font-size: 0.72rem; color: #34d399; font-weight: 800;">GRADE A (PRIME MSME)</div>
                </div>
                <div style="flex: 1; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem;">
                  <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 700;">COLLATERAL-FREE BORROWING POWER</div>
                  <div style="font-size: 1.6rem; font-weight: 900; color: #38bdf8; margin: 2px 0;">₹12,00,000</div>
                  <div style="font-size: 0.72rem; color: #7dd3fc;">Under Mudra Tarun / CGTMSE</div>
                </div>
                <div style="flex: 1; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem;">
                  <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 700;">AVERAGE PAYMENT VELOCITY</div>
                  <div style="font-size: 1.6rem; font-weight: 900; color: #a78bfa; margin: 2px 0;">24 Days</div>
                  <div style="font-size: 0.72rem; color: #c4b5fd;">Top 10% healthy cash flow tier</div>
                </div>
              </div>
            </div>

            <!-- 🛒 MARKETPLACE SETTLEMENT AUDITOR -->
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                  <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                    <span>🛒</span> <span>Omnichannel &amp; Marketplace Settlement Auditor</span>
                  </h3>
                  <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 2px;">
                    Audits payout sheets from Amazon, Flipkart, Swiggy, Zomato, and Meesho. Dissects hidden commissions, courier weight penalties & return leakages.
                  </p>
                </div>
                <button class="btn btn-outline" style="font-size: 0.78rem; padding: 0.35rem 0.85rem;" onclick="loadMarketplaceAuditData()">
                  🔍 Run Audit on Amazon/Swiggy
                </button>
              </div>

              <div class="flex gap-4" style="flex-wrap: wrap; margin-bottom: 1.25rem;">
                <div style="flex: 1; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 1rem;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #f87171;">EFFECTIVE DEDUCTION RATE</div>
                  <div style="font-size: 1.5rem; font-weight: 900; color: #ef4444; margin: 2px 0;">34.2%</div>
                  <div style="font-size: 0.72rem; color: #fca5a5;">Platform fee + Shipping + RTO</div>
                </div>
                <div style="flex: 1; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 1rem;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #fbbf24;">DISPUTABLE CHARGES FOUND</div>
                  <div style="font-size: 1.5rem; font-weight: 900; color: #f59e0b; margin: 2px 0;">₹6,200</div>
                  <div style="font-size: 0.72rem; color: #fde68a;">2 Claims ready for Safe-T Ticket</div>
                </div>
                <div style="flex: 1; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 1rem;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #6ee7b7;">NET REALIZATION RATE</div>
                  <div style="font-size: 1.5rem; font-weight: 900; color: #10b981; margin: 2px 0;">65.8%</div>
                  <div style="font-size: 0.72rem; color: #a7f3d0;">Actual cash banked per ₹100 sales</div>
                </div>
              </div>
            </div>
`;

if (!html.includes('1-Click Bank-Ready MSME Credit Dossier')) {
  html = html.replace('<div style="background: var(--background); border: 1px solid var(--border); padding: 2rem; border-radius: 16px; text-align: center;">', reportsBusinessSuiteHtml + '            <div style="background: var(--background); border: 1px solid var(--border); padding: 2rem; border-radius: 16px; text-align: center;">');
  console.log('✅ Added Credit Dossier & Marketplace Audit to #section-reports');
}

// 8. Add Modals for Smart Recovery, Bhasha Voice, Cash Advance & Credit Dossier
const newModalsHtml = `
  <!-- ═══════════════════════════════════════════════════════════════════
       🎙️ MULTILINGUAL BHASHA VOICE COPILOT MODAL
       ═══════════════════════════════════════════════════════════════════ -->
  <div id="bhashaVoiceModal" class="modal-backdrop" onclick="closeModals()">
    <div class="modal-box" onclick="event.stopPropagation()" style="max-width: 520px; text-align: center; border: 1.5px solid rgba(16, 185, 129, 0.4);">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎙️</div>
      <h3 style="font-size: 1.4rem; font-weight: 800; color: #fff;">Multilingual Bhasha Voice Copilot</h3>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem;">
        Speak in Hindi, Tamil, Telugu, Gujarati, Marathi, or English. The AI logs the entry and updates your Khata instantly.
      </p>

      <!-- Language selector chips -->
      <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 1.25rem;">
        <button class="bot-chip active" id="voiceLangHinglish" onclick="setBhashaVoiceLang('Hinglish')">Hindi / Hinglish</button>
        <button class="bot-chip" id="voiceLangTamil" onclick="setBhashaVoiceLang('Tamil')">தமிழ் (Tamil)</button>
        <button class="bot-chip" id="voiceLangTelugu" onclick="setBhashaVoiceLang('Telugu')">తెలుగు (Telugu)</button>
        <button class="bot-chip" id="voiceLangEnglish" onclick="setBhashaVoiceLang('English')">English</button>
      </div>

      <!-- Pulsing Mic Visualizer -->
      <div id="voiceMicVisualizer" onclick="toggleVoiceSpeechRecognition()" style="width: 100px; height: 100px; margin: 0 auto 1.25rem; border-radius: 50%; background: linear-gradient(135deg, #10b981, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; cursor: pointer; box-shadow: 0 0 35px rgba(16,185,129,0.4); transition: transform 0.2s;">
        🎙️
      </div>
      <div id="voiceStatusText" style="font-size: 0.82rem; font-weight: 700; color: #34d399; margin-bottom: 1rem;">
        Tap Mic to Start Speaking (or type below)
      </div>

      <!-- Voice Text Input & Prompt Suggestions -->
      <div style="margin-bottom: 1rem;">
        <input type="text" id="bhashaVoiceInput" class="form-input" placeholder='e.g., "Ramesh ko 5000 ka cement bheja udhari me"' style="text-align: center; font-size: 0.95rem; font-weight: 600;" />
      </div>

      <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 1.25rem;">
        <button class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="fillVoiceSample('Ramesh ko 5000 ka cement bheja udhari me')">
          "Ramesh ko 5000 cement udhari"
        </button>
        <button class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="fillVoiceSample('Petrol ke liye 1200 rupaye kharcha kiya')">
          "Petrol ₹1200 kharcha"
        </button>
        <button class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="fillVoiceSample('Sharma ji se 18500 ka payment mila')">
          "Sharma ji se ₹18500 mila"
        </button>
      </div>

      <div id="voiceParsedResultBox" style="display: none; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 1rem; margin-bottom: 1rem; text-align: left;">
        <div style="font-size: 0.75rem; font-weight: 800; color: #34d399; margin-bottom: 4px;">✅ EXTRACTED INTENT:</div>
        <div id="voiceParsedDetails" style="font-size: 0.85rem; color: #e2e8f0; line-height: 1.5;"></div>
      </div>

      <button class="btn btn-accent" id="bhashaSubmitBtn" style="width: 100%; font-weight: 800;" onclick="submitBhashaVoicePrompt()">
        Book Transaction into Ledger →
      </button>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════
       ⚡ SMART WHATSAPP RECOVERY MODAL WITH DYNAMIC UPI QR
       ═══════════════════════════════════════════════════════════════════ -->
  <div id="smartRecoveryModal" class="modal-backdrop" onclick="closeModals()">
    <div class="modal-box" onclick="event.stopPropagation()" style="max-width: 580px; border: 1.5px solid rgba(16, 185, 129, 0.4);">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
        <span style="font-size: 1.8rem;">⚡</span>
        <div>
          <h3 style="font-size: 1.3rem; font-weight: 800; margin: 0; color: #fff;">Smart 3-Stage Payment Recovery</h3>
          <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0;">Automated UPI Deep Links & WhatsApp Escalation</p>
        </div>
      </div>

      <!-- Party Context Box -->
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 0.75rem; color: #94a3b8;">OUTSTANDING CUSTOMER</div>
          <div id="recModalPartyName" style="font-size: 1.15rem; font-weight: 800; color: #fff;">Ramesh &amp; Sons</div>
          <div id="recModalInvInfo" style="font-size: 0.75rem; color: #38bdf8;">Invoice #INV-882</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: #94a3b8;">AMOUNT DUE</div>
          <div id="recModalAmount" style="font-size: 1.4rem; font-weight: 900; color: #10b981;">₹35,000</div>
        </div>
      </div>

      <!-- 3 Stage Selector Tabs -->
      <div style="display: flex; gap: 6px; margin-bottom: 1rem;">
        <button class="btn btn-outline active" id="recTabStage1" style="flex: 1; padding: 6px; font-size: 0.75rem; font-weight: 700;" onclick="selectRecoveryStage(1)">Stage 1: Polite</button>
        <button class="btn btn-outline" id="recTabStage2" style="flex: 1; padding: 6px; font-size: 0.75rem; font-weight: 700;" onclick="selectRecoveryStage(2)">Stage 2: Due Date</button>
        <button class="btn btn-outline" id="recTabStage3" style="flex: 1; padding: 6px; font-size: 0.75rem; font-weight: 700;" onclick="selectRecoveryStage(3)">Stage 3: Escalated</button>
      </div>

      <!-- Message Preview Box -->
      <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem;">
        <div style="font-size: 0.75rem; font-weight: 800; color: #34d399; margin-bottom: 6px;">💬 WHATSAPP DISPATCH PREVIEW:</div>
        <div id="recStageMessagePreview" style="font-size: 0.85rem; color: #e2e8f0; line-height: 1.6; white-space: pre-wrap;"></div>
      </div>

      <!-- Actions -->
      <div style="display: flex; gap: 10px;">
        <a id="recWhatsAppSendBtn" href="#" target="_blank" class="btn" style="flex: 1; background: #25d366; color: #fff; font-weight: 800; text-align: center; text-decoration: none; padding: 0.65rem;">
          🚀 Send on WhatsApp Now
        </a>
        <button class="btn btn-outline" onclick="copyUpiRecoveryLink()">
          📋 Copy UPI Link
        </button>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════
       👥 LOG CASH ADVANCE MODAL (PAGAR KHATA)
       ═══════════════════════════════════════════════════════════════════ -->
  <div id="addStaffAdvanceModal" class="modal-backdrop" onclick="closeModals()">
    <div class="modal-box" onclick="event.stopPropagation()" style="max-width: 440px;">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 0.35rem; color: #fff;">Log Staff Cash Advance</h3>
      <p style="color: var(--text-muted); font-size: 0.82rem; margin-bottom: 1.25rem;">
        Records mid-month emergency advances and automatically deducts from the month-end salary slip.
      </p>

      <form onsubmit="handleStaffAdvanceSubmit(event)">
        <div class="form-group">
          <label class="form-label">Employee *</label>
          <select id="advanceStaffSelect" class="form-input" required>
            <option value="stf_1">Ramesh Kumar (Head Mason)</option>
            <option value="stf_2">Sunil Verma (Forklift Operator)</option>
            <option value="stf_3">Deepak Sharma (Store Keeper)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Advance Amount (₹) *</label>
          <input type="number" id="advanceAmountInput" class="form-input" required min="100" placeholder="e.g. 2000" />
        </div>
        <div class="form-group">
          <label class="form-label">Reason / Note</label>
          <input type="text" id="advanceNoteInput" class="form-input" placeholder="e.g. Medical emergency, Festival advance" />
        </div>
        <button type="submit" class="btn btn-accent" style="width: 100%; margin-top: 1rem; font-weight: 800;">
          Deduct &amp; Save Advance →
        </button>
      </form>
    </div>
  </div>
`;

if (!html.includes('id="bhashaVoiceModal"')) {
  const modalInsertPoint = '<!-- ═══════════════════════════════════════════════════════════════════\n       🎓 IN-APP GUIDANCE & PRODUCT TOUR SYSTEM DOM ELEMENTS';
  html = html.replace(modalInsertPoint, newModalsHtml + '\n' + modalInsertPoint);
  console.log('✅ Added Business Owner Modals (Voice, Recovery, Pagar Advance)');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✨ index.html UI markup successfully updated!');
