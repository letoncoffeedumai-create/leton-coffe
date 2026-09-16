import React from 'react';
import { Profile } from '../../types';

interface ProfileViewProps {
  profile: Profile | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
        <div className="flex items-center gap-4 border-b border-surface-container pb-6 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-2xl uppercase shadow-sm">
            {profile?.full_name?.charAt(0) || 'A'}
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {profile?.full_name || 'Admin Leton'}
            </h3>
            <p className="text-xs text-on-surface-variant font-mono">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary">
                {profile?.role}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface">
                Outlet: {profile?.outlet_id?.toUpperCase() || 'SEMUA'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <span className="font-bold text-on-surface-variant block uppercase text-[10px]">
              ID Pengguna Supabase
            </span>
            <span className="font-mono text-on-surface">{profile?.id}</span>
          </div>

          <div>
            <span className="font-bold text-on-surface-variant block uppercase text-[10px]">
              Tingkat Izin Keamanan
            </span>
            <p className="text-on-surface-variant mt-1 leading-relaxed">
              {profile?.role === 'SUPER_ADMIN'
                ? 'Akses penuh ke seluruh konfigurasi multi-outlet, pesanan konsolidasi pusat, laporan analitik, manajemen pengguna admin, dan konten website.'
                : `Akses terbatas hanya untuk operasional outlet ${profile?.outlet_id?.toUpperCase()}. Dilindungi oleh Row Level Security (RLS) Supabase.`}
            </p>
          </div>

          <div>
            <span className="font-bold text-on-surface-variant block uppercase text-[10px]">
              Waktu Pendaftaran Akun
            </span>
            <span className="text-on-surface">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
