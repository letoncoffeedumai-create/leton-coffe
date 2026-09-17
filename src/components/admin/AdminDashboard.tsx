import React, { useState, useEffect, useMemo } from 'react';
import { Barista, Category, Order, Outlet, Product, Profile, WebsiteContent } from '../../types';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AccessDenied } from './AccessDenied';
import { OutletAnalyticsView } from './OutletAnalyticsView';
import { OrdersManagementView } from './OrdersManagementView';
import { MenuCMSView } from './MenuCMSView';
import { CategoriesAndOptionsView } from './CategoriesAndOptionsView';
import { StockManagementView } from './StockManagementView';
import { OutletsManagementView } from './OutletsManagementView';
import { WebsiteCMSView } from './WebsiteCMSView';
import { AdminUsersView } from './AdminUsersView';
import { AdminSettingsView } from './AdminSettingsView';
import { ProfileView } from './ProfileView';
import { normalizeOutletId } from '../../services/authService';

interface AdminDashboardProps {
  outlets: Outlet[];
  products: Product[];
  orders: Order[];
  categories?: Category[];
  baristas?: Barista[];
  websiteContent?: WebsiteContent;
  currentProfile: Profile | null;
  onRefreshOrders: () => void;
  onRefreshProducts: () => void;
  onCloseAdmin: () => void;
  onLogout: () => void;
  initialTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  outlets,
  products,
  orders,
  categories = [],
  baristas = [],
  websiteContent,
  currentProfile,
  onRefreshOrders,
  onRefreshProducts,
  onCloseAdmin,
  onLogout,
  initialTab = 'dashboard',
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync initial tab when changed from outside (e.g., URL change)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const isSuperAdmin = currentProfile?.role === 'SUPER_ADMIN';

  // Super Admin only tabs
  const superAdminOnlyTabs: AdminTab[] = [
    'categories',
    'options',
    'outlets',
    'content',
    'baristas',
    'open-booth',
    'admins',
    'settings'
  ];

  const isDenied = !isSuperAdmin && superAdminOnlyTabs.includes(activeTab);

  // Active tickets counter for badge
  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => {
      if (!isSuperAdmin) {
        const adminOutlet = normalizeOutletId(currentProfile?.outlet_id || 'sudirman');
        if (normalizeOutletId(o.outlet_id) !== adminOutlet) return false;
      }
      return o.order_status === 'NEW' || o.order_status === 'IN_PROGRESS' || o.order_status === 'PREPARING';
    }).length;
  }, [orders, isSuperAdmin, currentProfile]);

  // Tab Title helper
  const tabTitles: Record<AdminTab, string> = {
    dashboard: isSuperAdmin ? 'Dashboard Konsolidasi Pusat' : `Dashboard Outlet ${currentProfile?.outlet_id?.toUpperCase() || ''}`,
    orders: isSuperAdmin ? 'Semua Pesanan & KDS' : 'Pesanan & Kitchen Display',
    menu: 'Katalog Menu Minuman',
    categories: 'Kategori Menu',
    options: 'Topping & Syrup Add-ons',
    stock: 'Manajemen Stok & Ketersediaan',
    outlets: 'Manajemen Cabang Outlet',
    content: 'Website Content Management',
    baristas: 'Tim Barista & Jadwal',
    'open-booth': 'Open Booth & Event Catering',
    analytics: 'Laporan & Analitik Penjualan',
    admins: 'Manajemen Pengguna Admin (RBAC)',
    settings: 'Pengaturan Sistem & RLS',
    profile: 'Profil Akun Admin'
  };

  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      {/* Sidebar Navigation */}
      <AdminSidebar
        currentTab={activeTab}
        onSelectTab={handleSelectTab}
        profile={currentProfile}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        activeOrdersCount={activeOrdersCount}
      />

      {/* Main Panel Content with lg:ml-64 offset for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top Header */}
        <AdminHeader
          profile={currentProfile}
          outlets={outlets}
          selectedOutletFilter={selectedOutletFilter}
          onSelectOutletFilter={setSelectedOutletFilter}
          onRefresh={() => {
            onRefreshOrders();
            onRefreshProducts();
          }}
          onBackToWebsite={onCloseAdmin}
          onLogout={onLogout}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          currentTabTitle={tabTitles[activeTab] || 'Admin Dashboard'}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Permission Guard */}
          {isDenied ? (
            <AccessDenied
              profile={currentProfile}
              requiredRole="SUPER_ADMIN"
              onBackToDashboard={() => handleSelectTab('dashboard')}
            />
          ) : (
            <>
              {/* TAB: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Executive KPI overview */}
                  <OutletAnalyticsView
                    orders={orders}
                    profile={currentProfile}
                    outlets={outlets}
                    selectedOutletFilter={selectedOutletFilter}
                  />
                </div>
              )}

              {/* TAB: ORDERS */}
              {activeTab === 'orders' && (
                <OrdersManagementView
                  orders={orders}
                  profile={currentProfile}
                  outlets={outlets}
                  selectedOutletFilter={selectedOutletFilter}
                  onRefreshOrders={onRefreshOrders}
                />
              )}

              {/* TAB: MENU */}
              {activeTab === 'menu' && (
                <MenuCMSView
                  products={products}
                  categories={categories}
                  outlets={outlets}
                  profile={currentProfile}
                  selectedOutletFilter={selectedOutletFilter}
                  onRefreshProducts={onRefreshProducts}
                />
              )}

              {/* TAB: CATEGORIES & OPTIONS */}
              {(activeTab === 'categories' || activeTab === 'options') && (
                <CategoriesAndOptionsView
                  categories={categories}
                  products={products}
                  profile={currentProfile}
                  onRefreshCategories={onRefreshProducts}
                />
              )}

              {/* TAB: STOCK */}
              {activeTab === 'stock' && (
                <StockManagementView
                  products={products}
                  outlets={outlets}
                  profile={currentProfile}
                  selectedOutletFilter={selectedOutletFilter}
                  onRefreshProducts={onRefreshProducts}
                />
              )}

              {/* TAB: OUTLETS (Super Admin Only) */}
              {activeTab === 'outlets' && (
                <OutletsManagementView outlets={outlets} />
              )}

              {/* TAB: CONTENT / BARISTAS / OPEN BOOTH (Super Admin Only) */}
              {(activeTab === 'content' || activeTab === 'baristas' || activeTab === 'open-booth') && websiteContent && (
                <WebsiteCMSView
                  content={websiteContent}
                  baristas={baristas}
                />
              )}

              {/* TAB: ANALYTICS */}
              {activeTab === 'analytics' && (
                <OutletAnalyticsView
                  orders={orders}
                  profile={currentProfile}
                  outlets={outlets}
                  selectedOutletFilter={selectedOutletFilter}
                />
              )}

              {/* TAB: ADMINS (Super Admin Only) */}
              {activeTab === 'admins' && (
                <AdminUsersView currentProfile={currentProfile} />
              )}

              {/* TAB: SETTINGS (Super Admin Only) */}
              {activeTab === 'settings' && (
                <AdminSettingsView />
              )}

              {/* TAB: PROFILE (Outlet Admin) */}
              {activeTab === 'profile' && (
                <ProfileView profile={currentProfile} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
