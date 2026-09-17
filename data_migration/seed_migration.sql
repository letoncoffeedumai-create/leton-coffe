-- ==============================================================================
-- LETON COFFEE DUMAI - SEED MIGRATION (SAFE & IDEMPOTENT)
-- ==============================================================================
-- File: data_migration/seed_migration.sql
-- Keterangan: Skrip SQL aman untuk seeding data awal dan sinkronisasi struktur.
-- 
-- Aturan Keamanan Produksi:
-- 1. Idempotent: Menggunakan ON CONFLICT dengan batasan field yang jelas.
-- 2. No Blind Overwrite:
--    - Tabel orders: ON CONFLICT (order_number) DO NOTHING (tidak menyentuh transaksi live).
--    - Tabel products: is_active dan price dipertahankan jika sudah diubah di production.
--    - Tabel outlets: is_active dipertahankan jika sudah diubah di production.
--    - Tabel baristas: is_on_duty dipertahankan jika sudah diatur shift manager.
-- 3. Storage Separation:
--    - leton-images: PUBLIC (logo, menu, cabang, barista, cerita, open-booth, other).
--    - leton-receipts: PRIVATE (khusus bukti pembayaran QRIS, hanya authenticated staff).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROVISI STORAGE BUCKETS
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('leton-images', 'leton-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('leton-receipts', 'leton-receipts', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS POLICIES FOR STORAGE (leton-images - PUBLIC)
DROP POLICY IF EXISTS "Public Read leton-images" ON storage.objects;
CREATE POLICY "Public Read leton-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'leton-images');

DROP POLICY IF EXISTS "Admin Insert leton-images" ON storage.objects;
CREATE POLICY "Admin Insert leton-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'leton-images');

DROP POLICY IF EXISTS "Admin Update leton-images" ON storage.objects;
CREATE POLICY "Admin Update leton-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'leton-images');

DROP POLICY IF EXISTS "Admin Delete leton-images" ON storage.objects;
CREATE POLICY "Admin Delete leton-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'leton-images');

-- RLS POLICIES FOR STORAGE (leton-receipts - PRIVATE)
-- Customer (anon atau authenticated) hanya dapat mengunggah bukti bayar, TIDAK BISA membaca bukti milik orang lain.
DROP POLICY IF EXISTS "Customer Insert leton-receipts" ON storage.objects;
CREATE POLICY "Customer Insert leton-receipts"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'leton-receipts');

-- Hanya Staff / Admin Authenticated yang dapat membaca/melihat bukti transfer via Signed URL / Service Role.
DROP POLICY IF EXISTS "Staff Select leton-receipts" ON storage.objects;
CREATE POLICY "Staff Select leton-receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'leton-receipts');

-- ------------------------------------------------------------------------------
-- 2. SEED TABEL: OUTLETS (3 Cabang Asli)
-- Unique Key: id
-- Immutable: id, created_at
-- Updatable: code, name, chapter_label, subtitle, address, description, opening_hours, features, image_url
-- Protected: is_active (mempertahankan status operasional di production)
-- ------------------------------------------------------------------------------
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/cabang/sudirman_cover_chapter_5.jpg'
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/cabang/ratusima_cover_chapter_6.jpg'
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/open-booth/letgo_mobile_cover_bg.jpg'
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

-- ------------------------------------------------------------------------------
-- 3. SEED TABEL: CATEGORIES
-- Unique Key: id, slug
-- Updatable: name, display_order
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 4. SEED TABEL: PRODUCTS (8 Menu Asli Leton Coffee)
-- Unique Key: id
-- Immutable: id, created_at
-- Updatable: name, slug, category_id, category_name, description, image_url, badge, outlet_ids, updated_at
-- Protected: price, is_active (mempertahankan custom harga / ketersediaan live di outlet)
-- ------------------------------------------------------------------------------
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-1_black-series.jpg',
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-2_ice-milk-coffee-botolan.jpg',
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-3_fruity-series.jpg',
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-4_ice-milk-coffee.jpg',
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-5_thai-tea.jpg',
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-6_lycie-tea.jpg',
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-7_main-course.jpg',
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/menu/menu_menu-8_donut-glaze.jpg',
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

