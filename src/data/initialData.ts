import { Barista, Category, Outlet, Product, ProductOptionItem, WebsiteContent, Order } from '../types';

export const INITIAL_OUTLETS: Outlet[] = [
  {
    id: 'outlet-sudirman',
    code: 'SDR',
    name: 'Leton Coffee — Sudirman',
    chapter_label: 'CHAPTER 05',
    subtitle: 'Flagship Espresso Bar & Roastery',
    address: 'Jl. Jendral Sudirman No. 42, Central Hub, Dumai',
    description: 'Sunlit high ceilings, spacious banquettes & dedicated batch-brew slow bar.',
    opening_hours: '07:00 – 23:00 WIB',
    features: ['Dine-in & Takeaway', 'High Speed Wi-Fi 6', 'Batch Roastery On-site'],
    is_active: true,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNeNclD0sUA5s9EJnvRBhwWSp9tryLZ1bgMtD0YR2h3pBW1fZ7Gv3ihixvd9TnhH10ITEc6062eP03FD3pKDcxIdgcnK08z6l4SyEcYw-13C5_1WzW8MWgxmWPWPUlJlgbkepPclVaJwshlKSx3F66cYbofMwe59Mef7VCL1dlxA9XXEMhfPIdH7P_mBBqiuaNLmwYpqQrG6FWbRo1SOqKSZAS_FKaC-o0eTGyLbZPcDdzub5vgdg9Vw'
  },
  {
    id: 'outlet-ratusima',
    code: 'RTM',
    name: 'Leton Coffee — Ratusima / Kelakap 7',
    chapter_label: 'CHAPTER 06',
    subtitle: 'Slow Bar & Community Garden',
    address: 'Jl. Kelakap Tujuh No. 15, Ratusima, Dumai',
    description: 'Semi-outdoor canopy, lush tropical greens, acoustic music sessions & manual drippers.',
    opening_hours: '08:00 – 22:00 WIB',
    features: ['Outdoor Garden', 'Manual Brew V60', 'Vinyl Listening Nook'],
    is_active: true,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDa4FycU2BTSTmwVo3q7O3sYpGVlOVLue1vvJmnq9jNo3U9c1Ldl_Dsh5WsruuFm6QQJT2L96okJYDzj0aNunf9E2kSeFvwRKz6uJ-hCkQNminyrpSWeZaUbAwlgIgu2MNQxyjnYcP5UDl7hmtXV9L3GSkaGmqXclVjLCvOGQOc5lJpXXTRXS_H-E3UaUZw09fM2W7P0lQbid7DqK0EkD8EMupMiYnCbymnFSTPdUoz11g1MlAtIooIVw'
  },
  {
    id: 'outlet-letgo',
    code: 'LTG',
    name: "LET'GO — Depan MPP",
    chapter_label: 'EXPRESS KIOSK',
    subtitle: 'Express Drive & Grab-and-Go Kiosk',
    address: 'Kawasan Pelayanan Publik (Depan MPP), Dumai',
    description: 'Designed for rapid morning commutes, grab cups, and bottled concentrates.',
    opening_hours: '06:30 – 21:00 WIB',
    features: ['Curbside Pickup', '1L Bottle Concentrates', 'Fast-lane Cashless'],
    is_active: true,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1kxOGq9C1NNBDYolMqu8UZdz5mHdrXIbRFgl73rkXigB6lcWZlnUeGAbpm-wuRfO5B5hz2fGu4Goivqs99I98Ktm0H6iInIT2GMCrOzQd5gB897sAWDUwJu5E3w-8SRykqC2BOhyQRRhWvqbh4xL0NeoeG3J7uQmfLcDyAPwCUzCa-wFx3_t8vv8j_wTDSMtq969UjzlHIYVtgKA3tOwjI0l3FsQXclIDMot4-pRbJIQ3vVyDfTME-g'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-all', name: 'All Drinks', slug: 'all', display_order: 1 },
  { id: 'cat-coffee', name: 'Coffee & Espresso', slug: 'coffee', display_order: 2 },
  { id: 'cat-noncoffee', name: 'Non-Coffee & Milk', slug: 'non-coffee', display_order: 3 },
  { id: 'cat-tea', name: 'Artisan Tea & Tonics', slug: 'tea-tonics', display_order: 4 },
  { id: 'cat-manual', name: 'Manual Brew (Single Origin)', slug: 'manual-brew', display_order: 5 },
  { id: 'cat-pastry', name: 'Pastry & Bites', slug: 'pastry', display_order: 6 },
  { id: 'cat-bottled', name: 'Bottled 1L / Concentrates', slug: 'bottled', display_order: 7 }
];

