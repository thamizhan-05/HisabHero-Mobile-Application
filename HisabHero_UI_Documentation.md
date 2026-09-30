# HisabHero – Complete UI/UX Design Specification

> **Generated:** August 2026  
> **Version:** 2.0  
> **Platform:** React Native (Expo) — Android & iOS  
> **Purpose:** Full design specification for UI/UX redesign by another AI or design system

---

## 1. COMPLETE APP OVERVIEW

### Purpose
**HisabHero** is a full-stack mobile Personal & Business Finance Management Platform. The name "Hisab" (Hindi/Urdu) means *Account/Calculation* and "Hero" means *Champion*. The app lets individuals and business teams manage money, track expenses, generate invoices, process receipts via OCR, get AI-powered financial advice, and collaborate across business workspaces.

### Target Users
- **Individuals** tracking personal income & budgets
- **Small & Medium Business Owners** managing P&L, invoices, payroll
- **Accountants** reviewing financial health scores, reconciliation
- **Business Teams** collaborating on shared workspaces with role-based access (Owner, Admin, Accountant, Viewer)

### Primary Use Cases
1. Personal income & expense tracking with budgets and goals
2. Business workspace management with multi-user collaboration
3. AI CFO Chat Assistant for financial queries
4. Multilingual OCR receipt/invoice scanning
5. Invoice generation and management
6. Inventory, payroll, fixed assets, and chart of accounts management
7. Cash flow forecasting and financial health scoring
8. Bank statement reconciliation

---

## 2. NAVIGATION STRUCTURE

### Root Navigation

```
App.tsx (Root)
├── Splash/Loading Screen (automatic)
├── WelcomeScreen (Landing Page — not authenticated)
├── LoginScreen (Auth — Login/Signup/Forgot Password)
└── AppNavigator (Main App — authenticated)
    ├── Global Header (Workspace Switcher + Settings + Notifications)
    ├── PERSONAL WORKSPACE MODE
    │   ├── Tab: Dashboard
    │   ├── Tab: Expenses
    │   ├── Tab: Cash Flow
    │   ├── Tab: AI Chat
    │   └── Tab: Document Centre (Upload / OCR)
    └── BUSINESS WORKSPACE MODE
        ├── Tab: Dashboard
        ├── Tab: Expenses
        ├── Tab: Invoicing & Bills
        ├── Tab: AI Chat
        └── Tab: More (ERP Tools)
            ├── Inventory
            ├── Fixed Assets
            ├── Chart of Accounts
            ├── Projects
            ├── Payroll
            ├── Approvals
            ├── Bank Reconciliation
            ├── Chat / Team Messaging
            ├── Notifications
            └── AI Forecast
```

### Modals (Full-Screen Slides In)
- **WorkspaceModal** — Workspace Switcher (bottom sheet)
- **SettingsModal** — Full-screen settings with nested sections

### Bottom Navigation Tabs

**Personal Mode (5 tabs):**

| Icon | Label |
|------|-------|
| Activity | Dashboard |
| PieChart | Expenses |
| ArrowUpDown | Cash Flow |
| Sparkles | AI Chat |
| Upload | Documents |

**Business Mode (5 tabs):**

| Icon | Label |
|------|-------|
| Activity | Dashboard |
| PieChart | Expenses |
| FileText | Invoicing |
| Sparkles | AI Chat |
| MoreHorizontal | More |

---

## 3. FEATURE LIST

### Personal Workspace Features
- Personal Dashboard (stats, health score, alerts, recent transactions)
- Expense tracking with categories, tags, attachments
- Income tracking
- Budget management with progress bars
- Cash flow visualization (bar charts, monthly trends)
- AI CFO Chat Assistant (Gemini/OpenAI powered)
- OCR Receipt Scanner (multilingual — EN, HI, TA, TE, ML, KN)
- Document Upload & Processing
- Financial health score (0–100)
- Cash runway calculation
- Smart alerts and financial warnings

