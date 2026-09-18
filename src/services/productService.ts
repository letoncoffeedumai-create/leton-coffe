import { Category, Product } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateCategorySlug } from '../lib/slug';

const PRODUCTS_STORAGE_KEY = 'leton_products_data';
const CATEGORIES_STORAGE_KEY = 'leton_categories_data';

export const productService = {
  async getCategories(): Promise<Category[]> {
    // 1. Primary: fetch from server-side Supabase API
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(data));
          return data as Category[];
        }
      }
    } catch {
      // fallback to direct client if server API not reachable
    }

    // 2. Direct Supabase client query
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const { data: meta } = await supabase
            .from('website_content')
            .select('data')
            .eq('section_key', 'category_metadata')
            .maybeSingle();

          const inactiveIds = (meta?.data?.inactive_ids as string[]) || [];
          const categoriesWithStatus = data.map((cat) => ({
            ...cat,
            is_active: !inactiveIds.includes(cat.id)
          }));

          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categoriesWithStatus));
          return categoriesWithStatus as Category[];
        }
      } catch (err) {
        console.warn('Direct Supabase fetch failed:', err);
      }
    }

    // 3. LocalStorage fallback
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  },

  async createCategory(categoryData: {
    name: string;
    display_order?: number;
    is_active?: boolean;
    id?: string;
  }): Promise<Category> {
    const trimmedName = categoryData.name.trim();
    if (!trimmedName) {
      throw new Error('Nama kategori tidak boleh kosong.');
    }

    let serverErrorMsg = '';

    // Primary: Call server-side API (bypasses RLS with Service Role)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          display_order: categoryData.display_order,
          is_active: categoryData.is_active !== false,
          id: categoryData.id
        })
      });
      const result = await res.json();
      if (!res.ok) {
        serverErrorMsg = result.error || 'Gagal menyimpan kategori baru ke Supabase.';
      } else {
        await this.getCategories(); // refresh cache
        return result as Category;
      }
    } catch (err: any) {
      serverErrorMsg = err?.message || 'Gagal menghubungi server.';
    }

    // If server returned error, throw clearly
    if (serverErrorMsg && isSupabaseConfigured) {
      throw new Error(serverErrorMsg);
    }

    // Fallback: local storage
    const current = await this.getCategories();
    const maxOrder = current.reduce((max, c) => Math.max(max, c.display_order || 0), 0);
    const slug = generateCategorySlug(trimmedName);
    const newCategory: Category = {
      id: categoryData.id || `cat-${Date.now()}`,
      name: trimmedName,
      slug,
      display_order: categoryData.display_order ?? (maxOrder + 1),
      is_active: categoryData.is_active !== false
    };

    const updated = [...current, newCategory].sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    );
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    return newCategory;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    if (!id) {
      throw new Error('ID kategori tidak valid untuk pembaruan.');
    }

    let serverErrorMsg = '';

    // Primary: Call server-side API (bypasses RLS with Service Role and updates products)
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const result = await res.json();
      if (!res.ok) {
        serverErrorMsg = result.error || 'Gagal memperbarui kategori di Supabase.';
      } else {
        await this.getCategories(); // refresh cache
        return result as Category;
      }
    } catch (err: any) {
      serverErrorMsg = err?.message || 'Gagal menghubungi server.';
    }

    // If server returned an error, throw it so UI displays the exact Supabase error
    if (serverErrorMsg && isSupabaseConfigured) {
      throw new Error(serverErrorMsg);
    }

    // Fallback: local state
    const current = await this.getCategories();
    const target = current.find((c) => c.id === id);
    if (!target) {
      throw new Error(`Kategori dengan ID "${id}" tidak ditemukan.`);
    }

    const merged: Category = {
      ...target,
      ...updates,
      id: target.id,
      slug: updates.name ? generateCategorySlug(updates.name) : target.slug
    };

    const updated = current
      .map((c) => (c.id === id ? merged : c))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    return merged;
  },

  async deleteCategory(categoryId: string): Promise<void> {
    if (!categoryId) {
      throw new Error('ID kategori tidak valid untuk penghapusan.');
    }

    let serverErrorMsg = '';

    // Primary: Call server-side API
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) {
        serverErrorMsg = result.error || 'Gagal menghapus kategori dari Supabase.';
      } else {
        await this.getCategories(); // refresh cache
        return;
      }
    } catch (err: any) {
      serverErrorMsg = err?.message || 'Gagal menghubungi server.';
    }

    // If server returned error, throw clearly
    if (serverErrorMsg && isSupabaseConfigured) {
      throw new Error(serverErrorMsg);
    }

    // Fallback: local state
    const current = await this.getCategories();
    const updated = current.filter((c) => c.id !== categoryId);
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
  },

  async toggleCategoryActive(categoryId: string): Promise<Category> {
    const current = await this.getCategories();
    const target = current.find((c) => c.id === categoryId);
    if (!target) {
      throw new Error(`Kategori dengan ID "${categoryId}" tidak ditemukan.`);
    }
    const currentActive = target.is_active !== false;
    return this.updateCategory(categoryId, { is_active: !currentActive });
  },

  async reorderCategories(orderedIds: string[]): Promise<Category[]> {
    if (!Array.isArray(orderedIds)) {
      throw new Error('Daftar ID kategori tidak valid.');
    }

    let serverErrorMsg = '';

    // Primary: Call server-side API
    try {
      const res = await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds })
      });
      const result = await res.json();
      if (!res.ok) {
        serverErrorMsg = result.error || 'Gagal memperbarui urutan kategori di Supabase.';
      } else {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(result));
        return result as Category[];
      }
    } catch (err: any) {
      serverErrorMsg = err?.message || 'Gagal menghubungi server.';
    }

    if (serverErrorMsg && isSupabaseConfigured) {
      throw new Error(serverErrorMsg);
    }

    // Fallback: local state
    const current = await this.getCategories();
    const reordered: Category[] = [];

    for (let index = 0; index < orderedIds.length; index++) {
      const catId = orderedIds[index];
      const found = current.find((c) => c.id === catId);
      if (found) {
        reordered.push({ ...found, display_order: index + 1 });
      }
    }

    current.forEach((c) => {
      if (!orderedIds.includes(c.id)) {
        reordered.push(c);
      }
    });

    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(reordered));
    return reordered;
  },

  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(data));
          return data as Product[];
        }
      }
    } catch (apiErr) {
      console.warn('API getProducts failed, trying client supabase:', apiErr);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id');
      if (!error && data && data.length > 0) {
        return data as Product[];
      }
    }

    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  },

  async saveProduct(product: Product): Promise<Product> {
    try {
      // Check if product exists in current cache to decide POST or PUT
      const current = await this.getProducts();
      const existing = current.find((p) => p.id === product.id);

      const url = existing ? `/api/products/${product.id}` : '/api/products';
      const method = existing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });

      if (res.ok) {
        const saved = await res.json();
        const updated = existing
          ? current.map((p) => (p.id === product.id ? saved : p))
          : [saved, ...current];
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
        return saved;
      }
    } catch (apiErr) {
      console.warn('API saveProduct failed, fallback to client supabase:', apiErr);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('products').upsert(product);
    }
    const current = await this.getProducts();
    const existingIndex = current.findIndex((p) => p.id === product.id);
    let updated: Product[];
    if (existingIndex >= 0) {
      updated = current.map((p) => (p.id === product.id ? product : p));
    } else {
      updated = [product, ...current];
    }
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
    return product;
  },

  async createProduct(product: Product): Promise<Product> {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        const saved = await res.json();
        const current = await this.getProducts();
        const updated = [saved, ...current.filter((p) => p.id !== saved.id)];
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
        return saved;
      }
    } catch (apiErr) {
      console.warn('API createProduct failed:', apiErr);
    }
    return this.saveProduct(product);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const saved = await res.json();
        const current = await this.getProducts();
        const updated = current.map((p) => (p.id === id ? saved : p));
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
        return saved;
      }
    } catch (apiErr) {
      console.warn('API updateProduct failed:', apiErr);
    }

    const current = await this.getProducts();
    const target = current.find((p) => p.id === id);
    if (!target) return null;
    const merged = { ...target, ...updates };
    return this.saveProduct(merged);
  },

  async deleteProduct(productId: string): Promise<void> {
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
    } catch (apiErr) {
      console.warn('API deleteProduct failed:', apiErr);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('products').delete().eq('id', productId);
    }
    const current = await this.getProducts();
    const updated = current.filter((p) => p.id !== productId);
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updated));
  },

  async toggleProductActive(productId: string): Promise<Product | null> {
    const current = await this.getProducts();
    const target = current.find((p) => p.id === productId);
    if (!target) return null;
    return this.updateProduct(productId, { is_active: !target.is_active });
  },

  // --------------------------------------------------------------------------
  // Toppings API
  // --------------------------------------------------------------------------
  async getToppings(): Promise<any[]> {
    try {
      const res = await fetch('/api/toppings');
      if (res.ok) {
        return await res.json();
      }
    } catch (apiErr) {
      console.warn('Failed to fetch toppings:', apiErr);
    }
    return [];
  },

  async createTopping(topping: { name: string; price: number; category?: string; is_active?: boolean }): Promise<any> {
    const res = await fetch('/api/toppings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topping)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menambahkan topping');
    }
    return await res.json();
  },

  async updateTopping(id: string, updates: Partial<{ name: string; price: number; category: string; is_active: boolean }>): Promise<any> {
    const res = await fetch(`/api/toppings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengubah topping');
    }
    return await res.json();
  },

  async deleteTopping(id: string): Promise<void> {
    const res = await fetch(`/api/toppings/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus topping');
    }
  }
};
