import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
export const DEFAULT_SUPABASE_URL = 'https://njadckejuivvllyrqdeg.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_fJ-54g2FixUlH-gx_xPT0A_8lfRyP4o';

const supabaseUrl = (metaEnv.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

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
 * Storage bucket definitions
 * - PUBLIC: 'leton-images' (logo/, menu/, cabang/, barista/, cerita/, open-booth/, other/)
 * - PRIVATE: 'leton-receipts' (payment proof QRIS - restricted to authenticated staff via signed URLs)
 */
export const STORAGE_BUCKET = 'leton-images'; // Backward compatibility alias
export const PUBLIC_STORAGE_BUCKET = 'leton-images';
export const RECEIPTS_STORAGE_BUCKET = 'leton-receipts';

export async function uploadImageToStorage(
  folder: 'menu' | 'cabang' | 'barista' | 'cerita' | 'receipts' | 'logo' | 'open-booth' | 'payment' | 'qris' | 'other',
  file: File
): Promise<{ url: string; error?: string }> {
  try {
    // 1. Try server-side upload proxy first (uses Supabase Service Role for guaranteed storage permissions)
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder,
        filename: file.name,
        base64Data,
        contentType: file.type || 'image/jpeg'
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.url) {
        return { url: json.url };
      }
    }
  } catch (apiErr) {
    console.warn('API upload proxy failed, trying direct client storage:', apiErr);
  }

  const isReceipt = folder === 'receipts';
  const targetBucket = isReceipt ? RECEIPTS_STORAGE_BUCKET : PUBLIC_STORAGE_BUCKET;
  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.storage
        .from(targetBucket)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (!error && data) {
        if (isReceipt) {
          const { data: signedData } = await supabase.storage
            .from(RECEIPTS_STORAGE_BUCKET)
            .createSignedUrl(data.path, 86400);
          if (signedData?.signedUrl) return { url: signedData.signedUrl };
          return { url: data.path };
        }

        const { data: publicUrlData } = supabase.storage
          .from(PUBLIC_STORAGE_BUCKET)
          .getPublicUrl(data.path);

        return { url: publicUrlData.publicUrl };
      }
    } catch (err: unknown) {
      console.warn('Direct storage upload exception, falling back:', err);
    }
  }

  // Graceful fallback for local preview
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({ url: (e.target?.result as string) || URL.createObjectURL(file) });
    };
    reader.onerror = () => {
      resolve({ url: URL.createObjectURL(file) });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a temporary signed URL for viewing private payment receipts in Admin
 * Validity: defaults to 3600 seconds (1 hour)
 */
export async function getReceiptSignedUrl(pathOrUrl: string, expiresIn = 3600): Promise<string> {
  if (!pathOrUrl) return '';
  if (!supabase || !isSupabaseConfigured) return pathOrUrl;

  // If it's already a full signed URL or blob, return as is
  if (pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:') || pathOrUrl.includes('token=')) {
    return pathOrUrl;
  }

  // Extract path from storage URL if full URL was stored
  let cleanPath = pathOrUrl;
  if (pathOrUrl.includes(RECEIPTS_STORAGE_BUCKET)) {
    const parts = pathOrUrl.split(`${RECEIPTS_STORAGE_BUCKET}/`);
    if (parts[1]) cleanPath = parts[1].split('?')[0];
  }

  try {
    const { data, error } = await supabase.storage
      .from(RECEIPTS_STORAGE_BUCKET)
      .createSignedUrl(cleanPath, expiresIn);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('Failed to create signed URL for receipt:', err);
  }

  return pathOrUrl;
}
