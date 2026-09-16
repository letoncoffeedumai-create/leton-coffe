-- ==============================================================================
-- LETON COFFEE DUMAI - SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Jalankan skrip ini di SQL Editor di Supabase Dashboard Anda.
-- Skrip ini menyiapkan tabel profiles, orders, RLS policies, dan trigger sinkronisasi auth.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'OUTLET_ADMIN', 'CUSTOMER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('SUPER_ADMIN', 'OUTLET_ADMIN', 'CUSTOMER')),
  outlet_id TEXT, -- 'sudirman', 'kelakap', or 'letgo'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. OUTLETS TABLE
CREATE TABLE IF NOT EXISTS public.outlets (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  chapter_label TEXT,
  subtitle TEXT,
  address TEXT NOT NULL,
  description TEXT,
  opening_hours TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 1
);

-- 6. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  badge TEXT,
  outlet_ids TEXT[] DEFAULT '{outlet-sudirman,outlet-ratusima,outlet-letgo}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  outlet_id TEXT NOT NULL,
  outlet_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('DINE IN', 'TAKE AWAY')),
  table_number TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  pb1_tax NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('QRIS', 'TUNAI')),
  payment_status TEXT NOT NULL DEFAULT 'WAITING PAYMENT',
  order_status TEXT NOT NULL DEFAULT 'NEW' CHECK (order_status IN ('NEW', 'ACCEPTED', 'IN_PROGRESS', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
  customer_note TEXT,
  rejection_reason TEXT,
  payment_proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. ORDER ITEMS (Optional normalized relation)
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  options_summary TEXT,
  options_detail JSONB DEFAULT '{}'::jsonb
);

-- 9. WEBSITE CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.website_content (
  section_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. BARISTAS TABLE
CREATE TABLE IF NOT EXISTS public.baristas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  outlet TEXT NOT NULL,
  quote TEXT,
  favorite_drink TEXT,
  image_url TEXT,
  is_on_duty BOOLEAN NOT NULL DEFAULT true
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get current user's outlet_id
CREATE OR REPLACE FUNCTION public.current_user_outlet_id()
RETURNS TEXT AS $$
  SELECT outlet_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles: User can read own or super admin reads all" ON public.profiles;
CREATE POLICY "Profiles: User can read own or super admin reads all" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() 
    OR public.current_user_role() = 'SUPER_ADMIN'
  );

DROP POLICY IF EXISTS "Profiles: Super Admin can insert/update all" ON public.profiles;
CREATE POLICY "Profiles: Super Admin can insert/update all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'SUPER_ADMIN')
  WITH CHECK (public.current_user_role() = 'SUPER_ADMIN');

-- Allow user to update their own profile info (e.g. name)
DROP POLICY IF EXISTS "Profiles: User can update own name" ON public.profiles;
CREATE POLICY "Profiles: User can update own name" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ORDERS POLICIES
-- 1. Anyone (public customer) can place an order
DROP POLICY IF EXISTS "Orders: Anyone can insert orders" ON public.orders;
CREATE POLICY "Orders: Anyone can insert orders" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 2. Anyone can read their own order by order_number/id
DROP POLICY IF EXISTS "Orders: Public can read orders" ON public.orders;
CREATE POLICY "Orders: Public can read orders" ON public.orders
  FOR SELECT TO anon, authenticated
  USING (true);

-- 3. Super admin can read & update all orders
DROP POLICY IF EXISTS "Orders: Super Admin full access" ON public.orders;
CREATE POLICY "Orders: Super Admin full access" ON public.orders
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'SUPER_ADMIN')
  WITH CHECK (public.current_user_role() = 'SUPER_ADMIN');

-- 4. Outlet Admin: STRICT RLS for their outlet only
-- Normalizes 'sudirman' vs 'outlet-sudirman' and 'kelakap' vs 'outlet-ratusima'
DROP POLICY IF EXISTS "Orders: Outlet Admin access own outlet" ON public.orders;
CREATE POLICY "Orders: Outlet Admin access own outlet" ON public.orders
  FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'SUPER_ADMIN'
    OR (
      public.current_user_role() = 'OUTLET_ADMIN'
      AND (
        outlet_id = public.current_user_outlet_id()
        OR (public.current_user_outlet_id() ILIKE '%sudirman%' AND outlet_id ILIKE '%sudirman%')
        OR (public.current_user_outlet_id() ILIKE '%kelakap%' AND (outlet_id ILIKE '%kelakap%' OR outlet_id ILIKE '%ratusima%'))
      )
    )
  )
  WITH CHECK (
    public.current_user_role() = 'SUPER_ADMIN'
    OR (
      public.current_user_role() = 'OUTLET_ADMIN'
      AND (
        outlet_id = public.current_user_outlet_id()
        OR (public.current_user_outlet_id() ILIKE '%sudirman%' AND outlet_id ILIKE '%sudirman%')
        OR (public.current_user_outlet_id() ILIKE '%kelakap%' AND (outlet_id ILIKE '%kelakap%' OR outlet_id ILIKE '%ratusima%'))
      )
    )
  );

-- PRODUCTS & CATEGORIES POLICIES
-- Public can read active products & categories
DROP POLICY IF EXISTS "Products: Public read" ON public.products;
CREATE POLICY "Products: Public read" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Products: Admin write" ON public.products;
CREATE POLICY "Products: Admin write" ON public.products
  FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'SUPER_ADMIN'
    OR public.current_user_role() = 'OUTLET_ADMIN'
  );

DROP POLICY IF EXISTS "Categories: Public read" ON public.categories;
CREATE POLICY "Categories: Public read" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Categories: Super Admin write" ON public.categories;
CREATE POLICY "Categories: Super Admin write" ON public.categories
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- WEBSITE CONTENT & OUTLETS & BARISTAS POLICIES
-- Public read
CREATE POLICY "Content: Public read" ON public.website_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Content: Super Admin write" ON public.website_content FOR ALL TO authenticated USING (public.current_user_role() = 'SUPER_ADMIN');

CREATE POLICY "Outlets: Public read" ON public.outlets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Outlets: Super Admin write" ON public.outlets FOR ALL TO authenticated USING (public.current_user_role() = 'SUPER_ADMIN');

CREATE POLICY "Baristas: Public read" ON public.baristas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Baristas: Super Admin write" ON public.baristas FOR ALL TO authenticated USING (public.current_user_role() = 'SUPER_ADMIN');

-- TRIGGER: Auto-create profile row on Supabase Auth SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, outlet_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'OUTLET_ADMIN'),
    new.raw_user_meta_data->>'outlet_id'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
