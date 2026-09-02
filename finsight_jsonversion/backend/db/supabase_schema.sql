-- ==============================================================================
-- HISABHERO ENTERPRISE ERP & FINANCIAL PLATFORM
-- Unified Supabase PostgreSQL Production DDL Schema
-- ==============================================================================

-- Enable UUID & Crypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. USERS TABLE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'user',
    account_type TEXT DEFAULT 'personal',
    is_verified BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT true,
    auth_providers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── 2. WORKSPACES TABLE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'personal', -- 'personal' or 'business'
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT,
    industry TEXT,
    currency TEXT DEFAULT 'INR',
    join_code TEXT UNIQUE,
    cash_balance NUMERIC(15, 2) DEFAULT 0,
    settings JSONB DEFAULT '{"allowNegativeBalance": true, "taxEnabled": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_join_code ON workspaces(join_code);

-- ─── 3. WORKSPACE MEMBERS (RBAC) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'employee', -- 'owner', 'admin', 'manager', 'accountant', 'employee'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON workspace_members(workspace_id);

-- ─── 4. CHART OF ACCOUNTS (General Ledger) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
    sub_category TEXT,
    balance NUMERIC(15, 2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, code)
);
CREATE INDEX IF NOT EXISTS idx_accounts_ws ON accounts(workspace_id);

-- ─── 5. DOUBLE-ENTRY JOURNAL ENTRIES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entry_number TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    reference TEXT,
    status TEXT DEFAULT 'posted', -- 'draft', 'posted', 'void'
    lines JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ account_id, account_code, account_name, debit, credit, description }]
    total_debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_journal_balanced CHECK (total_debit = total_credit)
);
CREATE INDEX IF NOT EXISTS idx_journal_ws ON journal_entries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);

-- ─── 6. TRANSACTIONS TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'income', 'expense', 'transfer'
    category TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    merchant TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'Cash',
    source TEXT DEFAULT 'Manual',
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT true,
    merkle_hash TEXT,
    previous_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_ws_date ON transactions(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_cat ON transactions(category);

-- ─── 7. INVOICES & BILLS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_gstin TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '30 days',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cgst NUMERIC(15, 2) DEFAULT 0,
    sgst NUMERIC(15, 2) DEFAULT 0,
    igst NUMERIC(15, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_ws ON invoices(workspace_id);

CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    bill_number TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    vendor_gstin TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '30 days',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bills_ws ON bills(workspace_id);

-- ─── 8. KHATA & DEBTOR AGING ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS khata_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    party_name TEXT NOT NULL,
    party_type TEXT DEFAULT 'customer', -- 'customer', 'vendor'
    phone TEXT,
    current_balance NUMERIC(15, 2) DEFAULT 0,
    credit_limit NUMERIC(15, 2) DEFAULT 0,
    entries JSONB DEFAULT '[]'::jsonb,
    last_reminded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_khata_ws ON khata_ledgers(workspace_id);

-- ─── 9. UPLOADED DOCUMENTS & STATEMENT OCR ───────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    parser_used TEXT,
    status TEXT DEFAULT 'processed',
    summary JSONB DEFAULT '{}'::jsonb,
    raw_ocr_payload JSONB DEFAULT '{}'::jsonb,
    extracted_transactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_uploaded_docs_ws ON uploaded_documents(workspace_id);

-- ─── 10. FIXED ASSETS, PAYROLL, PROJECTS, SUBSCRIPTIONS, SESSIONS ────────────
CREATE TABLE IF NOT EXISTS fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    category TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_price NUMERIC(15, 2) NOT NULL,
    current_value NUMERIC(15, 2) NOT NULL,
    depreciation_rate NUMERIC(5, 2) DEFAULT 15,
    depreciation_method TEXT DEFAULT 'straight_line',
    accumulated_depreciation NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    designation TEXT,
    department TEXT,
    month TEXT NOT NULL,
    base_salary NUMERIC(15, 2) NOT NULL,
    allowances NUMERIC(15, 2) DEFAULT 0,
    deductions NUMERIC(15, 2) DEFAULT 0,
    net_salary NUMERIC(15, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'processed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    client_name TEXT,
    budget NUMERIC(15, 2) DEFAULT 0,
    spent NUMERIC(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'on_hold'
    start_date DATE,
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recurring_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    category TEXT DEFAULT 'SaaS & Software',
    amount NUMERIC(15, 2) NOT NULL,
    frequency TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
    next_billing_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT DEFAULT 'Mobile Device',
    platform TEXT DEFAULT 'Android',
    ip_address TEXT DEFAULT '127.0.0.1',
    user_agent TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'pending', 'revoked'
    is_primary BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON device_sessions(user_id);

CREATE TABLE IF NOT EXISTS business_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'tax_filing', -- 'tax_filing', 'payroll', 'compliance', 'meeting'
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed'
    priority TEXT DEFAULT 'high',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hero_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
