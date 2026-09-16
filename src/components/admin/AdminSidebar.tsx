import React from 'react';
import { Profile } from '../../types';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'menu'
  | 'categories'
  | 'options'
  | 'stock'
  | 'outlets'
  | 'content'
  | 'baristas'
  | 'open-booth'
  | 'analytics'
  | 'admins'
  | 'settings'
  | 'profile';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  profile: Profile | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  activeOrdersCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  isOpenMobile,
  onCloseMobile,
  activeOrdersCount = 0
}) => {
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  // Super Admin Navigation Items
  const superAdminNav = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: 'dashboard' },
    { id: 'orders' as AdminTab, label: 'Semua Pesanan', icon: 'receipt_long', badge: activeOrdersCount > 0 ? activeOrdersCount : undefined },
    { id: 'menu' as AdminTab, label: 'Menu & Produk', icon: 'restaurant_menu' },
    { id: 'categories' as AdminTab, label: 'Kategori', icon: 'category' },
    { id: 'options' as AdminTab, label: 'Topping & Syrup', icon: 'liquor' },
    { id: 'stock' as AdminTab, label: 'Stok Cabang', icon: 'inventory_2' },
    { id: 'outlets' as AdminTab, label: 'Outlet Cabang', icon: 'store' },
    { id: 'content' as AdminTab, label: 'Website Content', icon: 'web' },
    { id: 'baristas' as AdminTab, label: 'Barista', icon: 'badge' },
    { id: 'open-booth' as AdminTab, label: 'Open Booth', icon: 'event' },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: 'monitoring' },
    { id: 'admins' as AdminTab, label: 'Admin Management', icon: 'manage_accounts' },
    { id: 'settings' as AdminTab, label: 'Settings', icon: 'settings' }
  ];

  // Outlet Admin Navigation Items
  const outletAdminNav = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: 'dashboard' },
    { id: 'orders' as AdminTab, label: 'Pesanan Outlet', icon: 'receipt_long', badge: activeOrdersCount > 0 ? activeOrdersCount : undefined },
    { id: 'menu' as AdminTab, label: 'Menu Outlet', icon: 'restaurant_menu' },
    { id: 'stock' as AdminTab, label: 'Stok Outlet', icon: 'inventory_2' },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: 'monitoring' },
    { id: 'profile' as AdminTab, label: 'Profil Saya', icon: 'account_circle' }
  ];

  const navItems = isSuperAdmin ? superAdminNav : outletAdminNav;

  const handleNavClick = (tab: AdminTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface-container-lowest border-r border-surface-container flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Brand Header */}
          <div className="p-5 border-b border-surface-container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px] text-primary-container">
                  coffee_maker
                </span>
              </div>
              <div>
                <span className="font-headline-sm text-headline-sm font-bold text-primary block leading-none">
                  LETON COFFEE
                </span>
                <span className="text-[11px] font-bold text-primary-container uppercase tracking-wider block mt-1">
                  {isSuperAdmin ? 'ADMIN PUSAT' : `OUTLET ${profile?.outlet_id?.toUpperCase() || ''}`}
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Role badge card */}
          <div className="p-3 mx-3 my-3 rounded-xl bg-surface-container-low border border-surface-container/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">
                  {profile?.full_name || 'Admin'}
                </p>
                <p className="text-[10px] text-on-surface-variant truncate">
                  {isSuperAdmin ? 'Super Admin' : `Outlet: ${profile?.outlet_id || 'Sudirman'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-outline">
              Menu Navigasi
            </div>

            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-label-md text-label-md transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isActive ? 'text-primary-container' : 'text-on-surface-variant'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-primary-container text-on-primary'
                          : 'bg-primary-container/20 text-primary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-surface-container bg-surface-container-lowest text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-outline">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Leton Coffee v2.4 (Live)
          </div>
        </div>
      </aside>
    </>
  );
};
