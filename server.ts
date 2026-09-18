import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';

// Supabase Admin Client using service role key (bypasses RLS)
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const supabaseServiceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : null;

// Helper: generate clean slug from category name
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, '') // remove & so "Coffee & Espresso" -> "coffee espresso"
    .replace(/[^a-z0-9]+/g, '-') // convert spaces and non-alphanumerics to -
    .replace(/^-+|-+$/g, ''); // strip leading and trailing hyphens
}

// Helper: ensure unique slug among categories
function ensureUniqueSlug(
  baseSlug: string,
  existingList: { id: string; slug: string }[],
  currentId?: string
): string {
  let slug = baseSlug || 'kategori';
  const otherSlugs = new Set(
    existingList
      .filter((c) => !currentId || c.id !== currentId)
      .map((c) => c.slug)
  );

  if (!otherSlugs.has(slug)) return slug;

  let counter = 1;
  while (otherSlugs.has(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}

async function getInactiveCategoryIds(): Promise<string[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data } = await supabaseAdmin
      .from('website_content')
      .select('data')
      .eq('section_key', 'category_metadata')
      .maybeSingle();

    if (data && data.data && Array.isArray(data.data.inactive_ids)) {
      return data.data.inactive_ids;
    }
  } catch (err) {
    console.warn('Could not load category_metadata from website_content:', err);
  }
  return [];
}

