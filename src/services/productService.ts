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
        return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
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
