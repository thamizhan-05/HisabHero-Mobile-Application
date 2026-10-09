# HISABHERO — ARCHITECTURE & DEVELOPER GUIDE

## 1. Overview
**HisabHero** is a multi-platform financial management system designed for Indian Micro, Small, and Medium Enterprises (MSMEs) and personal accounting. It features a React Native / Expo mobile application, a responsive single-page web application, and a modular Node.js/Express backend connected to Supabase PostgreSQL with local resilient fallback.

---

## 2. Architecture Principles
The backend uses a **Modular Monolith** architecture:
- **Clean Separation of Concerns:**
  - `routes/`: Endpoint mapping, HTTP verb bindings, and route grouping.
  - `controllers/`: HTTP request extraction, validation, and JSON response formatting.
  - `services/`: Core business logic, mathematical domain calculations, and workflows.
  - `middleware/`: JWT authentication, multi-tenant workspace verification, rate limiting, and centralized error handling.
  - `utils/`: Currency arithmetic (minor-unit precision), schema validation, and sanitized logging.
  - `db/`: Data access repositories with automated resilient failover.

```
finsight_jsonversion/backend/
├── app.js                 # Express application configuration & middleware
├── server.js              # Lean server bootstrap & lifecycle listener (<40 lines)
├── config/
│   ├── env.js             # Validated environment configuration
│   └── constants.js       # Enumerations, roles, categories, error codes
├── middleware/
│   ├── auth.js            # JWT bearer token verification
│   ├── workspaceAuth.js   # Multi-tenant workspace authorization
│   ├── rateLimiter.js     # Sliding-window in-memory rate limiter
│   └── errorHandler.js    # Standardized JSON error response handler
├── utils/
│   ├── currency.js        # Decimal precision, minor units, safe rounding
│   ├── validation.js      # Zero-dependency schema validation
│   └── logger.js          # Sanitized logging without leaking credentials
├── modules/
│   ├── auth/              # Registration, OTP, login, profile, purge
│   ├── workspaces/        # Personal & business workspaces, join codes, members
│   ├── transactions/      # Ingestion, categorization, filtering, pagination
│   ├── dashboard/         # Health score, safe daily spend, dual runway
│   ├── documents/         # Document uploads, local regex OCR, Gemini fallback
│   ├── business/          # Invoices, khata, inventory, subscriptions, radar
│   └── ai/                # Hero Bot Q&A, multilingual voice copilot
├── routes/
│   └── index.js           # Central route aggregator mounting modules on /api
├── services/              # Domain calculation engines
│   ├── calculator.js      # Financial health score, runway, safe spend, MoM variance
│   ├── documentIntelligenceService.js
│   ├── pdfParsers.js      # 37 native Indian bank statement parsers (<20ms)
│   └── ...
└── tests/                 # Automated regression tests (Node 20+ test runner)
    ├── api.test.js        # HTTP route integration tests
    ├── auth.test.js       # PBKDF2 cryptography & JWT tests
    ├── calculator.test.js # Financial formulas & edge cases
    ├── currency.test.js   # Monetary precision & minor units
    └── validation.test.js # Input sanitization tests
```

---

## 3. How a Request Flows Through the System
1. **Client Request:** Mobile client (`apiClient.ts`) or Web SPA (`index.html`) sends an HTTP request (e.g. `POST /api/transactions`).
2. **Normalizer & Static:** Express serves static assets or normalizes legacy non-`/api/` URLs.
3. **CORS & Body Parsing:** CORS headers are applied; JSON payloads (up to 50MB) are parsed.
4. **Authentication (`authMiddleware`):** Extracts `Bearer <token>`, decodes JWT with `JWT_SECRET`, and attaches `req.userId`.
5. **Tenant Isolation (`requireWorkspaceAccess`):** Checks `x-workspace-id` header against the user's authorized workspaces via `workspacesRepo`. Unauthorized access is rejected with `403 Forbidden`.
6. **Controller:** Extracts inputs, calls `validate(req.body, schema)`, and passes sanitized arguments to the service.
7. **Service:** Executes business logic (e.g., `safeRound(amount)` to prevent floating point drift).
8. **Data Access Layer:** Performs the query on Supabase PostgreSQL (or local JSON fallback if unreachable).
9. **Response:** Controller formats response: `{ success: true, transaction: {...} }`.
10. **Error Handler:** Any uncaught exceptions are caught by `errorHandler`, logged via `logger.error`, and returned as a standardized JSON response without stack traces in production.

---

## 4. How to Add a New Feature
1. **Define the Feature Module:**
   - Create `backend/modules/<feature_name>/`:
     - `<feature_name>.service.js`: Domain logic and database queries.
     - `<feature_name>.controller.js`: Request parsing, validation, and JSON responses.
     - `<feature_name>.routes.js`: Express router with appropriate middleware.
2. **Mount the Route:**
   - In `backend/routes/index.js`, import `<feature_name>Routes` and mount it:
     ```javascript
     import myFeatureRoutes from '../modules/myFeature/myFeature.routes.js';
     router.use('/my-feature', myFeatureRoutes);
     ```
3. **Write Automated Tests:**
   - Add a test file in `backend/tests/<feature_name>.test.js`.
   - Run `npm test` to verify.

---

## 5. How to Run and Test Locally

### Backend:
```bash
cd finsight_jsonversion
npm install
npm test          # Runs all 23 automated unit and integration tests
npm start         # Starts backend on http://localhost:5000
```

### Mobile Application:
```bash
cd mobile
npm install
npm run typecheck # Verifies TypeScript across all 44 components
npm start         # Starts Expo dev server
```

---

## 6. Financial Integrity Rules
- **Zero-Floor Rule:** If a workspace's net cash balance drops below ₹0, the Financial Health Score immediately drops to 0 (`CRITICAL_DEFICIT`).
- **Minor-Unit Arithmetic:** All monetary additions and subtractions must use `addMoney` / `subtractMoney` in `utils/currency.js` to eliminate IEEE-754 floating-point inaccuracies.
- **Tenant Scope:** Every financial query must filter by `workspace_id`. Never execute an unbounded database scan.
