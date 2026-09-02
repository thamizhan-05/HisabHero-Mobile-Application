import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Replace the navbar section with clean, properly closed HTML
const cleanNavbar = `    <div class="nav-actions" id="navActions">
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
</div>`;

content = content.replace(/<div class="nav-actions" id="navActions">[\s\S]*?<\/nav>\s*<\/div>/, cleanNavbar);

fs.writeFileSync(indexPath, content, 'utf8');
console.log("Successfully cleaned up navbar and removed duplicate buttons!");
