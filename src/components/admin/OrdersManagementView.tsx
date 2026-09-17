import React, { useMemo, useState } from 'react';
import { Order, OrderStatus, Outlet, PaymentStatus, Profile } from '../../types';
import { orderService } from '../../services/orderService';
import { normalizeOutletId } from '../../services/authService';

interface OrdersManagementViewProps {
  orders: Order[];
  profile: Profile | null;
  outlets: Outlet[];
  selectedOutletFilter: string;
  onRefreshOrders: () => void;
}

export const OrdersManagementView: React.FC<OrdersManagementViewProps> = ({
  orders,
  profile,
  outlets,
  selectedOutletFilter,
  onRefreshOrders
}) => {
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  // State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [rejectionModalOrder, setRejectionModalOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Scoped orders based on role and filter
  const scopedOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Role scoping
      if (!isSuperAdmin) {
        const adminOutlet = normalizeOutletId(profile?.outlet_id || 'sudirman');
        if (normalizeOutletId(ord.outlet_id) !== adminOutlet) return false;
      } else if (selectedOutletFilter !== 'all') {
        if (normalizeOutletId(ord.outlet_id) !== normalizeOutletId(selectedOutletFilter)) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && ord.order_status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = ord.order_number.toLowerCase().includes(query);
        const matchesName = ord.customer_name.toLowerCase().includes(query);
        const matchesPhone = ord.customer_phone.includes(query);
        const matchesTable = ord.table_number?.toLowerCase().includes(query);
        if (!matchesNumber && !matchesName && !matchesPhone && !matchesTable) {
          return false;
        }
      }

      return true;
    });
  }, [orders, isSuperAdmin, profile, selectedOutletFilter, statusFilter, searchQuery]);

  // Handle status update
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      onRefreshOrders();
      if (selectedOrderDetail && selectedOrderDetail.id === orderId) {
        setSelectedOrderDetail((prev) => (prev ? { ...prev, order_status: newStatus } : null));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle QRIS payment verification
  const handleVerifyPayment = async (orderId: string, status: PaymentStatus) => {
    setIsUpdating(true);
    try {
      await orderService.updatePaymentStatus(orderId, status);
      // Auto move order to IN_PROGRESS if paid
      if (status === 'PAID') {
        await orderService.updateOrderStatus(orderId, 'IN_PROGRESS');
      }
      onRefreshOrders();
      if (selectedOrderDetail && selectedOrderDetail.id === orderId) {
        setSelectedOrderDetail((prev) =>
          prev ? { ...prev, payment_status: status, order_status: status === 'PAID' ? 'IN_PROGRESS' : prev.order_status } : null
        );
      }
      setSelectedProofOrder(null);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Reject Payment
  const handleConfirmReject = async () => {
    if (!rejectionModalOrder) return;
    setIsUpdating(true);
    try {
      await orderService.updatePaymentStatus(
        rejectionModalOrder.id,
        'PAYMENT REJECTED',
        rejectionReason || 'Bukti transfer tidak valid atau dana belum masuk.'
      );
      await orderService.updateOrderStatus(
        rejectionModalOrder.id,
        'CANCELLED',
        rejectionReason || 'Pembayaran ditolak'
      );
      onRefreshOrders();
      setRejectionModalOrder(null);
      setRejectionReason('');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3.5 flex items-center text-outline pointer-events-none text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari order #, nama pemesan, no telp, meja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-container-low border border-surface-container text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary-container"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden sm:inline">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-full bg-surface-container-low border border-surface-container text-xs sm:text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="NEW">NEW (Pesanan Baru)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Sedang Dibuat)</option>
              <option value="READY">READY (Siap Saji/Ambil)</option>
              <option value="COMPLETED">COMPLETED (Selesai)</option>
              <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
            </select>
          </div>
        </div>

        {/* Status quick tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'NEW', label: 'Tiket Baru' },
            { id: 'IN_PROGRESS', label: 'Diseduh / Diproses' },
            { id: 'READY', label: 'Siap Saji' },
            { id: 'COMPLETED', label: 'Selesai' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {scopedOrders.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-surface-container text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] text-outline mb-2">
            receipt_long
          </span>
          <p className="font-bold text-base text-on-surface">Tidak ada tiket pesanan ditemukan</p>
          <p className="text-xs text-outline mt-1">
            Ganti kata kunci pencarian atau filter status untuk melihat pesanan lainnya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {scopedOrders.map((ord) => {
            const isNew = ord.order_status === 'NEW';
            const isInProgress = ord.order_status === 'IN_PROGRESS' || ord.order_status === 'PREPARING';
            const isReady = ord.order_status === 'READY';
            const isCompleted = ord.order_status === 'COMPLETED';
            const isCancelled = ord.order_status === 'CANCELLED';

            const isWaitingVerification = ord.payment_status === 'WAITING VERIFICATION';

            return (
              <div
                key={ord.id}
                className={`p-5 rounded-2xl bg-surface-container-lowest border flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md ${
                  isNew
                    ? 'border-primary-container ring-2 ring-primary-container/20'
                    : isWaitingVerification
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : isInProgress
                    ? 'border-secondary-container'
                    : 'border-surface-container'
                }`}
              >
                <div>
                  {/* Top Bar: Order ID, Type, Outlet */}
                  <div className="flex items-start justify-between gap-2 border-b border-surface-container/60 pb-3">
                    <div>
                      <span className="font-headline-sm text-headline-sm font-bold text-primary block leading-none">
                        {ord.order_number}
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-medium mt-1 block">
                        {new Date(ord.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}{' '}
                        WIB • {ord.outlet_name.replace('Leton Coffee — ', '')}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          ord.order_type === 'DINE IN'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary-container/20 text-secondary'
                        }`}
                      >
                        {ord.order_type}
                        {ord.table_number ? ` • Meja ${ord.table_number}` : ''}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isNew
                            ? 'bg-primary-container text-on-primary animate-pulse'
                            : isInProgress
                            ? 'bg-amber-100 text-amber-800'
                            : isReady
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCompleted
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {ord.order_status}
                      </span>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="py-2.5 flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="font-semibold text-on-surface">{ord.customer_name}</span>
                    <span>{ord.customer_phone}</span>
                  </div>

                  {/* Payment Verification Banner if applicable */}
                  {isWaitingVerification && (
                    <div className="p-3 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-600 text-[18px]">
                            qr_code_scanner
                          </span>
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                            Menunggu Verifikasi QRIS
                          </span>
                        </div>
                        {ord.payment_proof_url && (
                          <button
                            onClick={() => setSelectedProofOrder(ord)}
                            className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                            Lihat Bukti
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleVerifyPayment(ord.id, 'PAID')}
                          disabled={isUpdating}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[15px]">check</span>
                          ACCEPT
                        </button>
                        <button
                          onClick={() => setRejectionModalOrder(ord)}
                          disabled={isUpdating}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[15px]">close</span>
                          REJECT
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="py-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {ord.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-on-surface">
                          <span>
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="text-primary">
                            Rp {(item.subtotal || item.unit_price * item.quantity).toLocaleString('id-ID')}
                          </span>
                        </div>
                        {item.options_summary && (
                          <div className="text-[11px] text-on-surface-variant font-medium">
                            {item.options_summary}
                          </div>
                        )}
                        {item.options_detail?.notes && (
                          <div className="text-[11px] text-amber-800 italic">
                            Catatan: &ldquo;{item.options_detail.notes}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Note from customer */}
                  {ord.customer_note && (
                    <div className="mt-2 p-2 rounded-lg bg-surface-container text-xs text-on-surface-variant">
                      <span className="font-bold">Catatan Meja:</span> {ord.customer_note}
                    </div>
                  )}

                  {/* Total & Payment method */}
                  <div className="pt-3 border-t border-surface-container mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-outline block">Total Tagihan</span>
                      <span className="font-headline-sm text-headline-sm font-bold text-primary">
                        Rp {ord.total.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-bold text-on-surface-variant block">
                        {ord.payment_method}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          ord.payment_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.payment_status === 'WAITING VERIFICATION'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.payment_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Workflow Action Buttons */}
                <div className="pt-4 mt-3 border-t border-surface-container flex flex-wrap items-center gap-2">
                  {/* Status transitions */}
                  {isNew && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'IN_PROGRESS')}
                      disabled={isUpdating}
                      className="flex-1 py-2 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">coffee</span>
                      <span>Mulai Diseduh</span>
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'READY')}
                      disabled={isUpdating}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Siap Saji</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                      disabled={isUpdating}
                      className="flex-1 py-2 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">done_all</span>
                      <span>Selesaikan Pesanan</span>
                    </button>
                  )}

                  {/* Payment verification button for QRIS */}
                  {isWaitingVerification && (
                    <button
                      onClick={() => handleVerifyPayment(ord.id, 'PAID')}
                      disabled={isUpdating}
                      className="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                      title="Verifikasi QRIS Lunas"
                    >
                      Verifikasi Lunas
                    </button>
                  )}

                  {/* Reject / Cancel order */}
                  {!isCompleted && !isCancelled && (
                    <button
                      onClick={() => setRejectionModalOrder(ord)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                      title="Batalkan Pesanan"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof Viewer Modal */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl p-6 relative border border-surface-container">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-title-lg font-bold text-on-surface">Bukti Pembayaran QRIS</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Pesanan #{selectedProofOrder.order_number} • {selectedProofOrder.customer_name} • Rp {selectedProofOrder.total.toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => setSelectedProofOrder(null)}
                className="p-1 rounded-lg text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="w-full max-h-[55vh] overflow-auto rounded-xl bg-black/90 flex items-center justify-center p-2">
              <img
                src={selectedProofOrder.payment_proof_url || ''}
                alt="Bukti Transfer"
                className="max-h-[50vh] object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-surface-container">
              <button
                onClick={() => setSelectedProofOrder(null)}
                className="px-4 py-2 rounded-full bg-surface-container text-on-surface font-semibold text-xs cursor-pointer hover:bg-surface-container-high"
              >
                Tutup
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = selectedProofOrder;
                    setSelectedProofOrder(null);
                    setRejectionModalOrder(target);
                  }}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  REJECT
                </button>
                <button
                  onClick={() => {
                    handleVerifyPayment(selectedProofOrder.id, 'PAID');
                    setSelectedProofOrder(null);
                  }}
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  ACCEPT (Lunas)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel / Rejection Modal */}
      {rejectionModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl">
            <h4 className="font-title-lg font-bold text-red-700 mb-2">Batalkan Pesanan</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Pesanan #{rejectionModalOrder.order_number} atas nama {rejectionModalOrder.customer_name} akan dibatalkan.
            </p>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Alasan Pembatalan:
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Bahan habis / Pembayaran tidak valid"
              className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-red-500 mb-4"
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectionModalOrder(null)}
                className="px-4 py-2 rounded-full bg-surface-container text-xs font-semibold text-on-surface cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isUpdating}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Konfirmasi Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
