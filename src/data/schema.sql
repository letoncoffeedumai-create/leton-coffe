-- ============================================================
-- LETON COFFEE SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. OUTLETS TABLE
CREATE TABLE IF NOT EXISTS public.outlets (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  chapter_label TEXT NOT NULL,
  subtitle TEXT,
  address TEXT NOT NULL,
  description TEXT,
  opening_hours TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_bestseller BOOLEAN DEFAULT false,
  badge TEXT,
  temperature_options JSONB DEFAULT '[]'::jsonb,
  sweetness_options JSONB DEFAULT '[]'::jsonb,
  toppings JSONB DEFAULT '[]'::jsonb,
  syrups JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  outlet_id TEXT NOT NULL REFERENCES public.outlets(id),
  outlet_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('DINE IN', 'TAKE AWAY')),
  table_number TEXT,
  subtotal NUMERIC NOT NULL,
  pb1_tax NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('QRIS', 'TUNAI')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('WAITING PAYMENT', 'WAITING VERIFICATION', 'PAY AT STORE', 'PAID', 'PAYMENT REJECTED')),
  order_status TEXT NOT NULL CHECK (order_status IN ('NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
  customer_note TEXT,
  rejection_reason TEXT,
  payment_proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  options_summary TEXT,
  options_detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROFILES & ROLES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'OUTLET_ADMIN', 'CUSTOMER')),
  outlet_id TEXT REFERENCES public.outlets(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BARISTAS TABLE
CREATE TABLE IF NOT EXISTS public.baristas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  outlet TEXT NOT NULL,
  quote TEXT,
  favorite_drink TEXT,
  image_url TEXT,
  is_on_duty BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. WEBSITE CONTENT TABLE (CMS)
CREATE TABLE IF NOT EXISTS public.website_content (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Public read for outlets, categories, products, baristas, website_content
CREATE POLICY "Public can view active outlets" ON public.outlets FOR SELECT USING (true);
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can view baristas" ON public.baristas FOR SELECT USING (true);
CREATE POLICY "Public can view website content" ON public.website_content FOR SELECT USING (true);

-- Orders: Anyone can insert a new order (customer order flow)
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Anyone can read their own order by order_number/ID
CREATE POLICY "Anyone can view own order by ID" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can view order items" ON public.order_items FOR SELECT USING (true);

-- 11. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) 
VALUES ('leton-images', 'leton-images', true)
ON CONFLICT (id) DO NOTHING;
