import React from 'react';
import { CartItem } from '../../types';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  pb1Tax: number;
  ecoDiscount: number;
  total: number;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  outletName: string;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  pb1Tax,
  ecoDiscount,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  outletName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-xs transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-container-lowest shadow-2xl flex flex-col justify-between border-l border-surface-container">
          {/* Cart Header */}
          <div className="p-space-lg border-b border-surface-container flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  shopping_bag
                </span>
                <h2 className="font-headline-sm text-on-surface font-bold">
                  Your Order Cart
                </h2>
              </div>
              <p className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">
                {outletName} • {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-space-lg space-y-space-md">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[32px]">
                    local_cafe
                  </span>
                </div>
                <h3 className="font-headline-sm text-on-surface font-semibold">
                  Keranjang masih kosong
                </h3>
                <p className="font-body-sm text-on-surface-variant max-w-xs">
                  Pilih minuman atau makanan favorit Anda dari menu Leton Coffee.
                </p>
              </div>
            ) : (
              <>
                {/* Free gift promo banner from Stitch */}
                <div className="flex items-center gap-space-xs p-2.5 rounded-md bg-surface-container-low text-primary font-body-sm text-body-sm border border-surface-container">
                  <span className="material-symbols-outlined text-[18px] text-primary-container">
                    redeem
                  </span>
                  <span className="font-medium">Free Leton sticker pack included!</span>
                </div>

                {items.map((item) => {
                  const opts = item.options;
                  const customizationParts: string[] = [];
                  if (opts.size) {
                    customizationParts.push(`Size: ${opts.size}${opts.size === 'Large' ? ' (+Rp 5.000)' : ''}`);
                  }
                  if (opts.temperature) customizationParts.push(opts.temperature);
                  if (opts.sweetness) customizationParts.push(opts.sweetness);
                  if (opts.toppings && opts.toppings.length > 0) {
                    opts.toppings
                      .filter((t) => t && t.price > 0)
                      .forEach((t) => customizationParts.push(`+${t.name || 'Topping'}`));
                  }
                  if (opts.syrups && opts.syrups.length > 0) {
                    opts.syrups
                      .filter((s) => s && s.price > 0)
                      .forEach((s) => customizationParts.push(`+${s.name || 'Syrup'}`));
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-space-md rounded-lg bg-surface-container-low/70 border border-surface-container/60 space-y-space-xs"
                    >
                      <div className="flex items-start justify-between gap-space-sm">
                        <div className="flex items-start gap-space-sm min-w-0">
                          <img
                            src={item.product?.image_url || ''}
                            alt={item.product?.name || 'Drink'}
                            className="w-12 h-12 rounded-md object-cover bg-surface-container flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-label-lg text-on-surface font-bold truncate">
                              {item.product?.name || 'Drink'}
                            </h4>
                            <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 leading-tight">
                              {customizationParts.join(' • ') || 'Standard Brew'}
                            </p>
                            {opts.notes && (
                              <p className="font-body-sm text-[11px] text-primary italic mt-0.5">
                                "{opts.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-on-surface-variant hover:text-error transition-colors p-1"
                          title="Hapus"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-surface-container/50">
                        {/* Stepper */}
                        <div className="flex items-center gap-space-xs bg-surface-container-lowest px-2 py-0.5 rounded-full border border-surface-container">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-primary hover:bg-surface-container cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              remove
                            </span>
                          </button>
                          <span className="font-label-md text-on-surface font-bold px-1.5">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-primary hover:bg-surface-container cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              add
                            </span>
                          </button>
                        </div>

                        <span className="font-label-lg text-on-surface font-bold">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Cart Footer Breakdown */}
          {items.length > 0 && (
            <div className="p-space-lg bg-surface-container-low border-t border-surface-container space-y-space-sm">
              <div className="space-y-1.5 font-body-sm text-body-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="text-on-surface font-medium">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Restaurant Tax (PB1 10%)</span>
                  <span className="text-on-surface font-medium">
                    Rp {pb1Tax.toLocaleString('id-ID')}
                  </span>
                </div>
                {ecoDiscount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Eco Tumbler Discount</span>
                    <span className="font-semibold">
                      -Rp {ecoDiscount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-surface-container flex justify-between font-headline-sm text-on-surface font-bold">
                  <span>Total Due</span>
                  <span className="text-primary text-headline-md">
                    Rp {total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className="w-full mt-2 py-3.5 px-space-lg rounded-full bg-primary-container text-on-primary font-label-lg uppercase tracking-wider font-bold shadow-[0_8px_24px_rgba(14,165,233,0.35)] hover:bg-primary transition-all flex items-center justify-center gap-space-xs cursor-pointer active:scale-98"
                type="button"
              >
                <span>CONTINUE TO CHECKOUT</span>
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
