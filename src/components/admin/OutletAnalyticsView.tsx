import React, { useMemo } from 'react';
import { Order, Outlet, Profile } from '../../types';
import { normalizeOutletId } from '../../services/authService';

interface OutletAnalyticsViewProps {
  orders: Order[];
  profile: Profile | null;
  outlets: Outlet[];
  selectedOutletFilter: string;
}

export const OutletAnalyticsView: React.FC<OutletAnalyticsViewProps> = ({
  orders,
  profile,
  outlets,
  selectedOutletFilter
}) => {
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  // Determine effective outlet scope
  const targetOutletId = useMemo(() => {
    if (!isSuperAdmin) {
      return normalizeOutletId(profile?.outlet_id || 'sudirman');
    }
    if (selectedOutletFilter === 'all') return 'all';
    return normalizeOutletId(selectedOutletFilter);
  }, [isSuperAdmin, profile, selectedOutletFilter]);

  // Filter orders strictly based on role and filter
  const scopedOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (targetOutletId === 'all') return true;
      return normalizeOutletId(ord.outlet_id) === targetOutletId;
    });
  }, [orders, targetOutletId]);

  // Date thresholds for today, this week (last 7 days), this month (current calendar month)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // 1. Sales metrics (exclude CANCELLED orders)
  const validOrders = scopedOrders.filter((o) => o.order_status !== 'CANCELLED');

  const salesToday = validOrders
    .filter((o) => new Date(o.created_at).getTime() >= startOfToday)
    .reduce((sum, o) => sum + o.total, 0);

  const salesThisWeek = validOrders
    .filter((o) => new Date(o.created_at).getTime() >= sevenDaysAgo)
    .reduce((sum, o) => sum + o.total, 0);

  const salesThisMonth = validOrders
    .filter((o) => new Date(o.created_at).getTime() >= startOfMonth)
    .reduce((sum, o) => sum + o.total, 0);

  // 2. Orders count by status
  const totalOrdersCount = scopedOrders.length;
  const newOrdersCount = scopedOrders.filter((o) => o.order_status === 'NEW').length;
  const inProgressOrdersCount = scopedOrders.filter(
    (o) =>
      o.order_status === 'IN_PROGRESS' ||
      o.order_status === 'PREPARING' ||
      o.order_status === 'ACCEPTED'
  ).length;
  const completedOrdersCount = scopedOrders.filter(
    (o) => o.order_status === 'COMPLETED'
  ).length;

  // 3. Transactions & AOV
  const totalTransactions = validOrders.length;
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue =
    totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  // 4. Produk Terlaris (Bestsellers aggregated from real order items)
  const bestsellers = useMemo(() => {
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    validOrders.forEach((ord) => {
      if (ord.items && Array.isArray(ord.items)) {
        ord.items.forEach((item) => {
          const current = itemMap.get(item.product_name) || {
            name: item.product_name,
            quantity: 0,
            revenue: 0
          };
          itemMap.set(item.product_name, {
            name: item.product_name,
            quantity: current.quantity + (item.quantity || 1),
            revenue: current.revenue + (item.subtotal || item.unit_price * (item.quantity || 1))
          });
        });
      }
    });

    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [validOrders]);

  // 5. Daily Breakdown for Charts (last 7 days)
  const dailyStats = useMemo(() => {
    const days: { dateLabel: string; sales: number; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

      const dayOrders = validOrders.filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t >= dayStart && t < dayEnd;
      });

      const daySales = dayOrders.reduce((sum, o) => sum + o.total, 0);

      days.push({
        dateLabel: dayLabel,
        sales: daySales,
        count: dayOrders.length
      });
    }

    return days;
  }, [validOrders]);

  const maxDailySales = Math.max(...dailyStats.map((d) => d.sales), 1);
  const maxDailyCount = Math.max(...dailyStats.map((d) => d.count), 1);

  // Active outlet display label
  const activeOutletName = useMemo(() => {
    if (targetOutletId === 'all') return 'Semua Outlet (Konsolidasi Pusat)';
    const found = outlets.find((o) => normalizeOutletId(o.id) === targetOutletId);
    return found ? found.name : `Outlet ${targetOutletId.toUpperCase()}`;
  }, [targetOutletId, outlets]);

  return (
    <div className="space-y-6">
      {/* Scope Banner */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">analytics</span>
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-outline block">
              Cakupan Data Analitik
            </span>
            <span className="font-title-lg text-title-lg font-bold text-on-surface">
              {activeOutletName}
            </span>
          </div>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Data Transaksi Real-time
        </div>
      </div>

      {/* Row 1: Key Sales KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Hari Ini */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sales Hari Ini</span>
            <span className="material-symbols-outlined text-[18px] text-primary">today</span>
          </div>
          <div className="font-headline-md text-headline-md font-bold text-primary">
            Rp {salesToday.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-outline mt-1">Perhitungan sejak 00:00 WIB hari ini</p>
        </div>

        {/* Sales Minggu Ini */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sales Minggu Ini</span>
            <span className="material-symbols-outlined text-[18px] text-secondary">date_range</span>
          </div>
          <div className="font-headline-md text-headline-md font-bold text-on-surface">
            Rp {salesThisWeek.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-outline mt-1">Total 7 hari terakhir</p>
        </div>

        {/* Sales Bulan Ini */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sales Bulan Ini</span>
            <span className="material-symbols-outlined text-[18px] text-primary-container">calendar_month</span>
          </div>
          <div className="font-headline-md text-headline-md font-bold text-on-surface">
            Rp {salesThisMonth.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-outline mt-1">
            Bulan {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Rata-rata Nilai Transaksi */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rata-rata Transaksi (AOV)</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-600">receipt</span>
          </div>
          <div className="font-headline-md text-headline-md font-bold text-on-surface">
            Rp {averageOrderValue.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-outline mt-1">
            Dari {totalTransactions} total transaksi berhasil
          </p>
        </div>
      </div>

      {/* Row 2: Order Pipeline Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container">
          <span className="text-xs font-semibold text-on-surface-variant block">Total Pesanan</span>
          <span className="text-2xl font-bold text-on-surface mt-1 block">{totalOrdersCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-primary-container/40 ring-1 ring-primary-container/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary block">Pesanan Baru</span>
            {newOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
            )}
          </div>
          <span className="text-2xl font-bold text-primary-container mt-1 block">{newOrdersCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-secondary-container/40">
          <span className="text-xs font-semibold text-on-surface-variant block">Sedang Diproses</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">{inProgressOrdersCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-emerald-200">
          <span className="text-xs font-semibold text-on-surface-variant block">Pesanan Selesai</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{completedOrdersCount}</span>
        </div>
      </div>

      {/* Row 3: Interactive Visual Charts (Grafik Sales & Grafik Jumlah Order) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Sales 7 Hari */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
                Grafik Sales (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Tren omzet penjualan harian berdasarkan pesanan nyata
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-[22px]">bar_chart</span>
          </div>

          <div className="space-y-3">
            {dailyStats.map((day, idx) => {
              const percentage = Math.max(Math.round((day.sales / maxDailySales) * 100), 2);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface">{day.dateLabel}</span>
                    <span className="font-bold text-primary">
                      Rp {day.sales.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-surface-container-low overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-500"
                      style={{ width: `${day.sales > 0 ? percentage : 0}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grafik Jumlah Order 7 Hari */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
                Grafik Jumlah Order (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Volume tiket pesanan yang masuk per hari
              </p>
            </div>
            <span className="material-symbols-outlined text-secondary text-[22px]">show_chart</span>
          </div>

          <div className="space-y-3">
            {dailyStats.map((day, idx) => {
              const percentage = Math.max(Math.round((day.count / maxDailyCount) * 100), 4);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface">{day.dateLabel}</span>
                    <span className="font-bold text-on-surface">
                      {day.count} pesanan
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-surface-container-low overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-secondary to-amber-500 transition-all duration-500"
                      style={{ width: `${day.count > 0 ? percentage : 0}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Produk Terlaris & Traffic Analytics Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produk Terlaris */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
                Produk Terlaris
              </h3>
              <p className="text-xs text-on-surface-variant">
                Menu paling diminati berdasarkan volume cup terjual
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-[22px]">local_cafe</span>
          </div>

          {bestsellers.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-low rounded-xl text-on-surface-variant text-sm">
              Belum ada data pesanan item terakumulasi untuk outlet ini.
            </div>
          ) : (
            <div className="divide-y divide-surface-container">
              {bestsellers.map((item, index) => (
                <div key={index} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400'
                          : index === 1
                          ? 'bg-slate-200 text-slate-800'
                          : index === 2
                          ? 'bg-orange-100 text-orange-900'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-on-surface block">
                        {item.name}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {item.quantity} cup dipesan
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-primary block">
                      Rp {item.revenue.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-outline">Total Omzet</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Traffic / Web Analytics Structure (Transparent Honest Empty State) */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
                Web Traffic & Pengunjung
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-outline uppercase tracking-wider">
                Siap Integrasi
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mb-6">
              Struktur telemetri untuk memantau kunjungan halaman menu & tingkat konversi
            </p>

            {/* Empty State Banner */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-dashed border-outline/40 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">signal_cellular_alt</span>
              </div>
              <p className="font-bold text-sm text-on-surface">
                Belum Terhubung ke Provider Web Analytics
              </p>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                Untuk menjaga akurasi data tanpa estimasi palsu, modul ini siap dihubungkan dengan Google Analytics 4 (Measurement ID) atau Cloudflare Web Analytics melalui panel Settings.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-surface-container flex items-center justify-between text-xs text-outline">
            <span>Metrik: Unik Visitor, Menu Pageviews, Conversion Rate</span>
            <span className="font-medium text-primary">Status: Idle</span>
          </div>
        </div>
      </div>
    </div>
  );
};
