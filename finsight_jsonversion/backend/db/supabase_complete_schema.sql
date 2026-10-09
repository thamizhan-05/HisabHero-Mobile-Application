-- ==============================================================================
-- HISABHERO COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Enterprise Unified Multi-Tenant Schema with Row Level Security (RLS)
-- Version: 5.5.0
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. USERS & PROFILES TABLE
-- Bridges Supabase Auth (auth.users) with application user profiles.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'User',
  password TEXT, -- PBKDF2 hash for native API sign-in compatibility
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'accountant', 'employee', 'viewer', 'user')),
  account_type TEXT NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal', 'business')),
  is_verified BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT true,
  auth_providers JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_workspace_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ==============================================================================
-- 3. WORKSPACES TABLE
-- Handles both Personal finance vaults and Business SME workspaces.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'business')),
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  business_name TEXT,
  industry TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  join_code TEXT UNIQUE,
  cash_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  settings JSONB NOT NULL DEFAULT '{
    "currency": "INR",
    "currencySymbol": "₹",
    "allowNegativeBalance": true,
    "taxEnabled": true,
    "startingBalance": 0
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_join_code ON public.workspaces(join_code);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON public.workspaces(type);

-- Add active_workspace_id foreign key to users table now that workspaces exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_active_workspace'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT fk_users_active_workspace 
    FOREIGN KEY (active_workspace_id) REFERENCES public.workspaces(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ==============================================================================
-- 4. WORKSPACE MEMBERS TABLE
-- Enforces multi-user business collaboration, RBAC, and access governance.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'accountant', 'employee', 'viewer', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);