### Business Workspace Features
- Multi-user Business Workspace with Join Code (XXXX-XXXX-XXXX format)
- Role-Based Access Control (Owner / Admin / Accountant / Viewer)
- Business Dashboard (revenue, expenses, net margin, runway)
- Invoice & Bill Management (create, send, status tracking)
- Inventory Management (products, stock levels, low-stock alerts)
- Fixed Assets Register
- Chart of Accounts (assets, liabilities, equity, revenue, expenses)
- Project Tracking
- Payroll Management
- Approvals Workflow
- Bank Statement Reconciliation
- Team Chat / Messaging
- Workspace Notifications
- AI Financial Forecast
- Activity Audit Log
- Member Management (invite, remove, change roles)

### AI Features
- AI CFO Chat (conversational financial advisor)
- AI Financial Forecast Screen
- AI Report Generation (AI Report Modal)
- Dynamic AI Theme Accent (changes accent color based on financial health)

### OCR Features
- Camera/Gallery receipt scanning
- Auto-extract: merchant name, total, tax, date, line items
- Multilingual support: English, Hindi, Tamil, Telugu, Malayalam, Kannada
- Auto-categorization of extracted transactions
- Bulk CSV/PDF bank statement upload

---

## 4. SCREEN-BY-SCREEN UI DESCRIPTION

### 4.1 Splash Screen
- **File:** `App.tsx` (inline rendering)
- **Layout:** Full-screen centered View
- **Background:** #06111f (deep dark)
- **Components:** Large transparent logo 120x120, title "HisabHero" 28px bold, subtitle in accent blue, ActivityIndicator

### 4.2 Welcome/Landing Screen
- **File:** `WelcomeScreen.tsx`
- **Layout:** Full-screen ScrollView, flex centered
- **Components:**
  - Animated entrance (opacity 0→1, scale 0.92→1, 450ms)
  - Transparent logo at 32% screen width
  - App title 34px 900-weight
  - Tagline badge pill with Sparkles icon
  - Value proposition card (3 bullet points with ShieldCheck icons)
  - Primary CTA: "Sign In" button (solid accent, 54px height)
  - Secondary CTA: "Create Account" button (outlined)

### 4.3 Login/Signup Screen
- **File:** `LoginScreen.tsx`
- **Modes:** Login / Signup / Forgot Password / Email Verification
- **Components:**
  - Transparent logo 96x96
  - Form card with: Email input, Password input (toggle eye), Full Name (signup), Account Type selector, Business fields
  - Primary submit button, Google Sign-In button, toggle links
  - Error display: red box with alert icon

### 4.4 Global App Header
- **File:** `AppNavigator.tsx`
- **Layout:** Horizontal row, paddingTop = statusBarHeight + 4
- **Left:** Logo 34x34 + Workspace Name 16px bold + ChevronDown
- **Right:** Briefcase icon + Settings icon + Bell icon (with red unread badge)

### 4.5 Dashboard Screen
- **File:** `DashboardScreen.tsx`
- **Components:**
  - Stats Grid: 2x2 card grid (Income, Expenses, Net Profit, Cash Runway)
  - Financial Health Score: Circular gauge 0–100
  - Budget Progress Bars: per category
  - Smart Alerts: Warning cards
  - Cash Flow Chart: Monthly bar chart
  - Recent Transactions: Flat list
  - Quick Actions: "+ Add Transaction"

### 4.6 Expenses Screen
- **File:** `ExpensesScreen.tsx`
- **Components:**
  - Category filter chips (horizontal scroll)
  - Date range picker
  - Expense cards with icon, merchant, category tag, amount, date
  - Pie chart for expense breakdown
  - FAB: "+ Add Expense"
  - Empty state: text only

### 4.7 Cash Flow Screen
- **File:** `CashFlowScreen.tsx`
- **Components:**
  - Monthly summary cards (Income / Expenses / Net)
  - Bar chart (6-month comparison)
  - Line chart (trend)
  - Transaction list grouped by month

### 4.8 AI Chat Screen
- **File:** `AiChatScreen.tsx`
- **Components:**
  - FlatList messages + fixed input bar
  - Bot messages: left-aligned bubble (card bg)
  - User messages: right-aligned bubble (accent color)
  - Typing indicator: ActivityIndicator in bubble
  - TextInput + Send button

