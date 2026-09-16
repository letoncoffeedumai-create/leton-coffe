import React from 'react';
import { Profile } from '../../types';

interface AccessDeniedProps {
  profile: Profile | null;
  requiredRole?: string;
  onBackToDashboard: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  profile,
  requiredRole = 'SUPER_ADMIN',
  onBackToDashboard
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <div className="w-20 h-20 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mb-6 shadow-xs ring-8 ring-red-50/50">
        <span className="material-symbols-outlined text-[44px]">shield_lock</span>
      </div>

      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 mb-2">
        Akses Ditolak
      </span>

      <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">
        Izin Akses Tidak Mencukupi
      </h2>

      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6 leading-relaxed">
        Anda sedang masuk sebagai{' '}
        <span className="font-semibold text-primary">
          {profile?.role === 'OUTLET_ADMIN'
            ? `Outlet Admin (${profile.outlet_id?.toUpperCase() || 'CABANG'})`
            : profile?.role || 'Admin'}
        </span>
        . Halaman ini memerlukan hak akses tingkat{' '}
        <span className="font-semibold text-red-700">{requiredRole}</span>.
      </p>

      <button
        onClick={onBackToDashboard}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg font-bold hover:bg-primary-container transition-all shadow-md cursor-pointer"
        type="button"
      >
        <span className="material-symbols-outlined text-[20px]">dashboard</span>
        Kembali ke Dashboard Outlet
      </button>
    </div>
  );
};
