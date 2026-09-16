import React, { useState } from 'react';
import { Outlet } from '../../types';

interface OutletsManagementViewProps {
  outlets: Outlet[];
  onUpdateOutlet?: (updated: Outlet) => void;
}

export const OutletsManagementView: React.FC<OutletsManagementViewProps> = ({ outlets }) => {
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
        <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
          Manajemen Outlet & Cabang Leton Coffee
        </h3>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Kelola informasi lokasi, jam operasional, dan fasilitas cabang Leton Coffee Dumai.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outlets.map((outlet) => (
          <div
            key={outlet.id}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="relative h-44 rounded-xl overflow-hidden mb-4 bg-surface-container">
                <img
                  src={outlet.image_url}
                  alt={outlet.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary text-on-primary shadow-xs">
                  {outlet.chapter_label || 'CHAPTER'}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                  {outlet.is_active ? 'Buka Normal' : 'Tutup Sementara'}
                </span>
              </div>

              <h4 className="font-title-lg font-bold text-on-surface">{outlet.name}</h4>
              <p className="text-xs text-primary font-semibold mt-0.5">{outlet.subtitle}</p>

              <div className="mt-3 space-y-2 text-xs text-on-surface-variant">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                    location_on
                  </span>
                  <span>{outlet.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                    schedule
                  </span>
                  <span>{outlet.opening_hours}</span>
                </div>
              </div>

              {/* Features */}
              <div className="mt-3 pt-3 border-t border-surface-container flex flex-wrap gap-1.5">
                {outlet.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container text-on-surface-variant"
                  >
                    ✓ {feat}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-surface-container flex items-center justify-between">
              <span className="text-[11px] font-mono text-outline">ID: {outlet.id}</span>
              <button
                onClick={() => setEditingOutlet(outlet)}
                className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
              >
                Edit Informasi
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Outlet Modal */}
      {editingOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl p-6 shadow-2xl">
            <h4 className="font-title-lg font-bold text-on-surface mb-4">
              Edit {editingOutlet.name}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Jam Operasional</label>
                <input
                  type="text"
                  defaultValue={editingOutlet.opening_hours}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  defaultValue={editingOutlet.address}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">URL Foto Outlet</label>
                <input
                  type="text"
                  defaultValue={editingOutlet.image_url}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditingOutlet(null)}
                className="px-4 py-2 rounded-full bg-surface-container text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => setEditingOutlet(null)}
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
