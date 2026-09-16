import React from 'react';
import { Order } from '../../types';

interface OrderSuccessViewProps {
  order: Order;
  onBackToHome: () => void;
  onOrderAgain: () => void;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({
  order,
  onBackToHome,
  onOrderAgain
}) => {
  return (
    <div className="w-full bg-surface min-h-screen py-space-xl px-margin-sm lg:px-margin-lg">
      <div className="max-w-3xl mx-auto space-y-space-lg">
        {/* Stepper Progress */}
        <div className="bg-surface-container-lowest shadow-[0_4px_24px_-4px_rgba(14,165,233,0.08)] rounded-full px-space-lg py-space-md border border-surface-container">
          <div className="flex items-center justify-between text-center">
            <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-fixed text-primary">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </span>
              <span className="hidden sm:inline-block">1. Cart</span>
            </div>
            <div className="flex-1 mx-2 h-0.5 bg-primary-fixed"></div>
            <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-fixed text-primary">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </span>
              <span className="hidden sm:inline-block">2. Details</span>
            </div>
            <div className="flex-1 mx-2 h-0.5 bg-primary-fixed"></div>
            <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-fixed text-primary">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </span>
              <span className="hidden sm:inline-block">3. Payment</span>
            </div>
            <div className="flex-1 mx-2 h-0.5 bg-primary-container"></div>
            <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md font-bold">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-container text-on-primary">
                4
              </span>
              <span>4. Ready to Sip</span>
            </div>
          </div>
        </div>

        {/* Confirmation Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-xl sm:p-space-xl shadow-lg border border-surface-container text-center space-y-space-md">
          <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[36px]">
              check_circle
            </span>
          </div>

          <div className="space-y-space-xs">
            <span className="px-space-md py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm uppercase font-bold tracking-wider inline-block">
              Pesanan Diterima Barista
            </span>
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold">
              Order Confirmed & Brewing!
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
              Terima kasih, <strong className="text-on-surface">{order.customer_name}</strong>. Tim barista kami di {order.outlet_name} telah menerima tiket pesanan Anda.
            </p>
          </div>

          {/* Ticket ID Box */}
          <div className="bg-surface-container-low rounded-lg p-space-md inline-block max-w-sm w-full mx-auto border border-surface-container text-left">
            <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
              <span>Order Number</span>
              <span>Status</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface font-mono">
                {order.order_number}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-[11px] font-bold">
                {order.order_status}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-container/60 flex justify-between text-body-sm text-on-surface-variant">
              <span>Fulfillment:</span>
              <strong className="text-on-surface font-semibold">
                {order.order_type}{' '}
                {order.table_number ? `(${order.table_number})` : ''}
              </strong>
            </div>
            <div className="mt-1 flex justify-between text-body-sm text-on-surface-variant">
              <span>Estimasi Penyajian:</span>
              <strong className="text-primary font-semibold">10 – 15 Menit</strong>
            </div>
          </div>

          {/* Live Progress Bar Indicator */}
          <div className="py-space-md max-w-md mx-auto">
            <div className="flex justify-between font-label-sm text-[11px] text-primary font-bold mb-2">
              <span>1. Tiket Masuk</span>
              <span>2. Brewing & Extraction</span>
              <span className="text-on-surface-variant">3. Disajikan</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
              <div className="bg-primary-container h-full w-2/3 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Order Items Breakdown */}
          <div className="text-left bg-surface-container-low/50 rounded-lg p-space-md border border-surface-container space-y-space-xs">
            <h3 className="font-label-md text-label-md font-bold text-on-surface pb-1 border-b border-surface-container">
              Item Pesanan ({order.items.length})
            </h3>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start py-1 text-body-sm">
                <div>
                  <span className="font-semibold text-on-surface">
                    {item.quantity}x {item.product_name}
                  </span>
                  <p className="text-[11px] text-on-surface-variant">
                    {item.options_summary}
                  </p>
                </div>
                <span className="font-semibold text-on-surface">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-surface-container flex justify-between font-label-lg text-label-lg font-bold text-on-surface">
              <span>Total Pembayaran ({order.payment_method})</span>
              <span className="text-primary">
                Rp {order.total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-space-sm justify-center pt-space-sm">
            <a
              href={`https://wa.me/6281234567890?text=Halo%20Leton%20Coffee,%20saya%20ingin%20cek%20pesanan%20${order.order_number}%20atas%20nama%20${order.customer_name}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-space-xs px-space-xl py-3 rounded-full bg-primary-container text-on-primary font-label-md font-bold hover:bg-primary shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Hubungi Barista di WhatsApp</span>
            </a>
            <button
              onClick={onOrderAgain}
              className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3 rounded-full bg-surface-container text-primary font-label-md font-bold hover:bg-surface-container-high transition-all cursor-pointer"
            >
              <span>Pesan Lagi</span>
            </button>
            <button
              onClick={onBackToHome}
              className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3 rounded-full bg-surface-container-lowest text-on-surface font-label-md font-medium hover:bg-surface-container transition-all cursor-pointer border border-surface-container"
            >
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
