import { Category, Product } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const PRODUCTS_STORAGE_KEY = 'leton_products_data';
const CATEGORIES_STORAGE_KEY = 'leton_categories_data';

export const productService = {
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');
      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    }

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

  async saveCategory(category: Category): Promise<Category> {
    const safeCategory: Category = {
      ...category,
      is_active: category.is_active ?? true
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const payload: any = {
          id: safeCategory.id,
          name: safeCategory.name,
          slug: safeCategory.slug,
          display_order: safeCategory.display_order
        };
        if (safeCategory.is_active !== undefined) {
          payload.is_active = safeCategory.is_active;
        }
        const { error } = await supabase.from('categories').upsert(payload);
        if (error && error.message?.includes('is_active')) {
          delete payload.is_active;
          await supabase.from('categories').upsert(payload);
        }
      } catch (err) {
        console.warn('Could not save category to Supabase, saving locally:', err);
      }
    }

    const current = await this.getCategories();
    const existingIndex = current.findIndex((c) => c.id === safeCategory.id);
    let updated: Category[];
    if (existingIndex >= 0) {
      updated = current.map((c) => (c.id === safeCategory.id ? safeCategory : c));
    } else {
      updated = [...current, safeCategory];
    }
    // Maintain display_order sorting
    updated.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    return safeCategory;
  },

  async createCategory(categoryData: Omit<Category, 'id'> & { id?: string }): Promise<Category> {
    const current = await this.getCategories();
    const maxOrder = current.reduce((max, c) => Math.max(max, c.display_order || 0), 0);
    const newCategory: Category = {
      id: categoryData.id || `cat-${Date.now()}`,
      name: categoryData.name.trim(),
      slug: (categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')).trim(),
      display_order: categoryData.display_order ?? (maxOrder + 1),
      is_active: categoryData.is_active ?? true
    };
    return this.saveCategory(newCategory);
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const current = await this.getCategories();
    const target = current.find((c) => c.id === id);
    if (!target) return null;
    const merged: Category = {
      ...target,
      ...updates,
      id: target.id // protect ID
    };
    return this.saveCategory(merged);
  },

  async deleteCategory(categoryId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('categories').delete().eq('id', categoryId);
      } catch (err) {
        console.warn('Could not delete category from Supabase:', err);
      }
    }
    const current = await this.getCategories();
    const updated = current.filter((c) => c.id !== categoryId);
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
  },

  async toggleCategoryActive(categoryId: string): Promise<Category | null> {
    const current = await this.getCategories();
    const target = current.find((c) => c.id === categoryId);
    if (!target) return null;
    const currentActive = target.is_active ?? true;
    return this.updateCategory(categoryId, { is_active: !currentActive });
  },

  async reorderCategories(orderedIds: string[]): Promise<Category[]> {
    const current = await this.getCategories();
    const reordered: Category[] = [];

    for (let index = 0; index < orderedIds.length; index++) {
      const catId = orderedIds[index];
      const found = current.find((c) => c.id === catId);
      if (found) {
        const updatedCat: Category = {
          ...found,
          display_order: index + 1
        };
        reordered.push(updatedCat);
      }
    }

    // Include any categories not in orderedIds at the end
    current.forEach((c) => {
      if (!orderedIds.includes(c.id)) {
        reordered.push(c);
      }
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all(
          reordered.map((cat, idx) =>
            supabase!.from('categories').update({ display_order: idx + 1 }).eq('id', cat.id)
          )
        );
      } catch (err) {
        console.warn('Could not update category order in Supabase:', err);
      }
    }

    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(reordered));
    return reordered;
  },

  async getProducts(): Promise<Product[]> {
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
    return this.saveProduct(product);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const current = await this.getProducts();
    const target = current.find((p) => p.id === id);
    if (!target) return null;
    const merged = { ...target, ...updates };
    return this.saveProduct(merged);
  },

  async deleteProduct(productId: string): Promise<void> {
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
    const updatedProduct = { ...target, is_active: !target.is_active };
    return this.saveProduct(updatedProduct);
  }
};
