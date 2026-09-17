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

  app.use(express.json());

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
