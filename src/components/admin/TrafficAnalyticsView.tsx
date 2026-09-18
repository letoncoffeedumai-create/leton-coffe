import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from '../../types';

interface TrafficStats {
  todayCount: number;
  weekCount: number;
  totalRangeCount: number;
  chartData: Array<{ date: string; label: string; count: number }>;
  topPages: Array<{ page: string; count: number }>;
  deviceDistribution: {
    mobile: number;
    desktop: number;
    total: number;
    mobilePercent: number;
    desktopPercent: number;
  };
  recentLogs: Array<{
    id: string;
    page_path: string;
    outlet_id: string | null;
    device_type: string;
    created_at: string;
  }>;
}

interface TrafficAnalyticsViewProps {
  outlets: Outlet[];
  currentOutletFilter?: string;
  isSuperAdmin?: boolean;
}

export const TrafficAnalyticsView: React.FC<TrafficAnalyticsViewProps> = ({
  outlets,
  currentOutletFilter = 'all',
  isSuperAdmin = true
}) => {
  const [selectedOutlet, setSelectedOutlet] = useState<string>(currentOutletFilter);
  const [daysFilter, setDaysFilter] = useState<number>(7);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<TrafficStats>({
    todayCount: 0,
    weekCount: 0,
    totalRangeCount: 0,
    chartData: [],
    topPages: [],
    deviceDistribution: {
      mobile: 0,
      desktop: 0,
      total: 0,
      mobilePercent: 0,
      desktopPercent: 0
    },
    recentLogs: []
  });

  const loadTrafficData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedOutlet && selectedOutlet !== 'all') {
        params.append('outlet', selectedOutlet);
      }
      params.append('days', daysFilter.toString());

      const res = await fetch(`/api/traffic/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load traffic stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOutlet, daysFilter]);

  useEffect(() => {
    loadTrafficData();
  }, [loadTrafficData]);

  // Max value for chart scaling
  const maxChartCount = Math.max(...(stats.chartData || []).map((d) => d.count), 1);

  const getPageTitle = (path: string) => {
    if (path === '/' || path === '/home') return 'Halaman Utama (Home)';
    if (path === '/ordering' || path === '/menu') return 'Katalog Menu & Pemesanan';
    if (path === '/checkout') return 'Halaman Checkout & QRIS';
    if (path === '/success') return 'Halaman Status Pesanan';
    if (path.startsWith('/admin')) return 'Portal Admin';
    return path;
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">monitoring</span>
          </div>
          <div>
            <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
              Statistik & Web Traffic Pengunjung
            </h3>
            <p className="text-xs text-on-surface-variant">
              Pemantauan pageviews dan aktivitas pengunjung secara real-time dari Supabase.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Days Range Toggle */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-surface-container text-xs">
            <button
              type="button"
              onClick={() => setDaysFilter(1)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                daysFilter === 1
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setDaysFilter(7)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                daysFilter === 7
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setDaysFilter(30)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                daysFilter === 30
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              30 Hari
            </button>
          </div>

          {/* Outlet Filter */}
          {isSuperAdmin && (
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container text-xs font-semibold text-on-surface focus:outline-none"
            >
              <option value="all">Semua Outlet (Pusat)</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadTrafficData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer border border-surface-container flex items-center justify-center"
            title="Segarkan Data"
          >
            <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Views */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pengunjung Hari Ini</span>
            <span className="material-symbols-outlined text-[18px] text-primary">visibility</span>
          </div>
          <div className="font-headline-md text-headline-md font-bold text-primary">
            {stats.todayCount.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-outline mt-1">Pageviews sejak 00:00 WIB hari ini</p>
        </div>

        {/* Week Views */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pengunjung Minggu Ini</span>
            <span className="material-symbols-outlined text-[18px] text-secondary">date_range</span>
          </div>
          <div className="font-headline-md text-headline-md font-bold text-on-surface">
            {stats.weekCount.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-outline mt-1">Total pageviews dalam 7 hari terakhir</p>
        </div>

        {/* Selected Period Views */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Kunjungan ({daysFilter} Hari)</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-600">trending_up</span>
          </div>
          <div className="font-headline-md text-headline-md font-bold text-on-surface">
            {stats.totalRangeCount.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-outline mt-1">Filter aktif saat ini</p>
        </div>

        {/* Mobile vs Desktop Ratio */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Mayoritas Perangkat</span>
            <span className="material-symbols-outlined text-[18px] text-amber-600">devices</span>
          </div>
          <div className="font-headline-md text-headline-md font-bold text-on-surface flex items-baseline gap-2">
            <span>{stats.deviceDistribution.mobilePercent}%</span>
            <span className="text-xs font-semibold text-outline">Mobile</span>
          </div>
          <p className="text-xs text-outline mt-1">
            Desktop: {stats.deviceDistribution.desktopPercent}% ({stats.deviceDistribution.desktop} hits)
          </p>
        </div>
      </div>

      {/* Row 2: Traffic Trend Chart & Device Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor Trend Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container pb-3">
            <div>
              <h4 className="font-title-md font-bold text-on-surface">Tren Pengunjung Harian</h4>
              <p className="text-xs text-on-surface-variant">
                Grafik jumlah pageviews per hari ({daysFilter} hari terakhir)
              </p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              Puncak: {maxChartCount} views
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4">
            <div className="h-48 flex items-end gap-2 sm:gap-4 px-2">
              {(stats.chartData || []).map((item, idx) => {
                const heightPercent = maxChartCount > 0 ? (item.count / maxChartCount) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-slate-900 text-white text-[11px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md">
                      {item.count} views ({item.label})
                    </div>

                    {/* Bar */}
                    <div className="w-full bg-surface-container-low rounded-t-lg overflow-hidden flex items-end h-full">
                      <div
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        className="w-full bg-primary group-hover:bg-primary-container transition-all rounded-t-lg"
                      />
                    </div>

                    {/* Label */}
                    <span className="text-[10px] sm:text-[11px] font-semibold text-on-surface-variant truncate max-w-[45px] text-center">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Device Distribution Card (1 col) */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-5">
          <div className="border-b border-surface-container pb-3">
            <h4 className="font-title-md font-bold text-on-surface">Distribusi Perangkat</h4>
            <p className="text-xs text-on-surface-variant">Proporsi pengguna smartphone vs komputer</p>
          </div>

          <div className="space-y-4">
            {/* Mobile Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-primary">smartphone</span>
                  Mobile Phone
                </span>
                <span className="text-primary">{stats.deviceDistribution.mobilePercent}%</span>
              </div>
              <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                <div
                  style={{ width: `${stats.deviceDistribution.mobilePercent}%` }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <span className="text-[10px] text-outline mt-0.5 block">
                {stats.deviceDistribution.mobile} pageviews
              </span>
            </div>

            {/* Desktop Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-secondary">computer</span>
                  Desktop / Laptop
                </span>
                <span className="text-secondary">{stats.deviceDistribution.desktopPercent}%</span>
              </div>
              <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                <div
                  style={{ width: `${stats.deviceDistribution.desktopPercent}%` }}
                  className="h-full bg-secondary rounded-full"
                />
              </div>
              <span className="text-[10px] text-outline mt-0.5 block">
                {stats.deviceDistribution.desktop} pageviews
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-on-surface block mb-1">Insight Leton Coffee:</span>
            Mayoritas pelanggan mengakses menu dan melakukan pesanan QRIS melalui smartphone secara langsung saat berkunjung.
          </div>
        </div>
      </div>

      {/* Row 3: Halaman Paling Sering Dikunjungi & Log Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages Table */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container pb-3">
            <div>
              <h4 className="font-title-md font-bold text-on-surface">Halaman Paling Sering Dikunjungi</h4>
              <p className="text-xs text-on-surface-variant">Daftar halaman dengan jumlah klik tertinggi</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-container text-outline text-[11px] uppercase">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Halaman / Jalur</th>
                  <th className="py-2.5 px-3 text-right">Kunjungan</th>
                  <th className="py-2.5 px-3 text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {stats.topPages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-outline">
                      Belum ada data kunjungan yang tercatat.
                    </td>
                  </tr>
                ) : (
                  stats.topPages.map((page, idx) => {
                    const pagePercent =
                      stats.totalRangeCount > 0
                        ? Math.round((page.count / stats.totalRangeCount) * 100)
                        : 0;
                    return (
                      <tr key={idx} className="hover:bg-surface-container-low/50">
                        <td className="py-2.5 px-3 font-bold text-outline">#{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-on-surface">{getPageTitle(page.page)}</div>
                          <div className="font-mono text-[10px] text-outline">{page.page}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-on-surface">
                          {page.count.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                            {pagePercent}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Visitor Feed */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-surface-container pb-3">
            <div>
              <h4 className="font-title-md font-bold text-on-surface">Aktivitas Pengunjung Terbaru</h4>
              <p className="text-xs text-on-surface-variant">Log real-time kunjungan terakhir pelanggan</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Tracking
            </span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {stats.recentLogs.length === 0 ? (
              <div className="py-8 text-center text-outline text-xs">
                Belum ada aktivitas kunjungan terbaru.
              </div>
            ) : (
              stats.recentLogs.map((log) => {
                const date = new Date(log.created_at);
                const timeStr = date.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });
                const dateStr = date.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short'
                });

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-surface-container-low/60 border border-surface-container flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        {log.device_type === 'mobile' ? 'smartphone' : 'computer'}
                      </span>
                      <div>
                        <span className="font-bold text-on-surface block">
                          {getPageTitle(log.page_path)}
                        </span>
                        <span className="text-[10px] font-mono text-outline">{log.page_path}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-on-surface block">
                        {timeStr} WIB
                      </span>
                      <span className="text-[10px] text-outline">{dateStr}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
