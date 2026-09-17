-- ==============================================================================
-- LETON COFFEE DUMAI - MASTER DATABASE SCHEMA & SEED MIGRATION
-- Project Supabase URL: https://njadckejuivvllyrqdeg.supabase.co
-- Storage Bucket: leton-images (PUBLIC) & leton-receipts (PRIVATE)
-- ==============================================================================
-- CARA MENJALANKAN (Hanya 1 Langkah):
-- 1. Buka Supabase Dashboard -> Project "Leton Coffee"
-- 2. Klik menu "SQL Editor" (ikon terminal / SQL di kiri)
-- 3. Klik "New query", paste seluruh isi script ini, lalu klik "RUN".
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. STRUKTUR TABEL (DDL)
-- ------------------------------------------------------------------------------

-- Tabel Profiles (User / Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('SUPER_ADMIN', 'OUTLET_ADMIN', 'CUSTOMER')),
  outlet_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabel Outlets (3 Cabang Asli)
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

-- Tabel Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 1
);

-- Tabel Products (8 Menu Asli)
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

-- Tabel Orders (Proteksi Transaksi)
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

-- Tabel Website Content (Hero, About, Chapters, Open Booth)
CREATE TABLE IF NOT EXISTS public.website_content (
  section_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabel Baristas (8 Profil Tim Asli)
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

-- ------------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Read Policies untuk Publik & Aplikasi Frontend
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read outlets" ON public.outlets;
CREATE POLICY "Public read outlets" ON public.outlets FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read baristas" ON public.baristas;
CREATE POLICY "Public read baristas" ON public.baristas FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read content" ON public.website_content;
CREATE POLICY "Public read content" ON public.website_content FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public place orders" ON public.orders;
CREATE POLICY "Public place orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin modify orders" ON public.orders;
CREATE POLICY "Admin modify orders" ON public.orders FOR UPDATE TO authenticated USING (true);

-- ------------------------------------------------------------------------------
-- 3. SEEDING DATA DENGAN ASSET DARI STORAGE BUCKET
-- ------------------------------------------------------------------------------

-- A. Outlets
INSERT INTO public.outlets (
  id, code, name, chapter_label, subtitle, address, description, opening_hours, features, is_active, image_url
) VALUES 
(
  'outlet-sudirman',
  'SDR',
  'Leton Coffee — Sudirman',
  'CHAPTER 05',
  'Flagship Espresso Bar & Roastery',
  'Jl. Jendral Sudirman No. 88, Dumai Kota, Riau',
  'Berlokasi di pusat aktivitas masyarakat Dumai. Menawarkan perpaduan suasana modern, urban, dan hangat untuk berdiskusi, menikmati kopi spesialti, maupun santai bersama komunitas.',
  'Setiap Hari: 08:00 – 00:00 WIB',
  ARRAY['Dine-in & Takeaway', 'High Speed Wi-Fi 6', 'Batch Roastery On-site', 'Urban Hub'],
  true,
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/cabang/sudirman_cover_chapter_5.jpg'
),
(
  'outlet-ratusima',
  'RTM',
  'Leton Coffee — Ratusima / Kelakap 7',
  'CHAPTER 06',
  'Slow Bar & Community Garden',
  'Jl. Ratu Sima / Kelakap Tujuh, Dumai Barat, Riau',
  'Pengalaman menikmati kopi dengan suasana terbuka (open-air), santai, dan sejuk di Dumai Barat. Cocok untuk menikmati sore santai, obrolan akrab, dan manual brew.',
  'Setiap Hari: 08:00 – 23:00 WIB',
  ARRAY['Outdoor Garden', 'Manual Brew V60', 'Community Spot', 'Vinyl Music Nook'],
  true,
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/cabang/ratusima_cover_chapter_6.jpg'
),
(
  'outlet-letgo',
  'LTG',
  'LET''GO — Depan MPP',
  'EXPRESS KIOSK',
  'Express Drive & Grab-and-Go Kiosk',
  'Kawasan Pelayanan Publik (Depan MPP), Dumai',
  'Dirancang untuk ritme mobilitas tinggi pagi hari: kopi cepat saji berkualitas, botolan 1L, dan pembayaran cashless instan.',
  'Setiap Hari: 06:30 – 21:00 WIB',
  ARRAY['Curbside Pickup', '1L Bottle Concentrates', 'Fast-lane Cashless', 'Drive-by Ready'],
  true,
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/open-booth/letgo_mobile_cover_bg.jpg'
)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  chapter_label = EXCLUDED.chapter_label,
  subtitle = EXCLUDED.subtitle,
  address = EXCLUDED.address,
  description = EXCLUDED.description,
  opening_hours = EXCLUDED.opening_hours,
  features = EXCLUDED.features,
  image_url = EXCLUDED.image_url,
  is_active = COALESCE(public.outlets.is_active, EXCLUDED.is_active);

-- B. Categories
INSERT INTO public.categories (id, name, slug, display_order)
VALUES 
  ('cat-coffee', 'Coffee & Espresso', 'coffee', 1),
  ('cat-signature', 'Signature Series', 'signature', 2),
  ('cat-fruity', 'Fruity & Mocktail', 'fruity', 3),
  ('cat-noncoffee', 'Non-Coffee & Artisan Tea', 'non-coffee', 4),
  ('cat-food', 'Pastry & Food', 'food', 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

-- C. Products (8 Menu Asli)
INSERT INTO public.products (
  id, name, slug, category_id, category_name, price, description, image_url, is_active, is_bestseller, badge, outlet_ids
) VALUES 
(
  'menu-1',
  'Black Series',
  'black-series',
  'cat-coffee',
  'Coffee & Espresso',
  30000,
  'Espresso ganda berpadu dengan susu creamy segar dan sirup aren organik khas Leton.',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-1_black-series.jpg',
  true,
  true,
  'BESTSELLER',
  ARRAY['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo']
),
(
  'menu-2',
  'Ice Milk Coffee Botolan Series',
  'ice-milk-coffee-botolan-series',
  'cat-coffee',
  'Coffee & Espresso',
  20000,
  'Kopi susu kemasan botol siap minum dengan cita rasa khas Leton, cocok untuk stok di rumah atau perjalanan.',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-2_ice-milk-coffee-botolan.jpg',
  true,
  false,
  'TAKE AWAY FAVORITE',
  ARRAY['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo']
),
(
  'menu-3',
  'Fruity Series',
  'fruity-series',
  'cat-fruity',
  'Fruity & Mocktail',
  25000,
  'Sensasi segar mocktail sari buah berpadu dengan cold brew pilihan yang menyegarkan di cuaca Dumai.',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-3_fruity-series.jpg',
  true,
  false,
  'REFRESHING',
  ARRAY['outlet-sudirman', 'outlet-ratusima']
),
(
  'menu-4',
  'Ice Milk Coffee',
  'ice-milk-coffee',
  'cat-coffee',
  'Coffee & Espresso',
  18000,
  'Kopi susu dingin racikan khas Leton dengan rasa manis lembut dan gurih seimbang.',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-4_ice-milk-coffee.jpg',
  true,
  true,
  'POPULAR',
  ARRAY['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo']
),
(
  'menu-5',
  'Thai Tea',
  'thai-tea',
  'cat-noncoffee',
  'Non-Coffee & Artisan Tea',
  20000,
  'Teh Thailand autentik bercampur susu kental manis dan evaporated milk lembut berkrim.',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-5_thai-tea.jpg',
  true,
  false,
  'SWEET & CREAMY',
  ARRAY['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo']
),
(
  'menu-6',
  'Lycie Tea',
  'lycie-tea',
  'cat-noncoffee',
  'Non-Coffee & Artisan Tea',
  26000,
  'Teh harum berpadu dengan manis buah leci segar utuh dan sirup pilihan.',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-6_lycie-tea.jpg',
  true,
  false,
  'FRESH FRUIT',
  ARRAY['outlet-sudirman', 'outlet-ratusima']
),
(
  'menu-7',
  'Main Course',
  'main-course',
  'cat-food',
  'Pastry & Food',
  30000,
  'Sajian hidangan utama pengisi energi yang nikmat dan mengenyangkan untuk menemani santap siang atau malam.',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-7_main-course.jpg',
  true,
  false,
  'CHEF SPECIAL',
  ARRAY['outlet-sudirman', 'outlet-ratusima']
),
(
  'menu-8',
  'Donut Glaze',
  'donut-glaze',
  'cat-food',
  'Pastry & Food',
  26000,
  'Donat lembut berbalut glaze manis, camilan sempurna pendamping secangkir kopi panas atau dingin.',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-8_donut-glaze.jpg',
  true,
  false,
  'SNACK',
  ARRAY['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  category_id = EXCLUDED.category_id,
  category_name = EXCLUDED.category_name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  badge = EXCLUDED.badge,
  is_bestseller = EXCLUDED.is_bestseller,
  outlet_ids = EXCLUDED.outlet_ids,
  updated_at = timezone('utc'::text, now()),
  price = COALESCE(public.products.price, EXCLUDED.price),
  is_active = COALESCE(public.products.is_active, EXCLUDED.is_active);

-- D. Baristas (8 Kru Asli)
INSERT INTO public.baristas (
  id, name, role, outlet, quote, favorite_drink, image_url, is_on_duty
) VALUES 
(
  'barista-1',
  'Team Sudirman',
  'Barista Crew',
  'Sudirman Hub',
  'Menjaga konsistensi rasa di setiap cup Leton dengan standar sangrai spesialti.',
  'Leton Aren Signature',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-1_team-sudirman.jpg',
  true
),
(
  'barista-2',
  'Azee & MR Bella',
  'Barista Letgo',
  'LET''GO MPP',
  'Kecepatan dan keramahan adalah kunci melayani para komuter pagi Dumai.',
  'Ice Milk Coffee Botolan',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-2_azee-mr-bella.jpg',
  true
),
(
  'barista-3',
  'Aulia & Indri',
  'Barista & Kasir',
  'Sudirman Hub',
  'Senyuman hangat menyambut setiap tamu yang datang menikmati hari.',
  'Thai Tea Creamy',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-3_aulia-indri.jpg',
  true
),
(
  'barista-4',
  'Letgo Team',
  'Let''GO Fleet Lead Barista',
  'Mobile Booth Fleet',
  'Menjangkau setiap sudut event dan momen penting dengan sajian kopi segar.',
  'Black Series Cold Brew',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-4_letgo-team.jpg',
  true
),
(
  'barista-1788235914522',
  'Jenita',
  'Kasir & Hospitality',
  'Ratusima Garden',
  'Melayani dengan setulus hati agar setiap kunjungan menjadi cerita manis.',
  'Lycie Tea Fresh',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-1788235914522_jenita.jpg',
  true
),
(
  'barista-1788236096868',
  'Pojan',
  'Senior Barista',
  'Sudirman Hub',
  'Eksplorasi rasa dan teknik ekstraksi presisi untuk pecinta kopi sejati.',
  'Manual Brew V60 Gayo',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-1788236096868_pojan.jpg',
  true
),
(
  'barista-1788239708233',
  'Alex',
  'Barista Specialist',
  'Ratusima Garden',
  'Menemani sore santai Anda dengan racikan kopi nikmat dan obrolan hangat.',
  'Ice Milk Coffee',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-1788239708233_alex.jpg',
  true
),
(
  'barista-1788239754510',
  'Team Sudirman Lead',
  'Floor & Shift Lead',
  'Sudirman Hub',
  'Dedikasi tanpa henti untuk memastikan standar kualitas terbaik di setiap cangkir.',
  'Black Series Americano',
  'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-1788239754510_team-sudirman-lead.jpg',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  outlet = EXCLUDED.outlet,
  quote = EXCLUDED.quote,
  favorite_drink = EXCLUDED.favorite_drink,
  image_url = EXCLUDED.image_url,
  is_on_duty = COALESCE(public.baristas.is_on_duty, EXCLUDED.is_on_duty);

-- E. Website Content
INSERT INTO public.website_content (section_key, data)
VALUES 
(
  'hero',
  jsonb_build_object(
    'title', 'Rasa Kopi yang Menemani Setiap Cerita di Kota Dumai',
    'subtitle', 'Dari seduhan hangat di Sudirman, sore santai di Ratu Sima, hingga semangat pagi bersama LET''GO di depan MPP.',
    'cta_order_text', 'PESAN SEKARANG',
    'cta_explore_text', 'JELAJAHI MENU',
    'logo_url', 'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/logo/logo_leton_official.jpg',
    'bg_image_url', 'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/other/hero_coffee_atmosphere_bg.jpg'
  )
),
(
  'about',
  jsonb_build_object(
    'badge', 'TENTANG LETON COFFEE',
    'title', 'Lebih dari Sekadar Kopi, Ini Ruang Berkumpul dan Bertumbuh',
    'description', 'Leton Coffee berawal dari kecintaan sederhana terhadap biji kopi nusantara dan keinginan menciptakan ruang temu yang hangat bagi warga Dumai. Setiap cangkir diracik penuh ketelitian, menghadirkan rasa yang akrab di lidah dan kenangan di hati.',
    'main_image', 'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/cerita/about_story_main.jpg',
    'stats', jsonb_build_array(
      jsonb_build_object('value', '3+', 'label', 'Titik Layanan'),
      jsonb_build_object('value', '100%', 'label', 'Biji Kopi Pilihan Nusantara'),
      jsonb_build_object('value', '15K+', 'label', 'Cangkir Kopi Tersaji')
    )
  )
),
(
  'open_booth',
  jsonb_build_object(
    'badge', 'MOBILE SERVICE & EVENT CATERING',
    'title', 'Hadirkan Kopi Spesialti Leton di Acara Spesial Anda',
    'description', 'Layanan Open Booth dan mobile fleet Leton siap melayani wedding, festival, gathering komunitas, hingga corporate event dengan barista berpengalaman.',
    'cover_image', 'https://njadckejuivvllyrqdeg.supabase.co/storage/v1/object/public/leton-images/open-booth/letgo_mobile_cover_bg.jpg',
    'whatsapp', '6281234567890'
  )
)
ON CONFLICT (section_key) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = timezone('utc'::text, now());
