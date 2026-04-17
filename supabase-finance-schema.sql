-- Agent Finance (Din) — Database Schema
-- Add to BB Meta Supabase project (hdydeudmbjiobnmrbmdl)

-- ============================================
-- COMPANIES
-- ============================================
CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('education', 'fnb', 'tech', 'services')),
  monthly_revenue_target NUMERIC(15,2),
  monthly_cost_budget NUMERIC(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BANK ACCOUNTS
-- ============================================
CREATE TABLE bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  bank_name TEXT NOT NULL,
  account_number TEXT,
  account_name TEXT,
  account_type TEXT CHECK (account_type IN ('current', 'savings', 'fixed_deposit')),
  balance NUMERIC(15,2) DEFAULT 0,
  balance_updated_at TIMESTAMPTZ,
  min_balance_alert NUMERIC(15,2) DEFAULT 50000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY CASH FLOW
-- ============================================
CREATE TABLE daily_cash_flow (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_balance NUMERIC(15,2),
  total_inflow NUMERIC(15,2) DEFAULT 0,
  total_outflow NUMERIC(15,2) DEFAULT 0,
  closing_balance NUMERIC(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, date)
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  bank_account_id UUID REFERENCES bank_accounts(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('inflow', 'outflow')),
  category TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  reference_number TEXT,
  vendor_name TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'completed',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICE / RECEIVABLES
-- ============================================
CREATE TABLE invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  amount NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  reminder_count INT DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYABLES (BILLS TO PAY)
-- ============================================
CREATE TABLE payables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  vendor_name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(15,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  category TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('critical', 'high', 'normal', 'low')) DEFAULT 'normal',
  approved_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOAN OBLIGATIONS (RHB etc)
-- ============================================
CREATE TABLE loan_obligations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  lender_name TEXT NOT NULL,
  loan_amount NUMERIC(15,2) NOT NULL,
  outstanding_amount NUMERIC(15,2) NOT NULL,
  monthly_payment NUMERIC(15,2) NOT NULL,
  interest_rate NUMERIC(5,2),
  payment_due_date INT NOT NULL, -- day of month
  next_payment_date DATE,
  remaining_months INT,
  status TEXT CHECK (status IN ('active', 'restructuring', 'paid_off', 'defaulted')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUDGET VS ACTUAL
-- ============================================
CREATE TABLE budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  category TEXT NOT NULL,
  month DATE NOT NULL, -- first day of month
  budgeted_amount NUMERIC(15,2) NOT NULL,
  actual_amount NUMERIC(15,2) DEFAULT 0,
  variance NUMERIC(15,2) GENERATED ALWAYS AS (budgeted_amount - actual_amount) STORED,
  variance_pct NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN budgeted_amount > 0 THEN ROUND((budgeted_amount - actual_amount) / budgeted_amount * 100, 2) ELSE 0 END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, category, month)
);

-- ============================================
-- FINANCIAL ALERTS
-- ============================================
CREATE TABLE financial_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  alert_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metric_value NUMERIC(15,2),
  threshold_value NUMERIC(15,2),
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY BRIEFING LOG
-- ============================================
CREATE TABLE daily_briefings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  briefing_content TEXT NOT NULL,
  total_cash_position NUMERIC(15,2),
  total_inflow NUMERIC(15,2),
  total_outflow NUMERIC(15,2),
  alert_count INT DEFAULT 0,
  sent_at TIMESTAMPTZ,
  sent_to TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- ============================================
-- FEE COLLECTION TRACKING (Brainy Bunch)
-- ============================================
CREATE TABLE fee_collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campus_id UUID REFERENCES campuses(id),
  student_id UUID REFERENCES students(id),
  fee_type TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  status TEXT CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue')) DEFAULT 'unpaid',
  reminder_count INT DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEED DATA — Companies
-- ============================================
INSERT INTO companies (name, code, type, monthly_revenue_target, monthly_cost_budget) VALUES
  ('Brainy Bunch Group', 'BB', 'education', 8750000, 6825000),
  ('Ahmad''s Fast Food', 'AFF', 'fnb', 500000, 425000),
  ('DE Coffee', 'DEC', 'fnb', 200000, 170000),
  ('DRE Coffee', 'DRE', 'fnb', 150000, 127500),
  ('Kaya Foodie', 'KF', 'services', 300000, 255000),
  ('AKR Poultry', 'AKR', 'services', 200000, 170000),
  ('Raudhah Tech', 'RT', 'tech', 150000, 127500),
  ('NOCAP', 'NC', 'tech', 100000, 85000);

-- Seed: RHB Loan
INSERT INTO loan_obligations (company_id, lender_name, loan_amount, outstanding_amount, monthly_payment, interest_rate, payment_due_date, next_payment_date, remaining_months, status)
VALUES (
  (SELECT id FROM companies WHERE code = 'BB'),
  'RHB Bank', 25000000, 18000000, 750000, 5.5, 15, '2026-05-15', 24, 'active'
);

-- Seed: Bank accounts
INSERT INTO bank_accounts (company_id, bank_name, account_number, account_name, account_type, balance, min_balance_alert)
VALUES
  ((SELECT id FROM companies WHERE code = 'BB'), 'RHB Bank', 'XXXX-001', 'BB Group Main', 'current', 2500000, 500000),
  ((SELECT id FROM companies WHERE code = 'AFF'), 'Maybank', 'XXXX-002', 'Ahmads Fast Food', 'current', 150000, 30000),
  ((SELECT id FROM companies WHERE code = 'DEC'), 'CIMB', 'XXXX-003', 'DE Coffee', 'current', 80000, 20000),
  ((SELECT id FROM companies WHERE code = 'RT'), 'Bank Islam', 'XXXX-004', 'Raudhah Tech', 'current', 120000, 25000);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_collections ENABLE ROW LEVEL SECURITY;

-- Super admin can see everything
CREATE POLICY "Super admin full access" ON companies FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);
CREATE POLICY "Super admin full access banks" ON bank_accounts FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);
CREATE POLICY "Super admin full access cashflow" ON daily_cash_flow FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);
CREATE POLICY "Super admin full access txns" ON transactions FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);
CREATE POLICY "Super admin full access invoices" ON invoices FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);
CREATE POLICY "Super admin full access payables" ON payables FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);
CREATE POLICY "Super admin full access loans" ON loan_obligations FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);
CREATE POLICY "Super admin full access budgets" ON budgets FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);
CREATE POLICY "Super admin full access alerts" ON financial_alerts FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);
CREATE POLICY "Super admin full access briefings" ON daily_briefings FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);
CREATE POLICY "Super admin full access fees" ON fee_collections FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);

-- Admin can see own company
CREATE POLICY "Admin view company" ON companies FOR SELECT USING (
  id IN (SELECT campus_id FROM campuses WHERE principal_id = auth.uid())
);
