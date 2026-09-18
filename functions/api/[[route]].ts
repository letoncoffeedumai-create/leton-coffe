import { createClient } from '@supabase/supabase-js';

// Default Leton Coffee Supabase configuration
const DEFAULT_SUPABASE_URL = 'https://njadckejuivvllyrqdeg.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qYWRja2VqdWl2dmxseXJxZGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU1MjEwOSwiZXhwIjoyMTA1MTI4MTA5fQ.PuXc6SoPk914J30yn5oBJLJC0wEOL1XJfzhy1-XvBz4';

function getSupabase(env: any) {
  const url = (env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  const key = (
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    env?.SUPABASE_SECRET_KEY ||
    env?.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SERVICE_ROLE_KEY
  ).trim();

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Content-Type': 'application/json'
  };
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders()
  });
}

function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

async function getInactiveCategoryIds(supabase: any): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('website_content')
      .select('data')
      .eq('section_key', 'category_metadata')
      .maybeSingle();

    if (data && data.data && Array.isArray(data.data.inactive_ids)) {
      return data.data.inactive_ids;
    }
  } catch (err) {
    console.warn('Could not load category_metadata:', err);
  }
  return [];
}

async function setCategoryActiveStatus(supabase: any, categoryId: string, isActive: boolean): Promise<void> {
  try {
    const inactiveIds = await getInactiveCategoryIds(supabase);
    let updated: string[];
    if (isActive) {
      updated = inactiveIds.filter((id) => id !== categoryId);
    } else {
      updated = Array.from(new Set([...inactiveIds, categoryId]));
    }

    await supabase.from('website_content').upsert({
      section_key: 'category_metadata',
      data: { inactive_ids: updated, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Could not update category_metadata:', err);
  }
}

async function getProductToppingConfigs(supabase: any): Promise<Record<string, { requires_topping: boolean; allowed_topping_ids: string[] }>> {
  try {
    const { data } = await supabase
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

async function saveProductToppingConfig(
  supabase: any,
  productId: string,
  config: { requires_topping: boolean; allowed_topping_ids: string[] }
) {
  try {
    const currentConfigs = await getProductToppingConfigs(supabase);
    currentConfigs[productId] = config;

    await supabase.from('website_content').upsert({
      section_key: 'product_topping_config',
      data: { configs: currentConfigs, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Could not save product_topping_config:', err);
  }
}

async function getToppingsList(supabase: any): Promise<any[]> {
  try {
    const { data } = await supabase
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

async function saveToppingsList(supabase: any, toppings: any[]) {
  await supabase.from('website_content').upsert({
    section_key: 'toppings_list',
    data: { toppings, updated_at: new Date().toISOString() },
    updated_at: new Date().toISOString()
  });
}

export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams;
  const supabase = getSupabase(env);

  let body: any = {};
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      body = await request.json();
    } catch {
      body = {};
    }
  }

  try {
    // 1. HEALTH CHECK
    if (pathname === '/api/health') {
      return jsonResponse({ status: 'ok', supabaseConfigured: true, platform: 'cloudflare-pages' });
    }

    // 2. CATEGORIES
    if (pathname === '/api/categories') {
      if (method === 'GET') {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) return jsonResponse({ error: error.message }, 400);

        const inactiveIds = await getInactiveCategoryIds(supabase);
        const categoriesWithStatus = (data || []).map((cat: any) => ({
          ...cat,
          is_active: !inactiveIds.includes(cat.id)
        }));
        return jsonResponse(categoriesWithStatus);
      }

      if (method === 'POST') {
        const { name, display_order, is_active, id } = body;
        if (!name || !name.trim()) {
          return jsonResponse({ error: 'Nama kategori wajib diisi' }, 400);
        }

        const trimmedName = name.trim();
        const baseSlug = generateCategorySlug(trimmedName);

        const { data: existing, error: listErr } = await supabase
          .from('categories')
          .select('id, slug, display_order');

        if (listErr) return jsonResponse({ error: listErr.message }, 400);

        const finalSlug = ensureUniqueSlug(baseSlug, existing || []);
        const maxOrder = (existing || []).reduce(
          (max: number, c: any) => Math.max(max, c.display_order || 0),
          0
        );

        const finalOrder = Number(display_order) || maxOrder + 1;
        const finalId = id || `cat-${finalSlug}-${Date.now()}`;

        const { data: inserted, error: insertErr } = await supabase
          .from('categories')
          .insert({
            id: finalId,
            name: trimmedName,
            slug: finalSlug,
            display_order: finalOrder
          })
          .select()
          .single();

        if (insertErr) return jsonResponse({ error: insertErr.message }, 400);

        const activeState = is_active !== false;
        if (!activeState) {
          await setCategoryActiveStatus(supabase, finalId, false);
        }

        return jsonResponse({ ...inserted, is_active: activeState }, 201);
      }
    }

    // 2b. CATEGORIES REORDER
    if (pathname === '/api/categories/reorder' && (method === 'PUT' || method === 'POST')) {
      const { orderedIds } = body;
      if (!Array.isArray(orderedIds)) {
        return jsonResponse({ error: 'orderedIds array is required' }, 400);
      }

      const updatePromises = orderedIds.map((catId: string, index: number) =>
        supabase
          .from('categories')
          .update({ display_order: index + 1 })
          .eq('id', catId)
      );

      await Promise.all(updatePromises);

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) return jsonResponse({ error: error.message }, 400);

      const inactiveIds = await getInactiveCategoryIds(supabase);
      const categoriesWithStatus = (data || []).map((cat: any) => ({
        ...cat,
        is_active: !inactiveIds.includes(cat.id)
      }));

      return jsonResponse(categoriesWithStatus);
    }

    // 2c. CATEGORIES /:id
    const catMatch = pathname.match(/^\/api\/categories\/([^/]+)$/);
    if (catMatch) {
      const categoryId = decodeURIComponent(catMatch[1]);

      if (method === 'PUT') {
        const { name, display_order, is_active } = body;
        const updatePayload: any = {};

        if (name !== undefined) {
          const trimmedName = String(name).trim();
          if (!trimmedName) {
            return jsonResponse({ error: 'Nama kategori tidak boleh kosong' }, 400);
          }
          updatePayload.name = trimmedName;

          const { data: allCats } = await supabase.from('categories').select('id, slug');
          const baseSlug = generateCategorySlug(trimmedName);
          const uniqueSlug = ensureUniqueSlug(baseSlug, allCats || [], categoryId);
          updatePayload.slug = uniqueSlug;
        }

        if (display_order !== undefined) {
          updatePayload.display_order = Number(display_order);
        }

        if (Object.keys(updatePayload).length > 0) {
          const { error: updateErr } = await supabase
            .from('categories')
            .update(updatePayload)
            .eq('id', categoryId);

          if (updateErr) return jsonResponse({ error: updateErr.message }, 400);

          if (updatePayload.name) {
            await supabase
              .from('products')
              .update({ category_name: updatePayload.name })
              .eq('category_id', categoryId);
          }
        }

        if (is_active !== undefined) {
          await setCategoryActiveStatus(supabase, categoryId, Boolean(is_active));
        }

        const { data: finalCat } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        const inactiveIds = await getInactiveCategoryIds(supabase);
        return jsonResponse({
          ...finalCat,
          is_active: !inactiveIds.includes(categoryId)
        });
      }

      if (method === 'DELETE') {
        const { data: prods } = await supabase
          .from('products')
          .select('id')
          .eq('category_id', categoryId);

        if (prods && prods.length > 0) {
          return jsonResponse({
            error: `Kategori tidak dapat dihapus karena masih memiliki ${prods.length} produk terdaftar.`
          }, 400);
        }

        const { error: delErr } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);

        if (delErr) return jsonResponse({ error: delErr.message }, 400);

        await setCategoryActiveStatus(supabase, categoryId, true);
        return jsonResponse({ success: true, message: 'Kategori berhasil dihapus' });
      }
    }

    // 3. PRODUCTS
    if (pathname === '/api/products') {
      if (method === 'GET') {
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .order('id');

        if (error) return jsonResponse({ error: error.message }, 400);

        const toppingConfigs = await getProductToppingConfigs(supabase);
        const enriched = (products || []).map((p: any) => {
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

        return jsonResponse(enriched);
      }

      if (method === 'POST') {
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
        } = body;

        if (!name || !name.trim()) {
          return jsonResponse({ error: 'Nama produk wajib diisi' }, 400);
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

        const { data: inserted, error: insertErr } = await supabase
          .from('products')
          .insert(productPayload)
          .select()
          .single();

        if (insertErr) return jsonResponse({ error: insertErr.message }, 400);

        if (requires_topping !== undefined || allowed_topping_ids !== undefined) {
          await saveProductToppingConfig(supabase, productId, {
            requires_topping: Boolean(requires_topping),
            allowed_topping_ids: Array.isArray(allowed_topping_ids) ? allowed_topping_ids : []
          });
        }

        return jsonResponse({
          ...inserted,
          requires_topping: Boolean(requires_topping),
          allowed_topping_ids: allowed_topping_ids || []
        }, 201);
      }
    }

    // 3b. PRODUCTS /:id
    const prodMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
    if (prodMatch) {
      const productId = decodeURIComponent(prodMatch[1]);

      if (method === 'PUT') {
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
        } = body;

        const updatePayload: any = { updated_at: new Date().toISOString() };

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

        const { data: updated, error } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', productId)
          .select()
          .single();

        if (error) return jsonResponse({ error: error.message }, 400);

        if (requires_topping !== undefined || allowed_topping_ids !== undefined) {
          await saveProductToppingConfig(supabase, productId, {
            requires_topping: Boolean(requires_topping),
            allowed_topping_ids: Array.isArray(allowed_topping_ids) ? allowed_topping_ids : []
          });
        }

        return jsonResponse({
          ...updated,
          requires_topping: Boolean(requires_topping),
          allowed_topping_ids: allowed_topping_ids || []
        });
      }

      if (method === 'DELETE') {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) return jsonResponse({ error: error.message }, 400);
        return jsonResponse({ success: true, message: 'Produk berhasil dihapus' });
      }
    }

    // 4. TOPPINGS
    if (pathname === '/api/toppings') {
      if (method === 'GET') {
        const toppings = await getToppingsList(supabase);
        return jsonResponse(toppings);
      }

      if (method === 'POST') {
        const { name, price, category = 'SNACK', is_active = true } = body;
        if (!name || !name.trim()) {
          return jsonResponse({ error: 'Nama topping wajib diisi' }, 400);
        }

        const current = await getToppingsList(supabase);
        const newTopping = {
          id: `top-${Date.now()}`,
          name: name.trim(),
          price: Number(price) || 0,
          category: category || 'SNACK',
          is_active: is_active !== false,
          created_at: new Date().toISOString()
        };

        current.push(newTopping);
        await saveToppingsList(supabase, current);
        return jsonResponse(newTopping, 201);
      }
    }

    const topMatch = pathname.match(/^\/api\/toppings\/([^/]+)$/);
    if (topMatch) {
      const toppingId = decodeURIComponent(topMatch[1]);

      if (method === 'PUT') {
        const { name, price, category, is_active } = body;
        const current = await getToppingsList(supabase);
        const index = current.findIndex((t: any) => t.id === toppingId);
        if (index < 0) return jsonResponse({ error: 'Topping tidak ditemukan' }, 404);

        const updated = {
          ...current[index],
          name: name !== undefined ? name.trim() : current[index].name,
          price: price !== undefined ? Number(price) : current[index].price,
          category: category !== undefined ? category : current[index].category,
          is_active: is_active !== undefined ? Boolean(is_active) : current[index].is_active,
          updated_at: new Date().toISOString()
        };

        current[index] = updated;
        await saveToppingsList(supabase, current);
        return jsonResponse(updated);
      }

      if (method === 'DELETE') {
        const current = await getToppingsList(supabase);
        const filtered = current.filter((t: any) => t.id !== toppingId);
        await saveToppingsList(supabase, filtered);
        return jsonResponse({ success: true, message: 'Topping berhasil dihapus' });
      }
    }

    // 5. ORDERS
    if (pathname === '/api/orders') {
      if (method === 'GET') {
        const outletId = searchParams.get('outlet_id');
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

        if (outletId && outletId !== 'all') {
          query = query.eq('outlet_id', outletId);
        }

        const { data: orders, error } = await query;
        if (error) return jsonResponse({ error: error.message }, 400);

        const orderIds = (orders || []).map((o: any) => o.id);
        let allItems: any[] = [];
        if (orderIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds);
          allItems = itemsData || [];
        }

        const itemsByOrderId = new Map<string, any[]>();
        allItems.forEach((it: any) => {
          const arr = itemsByOrderId.get(it.order_id) || [];
          arr.push(it);
          itemsByOrderId.set(it.order_id, arr);
        });

        const enrichedOrders = (orders || []).map((ord: any) => {
          const items = ord.items && Array.isArray(ord.items) && ord.items.length > 0
            ? ord.items
            : itemsByOrderId.get(ord.id) || [];
          return { ...ord, items };
        });

        return jsonResponse(enrichedOrders);
      }

      if (method === 'POST') {
        const orderData = body;
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
          items: orderData.items || [],
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

        const { data: insertedOrder, error: insertErr } = await supabase
          .from('orders')
          .insert(orderPayload)
          .select()
          .single();

        if (insertErr) return jsonResponse({ error: insertErr.message }, 400);

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

          await supabase.from('order_items').insert(itemsPayload);
        }

        return jsonResponse({
          ...insertedOrder,
          items: orderData.items || []
        }, 201);
      }
    }

    // 5b. ORDER STATUS & PAYMENT STATUS
    const ordPayMatch = pathname.match(/^\/api\/orders\/([^/]+)\/payment-status$/);
    if (ordPayMatch && method === 'PUT') {
      const orderId = decodeURIComponent(ordPayMatch[1]);
      const { payment_status, rejection_reason } = body;
      const now = new Date().toISOString();
      const updateData: any = { payment_status, updated_at: now };

      if (rejection_reason !== undefined) {
        updateData.rejection_reason = rejection_reason;
      }

      if (payment_status === 'PAID') {
        const { data: currentOrd } = await supabase
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

      const { data: updated, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse(updated);
    }

    const ordStatMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
    if (ordStatMatch && method === 'PUT') {
      const orderId = decodeURIComponent(ordStatMatch[1]);
      const { order_status, rejection_reason } = body;
      const now = new Date().toISOString();
      const updateData: any = { order_status, updated_at: now };

      if (rejection_reason !== undefined) {
        updateData.rejection_reason = rejection_reason;
      }

      const { data: updated, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse(updated);
    }

    const ordDelMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
    if (ordDelMatch && method === 'DELETE') {
      const orderId = decodeURIComponent(ordDelMatch[1]);
      await supabase.from('order_items').delete().eq('order_id', orderId);
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ success: true, message: 'Pesanan berhasil dihapus' });
    }

    // 6. QRIS SETTINGS
    if (pathname === '/api/settings/qris') {
      if (method === 'GET') {
        const outletId = searchParams.get('outlet_id') || 'all';
        let qrisData: any = null;

        if (outletId !== 'all') {
          const { data: outletQris } = await supabase
            .from('website_content')
            .select('data')
            .eq('section_key', `payment_qris_${outletId}`)
            .maybeSingle();

          if (outletQris?.data?.qris_image_url || outletQris?.data?.qris_url) {
            qrisData = outletQris.data;
          }
        }

        if (!qrisData) {
          const { data } = await supabase
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
        return jsonResponse({
          ...qrisData,
          qris_url: imageUrl,
          qris_image_url: imageUrl,
          nmid: qrisData.nmid || 'ID1020038918239',
          merchant_name: qrisData.merchant_name || 'LETON COFFEE DUMAI'
        });
      }

      if (method === 'POST') {
        const { qris_url, qris_image_url, nmid, merchant_name, outlet_id } = body;
        const imageUrl = qris_image_url || qris_url || '';
        const targetOutlet = outlet_id || 'all';
        const sectionKey = targetOutlet === 'all' ? 'payment_qris' : `payment_qris_${targetOutlet}`;

        const { data: existing } = await supabase
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

        await supabase.from('website_content').upsert({
          section_key: sectionKey,
          data: payload,
          updated_at: new Date().toISOString()
        });

        if (targetOutlet === 'all') {
          await supabase.from('website_content').upsert({
            section_key: 'payment_qris',
            data: payload,
            updated_at: new Date().toISOString()
          });
        }

        return jsonResponse({ success: true, ...payload });
      }
    }

    // 7. STORAGE UPLOAD (Base64)
    if (pathname === '/api/upload' && method === 'POST') {
      const { folder = 'menu', filename, base64Data, contentType = 'image/jpeg' } = body;
      if (!base64Data) {
        return jsonResponse({ error: 'base64Data is required for upload' }, 400);
      }

      const cleanedBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const binaryString = atob(cleanedBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const safeFilename = `${folder}/${Date.now()}-${(filename || 'image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { data, error } = await supabase.storage
        .from('leton-images')
        .upload(safeFilename, bytes, {
          contentType: contentType || 'image/jpeg',
          upsert: true
        });

      if (error) return jsonResponse({ error: error.message }, 400);

      const { data: publicUrlData } = supabase.storage
        .from('leton-images')
        .getPublicUrl(safeFilename);

      return jsonResponse({
        success: true,
        url: publicUrlData.publicUrl,
        path: safeFilename
      });
    }

    // 8. TRAFFIC ANALYTICS
    if (pathname === '/api/traffic/ping' && method === 'POST') {
      const { visitorId } = body;
      if (!visitorId) return jsonResponse({ status: 'missing_visitor_id' });

      const today = new Date().toISOString().split('T')[0];
      const { data: currentContent } = await supabase
        .from('website_content')
        .select('data')
        .eq('section_key', 'traffic_analytics')
        .maybeSingle();

      const traffic = currentContent?.data || { total_visitors: 0, total_page_views: 0, daily_stats: {} };
      const dailyStats = traffic.daily_stats || {};
      const todayStats = dailyStats[today] || { date: today, visitors: 0, page_views: 0, visitor_ids: [] };
      const visitorIds = todayStats.visitor_ids || [];

      if (!visitorIds.includes(visitorId)) {
        visitorIds.push(visitorId);
        todayStats.visitors = (todayStats.visitors || 0) + 1;
        traffic.total_visitors = (traffic.total_visitors || 0) + 1;
      }

      todayStats.page_views = (todayStats.page_views || 0) + 1;
      todayStats.visitor_ids = visitorIds.slice(-500);
      traffic.total_page_views = (traffic.total_page_views || 0) + 1;

      dailyStats[today] = todayStats;
      traffic.daily_stats = dailyStats;

      await supabase.from('website_content').upsert({
        section_key: 'traffic_analytics',
        data: traffic,
        updated_at: new Date().toISOString()
      });

      return jsonResponse({ success: true });
    }

    if (pathname === '/api/traffic/stats' && method === 'GET') {
      const { data: currentContent } = await supabase
        .from('website_content')
        .select('data')
        .eq('section_key', 'traffic_analytics')
        .maybeSingle();

      const traffic = currentContent?.data || { total_visitors: 0, total_page_views: 0, daily_stats: {} };
      const today = new Date().toISOString().split('T')[0];
      const dailyStats: Record<string, any> = traffic.daily_stats || {};
      const todayStats = dailyStats[today] || { visitors: 0, page_views: 0 };
      const visitorsToday = todayStats.visitors || 0;

      let visitors7Days = 0;
      let visitors30Days = 0;
      const dailyChart: { date: string; label: string; visitors: number; page_views: number }[] = [];

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const stat = dailyStats[dateStr] || { visitors: 0, page_views: 0 };

        if (i < 7) visitors7Days += stat.visitors || 0;
        visitors30Days += stat.visitors || 0;

        dailyChart.push({
          date: dateStr,
          label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          visitors: stat.visitors || 0,
          page_views: stat.page_views || 0
        });
      }

      return jsonResponse({
        total_visitors: traffic.total_visitors || 0,
        total_page_views: traffic.total_page_views || 0,
        visitors_today: visitorsToday,
        visitors_7days: visitors7Days,
        visitors_30days: visitors30Days,
        daily_chart: dailyChart
      });
    }

    return jsonResponse({ error: `Route not found: ${method} ${pathname}` }, 404);
  } catch (err: any) {
    return jsonResponse({ error: err?.message || 'Serverless execution error' }, 500);
  }
}
