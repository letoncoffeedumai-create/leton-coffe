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
 * Storage bucket definitions
 * - PUBLIC: 'leton-images' (logo/, menu/, cabang/, barista/, cerita/, open-booth/, other/)
 * - PRIVATE: 'leton-receipts' (payment proof QRIS - restricted to authenticated staff via signed URLs)
 */
export const STORAGE_BUCKET = 'leton-images'; // Backward compatibility alias
export const PUBLIC_STORAGE_BUCKET = 'leton-images';
export const RECEIPTS_STORAGE_BUCKET = 'leton-receipts';

export async function uploadImageToStorage(
  folder: 'menu' | 'cabang' | 'barista' | 'cerita' | 'receipts' | 'logo' | 'open-booth' | 'other',
  file: File
): Promise<{ url: string; error?: string }> {
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

      if (error) {
        console.warn('Supabase storage upload error, falling back to object URL:', error);
        return { url: URL.createObjectURL(file) };
      }

      // If it's a private receipt, NEVER generate public URL.
      // Return a signed URL or path for secure reference.
      if (isReceipt) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(RECEIPTS_STORAGE_BUCKET)
          .createSignedUrl(data.path, 86400); // 24 hours validity

        if (!signedError && signedData?.signedUrl) {
          return { url: signedData.signedUrl };
        }
        return { url: data.path };
      }

      const { data: publicUrlData } = supabase.storage
        .from(PUBLIC_STORAGE_BUCKET)
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
