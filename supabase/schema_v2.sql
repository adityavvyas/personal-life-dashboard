-- ==============================================================================
-- PERSONAL LIFE DASHBOARD - MASTER SCHEMA V2 (MULTI-USER & RLS ENABLED)
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor.

-- 1. user_profiles
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username text UNIQUE,
  name text,
  pin_hash text,
  failed_attempts integer DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
COMMENT ON TABLE public.user_profiles IS 'Extended user profiles and PIN auth state';

-- Create the has_pin_setup RPC function for the frontend
CREATE OR REPLACE FUNCTION has_pin_setup(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = user_uuid AND pin_hash IS NOT NULL AND pin_hash != ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. accounts
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  bank_name text NOT NULL,
  account_type text CHECK (account_type IN ('savings', 'current', 'wallet')),
  balance numeric DEFAULT 0,
  interest_rate numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  icon text,
  color text,
  budget_limit numeric DEFAULT 0,
  type text CHECK (type IN ('income', 'expense')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  amount numeric NOT NULL,
  type text CHECK (type IN ('income', 'expense')),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);

-- 5. goals
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  deadline date,
  priority text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. bills
CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  frequency text CHECK (frequency IN ('monthly', 'yearly', 'one-time', 'weekly')),
  is_paid boolean DEFAULT false,
  is_subscription boolean DEFAULT false,
  category text,
  next_due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. routines
CREATE TABLE public.routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  type text CHECK (type IN ('gym', 'study', 'meditation', 'health', 'custom')) DEFAULT 'custom',
  target_frequency text CHECK (target_frequency IN ('daily', 'weekly')) DEFAULT 'daily',
  color text DEFAULT '#00d4aa',
  icon text DEFAULT '✅',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. routine_logs
CREATE TABLE public.routine_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  routine_id uuid REFERENCES public.routines(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(routine_id, date)
);

-- 9. todos
CREATE TABLE public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  title text NOT NULL,
  priority text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  due_date date,
  completed boolean DEFAULT false,
  date_created date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. market_cache
CREATE TABLE public.market_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text CHECK (type IN ('stock', 'fuel', 'currency')) NOT NULL,
  symbol text NOT NULL,
  price numeric,
  change_percent numeric,
  date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(type, symbol, date)
);

-- 11. settings
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);


-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_cache ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- CREATE POLICIES (Users can only see and edit their own rows)
-- ==============================================================================
CREATE POLICY "Users can manage their own profiles" ON public.user_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bills" ON public.bills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own routines" ON public.routines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own routine_logs" ON public.routine_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own todos" ON public.todos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow public read of market_cache" ON public.market_cache FOR SELECT USING (true);
CREATE POLICY "Users can manage their own settings" ON public.settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Optional: Create some default categories for new users automatically
-- (Normally this is done via edge function or triggers, but users can add their own)
