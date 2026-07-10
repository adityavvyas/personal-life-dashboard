-- Supabase schema for Personal Life Dashboard

-- 1. accounts
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank_name text NOT NULL,
  account_type text CHECK (account_type IN ('savings', 'current', 'wallet')),
  balance numeric DEFAULT 0,
  interest_rate numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE accounts IS 'Bank account tracking';

-- 2. categories
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  color text,
  budget_limit numeric DEFAULT 0,
  type text CHECK (type IN ('income', 'expense')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE categories IS 'Expense/income categories with budgets';

-- Seed default categories
INSERT INTO categories (name, icon, color, type) VALUES
('Food & Dining', '🍽️', '#ff6b6b', 'expense'),
('Groceries', '🛒', '#feca57', 'expense'),
('Transport', '🚗', '#48dbfb', 'expense'),
('Fuel', '⛽', '#ff9f43', 'expense'),
('Shopping', '🛍️', '#ff9ff3', 'expense'),
('Entertainment', '🎬', '#5f27cd', 'expense'),
('Utilities', '💡', '#0abde3', 'expense'),
('Rent', '🏠', '#1dd1a1', 'expense'),
('Healthcare', '⚕️', '#ee5253', 'expense'),
('Education', '📚', '#2e86de', 'expense'),
('Subscriptions', '🔁', '#10ac84', 'expense'),
('Personal Care', '💅', '#ff7f50', 'expense'),
('Gifts', '🎁', '#f368e0', 'expense'),
('Other', '🏷️', '#c8d6e5', 'expense'),
('Salary', '💰', '#1dd1a1', 'income'),
('Freelance', '💻', '#48dbfb', 'income'),
('Investments', '📈', '#feca57', 'income'),
('Refunds', '💸', '#ff9f43', 'income');

-- 3. transactions
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL,
  type text CHECK (type IN ('income', 'expense')),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
COMMENT ON TABLE transactions IS 'All financial transactions';

-- 4. goals
CREATE TABLE goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  deadline date,
  priority text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE goals IS 'Financial savings goals';

-- 5. bills
CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
COMMENT ON TABLE bills IS 'Bills + subscription tracking';

-- 6. routines
CREATE TABLE routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type IN ('gym', 'study', 'meditation', 'health', 'custom')) DEFAULT 'custom',
  target_frequency text CHECK (target_frequency IN ('daily', 'weekly')) DEFAULT 'daily',
  color text DEFAULT '#00d4aa',
  icon text DEFAULT '✅',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE routines IS 'Habit definitions';

-- 7. routine_logs
CREATE TABLE routine_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(routine_id, date)
);
CREATE INDEX idx_routine_logs_routine_date ON routine_logs(routine_id, date);
COMMENT ON TABLE routine_logs IS 'Daily habit completions';

-- 8. todos
CREATE TABLE todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  priority text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  due_date date,
  completed boolean DEFAULT false,
  date_created date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE todos IS 'To-do list items';

-- 9. market_cache
CREATE TABLE market_cache (
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
CREATE INDEX idx_market_cache_type_date ON market_cache(type, date);
COMMENT ON TABLE market_cache IS 'Cached live data (reduce API calls)';

-- 10. settings
CREATE TABLE settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE settings IS 'User preferences (PIN hash, city, theme, enrolled stocks)';

-- Seed default settings
INSERT INTO settings (key, value) VALUES
('pin_hash', ''),
('theme', 'dark'),
('city', 'jaipur'),
('currency_pairs', '["USD/INR","EUR/INR","GBP/INR"]'),
('stocks', '["NIFTY 50","SENSEX"]');

-- RLS (Row Level Security) - allow all operations since it's a single user app
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for goals" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for bills" ON bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for routines" ON routines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for routine_logs" ON routine_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for todos" ON todos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for market_cache" ON market_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for settings" ON settings FOR ALL USING (true) WITH CHECK (true);
