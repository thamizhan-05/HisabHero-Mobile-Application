import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');
let content = fs.readFileSync(indexPath, 'utf8');

const targetStr = `        navActions.innerHTML = \`
          \${langDropdownHtml}
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(79, 70, 229, 0.08); padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(79, 70, 229, 0.2);">
            <div style="width: 26px; height: 26px; border-radius: 13px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800;">
              \${initial}
            </div>
            <span style="font-size: 13px; font-weight: 700; color: var(--text);">\${name}</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="handleLogout()" style="padding: .4rem .85rem; font-size: .8rem;">Sign Out</button>
        \`;`;

const replacementStr = `        navActions.innerHTML = \`
          \${langDropdownHtml}
          <button class="btn btn-primary btn-sm btn-magnetic" onclick="switchAppView('dashboard')" style="background: #38bdf8; color: #0f172a; font-weight: 800; padding: .45rem 1rem;">
            📊 Open Dashboard
          </button>
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(79, 70, 229, 0.08); padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(79, 70, 229, 0.2);">
            <div style="width: 26px; height: 26px; border-radius: 13px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800;">
              \${initial}
            </div>
            <span style="font-size: 13px; font-weight: 700; color: var(--text);">\${name}</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="handleLogout()" style="padding: .4rem .85rem; font-size: .8rem;">Sign Out</button>
        \`;

        // Update dashboard header user avatar
        const dashAvatar = document.getElementById('appUserAvatar');
        if (dashAvatar) dashAvatar.textContent = initial;`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync(indexPath, content, 'utf8');
console.log("Successfully updated updateUserAuthState with Open Dashboard button!");
