import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('c:/Users/selva/Desktop/HisabHero/finsight_jsonversion/backend/public/index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Find the modals section
const modalsStart = content.indexOf('<!-- MODAL: LOGIN -->');
if (modalsStart === -1) {
  console.error("Could not find MODAL: LOGIN");
  process.exit(1);
}

const beforeModals = content.substring(0, modalsStart);

const newModalsAndScript = `<!-- MODAL: LOGIN -->
<div class="modal-backdrop" id="loginModal" onclick="closeModalOnBackdrop(event, 'loginModal')">
  <div class="modal-card">
    <div class="modal-header">
      <div class="modal-title">Sign In to HisabHero</div>
      <button class="modal-close" onclick="closeModal('loginModal')">✕</button>
    </div>
    <div class="form-msg form-error-msg" id="loginError" style="display: none;"></div>
    <form id="loginForm" onsubmit="handleLoginSubmit(event)">
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" class="form-input" id="loginEmail" placeholder="name@company.com" required autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" class="form-input" id="loginPassword" placeholder="••••••••" required autocomplete="current-password">
      </div>
      <button type="submit" class="btn btn-primary btn-full btn-magnetic" id="loginSubmit">
        <span>Sign In</span>
        <span class="btn-arrow">→</span>
      </button>
      <div style="text-align: center; margin-top: 1rem; font-size: .85rem; color: var(--text-muted);">
        Don't have an account? 
        <a href="javascript:void(0)" onclick="closeModal('loginModal'); openModal('signupModal');" style="color: var(--primary); font-weight: 700; text-decoration: none;">Create Free Account</a>
      </div>
    </form>
  </div>
</div>

<!-- MODAL: SIGNUP -->
<div class="modal-backdrop" id="signupModal" onclick="closeModalOnBackdrop(event, 'signupModal')">
  <div class="modal-card">
    <div class="modal-header">
      <div class="modal-title">Create HisabHero Account</div>
      <button class="modal-close" onclick="closeModal('signupModal')">✕</button>
    </div>
    <div class="form-msg form-error-msg" id="signupError" style="display: none;"></div>
    <form id="signupForm" onsubmit="handleSignupSubmit(event)">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-input" id="signupName" placeholder="e.g. Rahul Sharma" required autocomplete="name">
      </div>
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" class="form-input" id="signupEmail" placeholder="name@company.com" required autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Password (Minimum 6 characters)</label>
        <input type="password" class="form-input" id="signupPassword" placeholder="••••••••" required minlength="6" autocomplete="new-password">
      </div>
      <button type="submit" class="btn btn-primary btn-full btn-magnetic" id="signupSubmit">
        <span>Create Account</span>
        <span class="btn-arrow">→</span>
      </button>
      <div style="text-align: center; margin-top: 1rem; font-size: .85rem; color: var(--text-muted);">
        Already have an account? 
        <a href="javascript:void(0)" onclick="closeModal('signupModal'); openModal('loginModal');" style="color: var(--primary); font-weight: 700; text-decoration: none;">Sign In</a>
      </div>
    </form>
  </div>
</div>

<!-- MODAL: EMAIL OTP VERIFICATION -->
<div class="modal-backdrop" id="otpModal" onclick="closeModalOnBackdrop(event, 'otpModal')">
  <div class="modal-card" style="text-align: center;">
    <div class="modal-header">
      <div class="modal-title">Verify Your Email</div>
      <button class="modal-close" onclick="closeModal('otpModal')">✕</button>
    </div>
    <div style="font-size: 2.25rem; margin-bottom: .5rem;">✉️</div>
    <p style="font-size: .9rem; color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.5;">
      We sent a 6-digit verification code to<br>
      <strong id="otpTargetEmail" style="color: var(--text); font-weight: 800;"></strong>
    </p>
    <div class="form-msg form-error-msg" id="otpError" style="display: none;"></div>
    <div class="form-msg" id="otpSuccess" style="display: none; background: #dcfce7; color: #166534; margin-bottom: 1rem; padding: .65rem 1rem; border-radius: var(--radius); font-weight: 700;"></div>
    <form id="otpForm" onsubmit="handleOtpSubmit(event)">
      <div class="form-group">
        <label class="form-label" style="text-align: left;">Enter 6-Digit Code</label>
        <input type="text" class="form-input" id="otpCodeInput" placeholder="123456" maxlength="6" pattern="[0-9]{6}" required style="text-align: center; font-size: 1.5rem; letter-spacing: 6px; font-weight: 800;" autocomplete="one-time-code">
      </div>
      <button type="submit" class="btn btn-primary btn-full btn-magnetic" id="otpSubmit">
        <span>Verify & Activate Account</span>
        <span class="btn-arrow">✓</span>
      </button>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem; font-size: .85rem;">
        <button type="button" onclick="handleResendOtp()" id="resendOtpBtn" style="background: none; border: none; color: var(--primary); font-weight: 700; cursor: pointer; padding: 0;">
          🔄 Resend Code
        </button>
        <a href="javascript:void(0)" onclick="closeModal('otpModal'); openModal('loginModal');" style="color: var(--text-muted); text-decoration: none;">
          Back to Sign In
        </a>
      </div>
    </form>
  </div>
</div>

<!-- MODAL: REVIEW LOGIN REQUIRED (UNAUTHENTICATED / INCOGNITO VISITORS) -->
<div class="modal-backdrop" id="reviewLoginRequiredModal" onclick="closeModalOnBackdrop(event, 'reviewLoginRequiredModal')">
  <div class="modal-card" style="text-align: center; max-width: 440px;">
    <div class="modal-header">
      <div class="modal-title" style="font-size: 1.35rem;">Account Required</div>
      <button class="modal-close" onclick="closeModal('reviewLoginRequiredModal')">✕</button>
    </div>
    <div style="font-size: 2.5rem; margin-bottom: .75rem;">🛡️</div>
    <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text); margin-bottom: .5rem;">Sign In to Post a Verified Review</h3>
    <p style="font-size: .9rem; color: var(--text-muted); line-height: 1.55; margin-bottom: 1.5rem;">
      To maintain 100% review integrity and prevent spam, please sign in to your HisabHero account before writing a review.
    </p>

    <div style="display: flex; flex-direction: column; gap: .75rem;">
      <button class="btn btn-primary btn-full" onclick="closeModal('reviewLoginRequiredModal'); openModal('loginModal');">
        🔑 Sign In with HisabHero Account
      </button>
      <button class="btn btn-secondary btn-full" onclick="closeModal('reviewLoginRequiredModal'); openModal('signupModal');">
        ✨ Create New Free Account
      </button>
    </div>
  </div>
</div>

<!-- MODAL: WRITE REVIEW -->
<div class="modal-backdrop" id="reviewModal" onclick="closeModalOnBackdrop(event, 'reviewModal')">
  <div class="modal-card">
    <div class="modal-header">
      <div class="modal-title">Write a Review</div>
      <button class="modal-close" onclick="closeModal('reviewModal')">✕</button>
    </div>
    <div class="form-msg form-error-msg" id="reviewError" style="display: none;"></div>
    <div id="reviewAccountBadge" style="display: none; padding: .65rem 1rem; border-radius: var(--radius); background: var(--mint-light); color: var(--mint); font-size: .85rem; font-weight: 700; margin-bottom: 1.25rem;"></div>
    <form id="reviewForm" onsubmit="handleReviewSubmit(event)">
      <input type="hidden" id="reviewEmail" value="">
      <div class="form-group">
        <label class="form-label">Your Name</label>
        <input type="text" class="form-input" id="reviewName" placeholder="e.g. Rahul Sharma" required>
      </div>
      <div class="form-group">
        <label class="form-label">Role / Title</label>
        <input type="text" class="form-input" id="reviewRole" placeholder="e.g. Founder / CFO / Accountant">
      </div>
      <div class="form-group">
        <label class="form-label">Company Name</label>
        <input type="text" class="form-input" id="reviewCompany" placeholder="e.g. Apex Logistics">
      </div>
      <div class="form-group">
        <label class="form-label">Rating</label>
        <select class="form-input" id="reviewRating" required>
          <option value="5">★★★★★ (5 / 5)</option>
          <option value="4">★★★★☆ (4 / 5)</option>
          <option value="3">★★★☆☆ (3 / 5)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Your Review Message</label>
        <textarea class="form-input" id="reviewComment" rows="4" placeholder="Share your experience using HisabHero..." required style="resize: vertical;"></textarea>
      </div>
      <button type="submit" class="btn btn-primary btn-full" id="reviewSubmit">Submit Review →</button>
    </form>
  </div>
</div>

<script>
  // ─── TRANSLATIONS ENGINE (8 LANGUAGES) ──────────────────────────────────
  const TRANSLATIONS = {
    en: {
      nav_ocr: "OCR Engine", nav_ai: "AI CFO", nav_strengths: "Strengths", nav_merkle: "Merkle Vault",
      nav_reviews: "Reviews", nav_contact: "Contact", nav_signin: "Sign In", nav_create: "Create Account →",
      hero_badge: "PATENT-GRADE FINANCIAL ENGINE V5.5",
      hero_h1: "Powered by Quality.<br><span class=\\"accent\\">Committed to Efficiency.</span>",
      hero_sub: "Turning research-backed financial intelligence into automated, audit-proof growth for MSMEs, freelancers, and enterprise corporations.",
      mobile_title: "Smart Financial Accounting Right in Your Pocket",
      mobile_sub: "Take control of your personal expenses, multi-branch business workspaces, 1-tap GST receipt OCR, and AI CFO queries anywhere, anytime.",
      mobile_f1_title: "📸 1-Tap Camera OCR", mobile_f1_sub: "Point & scan receipts to extract GSTIN, merchant & totals",
      mobile_f2_title: "🧠 Mobile AI CFO", mobile_f2_sub: "Instant working capital, runway & tax guidance",
      mobile_f3_title: "🏢 Workspace Switcher", mobile_f3_sub: "Mandatory personal workspace & business team accounts",
      mobile_f4_title: "⚡ Offline-First Sync", mobile_f4_sub: "Record data without internet, auto-syncs live to MongoDB",
      mobile_btn_play: "📱 Download App from Play Store (v5.5.0)",
      ocr_title: "Upload → AI Understands → Transaction Created",
      ocr_sub: "Watch how HisabHero scans vendor invoices and receipts in real time to generate audit-proof financial records.",
      ai_title: "Ask Anything About Your Finances.",
      ai_prompt_label: "USER PROMPT", ai_prompt: '"How can I optimize our working capital runway for next month?"',
      ai_rec_label: "✨ AI CFO RECOMMENDATION", ai_rec_sub: '"By filing your GSTR-1 by the 11th, you can reclaim <strong>₹12,400 in unutilized Input Tax Credit (ITC)</strong>. Additionally, sending 1-click WhatsApp payment reminders to Apex Global will accelerate ₹45,000 in receivables."',
      bento_tag: "Core Capabilities", bento_title: "Top Six Reasons to Choose HisabHero", bento_sub: "Our capabilities span from personal budget management to enterprise-grade multi-branch accounting.",
      bento_c1_title: "🌐 8 Indian & Global Languages", bento_c1_sub: "Complete multilingual voice OCR & financial interface support across English, Tamil (தமிழ்), Hindi (हिंदी), Marathi (मराठी), Gujarati (ગુજરાતી), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), and Bengali (বাংলা).",
      bento_c2_title: "Enterprise Business Operations", bento_c2_sub: "Multi-tenant workspaces with multi-owner approval thresholds, granular RBAC permissions, and team member collaboration.",
      bento_c3_title: "Dedicated AI CFO Companion", bento_c3_sub: "Your built-in AI companion powered by Google Gemini reads your financial transaction streams to answer questions and forecast cash flow.",
      merkle_title: "Merkle Tree Tamper-Proof Audit Vault", merkle_sub: "Blockchain-level immutability inside standard databases without gas fees or latency.",
      rev_tag: "Verified Feedback", rev_title: "What Financial Leaders Say", rev_btn: "✍️ Write a Review",
      contact_title: "Get in Touch with HisabHero", contact_sub: "Have questions about our financial engine or custom enterprise deployment? Contact us anytime."
    },
    ta: {
      nav_ocr: "OCR இன்ஜின்", nav_ai: "AI CFO", nav_strengths: "சிறப்பம்சங்கள்", nav_merkle: "மெர்க்கிள் வால்ட்",
      nav_reviews: "மதிப்புரைகள்", nav_contact: "தொடர்பு கொள்ள", nav_signin: "உள்நுழைய", nav_create: "கணக்கு தொடங்க →",
      hero_badge: "காப்புரிமை பெற்ற நிதி இன்ஜின் V5.5",
      hero_h1: "தரத்தால் இயக்கப்படுகிறது.<br><span class=\\"accent\\">திறனுக்கு அர்ப்பணிக்கப்பட்டது.</span>",
      hero_sub: "ஆராய்ச்சி சார்ந்த நிதி நுண்ணறிவை MSMEகள் மற்றும் நிறுவனங்களுக்கான தானியங்கி, தணிக்கை-ஆதார வளர்ச்சியாக மாற்றுகிறது.",
      mobile_title: "உங்கள் பாக்கெட்டிலேயே ஸ்மார்ட் நிதி கணக்கியல்",
      mobile_sub: "தனிப்பட்ட செலவுகள், வணிக பணியிடங்கள், 1-தட்டு GST ரசீது OCR மற்றும் AI CFO வினவல்களை எங்கும் கட்டுப்படுத்துங்கள்.",
      mobile_f1_title: "📸 1-தட்டு கேமரா OCR", mobile_f1_sub: "ரசீதுகளை ஸ்கேன் செய்து GSTIN மற்றும் தொகையை உடனே பிரித்தெடுக்கவும்",
      mobile_f2_title: "🧠 மொபைல் AI CFO", mobile_f2_sub: "உடனடி மூலதனம், நிதி காலம் மற்றும் வரி வழிகாட்டுதல்",
      mobile_f3_title: "🏢 பணியிடங்கள் மாற்றி", mobile_f3_sub: "தனிப்பட்ட கணக்கு மற்றும் வணிகக் குழு கணக்குகள்",
      mobile_f4_title: "⚡ ஆஃப்லைன் ஒத்திசைவு", mobile_f4_sub: "இணையம் இல்லாமல் பதிவு செய்யுங்கள், தானாக ஒத்திசைக்கப்படும்",
      mobile_btn_play: "📱 Play Store-ல் செயலியை பதிவிறக்குங்கள் (v5.5.0)",
      ocr_title: "பதிவேற்றவும் → AI புரிந்துகொள்கிறது → பதிவு உருவாகிறது",
      ocr_sub: "HisabHero எவ்வாறு இன்வாய்ஸ்களை ஸ்கேன் செய்து தானியங்கி நிதி பதிவுகளை உருவாக்குகிறது என்பதைப் பாருங்கள்.",
      ai_title: "உங்கள் நிதி பற்றி எதையும் கேளுங்கள்.",
      ai_prompt_label: "பயனர் வினவல்", ai_prompt: '"அடுத்த மாதத்திற்கான எங்கள் மூலதனத்தை எவ்வாறு மேம்படுத்துவது?"',
      ai_rec_label: "✨ AI CFO பரிந்துரை", ai_rec_sub: '"11-க்குள் GSTR-1 தாக்கல் செய்வதன் மூலம் ₹12,400 ITC திரும்பப் பெறலாம். மேலும் வாட்ஸ்அப் நினைவூட்டல் ₹45,000 வசூலை விரைவுபடுத்தும்."',
      bento_tag: "முக்கிய திறன்கள்", bento_title: "HisabHero-வை தேர்வு செய்வதற்கான 6 காரணங்கள்", bento_sub: "தனிப்பட்ட பட்ஜெட் முதல் வணிக கணக்கியல் வரை அனைத்தையும் எளிதாக்குங்கள்.",
      bento_c1_title: "🌐 8 இந்திய மற்றும் உலக மொழிகள்", bento_c1_sub: "ஆங்கிலம், தமிழ், இந்தி, மராத்தி, குஜராத்தி, தெலுங்கு, கன்னடம் மற்றும் வங்காள மொழிகளில் முழுமையான ஆதரவு.",
      bento_c2_title: "நிறுவன வணிக செயல்பாடுகள்", bento_c2_sub: "பல்வேறு கிளைகள், ஒப்புதல் வரம்புகள் மற்றும் குழு ஒத்துழைப்புடன் கூடிய வணிக அமைப்புகள்.",
      bento_c3_title: "பிரத்யேக AI CFO உதவியாளர்", bento_c3_sub: "உங்கள் பரிவர்த்தனைகளைப் படித்து வழிகாட்டும் சக்திவாய்ந்த AI உதவியாளர்.",
      merkle_title: "மெர்க்கிள் ட்ரீ சேதமடையாத தணிக்கை வால்ட்", merkle_sub: "பிளாக்செயின் அளவிலான பாதுகாப்பு எந்தவித கூடுதல் கட்டணமும் இல்லாமல்.",
      rev_tag: "சரிபார்க்கப்பட்ட கருத்துகள்", rev_title: "நிதி தலைவர்கள் கூறுவது", rev_btn: "✍️ மதிப்புரை எழுதுங்கள்",
      contact_title: "HisabHero உடன் தொடர்பு கொள்ளவும்", contact_sub: "எங்கள் நிதி அமைப்பு அல்லது தனிப்பயன் பயன்பாடு பற்றி ஏதேனும் கேள்விகள் உள்ளதா? எப்போது வேண்டுமானாலும் தொடர்பு கொள்ளுங்கள்."
    },
    hi: {
      nav_ocr: "OCR इंजन", nav_ai: "AI CFO", nav_strengths: "विशेषताएं", nav_merkle: "मर्कल वॉल्ट",
      nav_reviews: "समीक्षाएं", nav_contact: "संपर्क करें", nav_signin: "साइन इन", nav_create: "खाता बनाएं →",
      hero_badge: "पेटेंट-ग्रेड वित्तीय इंजन V5.5",
      hero_h1: "गुणवत्ता द्वारा संचालित.<br><span class=\\"accent\\">दक्षता के लिए प्रतिबद्ध.</span>",
      hero_sub: "अनुसंधान-समर्थित वित्तीय बुद्धिमत्ता को व्यवसायों और एमएसएमई के लिए स्वचालित विकास में बदलना।",
      mobile_title: "आपकी जेब में स्मार्ट वित्तीय लेखांकन",
      mobile_sub: "अपने व्यक्तिगत खर्चों, व्यावसायिक कार्यक्षेत्रों और AI CFO सलाह को कभी भी, कहीं भी नियंत्रित करें।",
      mobile_f1_title: "📸 1-टैप कैमरा OCR", mobile_f1_sub: "रसीद स्कैन करें और तुरंत GSTIN और विवरण प्राप्त करें",
      mobile_f2_title: "🧠 मोबाइल AI CFO", mobile_f2_sub: "तत्काल कार्यशील पूंजी और कर मार्गदर्शन",
      mobile_f3_title: "🏢 वर्कस्पेस स्विचर", mobile_f3_sub: "व्यक्तिगत खाता और व्यावसायिक टीम खाते",
      mobile_f4_title: "⚡ ऑफलाइन सिंक", mobile_f4_sub: "इंटरनेट के बिना डेटा रिकॉर्ड करें, लाइव सिंक होगा",
      mobile_btn_play: "📱 Play Store से ऐप डाउनलोड करें (v5.5.0)",
      ocr_title: "अपलोड करें → AI समझता है → लेन-देन दर्ज",
      ocr_sub: "देखें कि कैसे HisabHero चालानों को स्कैन करके तुरंत वित्तीय रिकॉर्ड तैयार करता है।",
      ai_title: "अपने वित्त के बारे में कुछ भी पूछें।",
      ai_prompt_label: "उपयोगकर्ता संकेत", ai_prompt: '"अगले महीने के लिए पूंजी का अनुकूलन कैसे करें?"',
      ai_rec_label: "✨ AI CFO अनुशंसा", ai_rec_sub: '"11 तारीख तक GSTR-1 दाखिल करके आप ₹12,400 ITC प्राप्त कर सकते हैं। व्हाट्सएप अनुस्मारक से ₹45,000 की वसूली तेज होगी।"',
      bento_tag: "मुख्य क्षमताएं", bento_title: "HisabHero को चुनने के 6 प्रमुख कारण", bento_sub: "व्यक्तिगत बजट से लेकर कॉर्पोरेट स्तर के वित्तीय प्रबंधन तक।",
      bento_c1_title: "🌐 8 भारतीय और वैश्विक भाषाएं", bento_c1_sub: "अंग्रेजी, तमिल, हिंदी, मराठी, गुजराती, तेलुगु, कन्नड़ और बंगाली में पूर्ण बहुभाषी समर्थन।",
      bento_c2_title: "एंटरप्राइज बिजनेस ऑपरेशंस", bento_c2_sub: "मल्टी-यूजर वर्कस्पेस और टीम सहयोग।",
      bento_c3_title: "समर्पित AI CFO साथी", bento_c3_sub: "Google Gemini द्वारा संचालित आपका बुद्धिमान वित्तीय सहायक।",
      merkle_title: "मर्कल ट्री छेड़छाड़-मुक्त ऑडिट वॉल्ट", merkle_sub: "ब्लॉकचेन स्तर की डेटा सुरक्षा बिना किसी अतिरिक्त शुल्क के।",
      rev_tag: "सत्यापित समीक्षाएं", rev_title: "वित्तीय विशेषज्ञों की राय", rev_btn: "✍️ समीक्षा लिखें",
      contact_title: "HisabHero से संपर्क करें", contact_sub: "हमारे वित्तीय इंजन के बारे में कोई प्रश्न हैं? हमसे कभी भी संपर्क करें।"
    },
    mr: {
      nav_ocr: "OCR इंजिन", nav_ai: "AI CFO", nav_strengths: "वैशिष्ट्ये", nav_merkle: "मर्कल वॉल्ट",
      nav_reviews: "अभिप्राय", nav_contact: "संपर्क", nav_signin: "साइन इन", nav_create: "खाते तयार करा →",
      hero_badge: "पेटंट-ग्रेड फायनान्शियल इंजिन V5.5",
      hero_h1: "गुणवत्तेने प्रेरित.<br><span class=\\"accent\\">कार्यक्षमतेसाठी कटिबद्ध.</span>",
      hero_sub: "एमएसएमई आणि व्यवसायांसाठी संशोधन-आधारित स्मार्ट वित्तीय व्यवस्थापन.",
      mobile_title: "तुमच्या खिशात स्मार्ट फायनान्शियल अकाउंटिंग",
      mobile_sub: "वैयक्तिक खर्च, व्यवसाय वर्कस्पेस आणि AI CFO सल्ला कधीही, कुठेही मिळवा.",
      mobile_f1_title: "📸 1-टॅप कॅमेरा OCR", mobile_f1_sub: "पावती स्कॅन करा आणि GSTIN तपशील मिळवा",
      mobile_f2_title: "🧠 मोबाईल AI CFO", mobile_f2_sub: "तात्काळ खेळते भांडवल आणि कर मार्गदर्शन",
      mobile_f3_title: "🏢 वर्कस्पेस स्विचर", mobile_f3_sub: "वैयक्तिक आणि व्यवसाय खाती सहज व्यवस्थापित करा",
      mobile_f4_title: "⚡ ऑफलाइन सिंक", mobile_f4_sub: "इंटरनेटशिवाय व्यवहार नोंदवा, आपोआप सिंक होईल",
      mobile_btn_play: "📱 Play Store वरून ॲप डाउनलोड करा (v5.5.0)",
      ocr_title: "अपलोड करा → AI समजून घेते → व्यवहार तयार",
      ocr_sub: "HisabHero पावत्या स्कॅन करून स्वयंचलित आर्थिक नोंदी कशा तयार करतो ते पहा.",
      ai_title: "तुमच्या वित्ताबद्दल काहीही विचारा.",
      ai_prompt_label: "वापरकर्ता प्रश्न", ai_prompt: '"पुढील महिन्यासाठी खेळते भांडवल कसे वाढवायचे?"',
      ai_rec_label: "✨ AI CFO शिफारस", ai_rec_sub: '"11 तारखेपर्यंत GSTR-1 दाखल करून ₹12,400 ITC परत मिळवा."',
      bento_tag: "मुख्य वैशिष्ट्ये", bento_title: "HisabHero निवडण्याची 6 प्रमुख कारणे", bento_sub: "वैयक्तिक बजेटपासून एंटरप्राइझ अकाउंटिंगपर्यंत सर्वकाही.",
      bento_c1_title: "🌐 8 भारतीय आणि जागतिक भाषा", bento_c1_sub: "मराठी, हिंदी, इंग्रजी, तमिळ, गुजराती, तेलुगू, कन्नड आणि बंगाली भाषांमध्ये उपलब्ध.",
      bento_c2_title: "व्यवसाय ऑपरेशन्स", bento_c2_sub: "सुरक्षित वर्कस्पेस आणि टीम व्यवस्थापन.",
      bento_c3_title: "समर्पित AI CFO मार्गदर्शक", bento_c3_sub: "तुमचा बुद्धिमान AI वित्तीय सल्लागार.",
      merkle_title: "मर्कल ट्री सुरक्षित ऑडिट वॉल्ट", merkle_sub: "ब्लॉकचेन पातळीवरील सुरक्षितता आणि पारदर्शकता.",
      rev_tag: "सत्यापित अभिप्राय", rev_title: "उद्योग प्रमुखांचे मत", rev_btn: "✍️ अभिप्राय नोंदवा",
      contact_title: "HisabHero शी संपर्क साधा", contact_sub: "काही प्रश्न आहेत का? आमच्याशी कधीही संपर्क साधा."
    },
    gu: {
      nav_ocr: "OCR એન્જિન", nav_ai: "AI CFO", nav_strengths: "વિશેષતાઓ", nav_merkle: "મર્કલ વૉલ્ટ",
      nav_reviews: "પ્રતિસાદ", nav_contact: "સંપર્ક કરો", nav_signin: "સાઇન ઇન", nav_create: "ખાતું બનાવો →",
      hero_badge: "પેટન્ટ-ગ્રેડ ફાયનાન્સિયલ એન્જિન V5.5",
      hero_h1: "ગુણવત્તા દ્વારા સંચાલિત.<br><span class=\\"accent\\">કાર્યક્ષમતા માટે પ્રતિબદ્ધ.</span>",
      hero_sub: "વ્યવસાયો અને MSME માટે સંશોધન આધારિત સ્માર્ટ નાણાકીય વ્યવસ્થાપન.",
      mobile_title: "તમારા ખિસ્સામાં સ્માર્ટ નાણાકીય એકાઉન્ટિંગ",
      mobile_sub: "વ્યક્તિગત ખર્ચ, વ્યવસાય વર્કસ્પેસ અને AI CFO સલાહ ગમે ત્યારે મેળવો.",
      mobile_f1_title: "📸 1-ટેપ કેમેરા OCR", mobile_f1_sub: "રસીદો સ્કેન કરો અને તરત જ GSTIN વિગતો મેળવો",
      mobile_f2_title: "🧠 મોબાઇલ AI CFO", mobile_f2_sub: "તાત્કાલિક કાર્યકારી મૂડી અને ટેક્સ માર્ગદર્શન",
      mobile_f3_title: "🏢 વર્કસ્પેસ સ્વિચર", mobile_f3_sub: "વ્યક્તિગત અને વ્યવસાય ખાતાઓ સરળતાથી મેનેજ કરો",
      mobile_f4_title: "⚡ ઑફલાઇન સિંક", mobile_f4_sub: "ઇન્ટરનેટ વિના ડેટા રેકોર્ડ કરો, લાઇવ સિંક થશે",
      mobile_btn_play: "📱 Play Store પરથી એપ ડાઉનલોડ કરો (v5.5.0)",
      ocr_title: "અપલોડ કરો → AI સમજે છે → ટ્રાન્ઝેક્શન બન્યું",
      ocr_sub: "જુઓ કેવી રીતે HisabHero રસીદો સ્કેન કરીને ઓડિટ-પ્રૂફ નાણાકીય રેકોર્ડ્સ બનાવે છે.",
      ai_title: "તમારા નાણાં વિશે કંઈપણ પૂછો.",
      ai_prompt_label: "યુઝર પ્રોમ્પ્ટ", ai_prompt: '"આગામી મહિના માટે મૂડીનું સંચાલન કેવી રીતે કરવું?"',
      ai_rec_label: "✨ AI CFO ભલામણ", ai_rec_sub: '"11મી તારીખ સુધીમાં GSTR-1 ફાઇલ કરીને ₹12,400 ITC મેળવો."',
      bento_tag: "મુખ્ય ક્ષમતાઓ", bento_title: "HisabHero પસંદ કરવાના 6 મુખ્ય કારણો", bento_sub: "વ્યક્તિગત બજેટથી લઈને એન્ટરપ્રાઇઝ એકાઉન્ટિંગ સુધી.",
      bento_c1_title: "🌐 8 ભારતીય અને વૈશ્વિક ભાષાઓ", bento_c1_sub: "ગુજરાતી, હિન્દી, અંગ્રેજી, તમિલ, મરાઠી, તેલુગુ, કન્નડ અને બંગાળીમાં ઉપલબ્ધ.",
      bento_c2_title: "એન્ટરપ્રાઇઝ બિઝનેસ ઓપરેશન્સ", bento_c2_sub: "મલ્ટી-યુઝર વર્કસ્પેસ અને ટીમ સહયોગ.",
      bento_c3_title: "સમર્પિત AI CFO સાથી", bento_c3_sub: "Google Gemini દ્વારા સંચાલિત તમારો સ્માર્ટ નાણાકીય સહાયક.",
      merkle_title: "મર્કલ ટ્રી સુરક્ષિત ઓડિટ વૉલ્ટ", merkle_sub: "બ્લોકચેન સ્તરની સુરક્ષા કોઈ વધારાના ખર્ચ વિના.",
      rev_tag: "ચકાસાયેલ સમીક્ષાઓ", rev_title: "નાણાકીય નિષ્ણાતો શું કહે છે", rev_btn: "✍️ સમીક્ષા લખો",
      contact_title: "HisabHero નો સંપર્ક કરો", contact_sub: "કોઈ પ્રશ્નો છે? ગમે ત્યારે અમારો સંપર્ક કરો."
    },
    te: {
      nav_ocr: "OCR ఇంజిన్", nav_ai: "AI CFO", nav_strengths: "ఫీచర్లు", nav_merkle: "మెర్కిల్ వాల్ట్",
      nav_reviews: "సమీక్షలు", nav_contact: "సంప్రదించండి", nav_signin: "సైన్ ఇన్", nav_create: "ఖాతా సృష్టించండి →",
      hero_badge: "పేటెంట్-గ్రేడ్ ఫైనాన్షియల్ ఇంజిన్ V5.5",
      hero_h1: "నాణ్యతతో నడుస్తుంది.<br><span class=\\"accent\\">సమర్థతకు కట్టుబడి ఉంది.</span>",
      hero_sub: "MSMEలు మరియు వ్యాపారాల కోసం పరిశోధన-ఆధారిత స్మార్ట్ ఆర్థిక నిర్వహణ.",
      mobile_title: "మీ జేబులోనే స్మార్ట్ ఆర్థిక అకౌంటింగ్",
      mobile_sub: "వ్యక్తిగత ఖర్చులు, వ్యాపార వర్క్‌స్పేస్‌లు మరియు AI CFO సలహాలను ఎప్పుడైనా పొందండి.",
      mobile_f1_title: "📸 1-ట్యాప్ కెమెరా OCR", mobile_f1_sub: "రసీదులను స్కాన్ చేసి వెంటనే GSTIN వివరాలను పొందండి",
      mobile_f2_title: "🧠 మొబైల్ AI CFO", mobile_f2_sub: "తక్షణ వర్కింగ్ క్యాపిటల్ మరియు పన్ను మార్గదర్శకత్వం",
      mobile_f3_title: "🏢 వర్క్‌స్పేస్ స్విచ్చర్", mobile_f3_sub: "వ్యక్తిగత మరియు వ్యాపార ఖాతాలను సులభంగా నిర్వహించండి",
      mobile_f4_title: "⚡ ఆఫ్‌లైన్ సింక్", mobile_f4_sub: "ఇంటర్నెట్ లేకుండా రికార్డ్ చేయండి, ఆటోమేటిక్‌గా సింక్ అవుతుంది",
      mobile_btn_play: "📱 Play Store నుండి యాప్‌ను డౌన్‌లోಡ್ చేసుకోండి (v5.5.0)",
      ocr_title: "అప్‌లోడ్ చేయండి → AI అర్థం చేసుకుంటుంది → లావాదేవీ రికార్డ్",
      ocr_sub: "HisabHero రసీదులను స్కాన్ చేసి ఆర్థిక రికార్డులను ఎలా రూపొందిస్తుందో చూడండి.",
      ai_title: "మీ ఫైనాన్స్ గురించి ఏదైనా అడగండి.",
      ai_prompt_label: "యూజర్ ప్రాంప్ట్", ai_prompt: '"వచ్చే నెల కోసం మూలధనాన్ని ఎలా మెరుగుపరచాలి?"',
      ai_rec_label: "✨ AI CFO సిఫార్సు", ai_rec_sub: '"11వ తేదీ నాటికి GSTR-1 ఫైల్ చేయడం ద్వారా ₹12,400 ITCని పొందవచ్చు."',
      bento_tag: "ముఖ్య ఫీచర్లు", bento_title: "HisabHero ఎంచుకోవడానికి 6 ముఖ్య కారణాలు", bento_sub: "వ్యక్తిగత బడ్జెట్ నుండి ఎంటర్‌ప్రైజ్ అకౌంటింగ్ వరకు.",
      bento_c1_title: "🌐 8 భారతీయ మరియు ప్రపంచ భాషలు", bento_c1_sub: "తెలుగు, హిందీ, ఇంగ్లీష్, తమిళం, మరాఠీ, గుజరాతీ, కన్నడ మరియు బెంగాలీలలో లభ్యం.",
      bento_c2_title: "ఎంటర్‌ప్రైజ్ బిజినెస్ ఆపరేషన్స్", bento_c2_sub: "మల్టీ-యూజర్ వర్క్‌స్పేస్ మరియు టీమ్ సహకారం.",
      bento_c3_title: "ప్రత్యేక AI CFO సహచరుడు", bento_c3_sub: "Google Gemini ద్వారా ఆధారిత మీ స్మార్ట్ ఆర్థిక సహాయకుడు.",
      merkle_title: "మెర్కిల్ ట్రీ సురక్షిత ఆడిట్ వాల్ట్", merkle_sub: "బ్లాక్‌చెయిన్ స్థాయి భద్రత ఎటువంటి అదనపు ఖర్చు లేకుండా.",
      rev_tag: "ధృవీకరించబడిన సమీక్షలు", rev_title: "ఆర్థిక నిపుణులు ఏమంటున్నారు", rev_btn: "✍️ సమీక్ష రాయండి",
      contact_title: "HisabHeroని సంప్రదించండి", contact_sub: "ఏవైనా ప్రశ్నలు ఉన్నాయా? ఎప్పుడైనా మమ్మల్ని సంప్రదించండి."
    },
    kn: {
      nav_ocr: "OCR ಎಂಜಿನ್", nav_ai: "AI CFO", nav_strengths: "ವೈಶಿಷ್ಟ್ಯಗಳು", nav_merkle: "ಮರ್ಕಲ್ ವಾಲ್ಟ್",
      nav_reviews: "ವಿಮರ್ಶೆಗಳು", nav_contact: "ಸಂಪರ್ಕಿಸಿ", nav_signin: "ಸೈನ್ ಇನ್", nav_create: "ಖಾತೆ ರಚಿಸಿ →",
      hero_badge: "ಪೇಟೆಂಟ್-ಗ್ರೇಡ್ ಹಣಕಾಸು ಎಂಜಿನ್ V5.5",
      hero_h1: "ಗುಣಮಟ್ಟದಿಂದ ಚಾಲಿತ.<br><span class=\\"accent\\">ದಕ್ಷತೆಗೆ ಬದ್ಧವಾಗಿದೆ.</span>",
      hero_sub: "MSMEಗಳು ಮತ್ತು ಸಂಸ್ಥೆಗಳಿಗಾಗಿ ಸಂಶೋಧನೆ ಆಧಾರಿತ ಸ್ವಯಂಚಾಲಿತ ಹಣಕಾಸು ನಿರ್ವಹಣೆ.",
      mobile_title: "ನಿಮ್ಮ ಜೇಬಿನಲ್ಲೇ ಸ್ಮಾರ್ಟ್ ಹಣಕಾಸು ಲೆಕ್ಕಪತ್ರ",
      mobile_sub: "ವೈಯಕ್ತಿಕ ವೆಚ್ಚಗಳು, ವ್ಯಾಪಾರ ವರ್ಕ್‌ಸ್ಪೇಸ್‌ಗಳು ಮತ್ತು AI CFO ಸಲಹೆಯನ್ನು ಎಲ್ಲಿ ಬೇಕಾದರೂ ಪಡೆಯಿರಿ.",
      mobile_f1_title: "📸 1-ಟ್ಯಾಪ್ ಕ್ಯಾಮೆರಾ OCR", mobile_f1_sub: "ರಶೀದಿಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಮತ್ತು GSTIN ವಿವರಗಳನ್ನು ಪಡೆಯಿರಿ",
      mobile_f2_title: "🧠 ಮೊಬೈಲ್ AI CFO", mobile_f2_sub: "ತಕ್ಷಣದ ವರ್ಕಿಂಗ್ ಕ್ಯಾಪಿಟಲ್ ಮತ್ತು ತೆರಿಗೆ ಮಾರ್ಗದರ್ಶನ",
      mobile_f3_title: "🏢 ವರ್ಕ್‌ಸ್ಪೇಸ್ ಸ್ವಿಚರ್", mobile_f3_sub: "ವೈಯಕ್ತಿಕ ಮತ್ತು ವ್ಯಾಪಾರ ಖಾತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
      mobile_f4_title: "⚡ ಆಫ್‌ಲೈನ್ ಸಿಂಕ್", mobile_f4_sub: "ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆ ನಮೂದಿಸಿ, ಲೈವ್ ಸಿಂಕ್ ಆಗುತ್ತದೆ",
      mobile_btn_play: "📱 Play Store ನಿಂದ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (v5.5.0)",
      ocr_title: "ಅಪ್‌ಲೋಡ್ → AI ಗ್ರಹಿಕೆ → ವಹಿವಾಟು ದಾಖಲು",
      ocr_sub: "HisabHero ರಶೀದಿಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಹಣಕಾಸು ದಾಖಲೆಗಳನ್ನು ಹೇಗೆ ಸೃಷ್ಟಿಸುತ್ತದೆ ನೋಡಿ.",
      ai_title: "ನಿಮ್ಮ ಹಣಕಾಸಿನ ಬಗ್ಗೆ ಏನು ಬೇಕಾದರೂ ಕೇಳಿ.",
      ai_prompt_label: "ಬಳಕೆದಾರರ ಪ್ರಶ್ನೆ", ai_prompt: '"ಮುಂದಿನ ತಿಂಗಳಿಗೆ ಹಣಕಾಸು ನಿರ್ವಹಣೆ ಹೇಗೆ ಮಾಡುವುದು?"',
      ai_rec_label: "✨ AI CFO ಶಿಫಾರಸು", ai_rec_sub: '"11ನೇ ತಾರೀಖಿನೊಳಗೆ GSTR-1 ಸಲ್ಲಿಸಿ ₹12,400 ITC ಮರಳಿ ಪಡೆಯಿರಿ."',
      bento_tag: "ಪ್ರಮುಖ ಸಾಮರ್ಥ್ಯಗಳು", bento_title: "HisabHero ಆಯ್ಕೆ ಮಾಡಲು 6 ಪ್ರಮುಖ ಕಾರಣಗಳು", bento_sub: "ವೈಯಕ್ತಿಕ ಬಜೆಟ್‌ನಿಂದ ಹಿಡಿದು ಸಂಸ್ಥೆಯ ಲೆಕ್ಕಪತ್ರದವರೆಗೆ.",
      bento_c1_title: "🌐 8 ಭಾರತೀಯ ಮತ್ತು ಜಾಗತಿಕ ಭಾಷೆಗಳು", bento_c1_sub: "ಕನ್ನಡ, ಹಿಂದಿ, ಇಂಗ್ಲಿಷ್, ತಮಿಳು, ಮರಾಠಿ, ಗುಜರಾತಿ, ತೆಲುಗು ಮತ್ತು ಬೆಂಗಾಲಿ ಭಾಷೆಗಳಲ್ಲಿ ಲಭ್ಯ.",
      bento_c2_title: "ಉದ್ಯಮ ವ್ಯಾಪಾರ ಕಾರ್ಯಾಚರಣೆಗಳು", bento_c2_sub: "ಸುರಕ್ಷಿತ ವರ್ಕ್‌ಸ್ಪೇಸ್‌ಗಳು ಮತ್ತು ತಂಡದ ಸಹಯೋಗ.",
      bento_c3_title: "ಮೀಸಲಾದ AI CFO ಸಹಾಯಕ", bento_c3_sub: "Google Gemini ಮೂಲಕ ಚಾಲಿತ ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ಹಣಕಾಸು ಸಹಾಯಕ.",
      merkle_title: "ಮರ್ಕಲ್ ಟ್ರೀ ಸುರಕ್ಷಿತ ಆಡಿಟ್ ವಾಲ್ಟ್", merkle_sub: "ಬ್ಲಾಕ್‌ಚೈನ್ ಮಟ್ಟದ ಭದ್ರತೆ ಯಾವುದೇ ಹೆಚ್ಚುವರಿ ಶುಲ್ಕವಿಲ್ಲದೆ.",
      rev_tag: "ಪರಿಶೀಲಿಸಿದ ವಿಮರ್ಶೆಗಳು", rev_title: "ಹಣಕಾಸು ತಜ್ಞರ ಅಭಿಪ್ರಾಯ", rev_btn: "✍️ ವಿಮರ್ಶೆ ಬರೆಯಿರಿ",
      contact_title: "HisabHero ಸಂಪರ್ಕಿಸಿ", contact_sub: "ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳಿವೆಯೇ? ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ."
    },
    bn: {
      nav_ocr: "OCR ইঞ্জিন", nav_ai: "AI CFO", nav_strengths: "বৈশিষ্ট্য", nav_merkle: "মার্কেল ভল্ট",
      nav_reviews: "পর্যালোচনা", nav_contact: "যোগাযোগ", nav_signin: "সাইন ইন", nav_create: "অ্যাকাউন্ট তৈরি করুন →",
      hero_badge: "পেটেন্ট-গ্রেড আর্থিক ইঞ্জিন V5.5",
      hero_h1: "গুণমান দ্বারা চালিত।<br><span class=\\"accent\\">দক্ষতার প্রতি অঙ্গীকারবদ্ধ।</span>",
      hero_sub: "ব্যবসা এবং MSME-এর জন্য গবেষণা-ভিত্তিক স্মার্ট আর্থিক ব্যবস্থাপনা।",
      mobile_title: "আপনার পকেটেই স্মার্ট আর্থিক অ্যাকাউন্টিং",
      mobile_sub: "ব্যক্তিগত খরচ, ব্যবসায়িক ওয়ার্কস্পেস এবং AI CFO পরামর্শ যে কোনো সময় পান।",
      mobile_f1_title: "📸 ১-ট্যাপ ক্যামেরা OCR", mobile_f1_sub: "রসিদ স্ক্যান করুন এবং অবিলম্বে GSTIN বিবরণ পান",
      mobile_f2_title: "🧠 মোবাইল AI CFO", mobile_f2_sub: "তাত্ক্ষণিক কার্যকারী মূলধন এবং ট্যাক্স নির্দেশিকা",
      mobile_f3_title: "🏢 ওয়ার্কস্পেস সুইচার", mobile_f3_sub: "ব্যক্তিগত এবং ব্যবসায়িক অ্যাকাউন্ট পরিচালনা করুন",
      mobile_f4_title: "⚡ অফলাইন সিঙ্ক", mobile_f4_sub: "ইন্টারনেট ছাড়াই এন্ট্রি করুন, লাইভ সিঙ্ক হবে",
      mobile_btn_play: "📱 Play Store থেকে অ্যাপ ডাউনলোড করুন (v5.5.0)",
      ocr_title: "আপলোড করুন → AI বোঝে → লেনদেন তৈরি",
      ocr_sub: "দেখুন কিভাবে HisabHero রসিদ স্ক্যান করে স্বয়ংক্রিয় আর্থিক রেকর্ড তৈরি করে।",
      ai_title: "আপনার আর্থিক বিষয়ে যে কোনো প্রশ্ন জিজ্ঞাসা করুন।",
      ai_prompt_label: "ব্যবহারকারী প্রম্পট", ai_prompt: '"পরের মাসের জন্য কীভাবে কার্যকারী মূলধন অপ্টিমাইজ করবেন?"',
      ai_rec_label: "✨ AI CFO সুপারিশ", ai_rec_sub: '"১১ তারিখের মধ্যে GSTR-1 ফাইল করে ₹12,400 ITC ফেরত পান।"',
      bento_tag: "মূল ক্ষমতা", bento_title: "HisabHero বেছে নেওয়ার ৬টি প্রধান কারণ", bento_sub: "ব্যক্তিগত বাজেট থেকে এন্টারপ্রাইজ অ্যাকাউন্টিং পর্যন্ত।",
      bento_c1_title: "🌐 ৮টি ভারতীয় ও বৈশ্বিক ভাষা", bento_c1_sub: "বাংলা, হিন্দি, ইংরেজি, তামিল, মারাঠি, গুজরাটি, তেলুগু এবং কন্নড় ভাষায় উপলব্ধ।",
      bento_c2_title: "এন্টারপ্রাইজ ব্যবসা পরিচালনা", bento_c2_sub: "মাল্টি-ইউজার ওয়ার্কস্পেস এবং দলের সহযোগিতা।",
      bento_c3_title: "ডেডিকেটেড AI CFO সহকারী", bento_c3_sub: "Google Gemini দ্বারা চালিত আপনার বিশ্বস্ত আর্থিক সহযোগী।",
      merkle_title: "মার্কেল ট্রি সুরক্ষিত অডিট ভল্ট", merkle_sub: "ব্লকচেন স্তরের ডেটা নিরাপত্তা কোনো অতিরিক্ত খরচ ছাড়া।",
      rev_tag: "যাচাইকৃত পর্যালোচনা", rev_title: "আর্থিক বিশেষজ্ঞদের মতামত", rev_btn: "✍️ পর্যালোচনা লিখুন",
      contact_title: "HisabHero-র সাথে যোগাযোগ করুন", contact_sub: "কোনো প্রশ্ন আছে? যে কোনো সময় আমাদের সাথে যোগাযোগ করুন।"
    }
  };

  // ─── LANGUAGE SWITCHER HANDLERS ──────────────────────────────────────────
  function toggleLangMenu(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const menu = document.getElementById('langMenu');
    if (menu) {
      menu.classList.toggle('show');
    }
  }

  // Close language menu on outside click
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('langDropdown');
    const menu = document.getElementById('langMenu');
    if (menu && dropdown && !dropdown.contains(e.target)) {
      menu.classList.remove('show');
    }
  });

  function selectWebsiteLanguage(code, label) {
    const btnSpan = document.getElementById('currentLangLabel') || document.querySelector('.lang-btn span');
    if (btnSpan) {
      btnSpan.textContent = label;
    }
    
    // Update active highlight in dropdown
    document.querySelectorAll('.lang-item').forEach(item => {
      if (item.getAttribute('onclick') && item.getAttribute('onclick').includes("'" + code + "'")) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    localStorage.setItem('hh_lang', code);
    const menu = document.getElementById('langMenu');
    if (menu) menu.classList.remove('show');

    // Apply translations across all data-i18n attributes
    const dict = TRANSLATIONS[code] || TRANSLATIONS['en'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict && dict[key]) {
        if (dict[key].includes('<')) {
          el.innerHTML = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });
  }

  // ─── AUTHENTICATION STATE & MODALS ───────────────────────────────────────
  let pendingVerificationEmail = '';

  function updateUserAuthState() {
    const token = localStorage.getItem('hh_token');
    const userStr = localStorage.getItem('hh_user');
    const navActions = document.getElementById('navActions');
    if (!navActions) return;

    const langDropdownHtml = \`
      <div class="lang-dropdown" id="langDropdown">
        <button class="btn btn-secondary btn-sm lang-btn" onclick="toggleLangMenu(event)" type="button">
          <span id="currentLangLabel">\${document.getElementById('currentLangLabel')?.textContent || '🌐 English'}</span>
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
    \`;

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const name = user.fullName || user.name || (user.email ? user.email.split('@')[0] : 'User');
        const initial = name.charAt(0).toUpperCase();

        navActions.innerHTML = \`
          \${langDropdownHtml}
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(79, 70, 229, 0.08); padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(79, 70, 229, 0.2);">
            <div style="width: 26px; height: 26px; border-radius: 13px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800;">
              \${initial}
            </div>
            <span style="font-size: 13px; font-weight: 700; color: var(--text);">\${name}</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="handleLogout()" style="padding: .4rem .85rem; font-size: .8rem;">Sign Out</button>
        \`;
        return;
      } catch {}
    }

    navActions.innerHTML = \`
      \${langDropdownHtml}
      <button class="btn btn-secondary btn-sm btn-magnetic" onclick="openModal('loginModal')" data-i18n="nav_signin">Sign In</button>
      <button class="btn btn-primary btn-sm btn-magnetic" onclick="openModal('signupModal')" data-i18n="nav_create">Create Account →</button>
    \`;
  }

  function handleLogout() {
    localStorage.removeItem('hh_token');
    localStorage.removeItem('hh_user');
    updateUserAuthState();
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const submitBtn = document.getElementById('loginSubmit');
    
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verifying...</span>';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem('hh_token', data.token);
        if (data.user) {
          localStorage.setItem('hh_user', JSON.stringify(data.user));
        }
        submitBtn.innerHTML = '<span>Success! ✓</span>';
        setTimeout(() => {
          closeModal('loginModal');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Sign In</span><span class="btn-arrow">→</span>';
          document.getElementById('loginForm').reset();
          updateUserAuthState();
        }, 300);
      } else {
        errorEl.textContent = data.error || 'Invalid credentials. Please check your email and password.';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In</span><span class="btn-arrow">→</span>';
      }
    } catch {
      errorEl.textContent = 'Server connection error. Please ensure backend is running.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In</span><span class="btn-arrow">→</span>';
    }
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

      if (res.ok && (data.success || data.needsVerification)) {
        pendingVerificationEmail = email;
        submitBtn.innerHTML = '<span>Account Created! ✓</span>';
        
        setTimeout(() => {
          closeModal('signupModal');
          document.getElementById('signupForm').reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Create Account</span><span class="btn-arrow">→</span>';

          // Open OTP Verification Modal
          document.getElementById('otpTargetEmail').textContent = email;
          const otpErr = document.getElementById('otpError');
          const otpSucc = document.getElementById('otpSuccess');
          if (otpErr) otpErr.style.display = 'none';
          if (otpSucc) {
            otpSucc.textContent = 'Verification code sent to your email!';
            otpSucc.style.display = 'block';
          }
          openModal('otpModal');
          const codeInput = document.getElementById('otpCodeInput');
          if (codeInput) {
            codeInput.value = '';
            codeInput.focus();
          }
        }, 400);
      } else {
        errorEl.textContent = data.error || 'Registration failed. Please try again.';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span><span class="btn-arrow">→</span>';
      }
    } catch {
      errorEl.textContent = 'Server connection error. Please ensure backend is running.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Create Account</span><span class="btn-arrow">→</span>';
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    const code = document.getElementById('otpCodeInput').value.trim();
    const email = pendingVerificationEmail || document.getElementById('otpTargetEmail').textContent.trim();
    const errorEl = document.getElementById('otpError');
    const successEl = document.getElementById('otpSuccess');
    const submitBtn = document.getElementById('otpSubmit');

    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verifying Code...</span>';

    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('hh_token', data.token);
        }
        if (data.user) {
          localStorage.setItem('hh_user', JSON.stringify(data.user));
        }

        successEl.textContent = '🎉 Email verified & account activated successfully!';
        successEl.style.display = 'block';
        submitBtn.innerHTML = '<span>Verified! ✓</span>';

        setTimeout(() => {
          closeModal('otpModal');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Verify & Activate Account</span><span class="btn-arrow">✓</span>';
          updateUserAuthState();
        }, 800);
      } else {
        errorEl.textContent = data.error || 'Invalid verification code. Please try again.';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Verify & Activate Account</span><span class="btn-arrow">✓</span>';
      }
    } catch {
      errorEl.textContent = 'Server connection error. Please try again.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Verify & Activate Account</span><span class="btn-arrow">✓</span>';
    }
  }

  async function handleResendOtp() {
    const email = pendingVerificationEmail || document.getElementById('otpTargetEmail').textContent.trim();
    const resendBtn = document.getElementById('resendOtpBtn');
    const errorEl = document.getElementById('otpError');
    const successEl = document.getElementById('otpSuccess');

    if (!email) {
      alert('Email not found. Please sign up again.');
      return;
    }

    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';

    try {
      const res = await fetch('/api/auth/resend-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        successEl.textContent = 'A new 6-digit code has been sent to your email.';
        successEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
      } else {
        errorEl.textContent = data.error || 'Failed to resend code.';
        errorEl.style.display = 'block';
      }
    } catch {
      errorEl.textContent = 'Connection error. Please try again.';
      errorEl.style.display = 'block';
    } finally {
      setTimeout(() => {
        resendBtn.disabled = false;
        resendBtn.textContent = '🔄 Resend Code';
      }, 3000);
    }
  }

  /* Master Storytelling Controller Class */
  class CinematicStoryEngine {
    constructor() {
      this.initStoryProgressBar();
      this.initGSAPScrollStory();
      this.initStatCounters();
    }

    initStoryProgressBar() {
      const progressBar = document.getElementById('storyProgressBar');
      window.addEventListener('scroll', () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        if (progressBar) progressBar.style.width = \`\${Math.min(progress, 100)}%\`;

        const navbar = document.getElementById('mainNavbar');
        if (navbar) {
          if (window.scrollY > 40) navbar.classList.add('scrolled');
          else navbar.classList.remove('scrolled');
        }
      }, { passive: true });
    }

    initGSAPScrollStory() {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
      gsap.registerPlugin(ScrollTrigger);

      gsap.from('#ocr-story .ocr-scene-card', {
        scrollTrigger: {
          trigger: '#ocr-story',
          start: 'top 80%',
          end: 'top 30%',
          scrub: 0.5
        },
        opacity: 0,
        y: 40,
        scale: 0.98
      });
    }

    initStatCounters() {
      const statGrid = document.getElementById('statGrid');
      if (!statGrid) return;

      let animated = false;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !animated) {
            animated = true;
            this.runCounters();
          }
        });
      }, { threshold: 0.2 });

      observer.observe(statGrid);
    }

    runCounters() {
      document.querySelectorAll('.stat-num').forEach(el => {
        const target = parseFloat(el.getAttribute('data-target') || '0');
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0');

        let start = null;
        const duration = 1600;
        const step = (timestamp) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const current = (easeProgress * target).toFixed(decimals);
          el.textContent = \`\${prefix}\${current}\${suffix}\`;
          if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
      });
    }
  }

  function openWriteReviewModal() {
    const token = localStorage.getItem('hh_token');
    const userStr = localStorage.getItem('hh_user');
    
    if (!token) {
      openModal('reviewLoginRequiredModal');
      return;
    }

    let userObj = {};
    try { userObj = JSON.parse(userStr || '{}'); } catch {}
    const name = userObj.fullName || userObj.name || (userObj.email ? userObj.email.split('@')[0] : 'HisabHero User');
    const email = userObj.email || '';

    const nameInput = document.getElementById('reviewName');
    if (nameInput) nameInput.value = name;
    
    const emailInput = document.getElementById('reviewEmail');
    if (emailInput) emailInput.value = email;
    
    const accountBadge = document.getElementById('reviewAccountBadge');
    if (accountBadge) {
      accountBadge.style.display = 'block';
      accountBadge.innerHTML = \`🛡️ Verified Account: <strong>\${name}</strong> (\${email}) ✓\`;
    }
    
    openModal('reviewModal');
  }

  async function loadPublicReviews() {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;
    try {
      const res = await fetch('/api/public/reviews');
      const data = await res.json();
      if (data.success && data.reviews) {
        if (data.reviews.length === 0) {
          grid.innerHTML = \`
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 2.5rem; background: #fff; border-radius: var(--radius-xl); border: 1.5px dashed var(--border); box-shadow: var(--shadow-hero);">
              <div style="font-size: 2.5rem; margin-bottom: .5rem;">⭐</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: var(--text); margin-bottom: .5rem;">Be the First to Post a Verified Review!</div>
              <p style="font-size: .95rem; color: var(--text-muted); max-width: 500px; margin: 0 auto 1.5rem;">Sign in to your HisabHero account to share your experience with thousands of businesses across India.</p>
              <button class="btn btn-primary" onclick="openWriteReviewModal()">✍️ Write a Review Now</button>
            </div>
          \`;
          return;
        }

        grid.innerHTML = data.reviews.map(rev => {
          const initials = rev.name ? rev.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
          const stars = '★'.repeat(rev.rating || 5);
          const subTitle = [rev.role, rev.company].filter(Boolean).join(' • ');
          return \`
            <div class="review-card">
              <div class="review-stars">\${stars}</div>
              <div class="review-comment">"\${rev.comment}"</div>
              <div class="review-author-row">
                <div class="review-avatar">\${initials}</div>
                <div>
                  <div class="review-author-name">\${rev.name} \${rev.verified ? '✓' : ''}</div>
                  <div class="review-author-sub">\${subTitle || 'Verified HisabHero Account'}</div>
                </div>
              </div>
            </div>
          \`;
        }).join('');
      }
    } catch {
      grid.innerHTML = '<div style="color: var(--text-muted);">Failed to load reviews.</div>';
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reviewName').value;
    const email = document.getElementById('reviewEmail').value;
    const role = document.getElementById('reviewRole').value;
    const company = document.getElementById('reviewCompany').value;
    const rating = document.getElementById('reviewRating').value;
    const comment = document.getElementById('reviewComment').value;
    const errorEl = document.getElementById('reviewError');
    const submitBtn = document.getElementById('reviewSubmit');

    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Submitting Review...</span>';

    try {
      const res = await fetch('/api/public/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, company, rating, comment })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        submitBtn.innerHTML = '<span>Review Submitted!</span>';
        setTimeout(() => {
          closeModal('reviewModal');
          document.getElementById('reviewForm').reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Submit Review →</span>';
          loadPublicReviews();
        }, 400);
      } else {
        errorEl.textContent = data.error || 'Failed to submit review';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Submit Review →</span>';
      }
    } catch {
      errorEl.textContent = 'Server connection error';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Submit Review →</span>';
    }
  }

  async function handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactText').value;
    const msgEl = document.getElementById('contactMsg');
    const submitBtn = document.getElementById('contactSubmit');

    msgEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Sending Message...</span>';

    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        msgEl.className = 'form-msg';
        msgEl.style.background = '#dcfce7';
        msgEl.style.color = '#166534';
        msgEl.textContent = data.message || 'Message sent successfully!';
        msgEl.style.display = 'block';
        document.getElementById('contactForm').reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Send Message 🚀</span>';
      } else {
        msgEl.className = 'form-msg form-error-msg';
        msgEl.textContent = data.error || 'Failed to send message';
        msgEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Send Message 🚀</span>';
      }
    } catch {
      msgEl.className = 'form-msg form-error-msg';
      msgEl.textContent = 'Server connection error';
      msgEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Send Message 🚀</span>';
    }
  }

  async function loadPublicStats() {
    try {
      const res = await fetch('/api/public/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards[0]) statCards[0].querySelector('.stat-num').textContent = data.stats.businesses;
        if (statCards[1]) statCards[1].querySelector('.stat-num').textContent = data.stats.users;
        if (statCards[2]) statCards[2].querySelector('.stat-num').textContent = data.stats.transactions;
        if (statCards[3]) statCards[3].querySelector('.stat-num').textContent = data.stats.uptime;
      }
    } catch {}
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  function closeModalOnBackdrop(e, modalId) {
    if (e.target.id === modalId) {
      closeModal(modalId);
    }
  }

  // Initialize on Load
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
  });
</script>
</body>
</html>
`;

const newIndexHtml = beforeModals + newModalsAndScript;
fs.writeFileSync(indexPath, newIndexHtml, 'utf8');
console.log("Successfully upgraded auth flow, signup modal, OTP verification modal, and login in index.html!");
