-- ==============================================================================
-- PERSONAL LIFE DASHBOARD — SCHEMA MIGRATION V3
-- ==============================================================================
-- Run this script in your Supabase SQL Editor AFTER schema_v2.sql is in place.
-- It is safe to run multiple times (all statements are idempotent).
-- ==============================================================================

-- ─── 1. DROP transactions.type (derive from joined category instead) ────────
-- Pre-check: ensure no contradiction exists before dropping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.transactions DROP COLUMN type;
    RAISE NOTICE 'Dropped transactions.type column';
  ELSE
    RAISE NOTICE 'transactions.type already dropped — skipping';
  END IF;
END $$;


-- ─── 2. CONVERT bills.category (text) → bills.category_id (FK) ─────────────
-- Step 2a: Add the new FK column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.bills ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added bills.category_id column';
  ELSE
    RAISE NOTICE 'bills.category_id already exists — skipping';
  END IF;
END $$;

-- Step 2b: Migrate existing text values to FK (best-effort match)
UPDATE public.bills b
SET category_id = (
  SELECT c.id FROM public.categories c
  WHERE LOWER(c.name) = LOWER(b.category) AND c.user_id = b.user_id
  LIMIT 1
)
WHERE b.category IS NOT NULL 
  AND b.category != ''
  AND b.category_id IS NULL;

-- Step 2c: Drop the old text column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'category'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.bills DROP COLUMN category;
    RAISE NOTICE 'Dropped bills.category text column';
  ELSE
    RAISE NOTICE 'bills.category text column already dropped — skipping';
  END IF;
END $$;


-- ─── 3. ADD created_at / updated_at WHERE MISSING ──────────────────────────
-- accounts: has last_updated but not created_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='accounts' AND column_name='created_at') THEN
    ALTER TABLE public.accounts ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- All tables should already have them from v2, but just in case:
DO $$
DECLARE
  tbl text;
  col text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'user_profiles','accounts','categories','transactions','goals',
    'bills','routines','routine_logs','todos','market_cache','settings'
  ])
  LOOP
    FOR col IN SELECT unnest(ARRAY['created_at','updated_at'])
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name=tbl AND column_name=col
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I timestamptz DEFAULT now()', tbl, col);
        RAISE NOTICE 'Added %.% column', tbl, col;
      END IF;
    END LOOP;
  END LOOP;
END $$;


-- ─── 4. CREATE vehicles TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  name text NOT NULL,
  fuel_type text CHECK (fuel_type IN ('petrol', 'diesel', 'cng', 'ev')) NOT NULL,
  default_efficiency numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Users manage own vehicles'
  ) THEN
    CREATE POLICY "Users manage own vehicles" ON public.vehicles
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ─── 5. CREATE fuel_logs TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  odometer_reading numeric,
  quantity numeric NOT NULL,
  price_per_unit numeric NOT NULL,
  is_full_tank boolean DEFAULT true,
  city text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fuel_logs' AND policyname = 'Users manage own fuel_logs'
  ) THEN
    CREATE POLICY "Users manage own fuel_logs" ON public.fuel_logs
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Index for efficient mileage queries (consecutive fills per vehicle)
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_date ON public.fuel_logs(vehicle_id, date);


-- ─── 6. VERIFY ──────────────────────────────────────────────────────────────
-- Quick sanity check: list all tables and their column counts
SELECT table_name, count(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