export const TOPPING_OPTIONS: ProductOptionItem[] = [
  { id: 'top-0', name: 'No Topping', price: 0, is_default: true },
  { id: 'top-1', name: 'Float', price: 6000 },
  { id: 'top-2', name: 'Jelly', price: 6000 },
  { id: 'top-3', name: 'Smoking Barels Xtrashot', price: 6000 },
  { id: 'top-4', name: 'Leton Blend Xtra Shot', price: 6000 },
  { id: 'top-5', name: 'Oat-Milk', price: 10000 }
];

export const SYRUP_OPTIONS: ProductOptionItem[] = [
  { id: 'syr-0', name: 'No Syrup', price: 0, is_default: true },
  { id: 'syr-1', name: 'Syrup Vanila', price: 6000 },
  { id: 'syr-2', name: 'Syrup Caramel', price: 6000 },
  { id: 'syr-3', name: 'Syrup Almond', price: 6000 },
  { id: 'syr-4', name: 'Syrup Hazelnut', price: 6000 }
];

export const TEMPERATURE_OPTIONS = ['Iced (Normal)', 'Less Ice', 'Hot Serve'];
export const SWEETNESS_OPTIONS = ['100%', '70% Less', '40% Low', '0% None'];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-sea-salt-latte',
    name: 'Sea Salt Cream Latte',
    slug: 'sea-salt-cream-latte',
    category_id: 'cat-coffee',
    category_name: 'Coffee & Espresso',
    price: 28000,
    description: 'Double ristretto, sea salt vanilla cream, toasted hazelnut finish.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNuSSfqiS3v1khxH6BRtBCQ9b37jKCbsg2JTuj-ucMF72QQZXY9t6Mz0F6Cvwx6sN5siVqxibu0h_xdEh1ZvcOwCtZEQIDhtKFMa9CmZh2ViEuZuQUG1ZCYHshbvRDDI0NORSsuMw4NS50olenYApeyBAA4MxX7OPYA6w7f7mZnS10S2oW9iCOcK5XqekTQ-YVBLnQ4ZeNLW84KOIHv5Q72vMyTDu0rkraHf1XslpBgFuqYZhYRL1zyA',
    is_active: true,
    is_bestseller: true,
    badge: 'Bestseller',
    temperature_options: TEMPERATURE_OPTIONS,
    sweetness_options: SWEETNESS_OPTIONS,
    toppings: TOPPING_OPTIONS,
    syrups: SYRUP_OPTIONS
  },
  {
    id: 'prod-iced-white',
    name: 'Leton Iced White',
    slug: 'leton-iced-white',
    category_id: 'cat-coffee',
    category_name: 'Coffee & Espresso',
    price: 24000,
    description: 'Signature double origin ristretto over velvety chilled fresh farm milk.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBe4GUf8Rdbn0GbY9UStoHvFCfUvRfp2SLbY3SbwZkfHXoFmT-MYTKwkTL9dIpK18p_CEc_dPjRCo1cGg0sZAY6_pZGxjp-dq_SjysIZeb8D9-JCIXLCpdYbUmjBtsWcS1D-IYWiDGauzezl8zcK5N1iTf4QQiOMk8zzcZ_9iB9Ji8gX5IQkdDPHA90O1RLozlxTdE55nBX5-kIBAJD70GdtKPSUzvnn6d-QATupncwQ8nRRbnzQQFxg',
    is_active: true,
    is_bestseller: true,
    badge: 'House Classic',
    temperature_options: TEMPERATURE_OPTIONS,
    sweetness_options: SWEETNESS_OPTIONS,
    toppings: TOPPING_OPTIONS,
    syrups: SYRUP_OPTIONS
  },
  {
    id: 'prod-aceh-gayo',
    name: 'Aceh Gayo Anaerobic',
    slug: 'aceh-gayo-anaerobic',
    category_id: 'cat-manual',
    category_name: 'Manual Brew (Single Origin)',
    price: 32000,
    description: 'Hand poured V60, wild mountain bergamot, crisp green apple note, honeyed tea body.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7PTn0MzbNPt2HJ_PqHzyX7MbCql5Z5O6FJnKTT60xFrvaoma6CP5XiVZ2Mjo_Rr4gFtobL0ciM_VlDbBwE0snMGFfBGGOtNKIoQaxXhY9oVlE6nWWlBWZshTJeCKJG5mNkahhV3tVsRhOWkW7zhjzAYUH_44YBNhWMgfnqrwa-W25GqpUV5KSGnWA2Z6bwRBVGYcDcPx7lmbvM6R8MauqYuWf1G6woiBjw_Z3SRG8M7qdtucxhzRg-A',
    is_active: true,
    badge: 'Single Origin',
    temperature_options: ['Hot V60', 'Iced Japanese V60'],
    sweetness_options: ['0% None (Pure Single Origin)'],
    toppings: TOPPING_OPTIONS,
    syrups: SYRUP_OPTIONS
  },
  {
    id: 'prod-yuzu-tonic',
    name: 'Yuzu Citrus Tonic',
    slug: 'yuzu-citrus-tonic',
    category_id: 'cat-tea',
    category_name: 'Artisan Tea & Tonics',
    price: 26000,
    description: '18-hour cold steeped beans, Japanese yuzu citrus, carbonated tonic water.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3MPlPtHG4slmOaBkofDcnFjBW-CwE1wNCBzF21JT-5u8T05AXTSXTWwkDK8K4dzRFuh3EW0Yyq_TiRX23dQCOwukULLO6gNh6AWpITYpPpXJuvOk3nJKybrHX-zoWwa3-alyGd_JNwdaj5iAbESsLrqFicRCnUhVfzQjKfKCK0pM7Q3BYlVBzG6iWJ2RODf_YmzmkwkscDbBLx6wjwnOphE4EQhWNLOXLexgqQ1cjcnYN4U_-GV9JeA',
    is_active: true,
    badge: 'Sparkling Cold',
    temperature_options: ['Iced (Normal)'],
    sweetness_options: ['100%', '70% Less', '40% Low'],
    toppings: TOPPING_OPTIONS,
    syrups: SYRUP_OPTIONS
  },
  {
    id: 'prod-cortado',
    name: 'Pecan Praline Cortado',
    slug: 'pecan-praline-cortado',
    category_id: 'cat-coffee',
    category_name: 'Coffee & Espresso',
    price: 25000,
    description: 'Equal parts velvety steamed milk and rich caramelized praline espresso in a Gibraltar glass.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrI64ndVui5nhmcPrhdDFlvfcLIuse2EQs9URxKsDq8CuumMCA-nd-esVqW48ne8SEohL_-qShMJjS6iawyij7JrkV95QHWYAzJBvdUqB2pqj_R4bp-XdBLUbqtFG7G5XX5K_IAY9sRBMx0dctsIFyiUg1Ru9tNScx9QsLAPBBjb1L-9bfm5vTd_7VJEU0QumDEdahPHGbupp7dPXwUylz4M9w3gerow1wEvVzdrmNKsyuLidALEAxXA',
    is_active: true,
    temperature_options: ['Hot Serve (Gibraltar)', 'Iced'],
    sweetness_options: SWEETNESS_OPTIONS,
    toppings: TOPPING_OPTIONS,
    syrups: SYRUP_OPTIONS
  },
  {
    id: 'prod-cloud-matcha',
    name: 'Cloud Matcha Latte',
    slug: 'cloud-matcha-latte',
    category_id: 'cat-noncoffee',
    category_name: 'Non-Coffee & Milk',
    price: 30000,
    description: 'First-flush Uji ceremonial matcha, sweet cold cloud foam cap, organic milk.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWdB-ccmTfPdR6gQaDz5WVI5fiIz784HW8ClxyIQ21OZIJBpAvFjvrOpzm5Js7kykz52SQdNCI49QRRaI_z4xRVC6pCKOtsDrA4mZ5yUB5IE9fPSDUH8KZLIhqnmEfRRrQ81ywr1jD2I7pvi1Us3oEfZstNg55RTX0povue6fm1mcJAuLMnAyDDIUTPN4Uzh7lZLc2JxpVBZqj8Y9T-MpSi-c2_Tp1OVHdMUb_wt45bbQahnBChqofsQ',
    is_active: true,
    temperature_options: TEMPERATURE_OPTIONS,
    sweetness_options: SWEETNESS_OPTIONS,
    toppings: TOPPING_OPTIONS,
    syrups: SYRUP_OPTIONS
  },
  {
    id: 'prod-cold-brew-oat',
    name: 'Cold Brew White Oat',
    slug: 'cold-brew-white-oat',
    category_id: 'cat-coffee',
    category_name: 'Coffee & Espresso',
    price: 32000,
    description: '24-hour immersion brew harmoniously blended with creamy Swedish oat milk.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-OSxvzRoBP34YEe2DQnxtEkWe8f8uPC1oMTL5_tjuCQMsdX_IEXxZLCZeYyUZRaYS8x4KNTXHdhztOt57vsaDeLKGDUHDVo0r_TRT7cS1jVyMmhQm28zOajrC53LAQEIXa4tennisbKkG8Bw7zHYpyg23mpFoDL_LH-7jcFmcZZdGdLqTvdZZkDov9Rm4_LTKxwE0yEGzPb2MN4JKgH_yvVPZDfK9GD5gfaFsAWH0n_slMs8iAfJPEQ',
    is_active: true,
    temperature_options: ['Iced (Normal)', 'Bottle To-Go'],
    sweetness_options: SWEETNESS_OPTIONS,
    toppings: TOPPING_OPTIONS,
    syrups: SYRUP_OPTIONS
  },
  {
    id: 'prod-croissant-combo',
    name: 'Croissant & Espresso Combo',
    slug: 'croissant-espresso-combo',
    category_id: 'cat-pastry',
    category_name: 'Pastry & Bites',
    price: 36000,
    description: 'Freshly baked flaky French artisan butter croissant served with double-filtered Americano.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs35W6B2S5LDtpYgSPzr_r8nL5U9taFJ07U49QEkApcaOuzipkcpcvys7CjNBSsdwzAi-f1eI9sXuifSYk7m053AYWlUBbRwM1oRPGjK1D5J_5g55YBY3pRLQZD3y7kPILO1SP7za_WN0jvp0UiteqFu6DeTVVpWwoqfgnjdmY5Dx-ZHAbdKByS4mrqmNZ4R4KyFQVC5FcNu8GRIbC0TksSgWlQ16qx03b716SUdsWOECJKacubzCuCg',
    is_active: true,
    badge: 'Pairing Combo',
    temperature_options: ['Hot Americano', 'Iced Americano'],
    sweetness_options: ['No Sugar', 'Sugar on side'],
    toppings: TOPPING_OPTIONS,
    syrups: SYRUP_OPTIONS
  }
];