### 4.9 Document Centre / Upload Screen
- **File:** `UploadScreen.tsx`
- **Components:**
  - Upload option cards: Camera / Gallery / CSV/PDF
  - Uploaded documents list
  - OCR result preview card
  - Transaction extraction confirmation form
  - Language selector

### 4.10 Invoices & Bills Screen
- **File:** `InvoicesBillsScreen.tsx`
- **Components:**
  - Tab: Invoices | Bills
  - Invoice cards: No. + Customer + Amount + Status badge
  - Create invoice form (full-screen bottom sheet)
  - Line item builder
  - Status filter chips

### 4.11 Inventory Screen
- **File:** `InventoryScreen.tsx`
- **Components:** Product cards, low stock alerts (red badge), category filters, Add/Edit modal

### 4.12 Fixed Assets Screen
- **File:** `FixedAssetsScreen.tsx`
- **Components:** Asset cards (name, date, value, depreciation), depreciation chart, Add form

### 4.13 Chart of Accounts Screen
- **File:** `ChartOfAccountsScreen.tsx`
- **Components:** Tree view (5 types: Assets, Liabilities, Equity, Revenue, Expenses), account cards with code/name/balance

### 4.14 Projects Screen
- **File:** `ProjectsScreen.tsx`
- **Components:** Project cards (name, client, budget, spent, % progress bar), status filter

### 4.15 Payroll Screen
- **File:** `PayrollScreen.tsx`
- **Components:** Employee cards (name, designation, salary), Run payroll button, Payslip generation

### 4.16 Notifications Screen
- **File:** `NotificationsScreen.tsx`
- **Components:** Notification cards (icon + message + time), Read/Unread state, Mark all read

### 4.17 Settings Modal
- **File:** `SettingsModal.tsx`
- **Sections:**
  1. Profile Card (avatar initial, name, email, role badges)
  2. Edit Profile
  3. Appearance (10 Theme grid + 8 Accent color grid)
  4. Language & Currency
  5. Security (Change Password)
  6. Workspace Management (Join Code XXXX-XXXX-XXXX, Members, Requests)
  7. Notification Preferences
  8. API Settings
  9. About & Support
  10. Sign Out

### 4.18 Workspace Modal
- **File:** `WorkspaceModal.tsx`
- **Components:** Personal workspace option, business workspace list with role badges, Create New button, Join with Code input

---

## 5. CURRENT THEME SYSTEM

### 10 Available Themes

| Theme | Style | Dark | Background | Card |
|---|---|---|---|---|
| Midnight Titanium (DEFAULT) | Flagship | Yes | #06111f | #0b1d38 |
| Obsidian Gold | CEO Luxury | Yes | #0a0a0a | #141414 |
| Sapphire Elite | Corporate ERP | Yes | #0d1b2a | #1b263b |
| Emerald Wealth | Wealth Growth | Yes | #061a12 | #0d2b20 |
| Pearl White | Apple Light | No | #f8fafc | #ffffff |
| Graphite Pro | Dev/Linear | Yes | #121212 | #1e1e1e |
| Royal Indigo | AI Next-Gen | Yes | #0f0c1b | #19142b |
| Space Glass | visionOS Glassmorphism | Yes | #050814 | #0f172a |
| Carbon Fiber | Automotive Luxury | Yes | #161618 | #222225 |
| Platinum Silver | Accountant Light | No | #f1f5f9 | #ffffff |

### 8 Accent Colors

| Name | Hex |
|---|---|
| Electric Blue (DEFAULT) | #4f8cff |
| Emerald Green | #10b981 |
| Cyan | #06b6d4 |
| Royal Purple | #8b5cf6 |
| Orange | #f97316 |
| Crimson Red | #ef4444 |
| Teal | #14b8a6 |
| Gold | #d4af37 |

### Semantic Tokens (all themes)