-- ------------------------------------------------------------------------------
-- 5. SEED TABEL: BARISTAS (8 Profile Tim Leton)
-- Unique Key: id
-- Immutable: id
-- Updatable: name, role, outlet, quote, favorite_drink, image_url
-- Protected: is_on_duty (mempertahankan jadwal shift yang aktif di kasir)
-- ------------------------------------------------------------------------------
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
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-1_team-sudirman.jpg',
  true
),
(
  'barista-2',
  'Azee & MR Bella',
  'Barista Letgo',
  'LET''GO MPP',
  'Kecepatan dan keramahan adalah kunci melayani para komuter pagi Dumai.',
  'Ice Milk Coffee Botolan',
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-2_azee-mr-bella.jpg',
  true
),
(
  'barista-3',
  'Aulia & Indri',
  'Barista & Kasir',
  'Sudirman Hub',
  'Senyuman hangat menyambut setiap tamu yang datang menikmati hari.',
  'Thai Tea Creamy',
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-3_aulia-indri.jpg',
  true
),
(
  'barista-4',
  'Letgo Team',
  'Let''GO Fleet Lead Barista',
  'Mobile Booth Fleet',
  'Menjangkau setiap sudut event dan momen penting dengan sajian kopi segar.',
  'Black Series Cold Brew',
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-4_letgo-team.jpg',
  true
),
(
  'barista-1788235914522',
  'Jenita',
  'Kasir & Hospitality',
  'Ratusima Garden',
  'Melayani dengan setulus hati agar setiap kunjungan menjadi cerita manis.',
  'Lycie Tea Fresh',
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-1788235914522_jenita.jpg',
  true
),
(
  'barista-1788236096868',
  'Pojan',
  'Senior Barista',
  'Sudirman Hub',
  'Eksplorasi rasa dan teknik ekstraksi presisi untuk pecinta kopi sejati.',
  'Manual Brew V60 Gayo',
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-1788236096868_pojan.jpg',
  true
),
(
  'barista-1788239708233',
  'Alex',
  'Barista Specialist',
  'Ratusima Garden',
  'Menemani sore santai Anda dengan racikan kopi nikmat dan obrolan hangat.',
  'Ice Milk Coffee',
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-1788239708233_alex.jpg',
  true
),
(
  'barista-1788239754510',
  'Team Sudirman Lead',
  'Floor & Shift Lead',
  'Sudirman Hub',
  'Dedikasi tanpa henti untuk memastikan standar kualitas terbaik di setiap cangkir.',
  'Black Series Americano',
  'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/barista/barista_barista-1788239754510_team-sudirman-lead.jpg',
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

-- ------------------------------------------------------------------------------
-- 6. SEED TABEL: WEBSITE CONTENT (Hero, About, Chapters, Open Booth, Socials)
-- Unique Key: section_key
-- ------------------------------------------------------------------------------
INSERT INTO public.website_content (section_key, data)
VALUES 
(
  'hero',
  jsonb_build_object(
    'title', 'Rasa Kopi yang Menemani Setiap Cerita di Kota Dumai',
    'subtitle', 'Dari seduhan hangat di Sudirman, sore santai di Ratu Sima, hingga semangat pagi bersama LET''GO di depan MPP.',
    'cta_order_text', 'PESAN SEKARANG',
    'cta_explore_text', 'JELAJAHI MENU',
    'logo_url', 'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/logo/logo_leton_official.jpg',
    'bg_image_url', 'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/other/hero_coffee_atmosphere_bg.jpg'
  )
),
(
  'about',
  jsonb_build_object(
    'badge', 'TENTANG LETON COFFEE',
    'title', 'Lebih dari Sekadar Kopi, Ini Ruang Berkumpul dan Bertumbuh',
    'description', 'Leton Coffee berawal dari kecintaan sederhana terhadap biji kopi nusantara dan keinginan menciptakan ruang temu yang hangat bagi warga Dumai. Setiap cangkir diracik penuh ketelitian, menghadirkan rasa yang akrab di lidah dan kenangan di hati.',
    'main_image', 'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/cerita/about_story_main.jpg',
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
    'cover_image', 'https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/leton-images/open-booth/letgo_mobile_cover_bg.jpg',
    'whatsapp', '6281234567890'
  )
)
ON CONFLICT (section_key) DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- 7. TABEL ORDERS: PROTEKSI DATA TRANSAKSI
-- ATURAN: ON CONFLICT DO NOTHING
-- Jaminan mutlak: Migration TIDAK AKAN PERNAH menimpa, menghapus, atau merusak data order live!
-- ------------------------------------------------------------------------------
-- (Contoh jika memasukkan data order awal tanpa menimpa order yang sudah ada)
-- INSERT INTO public.orders (...) VALUES (...) ON CONFLICT (order_number) DO NOTHING;
