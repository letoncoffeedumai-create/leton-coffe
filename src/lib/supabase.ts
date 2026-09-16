import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

/**
 * Storage bucket definition and upload helpers
 * Bucket: 'leton-images'
 * Folders: menu/, cabang/, barista/, cerita/, receipts/
 */
export const STORAGE_BUCKET = 'leton-images';

export async function uploadImageToStorage(
  folder: 'menu' | 'cabang' | 'barista' | 'cerita' | 'receipts',
  file: File
): Promise<{ url: string; error?: string }> {
  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn('Supabase storage upload error, falling back to object URL:', error);
        return { url: URL.createObjectURL(file) };
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      return { url: publicUrlData.publicUrl };
    } catch (err: unknown) {
      console.warn('Storage upload exception, falling back:', err);
      return { url: URL.createObjectURL(file) };
    }
  }

  // Graceful fallback for local preview
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({ url: e.target?.result as string || URL.createObjectURL(file) });
    };
    reader.onerror = () => {
      resolve({ url: URL.createObjectURL(file) });
    };
    reader.readAsDataURL(file);
  });
}