| Token | Purpose |
|---|---|
| bg | Screen background |
| card | Card/container background |
| cardBorder | Card border |
| primary/accent | Brand/action color (overridden by chosen accent) |
| success | #10b981 (always green) |
| warning | #f59e0b (always amber) |
| error | #ef4444 / #ff6b6b (always red) |
| text | Primary text |
| textSecondary | Secondary text |
| textMuted | Placeholder/muted |
| inputBg / inputBorder | Form inputs |
| tabBarBg / tabBarBorder | Bottom navigation |
| badgeBg | Pill backgrounds (accent + 15% alpha) |
| glowColor | Shadows/glow (accent + 25% alpha) |

### Typography (NO custom fonts loaded)

| Element | Size | Weight |
|---|---|---|
| App Title | 34px | 900 |
| Screen Header | 24px | 800 |
| Card Title | 16px | 700 |
| Body | 14px | 500 |
| Caption | 11–12px | 600 |
| Stat Value | 18–22px | 800 |
| Tab Label | 9px | 600 |

### Border Radius Values
- Cards: 16–24px
- Buttons: 14–16px
- Inputs: 12px
- Chips/Pills: 20px (fully rounded)
- Avatars: 50% (circle)
- Tab Bar: 0 (flat)

---

## 6. COMPONENT LIBRARY

### Shared Components (only one truly shared)
- **AppButton.tsx** — Primary/Secondary button variant

### Inline (not yet extracted to shared components)
- Stat cards, Transaction cards, Invoice cards, Employee cards — all duplicated per screen
- Form inputs — all duplicated per screen with same structure
- Charts — all custom-built with View rectangles (NO chart library)
- Status badges — inline pill views per component
- Tab bar — fully custom, not using React Navigation

---

## 7. ASSETS

| Asset | Path | Usage |
|---|---|---|
| App launcher icon | assets/icon.png | Play Store / App Store |
| Android adaptive | assets/adaptive-icon.png | Android launcher |
| In-app logo | assets/logo_transparent.png | Header, Splash, Login, Welcome |

**Icons:** lucide-react-native (line style, 18–22px)  
**Fonts:** NONE (system fonts only — San Francisco / Roboto)  
**Lottie:** NONE  
**Illustrations:** NONE  

---

## 8. BACKEND

- **Stack:** Node.js + Express + MongoDB Atlas
- **Auth:** JWT + Google OAuth (expo-auth-session)
- **AI:** Google Gemini API + OpenAI fallback
- **OCR:** Google Cloud Vision + Tesseract.js fallback
- **Join Code Format:** XXXX-XXXX-XXXX (alphanumeric, no ambiguous chars)
- **Workspace Isolation:** `X-Workspace-Id` header on every request
- **Hosted:** Render.com

---

## 9. KNOWN UI PROBLEMS

1. **Double Safe Area stacking** — Root SafeAreaView + header topInset both applied top inset (partially fixed)
2. **Tab bar bottom inset** — Hardcoded height:68 doesn't respect Android gesture navigation / iPhone Home Indicator
3. **No custom fonts** — App uses system fonts only, looks generic
4. **No chart library** — All charts are custom View-based, not animated, not responsive
5. **No skeleton loaders** — Only ActivityIndicator shown during data fetch
6. **Light themes partially broken** — Hardcoded dark color values leak through on Pearl White / Platinum Silver
7. **No glassmorphism** — Space Glass theme flag exists but no blur is applied
8. **Incomplete i18n** — Many strings hardcoded in English despite i18n system existing
9. **No micro-animations** — No spring, bounce, or stagger animations anywhere
10. **Welcome Screen** — Both buttons go to same LoginScreen (no separate signup route)
11. **Tablet layout** — No responsive column adaptation on iPad/Android tablets
12. **Icon TypeScript cast** — Every icon: `const XIcon = X as any;` pattern is fragile
13. **Text overflow** — Long names/descriptions can overflow cards without truncation

---

## 10. FRONTEND FOLDER STRUCTURE