-- ==============================================================================
-- 5. TRANSACTIONS TABLE
-- Core financial ledger with categories, tax details, and audit hashes.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'INCOME', 'EXPENSE')),
  category TEXT NOT NULL DEFAULT 'General',
  amount NUMERIC(15, 2) NOT NULL,
  description TEXT NOT NULL,
  merchant TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  source TEXT NOT NULL DEFAULT 'Manual',
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  merkle_hash TEXT,
  previous_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_ws ON public.transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ws_date ON public.transactions(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(workspace_id, category);

-- ==============================================================================
-- 6. INVOICES & GST COMPLIANCE TABLE
-- Professional GST tax invoices, line items, and tracking.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_gstin TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  cgst NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  sgst NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  igst NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_tax NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('draft', 'unpaid', 'paid', 'sent', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_ws ON public.invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(workspace_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(workspace_id, status);

-- ==============================================================================
-- 7. KHATA LEDGERS (CUSTOMER & VENDOR UDHAAR)
-- Digital Ledger for credit tracking, reminders, and transaction histories.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.khata_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  party_name TEXT NOT NULL,
  party_type TEXT NOT NULL DEFAULT 'customer' CHECK (party_type IN ('customer', 'supplier', 'vendor')),
  phone TEXT,
  email TEXT,
  current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'INR',
  entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  last_reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_khata_ws ON public.khata_ledgers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_khata_party ON public.khata_ledgers(workspace_id, party_name);

-- ==============================================================================
-- 8. INVENTORY & FIXED ASSETS TABLE
-- Stock inventory, reorder thresholds, and fixed asset depreciation engine.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'stock' CHECK (type IN ('stock', 'asset')),
  sku TEXT,
  category TEXT,
  stock_quantity NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  unit_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  reorder_level NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  useful_life NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_ws ON public.inventory_items(workspace_id);

-- ==============================================================================
-- 9. RECURRING SUBSCRIPTIONS & BILLS
-- Manages recurring expenses, billing cycles, and reminders.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  category TEXT NOT NULL DEFAULT 'Software',
  next_billing_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'Card',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_ws ON public.subscriptions(workspace_id);

-- ==============================================================================
-- 10. UPLOADED DOCUMENTS & INTELLIGENCE RECORDS
-- Document parser audit logs, OCR summaries, and storage metadata.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.uploaded_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT,
  parser_used TEXT NOT NULL DEFAULT 'Universal Parser',
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  extracted_transactions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_ws ON public.uploaded_documents(workspace_id);

-- ==============================================================================
-- 11. STAFF & PAGAR KHATA (PAYROLL & ATTENDANCE)
-- Employee records, attendance calculations, advances, and payroll.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff',
  monthly_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  base_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  daily_wage NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  attendance JSONB NOT NULL DEFAULT '{"present": 0, "absent": 0, "halfDay": 0, "overtimeDays": 0}'::jsonb,
  advances_drawn NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  net_payable NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  advances JSONB NOT NULL DEFAULT '[]'::jsonb,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_ws ON public.staff(workspace_id);

-- ==============================================================================
-- 12. DEVICE SESSIONS (2-DEVICE CONCURRENT GOVERNANCE)
-- Enforces device binding, session verification, and remote revocation.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON public.device_sessions(user_id);

-- ==============================================================================
-- 13. OTP VERIFICATIONS TABLE
-- Stores SHA-256 hashed 6-digit email and phone verification codes.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'signup',
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON public.otp_verifications(email, purpose);

-- ==============================================================================
-- 14. MERCHANT MAPPINGS TABLE (AUTO-CATEGORIZATION RULES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.merchant_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  raw_pattern TEXT NOT NULL,
  clean_merchant TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, raw_pattern)
);

CREATE INDEX IF NOT EXISTS idx_merchant_mappings_ws ON public.merchant_mappings(workspace_id);

-- ==============================================================================
-- 15. AUDIT LOGS TABLE
-- Tracks immutable security, workspace, and financial audit events.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ws ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);

-- ==============================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation: Users only access data belonging to their workspaces.
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.khata_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access (Bypasses RLS for secure server operations)
-- Supabase automatically grants service_role bypass; explicit policies for authenticated users below:

-- Helper Security Function: Check if user has access to a workspace
CREATE OR REPLACE FUNCTION public.user_has_workspace_access(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = ws_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_id AND user_id = auth.uid() AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users Table Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Workspaces Table Policies
DROP POLICY IF EXISTS "Users can view accessible workspaces" ON public.workspaces;
CREATE POLICY "Users can view accessible workspaces" ON public.workspaces
  FOR SELECT USING (
    owner_id = auth.uid() 
    OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "Users can insert workspaces" ON public.workspaces;
CREATE POLICY "Users can insert workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update workspaces" ON public.workspaces;
CREATE POLICY "Owners can update workspaces" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Workspace Members Table Policies
DROP POLICY IF EXISTS "Members can view workspace membership" ON public.workspace_members;
CREATE POLICY "Members can view workspace membership" ON public.workspace_members
  FOR SELECT USING (public.user_has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Owners can manage workspace members" ON public.workspace_members;
CREATE POLICY "Owners can manage workspace members" ON public.workspace_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- Transactions Table Policies
DROP POLICY IF EXISTS "Users can view workspace transactions" ON public.transactions;
CREATE POLICY "Users can view workspace transactions" ON public.transactions
  FOR SELECT USING (public.user_has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can insert workspace transactions" ON public.transactions;
CREATE POLICY "Users can insert workspace transactions" ON public.transactions
  FOR INSERT WITH CHECK (public.user_has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can update workspace transactions" ON public.transactions;
CREATE POLICY "Users can update workspace transactions" ON public.transactions
  FOR UPDATE USING (public.user_has_workspace_access(workspace_id));

DROP POLICY IF EXISTS "Users can delete workspace transactions" ON public.transactions;
CREATE POLICY "Users can delete workspace transactions" ON public.transactions
  FOR DELETE USING (public.user_has_workspace_access(workspace_id));

-- Invoices Table Policies
DROP POLICY IF EXISTS "Workspace access for invoices" ON public.invoices;
CREATE POLICY "Workspace access for invoices" ON public.invoices
  FOR ALL USING (public.user_has_workspace_access(workspace_id));

-- Khata Ledgers Table Policies
DROP POLICY IF EXISTS "Workspace access for khata" ON public.khata_ledgers;
CREATE POLICY "Workspace access for khata" ON public.khata_ledgers
  FOR ALL USING (public.user_has_workspace_access(workspace_id));

-- Inventory Table Policies
DROP POLICY IF EXISTS "Workspace access for inventory" ON public.inventory_items;
CREATE POLICY "Workspace access for inventory" ON public.inventory_items
  FOR ALL USING (public.user_has_workspace_access(workspace_id));

-- Subscriptions Table Policies
DROP POLICY IF EXISTS "Workspace access for subscriptions" ON public.subscriptions;
CREATE POLICY "Workspace access for subscriptions" ON public.subscriptions
  FOR ALL USING (public.user_has_workspace_access(workspace_id));

-- Documents Table Policies
DROP POLICY IF EXISTS "Workspace access for documents" ON public.uploaded_documents;
CREATE POLICY "Workspace access for documents" ON public.uploaded_documents
  FOR ALL USING (public.user_has_workspace_access(workspace_id));

-- Staff Table Policies
DROP POLICY IF EXISTS "Workspace access for staff" ON public.staff;
CREATE POLICY "Workspace access for staff" ON public.staff
  FOR ALL USING (public.user_has_workspace_access(workspace_id));

-- Device Sessions Policies
DROP POLICY IF EXISTS "Users manage own device sessions" ON public.device_sessions;
CREATE POLICY "Users manage own device sessions" ON public.device_sessions
  FOR ALL USING (user_id = auth.uid());

-- Merchant Mappings Policies
DROP POLICY IF EXISTS "Workspace access for merchant mappings" ON public.merchant_mappings;
CREATE POLICY "Workspace access for merchant mappings" ON public.merchant_mappings
  FOR ALL USING (public.user_has_workspace_access(workspace_id));

-- ==============================================================================
-- 17. AUTOMATIC TIMESTAMP TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['users', 'workspaces', 'workspace_members', 'transactions', 'invoices', 'khata_ledgers', 'inventory_items', 'subscriptions', 'staff'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_updated_at_%1$I ON public.%1$I;
      CREATE TRIGGER trigger_updated_at_%1$I
      BEFORE UPDATE ON public.%1$I
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ', tbl);
  END LOOP;
END $$;

-- ==============================================================================
-- 18. SUPABASE STORAGE BUCKET INITIALIZATION
-- Bucket for private receipt and financial document storage.
-- Objects are organized by workspace: receipts_documents/{workspace_id}/{filename}
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts_documents', 'receipts_documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can read workspace receipts" ON storage.objects;
CREATE POLICY "Users can read workspace receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts_documents'
    AND auth.role() = 'authenticated'
    AND public.user_has_workspace_access((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Users can upload workspace receipts" ON storage.objects;
CREATE POLICY "Users can upload workspace receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts_documents'
    AND auth.role() = 'authenticated'
    AND public.user_has_workspace_access((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "Users can delete workspace receipts" ON storage.objects;
CREATE POLICY "Users can delete workspace receipts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipts_documents'
    AND auth.role() = 'authenticated'
    AND public.user_has_workspace_access((storage.foldername(name))[1]::uuid)
  );

-- ==============================================================================
-- 19. AUTH TRIGGER: SYNC SUPABASE AUTH TO PUBLIC USERS
-- Automatically inserts a record into public.users when a user signs up via Supabase Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_verified, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
