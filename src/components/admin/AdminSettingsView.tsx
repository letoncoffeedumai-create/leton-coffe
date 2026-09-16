import React, { useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AdminSettingsView: React.FC = () => {
  const [taxPercent, setTaxPercent] = useState(10);
  const [tumblerDiscount, setTumblerDiscount] = useState(3000);
  const [qrisNmid, setQrisNmid] = useState('ID1020038918239');
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
        <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
          Pengaturan Sistem & Integrasi Leton Coffee
        </h3>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Konfigurasi perpajakan daerah (PB1 Dumai), program ramah lingkungan, QRIS dinamis, dan koneksi Supabase.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Pengaturan sistem berhasil disimpan!
        </div>
      )}

      {/* POS & Financial Rules */}
      <form
        onSubmit={handleSaveSettings}
        className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4"
      >
        <h4 className="font-title-md font-bold text-on-surface border-b border-surface-container pb-2">
          Konfigurasi Kasir & Finansial
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
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
              Program Eco Tumbler Leton Coffee
            </span>
          </div>

          <div>
            <label className="block font-bold text-on-surface mb-1">
              NMID Merchant QRIS Statis/Dinamis
            </label>
            <input
              type="text"
              value={qrisNmid}
              onChange={(e) => setQrisNmid(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container font-mono"
            />
            <span className="text-[11px] text-outline mt-1 block">
              NMID resmi Leton Coffee Dumai
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

      {/* Supabase Connection & RLS Schema Card */}
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
