import React, { useState } from 'react';
import { Barista, WebsiteContent } from '../../types';

interface WebsiteCMSViewProps {
  content: WebsiteContent;
  baristas: Barista[];
  onUpdateContent?: (newContent: WebsiteContent) => void;
  onUpdateBaristas?: (newBaristas: Barista[]) => void;
}

export const WebsiteCMSView: React.FC<WebsiteCMSViewProps> = ({
  content,
  baristas
}) => {
  const [activeTab, setActiveTab] = useState<'hero' | 'baristas' | 'booth' | 'contact'>('hero');
  const [heroTagline, setHeroTagline] = useState(content.hero.tagline);
  const [heroSubtitle, setHeroSubtitle] = useState(content.hero.subtitle);
  const [localBaristas, setLocalBaristas] = useState<Barista[]>(baristas);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggleBaristaDuty = (id: string) => {
    setLocalBaristas(
      localBaristas.map((b) => (b.id === id ? { ...b, is_on_duty: !b.is_on_duty } : b))
    );
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-surface-container pb-2">
        <button
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'hero'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Hero & Tagline
        </button>
        <button
          onClick={() => setActiveTab('baristas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'baristas'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Tim Barista
        </button>
        <button
          onClick={() => setActiveTab('booth')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'booth'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Open Booth & Event
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'contact'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Kontak & Sosmed
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Perubahan konten website berhasil disimpan!
        </div>
      )}

      {/* HERO SECTION CMS */}
      {activeTab === 'hero' && (
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
            Konten Hero Homepage
          </h3>
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Tagline Utama</label>
            <input
              type="text"
              value={heroTagline}
              onChange={(e) => setHeroTagline(e.target.value)}
              className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container text-xs sm:text-sm text-on-surface"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Subjudul / Cerita</label>
            <textarea
              rows={3}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface"
            ></textarea>
          </div>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container cursor-pointer"
          >
            Simpan Perubahan Hero
          </button>
        </div>
      )}

      {/* BARISTAS CMS */}
      {activeTab === 'baristas' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-title-lg font-bold text-on-surface">Manajemen Barista & Kru</h3>
              <p className="text-xs text-on-surface-variant">
                Atur kru yang bertugas (on duty) di masing-masing bar outlet.
              </p>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold"
            >
              Simpan Jadwal Barista
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {localBaristas.map((barista) => (
              <div
                key={barista.id}
                className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={barista.image_url}
                    alt={barista.name}
                    className="w-12 h-12 rounded-full object-cover border border-surface-container"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h5 className="font-bold text-sm text-on-surface">{barista.name}</h5>
                    <span className="text-xs text-primary block">{barista.role}</span>
                    <span className="text-[11px] text-outline">{barista.outlet}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleBaristaDuty(barista.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                    barista.is_on_duty
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {barista.is_on_duty ? 'On Duty' : 'Off'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOOTH CMS */}
      {activeTab === 'booth' && (
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
            Open Booth & Event Catering
          </h3>
          <p className="text-xs text-on-surface-variant">
            Layanan live brew coffee cart Leton Coffee untuk acara pernikahan, gathering kantor, dan festival Dumai.
          </p>
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-2 text-xs">
            <div className="font-bold text-on-surface">Paket Live Brew Standard</div>
            <div className="text-on-surface-variant">Mulai dari 100 Cups espresso-based minuman segar.</div>
            <div className="font-mono text-primary font-bold">Rp 1.800.000 (Includes 2 Baristas + Setup)</div>
          </div>
        </div>
      )}

      {/* CONTACT CMS */}
      {activeTab === 'contact' && (
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
            Informasi Kontak & Sosmed
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold mb-1">WhatsApp Customer Service</label>
              <input
                type="text"
                defaultValue={content?.contact?.whatsapp || '+62 812-3456-7890'}
                className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Email Resmi</label>
              <input
                type="email"
                defaultValue={(content?.contact as any)?.email || 'hello@letoncoffee.id'}
                className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Instagram Handle</label>
              <input
                type="text"
                defaultValue={content?.contact?.instagram || '@letoncoffee'}
                className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">TikTok Handle</label>
              <input
                type="text"
                defaultValue={(content?.contact as any)?.tiktok || '@letoncoffee'}
                className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container cursor-pointer"
          >
            Simpan Kontak
          </button>
        </div>
      )}
    </div>
  );
};