export const INITIAL_BARISTAS: Barista[] = [
  {
    id: 'barista-1',
    name: 'Rian Ardiansyah',
    role: 'Head Roaster & Q-Grader',
    outlet: 'Leton Coffee — Sudirman',
    quote: 'We calibrate roast curves to preserve delicate jasmine florals and sweet citric brilliance rather than smoky darkness.',
    favorite_drink: 'V60 1:16 Ratio @ 92°C',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbKXE5FhYwcEYnpIwFH0zYGP3xA_8_700QlTBwc0elVcSL3do0YzSAsz1Mna1w3nYv8btHBx8iy42wHQfjzmsotcm6W7Ca4rbwb0ne7C2zW7XwyC7JXjBcI9ff2vnChjnSCoQvbfPCx560JWObLQQ_zPkPLtZu_EEwVhjDaaKGLOxRkiwu6I3F65rQ7JOIWu1SajwRbT3ZpwN_Hgy3mJ1FthC4ccTd-YNVnzhchP1Am5gxohvCFJnTiA',
    is_on_duty: true
  },
  {
    id: 'barista-2',
    name: 'Nadia Putri',
    role: 'Lead Barista — Sudirman',
    outlet: 'Leton Coffee — Sudirman',
    quote: 'Microfoam is about velvety texture that holds the sweetness of the milk across every single sip you take.',
    favorite_drink: 'Cortado with Whole Oat Milk',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3VjU6ncEWZGAd_YLy8eOM2mnRRZY3zbRG6UBS-bWalQI1uU0mH3KIugm16preR__x_D42FmIJM_OZK7nlbLtwB46TxPYXsT7TGZ_mhfLq7o0Shq0ednCkkeAOOURcAhLOciARBT2Q-qT0vVusDf3DT26njUe9uhHJ2IEx3jab9OKJBF8L7nThTlPfNu_LFcf-0tm_Ns4vRFsB5OIhDCNBzVdt2UasAMd3_9i_GHjP786NAtkMoM_LNg',
    is_on_duty: true
  },
  {
    id: 'barista-3',
    name: 'Fikri Maulana',
    role: 'Latte Art & Brew Specialist',
    outlet: 'Leton — Ratusima / Kelakap 7',
    quote: 'Coffee should feel refreshing and light. When the cup is clean, your morning thoughts instantly become clearer.',
    favorite_drink: 'Sea Salt Cloud Latte',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcM9wT4sxMUtk3RfwCvgHXcg2hScOTGVr73XbCH3gghWTd-C8yyQGisnrHJkJvehGliODJ7q6wY3UUYX1M7VZNemDkc-hJ1w_I6QkMnFDZmihsXEkEKbPCWzA2C2mLPhYLFEO4oIVTgWQbzijaaUAbxAVfSD_BF0NIcAmfocFhmQ5Ubfxl8GDiK68HLSw-QKD4DDb60iKp8Teoiel2-Cd4EdLu1YSjuDKb1WXw3ILjyXiCQfN2pHnR9g',
    is_on_duty: true
  }
];