async function setCategoryActiveStatus(categoryId: string, isActive: boolean): Promise<void> {
  if (!supabaseAdmin) return;
  try {
    const inactiveIds = await getInactiveCategoryIds();
    let updated: string[];
    if (isActive) {
      updated = inactiveIds.filter((id) => id !== categoryId);
    } else {
      updated = Array.from(new Set([...inactiveIds, categoryId]));
    }

    await supabaseAdmin
      .from('website_content')
      .upsert({
        section_key: 'category_metadata',
        data: { inactive_ids: updated, updated_at: new Date().toISOString() },
        updated_at: new Date().toISOString()
      });
  } catch (err) {
    console.warn('Could not update category_metadata in website_content:', err);
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --------------------------------------------------------------------------
  // API Routes: Health Check
  // --------------------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      supabaseConfigured: Boolean(supabaseAdmin)
    });
  });

  // --------------------------------------------------------------------------
  // API Routes: Categories CRUD
  // --------------------------------------------------------------------------

  // 1. GET /api/categories - List all categories ordered by display_order
  app.get('/api/categories', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const inactiveIds = await getInactiveCategoryIds();
      const categoriesWithStatus = (data || []).map((cat) => ({
        ...cat,
        is_active: !inactiveIds.includes(cat.id)
      }));

      return res.json(categoriesWithStatus);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // 2. POST /api/categories - Create new category
  app.post('/api/categories', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const { name, display_order, is_active } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama kategori wajib diisi' });
      }

      const trimmedName = name.trim();
      const baseSlug = generateCategorySlug(trimmedName);

      // Fetch existing categories to determine uniqueness and order
      const { data: existing, error: listErr } = await supabaseAdmin
        .from('categories')
        .select('id, slug, display_order');

      if (listErr) {
        return res.status(400).json({ error: listErr.message });
      }

      const finalSlug = ensureUniqueSlug(baseSlug, existing || []);
      const maxOrder = (existing || []).reduce(
        (max, c) => Math.max(max, c.display_order || 0),
        0
      );

      const finalOrder = Number(display_order) || maxOrder + 1;
      const finalId = req.body.id || `cat-${finalSlug}-${Date.now()}`;

      // Insert into Supabase categories
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('categories')
        .insert({
          id: finalId,
          name: trimmedName,
          slug: finalSlug,
          display_order: finalOrder
        })
        .select()
        .single();

      if (insertErr) {
        return res.status(400).json({ error: insertErr.message });
      }

      // Update active status if false
      const activeState = is_active !== false;
      if (!activeState) {
        await setCategoryActiveStatus(finalId, false);
      }

      return res.status(201).json({
        ...inserted,
        is_active: activeState
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // 3. PUT /api/categories/reorder - Reorder categories
  app.put('/api/categories/reorder', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds array is required' });
      }

      const updatePromises = orderedIds.map((id, index) =>
        supabaseAdmin!
          .from('categories')
          .update({ display_order: index + 1 })
          .eq('id', id)
      );

      const results = await Promise.all(updatePromises);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) {
        return res.status(400).json({ error: firstError.message });
      }

      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const inactiveIds = await getInactiveCategoryIds();
      const categoriesWithStatus = (data || []).map((cat) => ({
        ...cat,
        is_active: !inactiveIds.includes(cat.id)
      }));

      return res.json(categoriesWithStatus);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // 4. PUT /api/categories/:id - Update existing category
  app.put('/api/categories/:id', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const categoryId = req.params.id;
      const { name, display_order, is_active } = req.body;

      // 1. Check if category exists
      const { data: existingCat, error: fetchErr } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .maybeSingle();

      if (fetchErr) {
        return res.status(400).json({ error: fetchErr.message });
      }
      if (!existingCat) {
        return res.status(404).json({ error: `Kategori dengan ID "${categoryId}" tidak ditemukan` });
      }

      const updatePayload: any = {};

      // Auto-generate slug when name changes
      if (name !== undefined) {
        const trimmedName = String(name).trim();
        if (!trimmedName) {
          return res.status(400).json({ error: 'Nama kategori tidak boleh kosong' });
        }
        updatePayload.name = trimmedName;

        // Fetch all categories to ensure unique slug
        const { data: allCats } = await supabaseAdmin.from('categories').select('id, slug');
        const baseSlug = generateCategorySlug(trimmedName);
        const uniqueSlug = ensureUniqueSlug(baseSlug, allCats || [], categoryId);
        updatePayload.slug = uniqueSlug;
      }

      if (display_order !== undefined) {
        updatePayload.display_order = Number(display_order) || existingCat.display_order;
      }

      // Execute UPDATE query in Supabase
      if (Object.keys(updatePayload).length > 0) {
        const { data: updated, error: updateErr } = await supabaseAdmin
          .from('categories')
          .update(updatePayload)
          .eq('id', categoryId)
          .select()
          .single();

        if (updateErr) {
          return res.status(400).json({ error: updateErr.message });
        }

        // If name was updated, also synchronize category_name in products table
        if (updatePayload.name) {
          await supabaseAdmin
            .from('products')
            .update({ category_name: updatePayload.name })
            .eq('category_id', categoryId);
        }
      }

      // Update active status if provided
      if (is_active !== undefined) {
        await setCategoryActiveStatus(categoryId, Boolean(is_active));
      }

      // Fetch final updated row
      const { data: finalCat } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      const inactiveIds = await getInactiveCategoryIds();
      return res.json({
        ...finalCat,
        is_active: !inactiveIds.includes(categoryId)
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // 5. DELETE /api/categories/:id - Delete category from Supabase
  app.delete('/api/categories/:id', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const categoryId = req.params.id;

      // Check if products exist for this category
      const { data: prods, error: prodErr } = await supabaseAdmin
        .from('products')
        .select('id, name')
        .eq('category_id', categoryId);

      if (prodErr) {
        return res.status(400).json({ error: prodErr.message });
      }

      if (prods && prods.length > 0) {
        return res.status(400).json({
          error: `Kategori tidak dapat dihapus karena masih memiliki ${prods.length} produk terdaftar. Pindahkan produk terlebih dahulu.`
        });
      }

      const { error: delErr } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (delErr) {
        return res.status(400).json({ error: delErr.message });
      }

      // Clean up from inactiveIds if present
      await setCategoryActiveStatus(categoryId, true);

      return res.json({
        success: true,
        message: 'Kategori berhasil dihapus'
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // --------------------------------------------------------------------------
  // API Routes: Storage Upload (Bucket: leton-images)
  // --------------------------------------------------------------------------
  app.post('/api/upload', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const { folder = 'menu', filename, base64Data, contentType = 'image/jpeg' } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: 'base64Data is required for upload' });
      }

      // Clean base64 header if present (e.g. data:image/png;base64,...)
      const cleanedBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanedBase64, 'base64');

      const safeFilename = `${folder}/${Date.now()}-${(filename || 'image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { data, error } = await supabaseAdmin.storage
        .from('leton-images')
        .upload(safeFilename, buffer, {
          contentType: contentType || 'image/jpeg',
          upsert: true
        });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('leton-images')
        .getPublicUrl(safeFilename);

      return res.json({
        success: true,
        url: publicUrlData.publicUrl,
        path: safeFilename
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Storage upload failed' });
    }
  });

  // --------------------------------------------------------------------------
  // API Routes: Orders Management & Verification
  // --------------------------------------------------------------------------

  // 1. GET /api/orders - Fetch all orders with their items
  app.get('/api/orders', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const outletId = req.query.outlet_id as string | undefined;

      let query = supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (outletId && outletId !== 'all') {
        query = query.eq('outlet_id', outletId);
      }

      const { data: orders, error } = await query;
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Fetch order items for orders
      const orderIds = (orders || []).map((o) => o.id);
      let allItems: any[] = [];
      if (orderIds.length > 0) {
        const { data: itemsData } = await supabaseAdmin
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);
        allItems = itemsData || [];
      }

      const itemsByOrderId = new Map<string, any[]>();
      allItems.forEach((it) => {
        const arr = itemsByOrderId.get(it.order_id) || [];
        arr.push(it);
        itemsByOrderId.set(it.order_id, arr);
      });

      const enrichedOrders = (orders || []).map((ord) => {
        const items = ord.items && Array.isArray(ord.items) && ord.items.length > 0
          ? ord.items
          : itemsByOrderId.get(ord.id) || [];
        return {
          ...ord,
          items
        };
      });

      return res.json(enrichedOrders);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch orders' });
    }
  });

  // 2. POST /api/orders - Create new order
  app.post('/api/orders', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const orderData = req.body;
      const orderId = orderData.id || `ord-${Date.now()}`;
      const now = new Date().toISOString();

      const orderPayload = {
        id: orderId,
        order_number: orderData.order_number || `LTN-${Date.now().toString().slice(-6)}`,
        outlet_id: orderData.outlet_id || 'outlet-sudirman',
        outlet_name: orderData.outlet_name || 'Leton Coffee — Sudirman (Pusat)',
        customer_name: orderData.customer_name || 'Pelanggan Leton',
        customer_phone: orderData.customer_phone || '',
        order_type: orderData.order_type || 'DINE IN',
        table_number: orderData.table_number || '',
        subtotal: Number(orderData.subtotal) || 0,
        pb1_tax: Number(orderData.pb1_tax) || 0,
        discount: Number(orderData.discount) || 0,
        total: Number(orderData.total) || 0,
        payment_method: orderData.payment_method || 'QRIS',
        payment_status: orderData.payment_status || 'WAITING VERIFICATION',
        order_status: orderData.order_status || 'NEW',
        customer_note: orderData.customer_note || '',
        payment_proof_url: orderData.payment_proof_url || null,
        rejection_reason: orderData.rejection_reason || null,
        created_at: orderData.created_at || now,
        updated_at: now
      };

      const { data: insertedOrder, error: insertErr } = await supabaseAdmin
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

      if (insertErr) {
        return res.status(400).json({ error: insertErr.message });
      }

      if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
        const itemsPayload = orderData.items.map((it: any, idx: number) => ({
          id: it.id || `item-${orderId}-${idx + 1}`,
          order_id: orderId,
          product_id: it.product_id || (it.product && it.product.id) || '',
          product_name: it.product_name || (it.product && it.product.name) || 'Item Menu',
          product_image: it.product_image || (it.product && it.product.image_url) || '',
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          subtotal: Number(it.subtotal) || (Number(it.unit_price) || 0) * (Number(it.quantity) || 1),
          options_summary: it.options_summary || '',
          options_detail: it.options_detail || it.options || {}
        }));

        await supabaseAdmin.from('order_items').insert(itemsPayload);
      }

      return res.status(201).json({
        ...insertedOrder,
        items: orderData.items || []
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to create order' });
    }
  });

  // 3. PUT /api/orders/:id/payment-status - Update payment status (Verifikasi QRIS: PAID or PAYMENT REJECTED)
  app.put('/api/orders/:id/payment-status', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const orderId = req.params.id;
      const { payment_status, rejection_reason } = req.body;

      if (!payment_status) {
        return res.status(400).json({ error: 'payment_status is required' });
      }

      const now = new Date().toISOString();
      const updateData: any = {
        payment_status,
        updated_at: now
      };

      if (rejection_reason !== undefined) {
        updateData.rejection_reason = rejection_reason;
      }

      // If accepted/PAID, advance NEW orders to IN_PROGRESS/ACCEPTED
      if (payment_status === 'PAID') {
        const { data: currentOrd } = await supabaseAdmin
          .from('orders')
          .select('order_status')
          .eq('id', orderId)
          .maybeSingle();

        if (currentOrd && currentOrd.order_status === 'NEW') {
          updateData.order_status = 'IN_PROGRESS';
        }
      } else if (payment_status === 'PAYMENT REJECTED') {
        updateData.order_status = 'CANCELLED';
      }

      const { data: updated, error } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update payment status' });
    }
  });

  // 4. PUT /api/orders/:id/status - Update order fulfillment status
  app.put('/api/orders/:id/status', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const orderId = req.params.id;
      const { order_status, rejection_reason } = req.body;

      if (!order_status) {
        return res.status(400).json({ error: 'order_status is required' });
      }

      const now = new Date().toISOString();
      const updateData: any = {
        order_status,
        updated_at: now
      };

      if (rejection_reason !== undefined) {
        updateData.rejection_reason = rejection_reason;
      }

      const { data: updated, error } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update order status' });
    }
  });

  // --------------------------------------------------------------------------
  // API Routes: Products & Topping Configuration
  // --------------------------------------------------------------------------

  async function getProductToppingConfigs(): Promise<Record<string, { requires_topping: boolean; allowed_topping_ids: string[] }>> {
    if (!supabaseAdmin) return {};
    try {
      const { data } = await supabaseAdmin
        .from('website_content')
        .select('data')
        .eq('section_key', 'product_topping_config')
        .maybeSingle();

      if (data && data.data && data.data.configs) {
        return data.data.configs;
      }
    } catch (err) {
      console.warn('Could not read product_topping_config:', err);
    }
    return {};
  }

  async function saveProductToppingConfig(productId: string, config: { requires_topping: boolean; allowed_topping_ids: string[] }) {
    if (!supabaseAdmin) return;
    try {
      const currentConfigs = await getProductToppingConfigs();
      currentConfigs[productId] = config;

      await supabaseAdmin.from('website_content').upsert({
        section_key: 'product_topping_config',
        data: { configs: currentConfigs, updated_at: new Date().toISOString() },
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not save product_topping_config:', err);
    }
  }

  // 1. GET /api/products - List all products with topping configuration
  app.get('/api/products', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const { data: products, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('id');

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const toppingConfigs = await getProductToppingConfigs();

      const enriched = (products || []).map((p) => {
        const cfg = toppingConfigs[p.id] || {
          requires_topping: p.category_id === 'cat-snack' || p.category_id === 'cat-coffee',
          allowed_topping_ids: []
        };
        return {
          ...p,
          requires_topping: cfg.requires_topping,
          allowed_topping_ids: cfg.allowed_topping_ids || []
        };
      });

      return res.json(enriched);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch products' });
    }
  });

  // 2. POST /api/products - Create new product
  app.post('/api/products', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const {
        id,
        name,
        category_id,
        category_name,
        price,
        description,
        image_url,
        is_active,
        is_bestseller,
        badge,
        outlet_ids,
        requires_topping,
        allowed_topping_ids
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama produk wajib diisi' });
      }

      const trimmedName = name.trim();
      const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const productId = id || `prod-${Date.now()}`;
      const now = new Date().toISOString();

      const productPayload = {
        id: productId,
        name: trimmedName,
        slug,
        category_id: category_id || 'cat-coffee',
        category_name: category_name || 'Coffee & Espresso',
        price: Number(price) || 0,
        description: (description || '').trim(),
        image_url: image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
        is_active: is_active !== false,
        is_bestseller: Boolean(is_bestseller),
        badge: badge || null,
        outlet_ids: Array.isArray(outlet_ids) && outlet_ids.length > 0
          ? outlet_ids
          : ['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo'],
        created_at: now,
        updated_at: now
      };

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('products')
        .insert(productPayload)
        .select()
        .single();

      if (insertErr) {
        return res.status(400).json({ error: insertErr.message });
      }

      // Save topping setting
      if (requires_topping !== undefined || allowed_topping_ids !== undefined) {
        await saveProductToppingConfig(productId, {
          requires_topping: Boolean(requires_topping),
          allowed_topping_ids: Array.isArray(allowed_topping_ids) ? allowed_topping_ids : []
        });
      }

      return res.status(201).json({
        ...inserted,
        requires_topping: Boolean(requires_topping),
        allowed_topping_ids: allowed_topping_ids || []
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to create product' });
    }
  });

  // 3. PUT /api/products/:id - Update product
  app.put('/api/products/:id', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const productId = req.params.id;
      const {
        name,
        category_id,
        category_name,
        price,
        description,
        image_url,
        is_active,
        is_bestseller,
        badge,
        outlet_ids,
        requires_topping,
        allowed_topping_ids
      } = req.body;

      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };

      if (name !== undefined) {
        updatePayload.name = name.trim();
        updatePayload.slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      }
      if (category_id !== undefined) updatePayload.category_id = category_id;
      if (category_name !== undefined) updatePayload.category_name = category_name;
      if (price !== undefined) updatePayload.price = Number(price);
      if (description !== undefined) updatePayload.description = description.trim();
      if (image_url !== undefined) updatePayload.image_url = image_url;
      if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);
      if (is_bestseller !== undefined) updatePayload.is_bestseller = Boolean(is_bestseller);
      if (badge !== undefined) updatePayload.badge = badge || null;
      if (outlet_ids !== undefined) updatePayload.outlet_ids = outlet_ids;

      const { data: updated, error } = await supabaseAdmin
        .from('products')
        .update(updatePayload)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (requires_topping !== undefined || allowed_topping_ids !== undefined) {
        await saveProductToppingConfig(productId, {
          requires_topping: Boolean(requires_topping),
          allowed_topping_ids: Array.isArray(allowed_topping_ids) ? allowed_topping_ids : []
        });
      }

      return res.json({
        ...updated,
        requires_topping: Boolean(requires_topping),
        allowed_topping_ids: allowed_topping_ids || []
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update product' });
    }
  });

  // 4. DELETE /api/products/:id - Delete product
  app.delete('/api/products/:id', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const productId = req.params.id;
      const { error } = await supabaseAdmin.from('products').delete().eq('id', productId);
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true, message: 'Produk berhasil dihapus' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to delete product' });
    }
  });

  // --------------------------------------------------------------------------
  // API Routes: Toppings Management (CRUD + Snack Toppings)
  // --------------------------------------------------------------------------

  async function getToppingsList(): Promise<any[]> {
    if (!supabaseAdmin) return [];
    try {
      const { data } = await supabaseAdmin
        .from('website_content')
        .select('data')
        .eq('section_key', 'toppings_list')
        .maybeSingle();

      if (data && data.data && Array.isArray(data.data.toppings)) {
        return data.data.toppings;
      }
    } catch (err) {
      console.warn('Could not read toppings_list:', err);
    }
    return [];
  }

  async function saveToppingsList(toppings: any[]) {
    if (!supabaseAdmin) return;
    await supabaseAdmin.from('website_content').upsert({
      section_key: 'toppings_list',
      data: { toppings, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString()
    });
  }

  // 1. GET /api/toppings
  app.get('/api/toppings', async (req, res) => {
    try {
      const toppings = await getToppingsList();
      return res.json(toppings);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch toppings' });
    }
  });

  // 2. POST /api/toppings - Create topping
  app.post('/api/toppings', async (req, res) => {
    try {
      const { name, price, category = 'SNACK', is_active = true } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama topping wajib diisi' });
      }

      const current = await getToppingsList();
      const newTopping = {
        id: `top-${Date.now()}`,
        name: name.trim(),
        price: Number(price) || 0,
        category: category || 'SNACK',
        is_active: is_active !== false,
        created_at: new Date().toISOString()
      };

      current.push(newTopping);
      await saveToppingsList(current);

      return res.status(201).json(newTopping);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to create topping' });
    }
  });

  // 3. PUT /api/toppings/:id - Update topping
  app.put('/api/toppings/:id', async (req, res) => {
    try {
      const toppingId = req.params.id;
      const { name, price, category, is_active } = req.body;

      const current = await getToppingsList();
      const index = current.findIndex((t) => t.id === toppingId);
      if (index < 0) {
        return res.status(404).json({ error: 'Topping tidak ditemukan' });
      }

      const updated = {
        ...current[index],
        name: name !== undefined ? name.trim() : current[index].name,
        price: price !== undefined ? Number(price) : current[index].price,
        category: category !== undefined ? category : current[index].category,
        is_active: is_active !== undefined ? Boolean(is_active) : current[index].is_active,
        updated_at: new Date().toISOString()
      };

      current[index] = updated;
      await saveToppingsList(current);

      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update topping' });
    }
  });

  // 4. DELETE /api/toppings/:id - Delete topping
  app.delete('/api/toppings/:id', async (req, res) => {
    try {
      const toppingId = req.params.id;
      const current = await getToppingsList();
      const filtered = current.filter((t) => t.id !== toppingId);
      await saveToppingsList(filtered);

      return res.json({ success: true, message: 'Topping berhasil dihapus' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to delete topping' });
    }
  });

  // --------------------------------------------------------------------------
  // API Routes: QRIS Payment Settings
  // --------------------------------------------------------------------------

  // 1. GET /api/settings/qris
  app.get('/api/settings/qris', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const outletId = req.query.outlet_id ? String(req.query.outlet_id) : 'all';

      let qrisData: any = null;
      if (outletId !== 'all') {
        const { data: outletQris } = await supabaseAdmin
          .from('website_content')
          .select('data')
          .eq('section_key', `payment_qris_${outletId}`)
          .maybeSingle();
        if (outletQris?.data?.qris_image_url || outletQris?.data?.qris_url) {
          qrisData = outletQris.data;
        }
      }

      if (!qrisData) {
        const { data } = await supabaseAdmin
          .from('website_content')
          .select('data')
          .eq('section_key', 'payment_qris')
          .maybeSingle();

        qrisData = data?.data || {
          qris_url: '',
          qris_image_url: '',
          nmid: 'ID1020038918239',
          merchant_name: 'LETON COFFEE DUMAI'
        };
      }

      const imageUrl = qrisData.qris_image_url || qrisData.qris_url || '';
      return res.json({
        ...qrisData,
        qris_url: imageUrl,
        qris_image_url: imageUrl,
        nmid: qrisData.nmid || 'ID1020038918239',
        merchant_name: qrisData.merchant_name || 'LETON COFFEE DUMAI'
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to load QRIS settings' });
    }
  });

  // 2. POST /api/settings/qris - Update QRIS Image and details
  app.post('/api/settings/qris', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const { qris_url, qris_image_url, nmid, merchant_name, outlet_id } = req.body;
      const imageUrl = qris_image_url || qris_url || '';
      const targetOutlet = outlet_id || 'all';
      const sectionKey = targetOutlet === 'all' ? 'payment_qris' : `payment_qris_${targetOutlet}`;

      const { data: existing } = await supabaseAdmin
        .from('website_content')
        .select('data')
        .eq('section_key', sectionKey)
        .maybeSingle();

      const payload = {
        outlet_id: targetOutlet,
        qris_url: imageUrl || existing?.data?.qris_url || '',
        qris_image_url: imageUrl || existing?.data?.qris_image_url || existing?.data?.qris_url || '',
        nmid: nmid !== undefined ? nmid : existing?.data?.nmid || 'ID1020038918239',
        merchant_name: merchant_name !== undefined ? merchant_name : existing?.data?.merchant_name || 'LETON COFFEE DUMAI',
        updated_at: new Date().toISOString()
      };

      await supabaseAdmin.from('website_content').upsert({
        section_key: sectionKey,
        data: payload,
        updated_at: new Date().toISOString()
      });

      if (targetOutlet === 'all') {
        await supabaseAdmin.from('website_content').upsert({
          section_key: 'payment_qris',
          data: payload,
          updated_at: new Date().toISOString()
        });
      }

      return res.json({ success: true, ...payload });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to save QRIS settings' });
    }
  });

  // --------------------------------------------------------------------------
  // API Routes: Web Traffic Analytics
  // --------------------------------------------------------------------------

  // 1. POST /api/traffic/ping - Log visitor & pageview
  app.post('/api/traffic/ping', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.json({ status: 'ignored' });
      }

      const { visitorId } = req.body;
      if (!visitorId) {
        return res.json({ status: 'missing_visitor_id' });
      }

      const today = new Date().toISOString().split('T')[0];

      const { data: currentContent } = await supabaseAdmin
        .from('website_content')
        .select('data')
        .eq('section_key', 'traffic_analytics')
        .maybeSingle();

      const traffic = currentContent?.data || {
        total_visitors: 0,
        total_page_views: 0,
        daily_stats: {}
      };

      const dailyStats = traffic.daily_stats || {};
      const todayStats = dailyStats[today] || {
        date: today,
        visitors: 0,
        page_views: 0,
        visitor_ids: []
      };

      const visitorIds = todayStats.visitor_ids || [];
      const isNewVisitorToday = !visitorIds.includes(visitorId);

      if (isNewVisitorToday) {
        visitorIds.push(visitorId);
        todayStats.visitors = (todayStats.visitors || 0) + 1;
        traffic.total_visitors = (traffic.total_visitors || 0) + 1;
      }

      todayStats.page_views = (todayStats.page_views || 0) + 1;
      todayStats.visitor_ids = visitorIds.slice(-500); // cap storage of ids
      traffic.total_page_views = (traffic.total_page_views || 0) + 1;

      dailyStats[today] = todayStats;
      traffic.daily_stats = dailyStats;

      await supabaseAdmin.from('website_content').upsert({
        section_key: 'traffic_analytics',
        data: traffic,
        updated_at: new Date().toISOString()
      });

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Traffic ping failed' });
    }
  });

  // 2. GET /api/traffic/stats - Aggregate stats for Admin Dashboard
  app.get('/api/traffic/stats', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase is not configured on server' });
      }

      const { data: currentContent } = await supabaseAdmin
        .from('website_content')
        .select('data')
        .eq('section_key', 'traffic_analytics')
        .maybeSingle();

      const traffic = currentContent?.data || {
        total_visitors: 0,
        total_page_views: 0,
        daily_stats: {}
      };

      const today = new Date().toISOString().split('T')[0];
      const dailyStats: Record<string, any> = traffic.daily_stats || {};

      const todayStats = dailyStats[today] || { visitors: 0, page_views: 0 };
      const visitorsToday = todayStats.visitors || 0;

      // 7 days and 30 days
      const nowMs = Date.now();
      let visitors7Days = 0;
      let visitors30Days = 0;

      const dailyChart: { date: string; label: string; visitors: number; page_views: number }[] = [];

      for (let i = 29; i >= 0; i--) {
        const dStr = new Date(nowMs - i * 86400000).toISOString().split('T')[0];
        const dayStat = dailyStats[dStr] || { visitors: 0, page_views: 0 };
        const v = dayStat.visitors || 0;
        const pv = dayStat.page_views || 0;

        if (i < 7) {
          visitors7Days += v;
        }
        visitors30Days += v;

        const dateObj = new Date(dStr);
        const label = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        dailyChart.push({
          date: dStr,
          label,
          visitors: v,
          page_views: pv
        });
      }

      return res.json({
        total_visitors: traffic.total_visitors || visitors30Days,
        visitors_today: visitorsToday,
        visitors_7_days: visitors7Days,
        visitors_30_days: visitors30Days,
        total_page_views: traffic.total_page_views || 0,
        daily_chart: dailyChart
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch traffic stats' });
    }
  });

  // --------------------------------------------------------------------------
  // Vite Middleware (Dev) / Static Serve (Prod)
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Leton Coffee Server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
