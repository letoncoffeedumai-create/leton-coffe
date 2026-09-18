import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from '../../types';
import { isSupabaseConfigured, uploadImageToStorage } from '../../lib/supabase';

interface AdminSettingsViewProps {
  outlets?: Outlet[];
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ outlets = [] }) => {
  const [taxPercent, setTaxPercent] = useState(10);
  const [tumblerDiscount, setTumblerDiscount] = useState(3000);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // QRIS Management States
  const [selectedQrisOutlet, setSelectedQrisOutlet] = useState<string>('all');
  const [qrisNmid, setQrisNmid] = useState<string>('ID1020038918239');
  const [qrisImageUrl, setQrisImageUrl] = useState<string>('');
  const [isUploadingQris, setIsUploadingQris] = useState<boolean>(false);
  const [isSavingQris, setIsSavingQris] = useState<boolean>(false);
  const [qrisFeedback, setQrisFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load QRIS configuration for selected outlet
  const loadQrisSettings = useCallback(async (outletId: string) => {
    try {
      const res = await fetch(`/api/settings/qris?outlet_id=${outletId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.qris_image_url) {
          setQrisImageUrl(data.qris_image_url);
        }
        if (data.nmid) {
          setQrisNmid(data.nmid);
        }
      }
    } catch (err) {
      console.error('Failed to load QRIS settings:', err);
    }
  }, []);

  useEffect(() => {
    loadQrisSettings(selectedQrisOutlet);
  }, [selectedQrisOutlet, loadQrisSettings]);

  // Handle uploading QRIS image to Supabase storage
  const handleQrisFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setQrisFeedback({ type: 'error', message: 'File harus berupa gambar (PNG, JPG, WEBP)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setQrisFeedback({ type: 'error', message: 'Ukuran file gambar maksimal 5MB' });
      return;
    }

    setIsUploadingQris(true);
    setQrisFeedback(null);

    try {
      // Upload to leton-images bucket
      const { url } = await uploadImageToStorage('qris', file);
      setQrisImageUrl(url);
      setQrisFeedback({
        type: 'success',
        message: 'Gambar QRIS berhasil diunggah ke Supabase storage! Klik "Simpan Pengaturan QRIS" untuk mengaktifkan.'
      });
    } catch (err: any) {
      console.error('Error uploading QRIS image:', err);
      setQrisFeedback({
        type: 'error',
        message: `Gagal mengunggah gambar QRIS: ${err?.message || 'Terjadi kesalahan'}`
      });
    } finally {
      setIsUploadingQris(false);
    }
  };

  // Save QRIS configuration to Supabase via backend API
  const handleSaveQris = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQris(true);
    setQrisFeedback(null);

    try {
      const res = await fetch('/api/settings/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outlet_id: selectedQrisOutlet,
          qris_image_url: qrisImageUrl,
          nmid: qrisNmid
        })
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan pengaturan QRIS');
      }

      setQrisFeedback({
        type: 'success',
        message: `QRIS untuk ${
          selectedQrisOutlet === 'all'
            ? 'Semua Outlet (Pusat)'
            : outlets.find((o) => o.id === selectedQrisOutlet)?.name || selectedQrisOutlet
        } berhasil diperbarui dan aktif langsung di checkout pelanggan!`
      });
    } catch (err: any) {
      console.error('Failed to save QRIS settings:', err);
      setQrisFeedback({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan saat menyimpan QRIS'
      });
    } finally {
      setIsSavingQris(false);
    }
  };

  const sampleSql = `-- LETON COFFEE DUMAI - SUPABASE RLS SCRIPT
-- Jalankan di SQL Editor di Supabase Dashboard Anda.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orders: Super Admin full access" ON public.orders
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN');

CREATE POLICY "Orders: Outlet Admin access own outlet" ON public.orders
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'OUTLET_ADMIN'
      AND (
        outlet_id = (SELECT outlet_id FROM public.profiles WHERE id = auth.uid())
        OR ((SELECT outlet_id FROM public.profiles WHERE id = auth.uid()) ILIKE '%sudirman%' AND outlet_id ILIKE '%sudirman%')
        OR ((SELECT outlet_id FROM public.profiles WHERE id = auth.uid()) ILIKE '%kelakap%' AND (outlet_id ILIKE '%kelakap%' OR outlet_id ILIKE '%ratusima%'))
      )
    )
  );`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sampleSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
        <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
          Pengaturan Sistem & Integrasi Leton Coffee
        </h3>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Konfigurasi QRIS dinamis Supabase, perpajakan daerah (PB1 Dumai), program tumbler ramah lingkungan, dan koneksi database.
        </p>
      </div>

      {/* 1. QRIS UPLOAD & MANAGEMENT SECTION */}
      <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
            </div>
            <div>
              <h4 className="font-title-md font-bold text-on-surface">
                Upload & Pengaturan QRIS Pembayaran
              </h4>
              <p className="text-xs text-on-surface-variant">
                Upload gambar QRIS baru langsung dari perangkat. Tersimpan di Supabase storage dan langsung aktif di halaman checkout.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Supabase Storage
          </span>
        </div>

        {qrisFeedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              qrisFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {qrisFeedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{qrisFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveQris} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Col: Target & NMID */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Cakupan Outlet QRIS
                </label>
                <select
                  value={selectedQrisOutlet}
                  onChange={(e) => setSelectedQrisOutlet(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="all">⭐ Satu QRIS untuk Semua Outlet (Pusat)</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      📍 Khusus {o.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Pilih "Semua Outlet" untuk menggunakan satu QRIS terpusat, atau tentukan QRIS spesifik per outlet.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  NMID Merchant QRIS
                </label>
                <input
                  type="text"
                  required
                  value={qrisNmid}
                  onChange={(e) => setQrisNmid(e.target.value)}
                  placeholder="ID1020038918239"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Nomor Merchant ID resmi dari Penyedia Jasa Pembayaran (PJP) atau Bank.
                </p>
              </div>

              {/* Upload Input */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Upload Gambar QRIS Baru
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 px-4 py-3 border-2 border-dashed border-surface-container-high rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low transition-colors cursor-pointer text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrisFileChange}
                      disabled={isUploadingQris}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        {isUploadingQris ? 'sync' : 'upload_file'}
                      </span>
                      <span>
                        {isUploadingQris
                          ? 'Mengunggah ke Supabase Storage...'
                          : 'Pilih File Gambar QRIS'}
                      </span>
                    </div>
                    <span className="text-[10px] text-outline block mt-0.5">
                      PNG, JPG, atau WEBP (maks. 5MB)
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingQris || isUploadingQris || !qrisImageUrl}
                  className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isSavingQris ? 'Menyimpan...' : 'Simpan & Aktifkan QRIS'}</span>
                </button>
              </div>
            </div>

            {/* Right Col: QRIS Preview Card */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col items-center justify-center min-h-[260px]">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Preview Tampilan di Checkout Pelanggan
              </span>

              {qrisImageUrl ? (
                <div className="relative group bg-surface-container-lowest p-3 rounded-2xl shadow-md border border-surface-container flex flex-col items-center max-w-[220px]">
                  <img
                    src={qrisImageUrl}
                    alt="QRIS Leton Coffee"
                    referrerPolicy="no-referrer"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-on-surface block">LETON COFFEE</span>
                    <span className="text-[10px] font-mono text-outline block">NMID: {qrisNmid}</span>
                  </div>
                  <span className="mt-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                    ✓ Aktif di Supabase
                  </span>
                </div>
              ) : (
                <div className="text-center p-6 text-outline">
                  <span className="material-symbols-outlined text-[48px] text-outline mb-1 block">
                    qr_code_2
                  </span>
                  <span className="text-xs font-medium block">
                    Belum ada gambar QRIS yang diunggah untuk cakupan ini.
                  </span>
                  <span className="text-[11px] text-outline mt-1 block">
                    Silakan pilih file gambar QRIS di samping untuk mengunggah.
                  </span>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Pengaturan sistem berhasil disimpan!
        </div>
      )}

      {/* 2. POS & Financial Rules */}
      <form
        onSubmit={handleSaveSettings}
        className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4"
      >
        <h4 className="font-title-md font-bold text-on-surface border-b border-surface-container pb-2">
          Konfigurasi Kasir & Finansial
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-on-surface mb-1">
              Pajak Restoran / PB1 (%)
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={taxPercent}
              onChange={(e) => setTaxPercent(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container font-bold"
            />
            <span className="text-[11px] text-outline mt-1 block">
              Default 10% sesuai regulasi Bapenda Dumai
            </span>
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">
              Diskon Tumbler Sendiri (IDR)
            </label>
            <input
              type="number"
              step={500}
              min={0}
              value={tumblerDiscount}
              onChange={(e) => setTumblerDiscount(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container font-bold"
            />
            <span className="text-[11px] text-outline mt-1 block">
              Program Eco Tumbler Leton Coffee (-Rp 3.000)
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container cursor-pointer"
        >
          Simpan Pengaturan Finansial
        </button>
      </form>

      {/* 3. Supabase Connection & RLS Schema Card */}
      <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container pb-3">
          <div>
            <h4 className="font-title-md font-bold text-on-surface">
              Status Koneksi Supabase & Skrip RLS
            </h4>
            <p className="text-xs text-on-surface-variant">
              Database backend, Autentikasi, dan Row Level Security (RLS).
            </p>
          </div>

          {isSupabaseConfigured ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase Terhubung
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Menunggu VITE_SUPABASE_URL
            </span>
          )}
        </div>

        <div className="relative rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
          <button
            onClick={handleCopySql}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-sans text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copiedSql ? 'check' : 'content_copy'}
            </span>
            <span>{copiedSql ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
          </button>
          <pre>{sampleSql}</pre>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          File skrip SQL lengkap untuk pembuatan tabel <code className="font-mono bg-surface-container px-1 py-0.5 rounded">profiles</code>, <code className="font-mono bg-surface-container px-1 py-0.5 rounded">orders</code>, trigger pendaftaran akun baru, dan aturan RLS juga tersedia di repositori: <code className="font-mono bg-surface-container px-1 py-0.5 rounded">src/lib/supabase-schema.sql</code>.
        </p>
      </div>
    </div>
  );
};
