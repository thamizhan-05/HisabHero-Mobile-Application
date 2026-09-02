import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');
let content = fs.readFileSync(indexPath, 'utf8');

const updatedTranslations = `  // ─── TRANSLATIONS ENGINE (8 LANGUAGES) ───────────────────────────────────
  const TRANSLATIONS = {
    en: {
      nav_signin: "Sign In",
      nav_create: "Create Account →",
      hero_sub: "Smart Financial & ERP Intelligence for Businesses and Individuals."
    },
    ta: {
      nav_signin: "உள்நுழைக",
      nav_create: "கணக்கு தொடங்க →",
      hero_sub: "வணிகங்கள் மற்றும் தனிநபர்களுக்கான ஸ்மார்ட் நிதி & ஈஆர்பி மேலாண்மை."
    },
    hi: {
      nav_signin: "साइन इन करें",
      nav_create: "खाता बनाएं →",
      hero_sub: "व्यवसायों और व्यक्तियों के लिए स्मार्ट वित्तीय एवं ईआरपी प्रबंधन।"
    },
    mr: {
      nav_signin: "साइन इन करा",
      nav_create: "खाते तयार करा →",
      hero_sub: "व्यवसाय आणि व्यक्तींसाठी स्मार्ट आर्थिक आणि ईआरपी व्यवस्थापन."
    },
    gu: {
      nav_signin: "સાઇન ઇન કરો",
      nav_create: "ખાતું બનાવો →",
      hero_sub: "વ્યવસાયો અને વ્યક્તિઓ માટે સ્માર્ટ નાણાકીય અને ERP બુદ્ધિમત્તા."
    },
    te: {
      nav_signin: "సైన్ ఇన్ చేయండి",
      nav_create: "ఖాతా తెరవండి →",
      hero_sub: "వ్యాపారాలు మరియు వ్యక్తుల కోసం స్మార్ట్ ఫైనాన్షియల్ & ERP నిర్వహణ."
    },
    kn: {
      nav_signin: "ಸೈನ್ ಇನ್ ಮಾಡಿ",
      nav_create: "ಖಾತೆ ರಚಿಸಿ →",
      hero_sub: "ವ್ಯಾಪಾರಗಳು ಮತ್ತು ವ್ಯಕ್ತಿಗಳಿಗೆ ಸ್ಮಾರ್ಟ್ ಆರ್ಥಿಕ ಮತ್ತು ERP ನಿರ್ವಹಣೆ."
    },
    bn: {
      nav_signin: "সাইন ইন করুন",
      nav_create: "অ্যাকাউন্ট তৈরি করুন →",
      hero_sub: "ব্যবসা এবং ব্যক্তিদের জন্য স্মার্ট আর্থিক এবং ইআরপি বুদ্ধিমত্তা।"
    }
  };`;

content = content.replace(/\/\/ ─── TRANSLATIONS ENGINE[\s\S]*?^  \};/m, updatedTranslations);
fs.writeFileSync(indexPath, content, 'utf8');
console.log("Successfully updated clean multi-language translations dictionary!");
