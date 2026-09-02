import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');
let content = fs.readFileSync(indexPath, 'utf8');

const targetStr = `  // Initialize on Load
  window.addEventListener('DOMContentLoaded', () => {
    new CinematicStoryEngine();
    updateUserAuthState();
    loadPublicReviews();
    loadPublicStats();

    // Auto-apply saved or default language
    const savedLang = localStorage.getItem('hh_lang') || 'en';
    const langMap = {
      en: '🌐 English', ta: '🇮🇳 Tamil (தமிழ்)', hi: '🇮🇳 Hindi (हिंदी)', mr: '🇮🇳 Marathi (मराठी)',
      gu: '🇮🇳 Gujarati (ગુજરાતી)', te: '🇮🇳 Telugu (తెలుగు)', kn: '🇮🇳 Kannada (ಕನ್ನಡ)', bn: '🇮🇳 Bengali (বাংলা)'
    };
    selectWebsiteLanguage(savedLang, langMap[savedLang] || '🌐 English');
  });`;

const replacementStr = `  // Initialize on Load
  window.addEventListener('DOMContentLoaded', () => {
    new CinematicStoryEngine();
    updateUserAuthState();
    loadPublicReviews();
    loadPublicStats();

    // Auto-apply saved or default language
    const savedLang = localStorage.getItem('hh_lang') || 'en';
    const langMap = {
      en: '🌐 English', ta: '🇮🇳 Tamil (தமிழ்)', hi: '🇮🇳 Hindi (हिंदी)', mr: '🇮🇳 Marathi (मराठी)',
      gu: '🇮🇳 Gujarati (ગુજરાતી)', te: '🇮🇳 Telugu (తెలుగు)', kn: '🇮🇳 Kannada (ಕನ್ನಡ)', bn: '🇮🇳 Bengali (বাংলা)'
    };
    selectWebsiteLanguage(savedLang, langMap[savedLang] || '🌐 English');

    // If user is authenticated, automatically switch to Dashboard view
    if (localStorage.getItem('hh_token')) {
      switchAppView('dashboard');
    }
  });`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(indexPath, content, 'utf8');
console.log("Successfully added auto-open dashboard on load when authenticated!");