export const INITIAL_WEBSITE_CONTENT: WebsiteContent = {
  hero: {
    tagline: 'FRESH ROASTS DAILY • SPECIALTY COFFEE',
    title: 'LETON COFFEE',
    subtitle: 'Bridging your desire of coffee.',
    description: "Crafting modern coffee moments with high-clarity extraction, unhurried morning daylight, and bespoke single origins across Dumai's signature spaces.",
    featured_item_name: 'Sea Salt Cloud Latte',
    featured_item_price: 28000,
    featured_item_desc: 'Double ristretto, vanilla bean cold cream',
    featured_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8BAU8LqRzResUVqdUGMKpusAgl1pxQPc7BEVDSiQpHUmVAtquKXORgsgQ32U2YIF10AwdT_iSjl-lLM0uixm52N1ge_Ty5zF9XvEevNzPVxjeH758vyPndX9Ua4QjxT5RFYWxNIW7y27bYK2yuT6rEQ1zPZIj-Uhb7TB4SpHyW1Og-7sfdltNn-n9J_pBqh_AAtz9je7pJR-cCNLoMCwPBA4gTuAanlk0fsB7sRbgXNa2gNj0V_7HmA'
  },
  chapters: {
    sudirman: {
      chapter_num: '05 / SUDIRMAN',
      title: 'The Flagship Roastery Sanctuary',
      description: "Situated in the beating heart of Dumai's civic center, Chapter 05 Sudirman is engineered with high-volume daylight, acoustic serenity, and transparent roasting. Here, guest beans are profiled on our bespoke drum roaster every Tuesday morning.",
      seating: 64,
      daylight: '100% Solar Daylighted',
      wifi: 'Wi-Fi 6 High Speed Desk Hub',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNeNclD0sUA5s9EJnvRBhwWSp9tryLZ1bgMtD0YR2h3pBW1fZ7Gv3ihixvd9TnhH10ITEc6062eP03FD3pKDcxIdgcnK08z6l4SyEcYw-13C5_1WzW8MWgxmWPWPUlJlgbkepPclVaJwshlKSx3F66cYbofMwe59Mef7VCL1dlxA9XXEMhfPIdH7P_mBBqiuaNLmwYpqQrG6FWbRo1SOqKSZAS_FKaC-o0eTGyLbZPcDdzub5vgdg9Vw'
    },
    ratusima: {
      chapter_num: '06 / RATUSIMA',
      title: 'Kelakap 7 — Greenery & Slow Bar',
      description: 'Designed as an urban retreat from the coastal midday heat. Shaded by wide ficus canopies and bordered with fragrant herbs, this chapter celebrates the unhurried craft of ceramic drippers, aeropress clarity, and relaxed evening dialogue.',
      features: ['Open Air Veranda', 'Vinyl Listening Nook'],
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDa4FycU2BTSTmwVo3q7O3sYpGVlOVLue1vvJmnq9jNo3U9c1Ldl_Dsh5WsruuFm6QQJT2L96okJYDzj0aNunf9E2kSeFvwRKz6uJ-hCkQNminyrpSWeZaUbAwlgIgu2MNQxyjnYcP5UDl7hmtXV9L3GSkaGmqXclVjLCvOGQOc5lJpXXTRXS_H-E3UaUZw09fM2W7P0lQbid7DqK0EkD8EMupMiYnCbymnFSTPdUoz11g1MlAtIooIVw'
    }
  },
  open_booth: {
    tag: 'CATERING & CELEBRATIONS',
    title: 'Leton Open Booth Mobile Bar',
    description: 'Elevate your wedding, corporate milestone, or private gathering with our minimalist mobile coffee cart. Featuring professional dual-boiler commercial machines, trained baristas, and customizable cup sleeve branding.',
    bullets: [
      'Full Signature Drink Menu',
      'Fast 150+ Cups/Hour Flow',
      'Bespoke Cup Branding',
      'Turnkey Electricity & Water'
    ],
    wa_link: 'https://wa.me/6281234567890?text=Halo%20Leton%20Coffee,%20saya%20tertarik%20booking%20Open%20Booth%20untuk%20event',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1kxOGq9C1NNBDYolMqu8UZdz5mHdrXIbRFgl73rkXigB6lcWZlnUeGAbpm-wuRfO5B5hz2fGu4Goivqs99I98Ktm0H6iInIT2GMCrOzQd5gB897sAWDUwJu5E3w-8SRykqC2BOhyQRRhWvqbh4xL0NeoeG3J7uQmfLcDyAPwCUzCa-wFx3_t8vv8j_wTDSMtq969UjzlHIYVtgKA3tOwjI0l3FsQXclIDMot4-pRbJIQ3vVyDfTME-g'
  },
  contact: {
    whatsapp: '+62 812-3456-7890',
    instagram: '@letoncoffee',
    address: 'Jl. Jend. Sudirman No. 42, Central Hub, Dumai, Riau',
    hours: 'Everyday 07:00 – 23:00 WIB'
  },
  settings: {
    site_title: 'Leton Coffee',
    tax_percent: 10,
    eco_discount: 2000,
    qris_nmid: 'ID1020049281902 • A01'
  }
};

