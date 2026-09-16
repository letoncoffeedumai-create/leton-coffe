import React from 'react';
import { Outlet, Profile } from '../../types';

interface AdminHeaderProps {
  profile: Profile | null;
  outlets: Outlet[];
  selectedOutletFilter: string;
  onSelectOutletFilter: (outletId: string) => void;
  onRefresh: () => void;
  onBackToWebsite: () => void;
  onLogout: () => void;
  onToggleMobileMenu: () => void;
  currentTabTitle: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  profile,
  outlets,
  selectedOutletFilter,
  onSelectOutletFilter,
  onRefresh,
  onBackToWebsite,
  onLogout,
  onToggleMobileMenu,
  currentTabTitle
}) => {
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-30 bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-container px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
          type="button"
          aria-label="Buka Menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-tight">
            {currentTabTitle}
          </h1>
          <p className="text-xs text-on-surface-variant hidden sm:block">
            Leton Coffee Management Portal
          </p>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Outlet Indicator / Filter */}
        {isSuperAdmin ? (
          <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-container">
            <span className="material-symbols-outlined text-[18px] text-primary">
              storefront
            </span>
            <select
              value={selectedOutletFilter}
              onChange={(e) => onSelectOutletFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Outlet (Pusat)</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name.replace('Leton Coffee — ', '')}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-primary font-bold text-xs">
            <span className="material-symbols-outlined text-[16px]">store</span>
            <span>
              Outlet: {profile?.outlet_id?.toUpperCase() || 'SUDIRMAN'}
            </span>
          </div>
        )}

        {/* Sync / Refresh */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          title="Sinkronkan Data"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">sync</span>
        </button>

        {/* Public Website Preview */}
        <button
          onClick={onBackToWebsite}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-low text-primary font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
          type="button"
          title="Buka Website Pengunjung"
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          <span>Web Leton</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
          type="button"
          title="Keluar dari akun admin"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
