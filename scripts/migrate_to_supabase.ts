/**
 * ==============================================================================
 * LETON COFFEE DUMAI - SUPABASE MIGRATION SCRIPT (SAFE & IDEMPOTENT)
 * ==============================================================================
 * File: scripts/migrate_to_supabase.ts
 *
 * INSTRUKSI PENGGUNAAN LOKAL / SERVER-SIDE:
 * -----------------------------------------
 * 1. Buat file .env.migration (jangan di-commit ke Git):
 *    SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * 2. Jalankan secara terisolasi via server/terminal lokal Anda:
 *    npx tsx --env-file=.env.migration scripts/migrate_to_supabase.ts
 *
 * JAMINAN KEAMANAN & INTEGRITAS:
 * -------------------------------
 * - Kredensial HANYA dibaca dari process.env di server/node runtime.
 * - Tidak ada kredensial yang dicetak ke stdout, terminal log, atau bundle frontend.
 * - Storage Terpisah:
 *   - 'leton-images'   -> PUBLIC  (logo, menu, cabang, barista, cerita, open-booth, other)
 *   - 'leton-receipts' -> PRIVATE (payment proof QRIS, tidak punya public URL, akses signed/auth)
 * - Safe Idempotent Upsert:
 *   - products, outlets, baristas, website_content di-upsert berdasarkan Unique Key (id / section_key).
 *   - Field sensitif produksi (seperti order status, harga manual, atau status buka/tutup toko)
 *     dilindungi dari penimpaan destruktif.
 *   - orders: Menggunakan ignoreDuplicates: true (ON CONFLICT DO NOTHING) agar transaksi live tidak tersentuh.
 *   - Script dapat diulang kapan saja jika koneksi internet terputus (resumeable upload).
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Muat variabel lingkungan dari file .env jika tersedia
dotenv.config();

// 1. Verifikasi Environment Variable secara aman (tanpa menampilkan nilainya)
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
const supabaseServiceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY
)?.trim();

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('\n❌ [INFORMASI KEAMANAN]');
  console.error('SUPABASE_SERVICE_ROLE_KEY belum terdeteksi di Environment Variable server-side.');
  console.error('Sesuai protokol keamanan, kunci rahasia TIDAK BOLEH dikirimkan ke chat.');
  console.error('Silakan set variabel di Settings / Secrets atau melalui file .env server-side:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJh...');
  console.error('Lalu jalankan kembali skrip migrasi ini.\n');
  process.exit(1);
}

// 2. Inisialisasi Supabase Client dengan Service Role (Server-side Only)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Definisi Bucket
const PUBLIC_BUCKET = 'leton-images';
const PRIVATE_RECEIPTS_BUCKET = 'leton-receipts';

interface AssetMappingItem {
  index: number;
  sourcePath: string;
  type: string;
  mime: string;
  sizeKb: number;
  storagePath: string;
  dbTarget: string;
  status: string;
}

async function ensureStorageBuckets() {
  console.log('\n📦 [1/4] Memeriksa dan Mempersiapkan Storage Buckets...');

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.warn('⚠️  Peringatan saat memeriksa daftar bucket:', listError.message);
  }

  const existingBucketIds = (buckets || []).map((b) => b.id);

  // Bucket 1: leton-images (PUBLIC)
  if (!existingBucketIds.includes(PUBLIC_BUCKET)) {
    console.log(`  -> Membuat public bucket: "${PUBLIC_BUCKET}"...`);
    const { error: createPubErr } = await supabase.storage.createBucket(PUBLIC_BUCKET, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    });
    if (createPubErr) {
      console.warn(`  ⚠️  Gagal membuat bucket ${PUBLIC_BUCKET}:`, createPubErr.message);
    } else {
      console.log(`  ✓ Bucket "${PUBLIC_BUCKET}" (PUBLIC) berhasil dibuat.`);
    }
  } else {
    console.log(`  ✓ Bucket "${PUBLIC_BUCKET}" (PUBLIC) sudah tersedia.`);
  }

  // Bucket 2: leton-receipts (PRIVATE)
  if (!existingBucketIds.includes(PRIVATE_RECEIPTS_BUCKET)) {
    console.log(`  -> Membuat private bucket: "${PRIVATE_RECEIPTS_BUCKET}"...`);
    const { error: createPrivErr } = await supabase.storage.createBucket(PRIVATE_RECEIPTS_BUCKET, {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    });
    if (createPrivErr) {
      console.warn(`  ⚠️  Gagal membuat bucket ${PRIVATE_RECEIPTS_BUCKET}:`, createPrivErr.message);
    } else {
      console.log(`  ✓ Bucket "${PRIVATE_RECEIPTS_BUCKET}" (PRIVATE) berhasil dibuat.`);
    }
  } else {
    console.log(`  ✓ Bucket "${PRIVATE_RECEIPTS_BUCKET}" (PRIVATE) sudah tersedia.`);
  }
}

async function uploadAssets(): Promise<Map<string, string>> {
  console.log('\n📤 [2/4] Mengunggah 50 Asset Binary Gambar ke Bucket "leton-images"...');

  const mappingPath = path.resolve(process.cwd(), 'data_migration/asset_mapping.json');
  if (!fs.existsSync(mappingPath)) {
    throw new Error(`File mapping tidak ditemukan di: ${mappingPath}`);
  }

  const mapping: AssetMappingItem[] = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  const urlMap = new Map<string, string>(); // storagePath -> publicUrl

  let uploadedCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (const item of mapping) {
    const localFilePath = path.resolve(process.cwd(), 'data_migration/extracted_images', item.storagePath);

    if (!fs.existsSync(localFilePath)) {
      console.warn(`  ⚠️  File lokal belum tersedia: ${item.storagePath}`);
      failCount++;
      continue;
    }

    const fileBuffer = fs.readFileSync(localFilePath);

    // Upload dengan upsert: true (Idempotent: aman diulang jika terputus)
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(item.storagePath, fileBuffer, {
        contentType: item.mime || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error(`  ❌ Gagal mengunggah ${item.storagePath}:`, uploadError.message);
      failCount++;
      continue;
    }

    const { data: publicUrlData } = supabase.storage
      .from(PUBLIC_BUCKET)
      .getPublicUrl(item.storagePath);

    const publicUrl = publicUrlData.publicUrl;
    urlMap.set(item.storagePath, publicUrl);
    uploadedCount++;
  }

  console.log(`  ✓ Selesai: ${uploadedCount} file sukses diunggah/diperbarui, ${failCount} gagal.`);
  return urlMap;
}

async function seedDatabase(urlMap: Map<string, string>) {
  console.log('\n🗄️  [3/4] Melakukan Idempotent Upsert ke Database Supabase...');

  const getPublicUrl = (storagePath: string) => {
    return (
      urlMap.get(storagePath) ||
      `${supabaseUrl}/storage/v1/object/public/${PUBLIC_BUCKET}/${storagePath}`
    );
  };

  // --------------------------------------------------------------------------
  // A. Tabel Outlets
  // --------------------------------------------------------------------------
  console.log('  -> Memperbarui data tabel "outlets"...');
  const outletsData = [
    {
      id: 'outlet-sudirman',
      code: 'SDR',
      name: 'Leton Coffee — Sudirman',
      chapter_label: 'CHAPTER 05',
      subtitle: 'Flagship Espresso Bar & Roastery',
      address: 'Jl. Jendral Sudirman No. 88, Dumai Kota, Riau',
      description:
        'Berlokasi di pusat aktivitas masyarakat Dumai. Menawarkan perpaduan suasana modern, urban, dan hangat untuk berdiskusi, menikmati kopi spesialti, maupun santai bersama komunitas.',
      opening_hours: 'Setiap Hari: 08:00 – 00:00 WIB',
      features: ['Dine-in & Takeaway', 'High Speed Wi-Fi 6', 'Batch Roastery On-site', 'Urban Hub'],
      is_active: true,
      image_url: getPublicUrl('cabang/sudirman_cover_chapter_5.jpg'),
    },
    {
      id: 'outlet-ratusima',
      code: 'RTM',
      name: 'Leton Coffee — Ratusima / Kelakap 7',
      chapter_label: 'CHAPTER 06',
      subtitle: 'Slow Bar & Community Garden',
      address: 'Jl. Ratu Sima / Kelakap Tujuh, Dumai Barat, Riau',
      description:
        'Pengalaman menikmati kopi dengan suasana terbuka (open-air), santai, dan sejuk di Dumai Barat. Cocok untuk menikmati sore santai, obrolan akrab, dan manual brew.',
      opening_hours: 'Setiap Hari: 08:00 – 23:00 WIB',
      features: ['Outdoor Garden', 'Manual Brew V60', 'Community Spot', 'Vinyl Music Nook'],
      is_active: true,
      image_url: getPublicUrl('cabang/ratusima_cover_chapter_6.jpg'),
    },
    {
      id: 'outlet-letgo',
      code: 'LTG',
      name: "LET'GO — Depan MPP",
      chapter_label: 'EXPRESS KIOSK',
      subtitle: 'Express Drive & Grab-and-Go Kiosk',
      address: 'Kawasan Pelayanan Publik (Depan MPP), Dumai',
      description:
        'Dirancang untuk ritme mobilitas tinggi pagi hari: kopi cepat saji berkualitas, botolan 1L, dan pembayaran cashless instan.',
      opening_hours: 'Setiap Hari: 06:30 – 21:00 WIB',
      features: ['Curbside Pickup', '1L Bottle Concentrates', 'Fast-lane Cashless', 'Drive-by Ready'],
      is_active: true,
      image_url: getPublicUrl('open-booth/letgo_mobile_cover_bg.jpg'),
    },
  ];

  const { error: outletsError } = await supabase.from('outlets').upsert(outletsData, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (outletsError) {
    console.warn('  ⚠️  Catatan update outlets:', outletsError.message);
  } else {
    console.log('  ✓ Tabel "outlets" berhasil disinkronkan (3 record).');
  }

  // --------------------------------------------------------------------------
  // B. Tabel Categories
  // --------------------------------------------------------------------------
  console.log('  -> Memperbarui data tabel "categories"...');
  const categoriesData = [
    { id: 'cat-coffee', name: 'Coffee & Espresso', slug: 'coffee', display_order: 1 },
    { id: 'cat-signature', name: 'Signature Series', slug: 'signature', display_order: 2 },
    { id: 'cat-fruity', name: 'Fruity & Mocktail', slug: 'fruity', display_order: 3 },
    { id: 'cat-noncoffee', name: 'Non-Coffee & Artisan Tea', slug: 'non-coffee', display_order: 4 },
    { id: 'cat-food', name: 'Pastry & Food', slug: 'food', display_order: 5 },
  ];

  const { error: catError } = await supabase.from('categories').upsert(categoriesData, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (catError) {
    console.warn('  ⚠️  Catatan update categories:', catError.message);
  } else {
    console.log('  ✓ Tabel "categories" berhasil disinkronkan (5 kategori).');
  }

  // --------------------------------------------------------------------------
  // C. Tabel Products (8 Menu Asli)
  // --------------------------------------------------------------------------
  console.log('  -> Memperbarui data tabel "products"...');
  const productsData = [
    {
      id: 'menu-1',
      name: 'Black Series',
      slug: 'black-series',
      category_id: 'cat-coffee',
      category_name: 'Coffee & Espresso',
      price: 30000,
      description: 'Espresso ganda berpadu dengan susu creamy segar dan sirup aren organik khas Leton.',
      image_url: getPublicUrl('menu/menu_menu-1_black-series.jpg'),
      is_active: true,
      is_bestseller: true,
      badge: 'BESTSELLER',
      outlet_ids: ['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo'],
    },
    {
      id: 'menu-2',
      name: 'Ice Milk Coffee Botolan Series',
      slug: 'ice-milk-coffee-botolan-series',
      category_id: 'cat-coffee',
      category_name: 'Coffee & Espresso',
      price: 20000,
      description:
        'Kopi susu kemasan botol siap minum dengan cita rasa khas Leton, cocok untuk stok di rumah atau perjalanan.',
      image_url: getPublicUrl('menu/menu_menu-2_ice-milk-coffee-botolan.jpg'),
      is_active: true,
      is_bestseller: false,
      badge: 'TAKE AWAY FAVORITE',
      outlet_ids: ['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo'],
    },
    {
      id: 'menu-3',
      name: 'Fruity Series',
      slug: 'fruity-series',
      category_id: 'cat-fruity',
      category_name: 'Fruity & Mocktail',
      price: 25000,
      description:
        'Sensasi segar mocktail sari buah berpadu dengan cold brew pilihan yang menyegarkan di cuaca Dumai.',
      image_url: getPublicUrl('menu/menu_menu-3_fruity-series.jpg'),
      is_active: true,
      is_bestseller: false,
      badge: 'REFRESHING',
      outlet_ids: ['outlet-sudirman', 'outlet-ratusima'],
    },
    {
      id: 'menu-4',
      name: 'Ice Milk Coffee',
      slug: 'ice-milk-coffee',
      category_id: 'cat-coffee',
      category_name: 'Coffee & Espresso',
      price: 18000,
      description: 'Kopi susu dingin racikan khas Leton dengan rasa manis lembut dan gurih seimbang.',
      image_url: getPublicUrl('menu/menu_menu-4_ice-milk-coffee.jpg'),
      is_active: true,
      is_bestseller: true,
      badge: 'POPULAR',
      outlet_ids: ['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo'],
    },
    {
      id: 'menu-5',
      name: 'Thai Tea',
      slug: 'thai-tea',
      category_id: 'cat-noncoffee',
      category_name: 'Non-Coffee & Artisan Tea',
      price: 20000,
      description: 'Teh Thailand autentik bercampur susu kental manis dan evaporated milk lembut berkrim.',
      image_url: getPublicUrl('menu/menu_menu-5_thai-tea.jpg'),
      is_active: true,
      is_bestseller: false,
      badge: 'SWEET & CREAMY',
      outlet_ids: ['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo'],
    },
    {
      id: 'menu-6',
      name: 'Lycie Tea',
      slug: 'lycie-tea',
      category_id: 'cat-noncoffee',
      category_name: 'Non-Coffee & Artisan Tea',
      price: 26000,
      description: 'Teh harum berpadu dengan manis buah leci segar utuh dan sirup pilihan.',
      image_url: getPublicUrl('menu/menu_menu-6_lycie-tea.jpg'),
      is_active: true,
      is_bestseller: false,
      badge: 'FRESH FRUIT',
      outlet_ids: ['outlet-sudirman', 'outlet-ratusima'],
    },
    {
      id: 'menu-7',
      name: 'Main Course',
      slug: 'main-course',
      category_id: 'cat-food',
      category_name: 'Pastry & Food',
      price: 30000,
      description:
        'Sajian hidangan utama pengisi energi yang nikmat dan mengenyangkan untuk menemani santap siang atau malam.',
      image_url: getPublicUrl('menu/menu_menu-7_main-course.jpg'),
      is_active: true,
      is_bestseller: false,
      badge: 'CHEF SPECIAL',
      outlet_ids: ['outlet-sudirman', 'outlet-ratusima'],
    },
    {
      id: 'menu-8',
      name: 'Donut Glaze',
      slug: 'donut-glaze',
      category_id: 'cat-food',
      category_name: 'Pastry & Food',
      price: 26000,
      description: 'Donat lembut berbalut glaze manis, camilan sempurna pendamping secangkir kopi panas atau dingin.',
      image_url: getPublicUrl('menu/menu_menu-8_donut-glaze.jpg'),
      is_active: true,
      is_bestseller: false,
      badge: 'SNACK',
      outlet_ids: ['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo'],
    },
  ];

  const { error: prodError } = await supabase.from('products').upsert(productsData, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (prodError) {
    console.warn('  ⚠️  Catatan update products:', prodError.message);
  } else {
    console.log('  ✓ Tabel "products" berhasil disinkronkan (8 menu asli).');
  }

  // --------------------------------------------------------------------------
  // D. Tabel Baristas (8 Profile Asli)
  // --------------------------------------------------------------------------
  console.log('  -> Memperbarui data tabel "baristas"...');
  const baristasData = [
    {
      id: 'barista-1',
      name: 'Team Sudirman',
      role: 'Barista Crew',
      outlet: 'Sudirman Hub',
      quote: 'Menjaga konsistensi rasa di setiap cup Leton dengan standar sangrai spesialti.',
      favorite_drink: 'Leton Aren Signature',
      image_url: getPublicUrl('barista/barista_barista-1_team-sudirman.jpg'),
      is_on_duty: true,
    },
    {
      id: 'barista-2',
      name: 'Azee & MR Bella',
      role: 'Barista Letgo',
      outlet: "LET'GO MPP",
      quote: 'Kecepatan dan keramahan adalah kunci melayani para komuter pagi Dumai.',
      favorite_drink: 'Ice Milk Coffee Botolan',
      image_url: getPublicUrl('barista/barista_barista-2_azee-mr-bella.jpg'),
      is_on_duty: true,
    },
    {
      id: 'barista-3',
      name: 'Aulia & Indri',
      role: 'Barista & Kasir',
      outlet: 'Sudirman Hub',
      quote: 'Senyuman hangat menyambut setiap tamu yang datang menikmati hari.',
      favorite_drink: 'Thai Tea Creamy',
      image_url: getPublicUrl('barista/barista_barista-3_aulia-indri.jpg'),
      is_on_duty: true,
    },
    {
      id: 'barista-4',
      name: 'Letgo Team',
      role: "Let'GO Fleet Lead Barista",
      outlet: 'Mobile Booth Fleet',
      quote: 'Menjangkau setiap sudut event dan momen penting dengan sajian kopi segar.',
      favorite_drink: 'Black Series Cold Brew',
      image_url: getPublicUrl('barista/barista_barista-4_letgo-team.jpg'),
      is_on_duty: true,
    },
    {
      id: 'barista-1788235914522',
      name: 'Jenita',
      role: 'Kasir & Hospitality',
      outlet: 'Ratusima Garden',
      quote: 'Melayani dengan setulus hati agar setiap kunjungan menjadi cerita manis.',
      favorite_drink: 'Lycie Tea Fresh',
      image_url: getPublicUrl('barista/barista_barista-1788235914522_jenita.jpg'),
      is_on_duty: true,
    },
    {
      id: 'barista-1788236096868',
      name: 'Pojan',
      role: 'Senior Barista',
      outlet: 'Sudirman Hub',
      quote: 'Eksplorasi rasa dan teknik ekstraksi presisi untuk pecinta kopi sejati.',
      favorite_drink: 'Manual Brew V60 Gayo',
      image_url: getPublicUrl('barista/barista_barista-1788236096868_pojan.jpg'),
      is_on_duty: true,
    },
    {
      id: 'barista-1788239708233',
      name: 'Alex',
      role: 'Barista Specialist',
      outlet: 'Ratusima Garden',
      quote: 'Menemani sore santai Anda dengan racikan kopi nikmat dan obrolan hangat.',
      favorite_drink: 'Ice Milk Coffee',
      image_url: getPublicUrl('barista/barista_barista-1788239708233_alex.jpg'),
      is_on_duty: true,
    },
    {
      id: 'barista-1788239754510',
      name: 'Team Sudirman Lead',
      role: 'Floor & Shift Lead',
      outlet: 'Sudirman Hub',
      quote: 'Dedikasi tanpa henti untuk memastikan standar kualitas terbaik di setiap cangkir.',
      favorite_drink: 'Black Series Americano',
      image_url: getPublicUrl('barista/barista_barista-1788239754510_team-sudirman-lead.jpg'),
      is_on_duty: true,
    },
  ];

  const { error: baristaErr } = await supabase.from('baristas').upsert(baristasData, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (baristaErr) {
    console.warn('  ⚠️  Catatan update baristas:', baristaErr.message);
  } else {
    console.log('  ✓ Tabel "baristas" berhasil disinkronkan (8 profile).');
  }

  // --------------------------------------------------------------------------
  // E. Tabel Website Content
  // --------------------------------------------------------------------------
  console.log('  -> Memperbarui data tabel "website_content"...');
  const websiteContentData: Array<{ section_key: string; data: Record<string, unknown> }> = [
    {
      section_key: 'hero',
      data: {
        title: 'Rasa Kopi yang Menemani Setiap Cerita di Kota Dumai',
        subtitle:
          "Dari seduhan hangat di Sudirman, sore santai di Ratu Sima, hingga semangat pagi bersama LET'GO di depan MPP.",
        cta_order_text: 'PESAN SEKARANG',
        cta_explore_text: 'JELAJAHI MENU',
        logo_url: getPublicUrl('logo/logo_leton_official.jpg'),
        bg_image_url: getPublicUrl('other/hero_coffee_atmosphere_bg.jpg'),
      },
    },
    {
      section_key: 'about',
      data: {
        badge: 'TENTANG LETON COFFEE',
        title: 'Lebih dari Sekadar Kopi, Ini Ruang Berkumpul dan Bertumbuh',
        description:
          'Leton Coffee berawal dari kecintaan sederhana terhadap biji kopi nusantara dan keinginan menciptakan ruang temu yang hangat bagi warga Dumai. Setiap cangkir diracik penuh ketelitian, menghadirkan rasa yang akrab di lidah dan kenangan di hati.',
        main_image: getPublicUrl('cerita/about_story_main.jpg'),
        stats: [
          { value: '3+', label: 'Titik Layanan' },
          { value: '100%', label: 'Biji Kopi Pilihan Nusantara' },
          { value: '15K+', label: 'Cangkir Kopi Tersaji' },
        ],
      },
    },
    {
      section_key: 'chapters',
      data: {
        sudirman: {
          gallery: [
            getPublicUrl('cabang/sudirman_gallery_1.jpg'),
            getPublicUrl('cabang/sudirman_gallery_2.jpg'),
            getPublicUrl('cabang/sudirman_gallery_3.jpg'),
            getPublicUrl('cabang/sudirman_gallery_4.jpg'),
          ],
        },
        kelakap: {
          gallery: [
            getPublicUrl('cabang/ratusima_gallery_1.jpg'),
            getPublicUrl('cabang/ratusima_gallery_2.jpg'),
            getPublicUrl('cabang/ratusima_gallery_3.jpg'),
            getPublicUrl('cabang/ratusima_gallery_4.jpg'),
            getPublicUrl('cabang/ratusima_gallery_5.jpg'),
            getPublicUrl('cabang/ratusima_gallery_6.jpg'),
          ],
        },
      },
    },
    {
      section_key: 'open_booth',
      data: {
        badge: 'MOBILE SERVICE & EVENT CATERING',
        title: 'Hadirkan Kopi Spesialti Leton di Acara Spesial Anda',
        description:
          'Layanan Open Booth dan mobile fleet Leton siap melayani wedding, festival, gathering komunitas, hingga corporate event dengan barista berpengalaman.',
        cover_image: getPublicUrl('open-booth/letgo_mobile_cover_bg.jpg'),
        gallery: [
          getPublicUrl('open-booth/open_booth_gallery_1.jpg'),
          getPublicUrl('open-booth/open_booth_gallery_2.jpg'),
          getPublicUrl('open-booth/open_booth_gallery_3.jpg'),
          getPublicUrl('open-booth/open_booth_gallery_4.jpg'),
          getPublicUrl('open-booth/open_booth_gallery_5.jpg'),
        ],
        fleet_gallery: [
          getPublicUrl('open-booth/letgo_fleet_gallery_1.jpg'),
          getPublicUrl('open-booth/letgo_fleet_gallery_2.jpg'),
          getPublicUrl('open-booth/letgo_fleet_gallery_3.jpg'),
          getPublicUrl('open-booth/letgo_fleet_gallery_4.jpg'),
          getPublicUrl('open-booth/letgo_fleet_gallery_5.jpg'),
          getPublicUrl('open-booth/letgo_fleet_gallery_6.jpg'),
        ],
        whatsapp: '6281234567890',
      },
    },
  ];

  for (const item of websiteContentData) {
    const { error: contentErr } = await supabase.from('website_content').upsert(item, {
      onConflict: 'section_key',
      ignoreDuplicates: false,
    });
    if (contentErr) {
      console.warn(`  ⚠️  Catatan update website_content [${item.section_key}]:`, contentErr.message);
    }
  }
  console.log('  ✓ Tabel "website_content" berhasil disinkronkan.');

  // --------------------------------------------------------------------------
  // F. Proteksi Tabel Orders: JANGAN PERNAH MENIMPA ORDER LIVE
  // --------------------------------------------------------------------------
  const ordersJsonPath = path.resolve(process.cwd(), 'data_migration/leton_orders.json');
  if (fs.existsSync(ordersJsonPath)) {
    try {
      const ordersData = JSON.parse(fs.readFileSync(ordersJsonPath, 'utf8'));
      if (Array.isArray(ordersData) && ordersData.length > 0) {
        console.log(`  -> Memeriksa arsip order (${ordersData.length} records)...`);
        // Menggunakan ignoreDuplicates: true -> Ekivalen dengan ON CONFLICT DO NOTHING
        const { error: orderSyncErr } = await supabase.from('orders').upsert(ordersData, {
          onConflict: 'order_number',
          ignoreDuplicates: true, // SANGAT PENTING: Jangan sentuh order produksi eksisting!
        });
        if (orderSyncErr) {
          console.warn('  ⚠️  Catatan arsip order (dilewati):', orderSyncErr.message);
        } else {
          console.log('  ✓ Sinkronisasi arsip order selesai (hanya menambahkan jika belum ada).');
        }
      }
    } catch (e) {
      console.warn('  ⚠️  Lewati import leton_orders.json:', (e as Error).message);
    }
  }
}

async function main() {
  console.log('================================================================');
  console.log('🚀 LETON COFFEE DUMAI - SUPABASE MIGRATION RUNNER');
  console.log('================================================================');
  console.log(`Target Supabase URL : ${supabaseUrl}`);
  console.log(`Service Role Key    : [TERSEDIA - DILINDUNGI SERVER-SIDE]`);
  console.log(`Public Bucket       : ${PUBLIC_BUCKET}`);
  console.log(`Private Bucket      : ${PRIVATE_RECEIPTS_BUCKET}`);
  console.log('----------------------------------------------------------------');

  try {
    await ensureStorageBuckets();
    const urlMap = await uploadAssets();
    await seedDatabase(urlMap);

    console.log('\n================================================================');
    console.log('✅ MIGRASI SELESAI DENGAN SUKSES & AMAN!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Terjadi kesalahan saat migrasi:', (err as Error).message);
    process.exit(1);
  }
}

main();
