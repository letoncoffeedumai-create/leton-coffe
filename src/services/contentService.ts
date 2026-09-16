import { Barista, WebsiteContent } from '../types';
import { INITIAL_BARISTAS, INITIAL_WEBSITE_CONTENT } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const CONTENT_STORAGE_KEY = 'leton_cms_content';
const BARISTAS_STORAGE_KEY = 'leton_baristas_data';

export const contentService = {
  async getContent(): Promise<WebsiteContent> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('website_content').select('*');
      if (!error && data && data.length > 0) {
        const merged = { ...INITIAL_WEBSITE_CONTENT };
        data.forEach((row) => {
          if (row.section && row.content) {
            (merged as Record<string, unknown>)[row.section] = row.content;
          }
        });
        return merged;
      }
    }

    const stored = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(INITIAL_WEBSITE_CONTENT));
    return INITIAL_WEBSITE_CONTENT;
  },

  async getWebsiteContent(): Promise<WebsiteContent> {
    return this.getContent();
  },

  async saveContent(content: WebsiteContent): Promise<WebsiteContent> {
    if (isSupabaseConfigured && supabase) {
      const sections = Object.entries(content);
      for (const [section, data] of sections) {
        await supabase.from('website_content').upsert({
          id: `content-${section}`,
          section,
          content: data,
          updated_at: new Date().toISOString()
        });
      }
    }
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    return content;
  },

  async getBaristas(): Promise<Barista[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('baristas').select('*');
      if (!error && data && data.length > 0) {
        return data as Barista[];
      }
    }

    const stored = localStorage.getItem(BARISTAS_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(BARISTAS_STORAGE_KEY, JSON.stringify(INITIAL_BARISTAS));
    return INITIAL_BARISTAS;
  },

  async saveBaristas(baristas: Barista[]): Promise<Barista[]> {
    if (isSupabaseConfigured && supabase) {
      for (const b of baristas) {
        await supabase.from('baristas').upsert(b);
      }
    }
    localStorage.setItem(BARISTAS_STORAGE_KEY, JSON.stringify(baristas));
    return baristas;
  }
};
