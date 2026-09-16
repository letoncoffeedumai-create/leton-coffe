import { Outlet } from '../types';
import { INITIAL_OUTLETS } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const OUTLETS_STORAGE_KEY = 'leton_outlets_data';

export const outletService = {
  async getOutlets(): Promise<Outlet[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .order('id');
      if (!error && data && data.length > 0) {
        return data as Outlet[];
      }
    }

    const stored = localStorage.getItem(OUTLETS_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(OUTLETS_STORAGE_KEY, JSON.stringify(INITIAL_OUTLETS));
    return INITIAL_OUTLETS;
  },

  async updateOutlet(outlet: Outlet): Promise<Outlet> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('outlets').upsert(outlet);
    }
    const current = await this.getOutlets();
    const updated = current.map((o) => (o.id === outlet.id ? outlet : o));
    localStorage.setItem(OUTLETS_STORAGE_KEY, JSON.stringify(updated));
    return outlet;
  }
};
