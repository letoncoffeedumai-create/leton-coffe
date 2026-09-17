import React, { useState, useMemo } from 'react';
import { CartItem, Category, OrderType, Outlet, Product } from '../../types';
import { INITIAL_OUTLETS } from '../../data/initialData';

interface OrderingViewProps {
  products: Product[];
  categories: Category[];
  currentOutlet?: Outlet;
  selectedOutlet?: Outlet;
  outlets?: Outlet[];
  onSelectOutlet?: (outletId: string) => void;
  onOpenOutletSelector: () => void;
  fulfillmentMode: OrderType;
  onChangeFulfillmentMode: (mode: OrderType) => void;
  onSelectProduct: (product: Product) => void;
  cartItems?: CartItem[];
  cartCount?: number;
  cartSubtotal?: number;
  cartPb1Tax?: number;
  cartTotal?: number;
  onOpenCart: () => void;
  onCheckout?: () => void;
}

export const OrderingView: React.FC<OrderingViewProps> = ({
  products = [],
  categories = [],
  currentOutlet,
  selectedOutlet,
  outlets = [],
  onSelectOutlet,
  onOpenOutletSelector,
  fulfillmentMode,
  onChangeFulfillmentMode,
  onSelectProduct,
  cartItems = [],
  cartCount,
  cartSubtotal = 0,
  cartPb1Tax = 0,
  cartTotal = 0,
  onOpenCart,
  onCheckout
}) => {
  const activeOutlet: Outlet =
    currentOutlet ||
    selectedOutlet ||
    outlets[0] ||
    INITIAL_OUTLETS[0];

  const effectiveCartItems = cartItems || [];
  const effectiveCartCount = cartCount ?? effectiveCartItems.length;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [secondaryFilter, setSecondaryFilter] = useState<string>('all');

  // Filter products based on search, category, and secondary badges
  const filteredProducts = useMemo(() => {
    return (products || []).filter((product) => {
      if (!product || !product.is_active) return false;

      // Category match
      if (selectedCategory !== 'all' && product.category_id !== selectedCategory) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (product.name || '').toLowerCase().includes(q);
        const matchesDesc = (product.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      // Secondary filter
      if (secondaryFilter === 'bestseller' && !product.is_bestseller) {
        return false;
      }
      if (
        secondaryFilter === 'iced' &&
        !(product.name || '').toLowerCase().includes('iced') &&
        !(product.slug || '').includes('cold') &&
        !(product.slug || '').includes('tonic') &&
        !(product.slug || '').includes('latte')
      ) {
        return false;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery, secondaryFilter]);

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* 1. Context Bar & Fulfillment Switcher (Stitch exact layout) */}
      <section className="w-full bg-surface-container-low px-margin-sm lg:px-margin-lg py-space-md border-b border-surface-container/60">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-md">
          {/* Outlet Info Pill */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-space-sm rounded-full shadow-xs border border-surface-container/50">
              <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[18px]">
                  storefront
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-label-lg text-on-surface font-semibold">
                    {activeOutlet?.name || 'Leton Coffee'}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary uppercase bg-surface-container px-2 py-0.5 rounded-full">
                    {activeOutlet?.chapter_label || 'OUTLET'}
                  </span>
                </div>
                <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
                  <span>Open • {activeOutlet?.opening_hours || '08:00 - 23:00'}</span>
                  <span>•</span>
                  <span className="text-primary font-medium">
                    Dine In / Pick-up Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Switch Outlet Button */}
            <button
              onClick={onOpenOutletSelector}
              className="flex items-center gap-space-xs px-space-md py-2.5 rounded-full bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                swap_horiz
              </span>
              <span>Switch Outlet</span>
            </button>
          </div>

          {/* Dine-In / Takeaway Toggle & Live Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md flex-1 xl:max-w-2xl justify-end">
            {/* Segmented Mode Control */}
            <div className="flex items-center bg-surface-container-lowest p-1 rounded-full shadow-xs border border-surface-container self-start sm:self-auto">
              <button
                onClick={() => onChangeFulfillmentMode('DINE IN')}
                className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                  fulfillmentMode === 'DINE IN'
                    ? 'bg-primary-container text-on-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">
                  table_restaurant
                </span>
                <span>Dine In</span>
              </button>
              <button
                onClick={() => onChangeFulfillmentMode('TAKE AWAY')}
                className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                  fulfillmentMode === 'TAKE AWAY'
                    ? 'bg-primary-container text-on-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">
                  shopping_bag
                </span>
                <span>Takeaway (10m)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-primary">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drinks, single origins, artisan pastries..."
                className="w-full pl-10 pr-10 py-2 rounded-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-container shadow-xs transition-all border border-surface-container"
                type="text"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Tagline Banner */}
      <section className="w-full px-margin-sm lg:px-margin-lg pt-space-lg pb-space-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
              Curated Craft Menu
            </p>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">
              Bridging your desire of coffee.
            </h1>
          </div>
          <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-primary-container">
              water_drop
            </span>
            <span>Double-filtered water • Origin roasted weekly</span>
          </div>
        </div>
      </section>

      {/* 3. Sticky Filter Navigation */}
      <section className="w-full px-margin-sm lg:px-margin-lg py-space-sm sticky top-20 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-container/40">
        <div className="max-w-7xl mx-auto space-y-space-sm">
          {/* Horizontal Scrollable Tabs */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`whitespace-nowrap px-space-md py-2 rounded-full font-label-md text-label-md transition-colors cursor-pointer ${
                    active
                      ? 'bg-primary-container text-on-primary shadow-xs font-bold'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container border border-surface-container/60'
                  }`}
                  type="button"
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Secondary Refinement Badges */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mr-1">
              Filter:
            </span>
            <button
              onClick={() =>
                setSecondaryFilter(secondaryFilter === 'bestseller' ? 'all' : 'bestseller')
              }
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-label-sm text-label-sm transition-colors cursor-pointer ${
                secondaryFilter === 'bestseller'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container text-primary hover:bg-surface-container-high'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">
                local_fire_department
              </span>
              <span>Bestsellers</span>
            </button>
            <button
              onClick={() =>
                setSecondaryFilter(secondaryFilter === 'iced' ? 'all' : 'iced')
              }
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-label-sm text-label-sm transition-colors cursor-pointer ${
                secondaryFilter === 'iced'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary border border-surface-container'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">ac_unit</span>
              <span>Iced / Cold Crafted</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Main Product Catalog & Desktop Side Cart */}
      <section className="w-full px-margin-sm lg:px-margin-lg py-space-lg flex-1">
        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg items-start">
          {/* Products Grid (8 cols on XL) */}
          <div className="xl:col-span-8 flex flex-col gap-space-lg">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Available Craft Selections ({filteredProducts.length})
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-surface-container">
                <p className="font-headline-sm text-on-surface font-medium">
                  Tidak ada produk yang cocok dengan pencarian
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setSecondaryFilter('all');
                  }}
                  className="mt-3 px-4 py-2 rounded-full bg-primary-container text-on-primary font-label-md font-bold"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-space-md">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative flex flex-col rounded-lg bg-surface-container-lowest p-space-md shadow-xs hover:shadow-md transition-all border border-surface-container"
                  >
                    <div
                      onClick={() => onSelectProduct(product)}
                      className="relative w-full h-48 rounded-lg overflow-hidden bg-surface-container-low mb-space-sm cursor-pointer"
                    >
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={product.name}
                        src={product.image_url}
                      />
                      {product.badge && (
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md font-label-sm text-label-sm text-primary font-bold shadow-xs">
                          {product.badge}
                        </div>
                      )}
                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-inverse-surface/75 text-inverse-on-surface font-label-sm text-label-sm">
                        Customizable
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 justify-between gap-space-sm">
                      <div
                        onClick={() => onSelectProduct(product)}
                        className="cursor-pointer"
                      >
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-space-xs">
                        <span className="font-headline-sm text-headline-sm text-primary font-bold">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        <button
                          onClick={() => onSelectProduct(product)}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-container text-on-primary shadow-xs hover:bg-primary transition-all active:scale-95 cursor-pointer"
                          type="button"
                          title="Kustomisasi & Tambah"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            add
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Right Column: Sticky Order Summary (4 cols) */}
          <div className="hidden xl:flex xl:col-span-4 flex-col gap-space-md sticky top-24">
            <div className="w-full rounded-lg bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container/60">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Your Order
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {activeOutlet?.name || 'Leton Coffee'} • {effectiveCartItems.length} Items
                  </p>
                </div>
                <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-surface-container text-primary font-bold">
                  {fulfillmentMode}
                </span>
              </div>

              {/* Free gift banner */}
              <div className="flex items-center gap-space-xs p-2.5 rounded-md bg-surface-container-low text-primary my-space-sm font-body-sm text-body-sm border border-surface-container">
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  redeem
                </span>
                <span className="font-medium">Free Leton sticker pack unlocked!</span>
              </div>

              {/* Cart List */}
              <div className="divide-y-0 space-y-space-sm py-space-sm max-h-72 overflow-y-auto">
                {effectiveCartItems.length === 0 ? (
                  <div className="py-6 text-center text-on-surface-variant font-body-sm">
                    Keranjang kosong. Pilih minuman di samping untuk menambahkan.
                  </div>
                ) : (
                  effectiveCartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-space-sm p-space-sm rounded-md bg-surface-container-low"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm flex items-center justify-center">
                            {item.quantity}
                          </span>
                          <p className="font-label-md text-label-md text-on-surface font-semibold truncate">
                            {item.product.name}
                          </p>
                        </div>
                        <p className="font-body-sm text-[11px] text-on-surface-variant pl-7 leading-tight">
                          {item.options.size ? <strong className="text-primary font-bold">Size {item.options.size} • </strong> : null}
                          {item.options.temperature} • {item.options.sweetness}
                          {item.options.toppings.map((t) => ` • +${t.name}`)}
                        </p>
                      </div>
                      <span className="font-label-md text-label-md text-on-surface font-bold whitespace-nowrap">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Financial Calculation Breakdown */}
              {cartItems.length > 0 && (
                <div className="space-y-1.5 pt-space-sm font-body-sm text-body-sm border-t border-surface-container/60">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-semibold text-on-surface">
                      Rp {cartSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>PB1 Dining Tax (10%)</span>
                    <span className="font-semibold text-on-surface">
                      Rp {cartPb1Tax.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between font-headline-sm text-headline-sm text-on-surface pt-space-xs">
                    <span className="font-bold">Total Payment</span>
                    <span className="font-bold text-primary">
                      Rp {cartTotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Checkout Action */}
                  <button
                    onClick={onCheckout}
                    className="w-full mt-space-md flex items-center justify-between px-space-lg py-3.5 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg uppercase tracking-wider shadow-md hover:bg-primary transition-all active:scale-98 cursor-pointer font-bold"
                    type="button"
                  >
                    <span>CONTINUE TO CHECKOUT</span>
                    <span className="material-symbols-outlined text-[20px]">
                      arrow_forward
                    </span>
                  </button>

                  {/* Safe Order Assurances */}
                  <div className="flex items-center justify-center gap-space-md pt-space-sm font-label-sm text-label-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        check_circle
                      </span>{' '}
                      Instant Prep
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        qr_code_2
                      </span>{' '}
                      QRIS / Tunai
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Mobile Sticky Bottom Cart Peek Pill */}
      {effectiveCartItems.length > 0 && (
        <div className="xl:hidden fixed bottom-6 left-4 right-4 z-40">
          <div className="bg-surface-container-lowest/95 backdrop-blur-xl p-3 rounded-full shadow-2xl flex items-center justify-between border border-surface-container">
            <div className="flex items-center gap-space-sm pl-2">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                {effectiveCartItems.length}
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Rp {cartTotal.toLocaleString('id-ID')}
                </span>
                <span className="font-body-sm text-[11px] text-on-surface-variant">
                  {(activeOutlet?.name || 'Leton Coffee').replace('Leton Coffee — ', '')} • {fulfillmentMode}
                </span>
              </div>
            </div>
            <button
              onClick={onOpenCart}
              className="px-space-lg py-2 rounded-full bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider font-bold shadow-sm cursor-pointer"
              type="button"
            >
              View Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