```
mobile/
├── App.tsx                           Root: providers, auth routing, splash
├── app.json                          Expo config
├── eas.json                          EAS Build profiles
├── assets/
│   ├── icon.png                      Launcher icon (colored bg)
│   ├── adaptive-icon.png             Android adaptive icon
│   └── logo_transparent.png         In-app transparent logo
└── src/
    ├── components/
    │   ├── AppNavigator.tsx          Header + tabs + workspace routing
    │   ├── WelcomeScreen.tsx         Landing page (unauthenticated)
    │   ├── LoginScreen.tsx           Login / Signup / Forgot Password
    │   ├── DashboardScreen.tsx       KPI dashboard (largest file: 42KB)
    │   ├── ExpensesScreen.tsx        Expense tracker
    │   ├── CashFlowScreen.tsx        Cash flow charts
    │   ├── AiChatScreen.tsx          AI CFO assistant chat
    │   ├── AiForecastScreen.tsx      AI forecast
    │   ├── AiReportModal.tsx         AI report generation
    │   ├── UploadScreen.tsx          OCR + document upload
    │   ├── InvoicesBillsScreen.tsx   Invoice management (largest: 49KB)
    │   ├── InventoryScreen.tsx       Stock/inventory
    │   ├── FixedAssetsScreen.tsx     Fixed assets register
    │   ├── ChartOfAccountsScreen.tsx Chart of accounts
    │   ├── ProjectsScreen.tsx        Project tracking
    │   ├── PayrollScreen.tsx         Payroll
    │   ├── ApprovalsScreen.tsx       Approval workflows
    │   ├── BankReconciliationScreen.tsx Bank reconciliation
    │   ├── ChatScreen.tsx            Team messaging
    │   ├── NotificationsScreen.tsx   Notifications
    │   ├── SettingsModal.tsx         Full-screen settings (largest: 49KB)
    │   ├── WorkspaceModal.tsx        Workspace switcher bottom sheet
    │   ├── AddTransactionModal.tsx   Add income/expense
    │   └── AppButton.tsx             ONLY shared component
    ├── lib/
    │   ├── apiClient.ts              Authenticated fetch wrapper
    │   └── apiConfig.ts              Base URL management
    └── theme/
        ├── themeSystem.tsx           10 themes + 8 accents + ThemeProvider context
        ├── i18n.tsx                  Multi-language support (EN, HI, TA, TE, ML)
        └── index.ts                  Re-exports
```

---

## 11. REDESIGN RECOMMENDATIONS

When redesigning this application, the following improvements should be prioritized:

### Typography
- Load **Inter** or **Outfit** via `expo-google-fonts`
- Create a consistent type scale with named sizes

### Design Tokens
- Centralize all spacing into a scale: 4, 8, 12, 16, 20, 24, 32, 40, 48
- Remove ALL hardcoded color values from individual components
- Force all color usage through `theme.*` tokens

### Navigation
- Migrate to `@react-navigation/bottom-tabs` for proper native tab animation
- Add `@react-navigation/stack` for native back gestures and transitions

### Charts
- Replace custom View-based charts with `victory-native` or `react-native-gifted-charts`
- Add animated chart transitions on data load

### Loading States
- Add `react-native-skeleton-placeholder` shimmer loaders on every data screen
- Remove all plain ActivityIndicator-only loading states

### Animations
- Add `react-native-reanimated` for spring animations and gestures
- Stagger list item entrance animations
- Add card press scale animation (0.97 on press)
- Scroll-driven header collapse

### Component Library
- Extract all repeated card/button/input/badge patterns into a `components/ui/` design system
- Shared: `Card`, `Input`, `Button`, `Badge`, `Avatar`, `Divider`, `EmptyState`, `SkeletonCard`

### Safe Area
- Single root `SafeAreaProvider` with `initialWindowMetrics`
- Individual screens inherit insets via `useSafeAreaInsets()` — never hardcode values

### Light Theme Audit
- Audit every screen for hardcoded dark color values
- Replace with theme tokens

### Glassmorphism
- Implement `expo-blur` for the Space Glass theme `BlurView` backgrounds
- Apply to cards, modals, and header

---

*End of HisabHero UI/UX Design Specification v2.0*
*Generated by Antigravity AI | August 2026*