export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord-101',
    order_number: 'LTN-20260916-001',
    outlet_id: 'outlet-sudirman',
    outlet_name: 'Leton Coffee — Sudirman',
    customer_name: 'Aldi Pratama',
    customer_phone: '+62 812-9842-1102',
    order_type: 'DINE IN',
    table_number: 'Table A12 — Sunlit Terrace',
    subtotal: 76000,
    pb1_tax: 7600,
    discount: 0,
    total: 83600,
    payment_method: 'QRIS',
    payment_status: 'PAID',
    order_status: 'PREPARING',
    customer_note: 'Please separate ice for takeaway cup if possible, thank you!',
    created_at: '2026-09-16T10:24:00.000Z',
    updated_at: '2026-09-16T10:28:00.000Z',
    items: [
      {
        id: 'item-1',
        order_id: 'ord-101',
        product_id: 'prod-sea-salt-latte',
        product_name: 'Sea Salt Cream Latte',
        product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNuSSfqiS3v1khxH6BRtBCQ9b37jKCbsg2JTuj-ucMF72QQZXY9t6Mz0F6Cvwx6sN5siVqxibu0h_xdEh1ZvcOwCtZEQIDhtKFMa9CmZh2ViEuZuQUG1ZCYHshbvRDDI0NORSsuMw4NS50olenYApeyBAA4MxX7OPYA6w7f7mZnS10S2oW9iCOcK5XqekTQ-YVBLnQ4ZeNLW84KOIHv5Q72vMyTDu0rkraHf1XslpBgFuqYZhYRL1zyA',
        quantity: 1,
        unit_price: 40000,
        subtotal: 40000,
        options_summary: 'Iced • 70% Sweet • Leton Blend Xtra Shot • Vanilla Syrup',
        options_detail: {
          temperature: 'Iced (Normal)',
          sweetness: '70% Less',
          toppings: [{ id: 'top-4', name: 'Leton Blend Xtra Shot', price: 6000 }],
          syrups: [{ id: 'syr-1', name: 'Syrup Vanila', price: 6000 }],
          notes: ''
        }
      },
      {
        id: 'item-2',
        order_id: 'ord-101',
        product_id: 'prod-croissant-combo',
        product_name: 'Croissant & Espresso Combo',
        product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs35W6B2S5LDtpYgSPzr_r8nL5U9taFJ07U49QEkApcaOuzipkcpcvys7CjNBSsdwzAi-f1eI9sXuifSYk7m053AYWlUBbRwM1oRPGjK1D5J_5g55YBY3pRLQZD3y7kPILO1SP7za_WN0jvp0UiteqFu6DeTVVpWwoqfgnjdmY5Dx-ZHAbdKByS4mrqmNZ4R4KyFQVC5FcNu8GRIbC0TksSgWlQ16qx03b716SUdsWOECJKacubzCuCg',
        quantity: 1,
        unit_price: 36000,
        subtotal: 36000,
        options_summary: 'Hot Americano • Toasted Crisp',
        options_detail: {
          temperature: 'Hot Americano',
          sweetness: 'No Sugar',
          toppings: [],
          syrups: [],
          notes: ''
        }
      }
    ]
  }
];
