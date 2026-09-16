import React, { useState } from 'react';
import { Product } from '../../types';

interface SignaturePicksProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onViewFullMenu: () => void;
}

export const SignaturePicks: React.FC<SignaturePicksProps> = ({
  products,
  onSelectProduct,
  onViewFullMenu
}) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filterTabs = [
    { id: 'all', label: 'All Creations' },
    { id: 'cat-coffee', label: 'Specialty Espresso' },
    { id: 'cat-noncoffee', label: 'Milk & Cloud' },
    { id: 'cat-manual', label: 'Manual Pour' },
    { id: 'cat-tea', label: 'Artisan Tea' }
  ];

  const filteredProducts = (products || [])
    .filter((p) => p && p.is_active)
    .filter((p) => {
      if (selectedFilter === 'all') return true;
      return p.category_id === selectedFilter;
    })
    .slice(0, 8);

  return (
    <section className="w-full py-margin-lg bg-surface" id="signature-picks">
      <div className="max-w-7xl mx-auto px-margin-sm lg:px-margin-lg space-y-space-xl">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div>
            <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">
              CURATED ROTATION
            </span>
            <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
              Signature Brews & Cups
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Balanced notes, silky microfoam, and clean mountain harvests.
            </p>
          </div>

          {/* Filter Pill Controls */}
          <div className="flex flex-wrap items-center gap-space-xs bg-surface-container-high p-1 rounded-full border border-surface-container">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-space-md py-1.5 rounded-full text-label-md transition-colors cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-surface-container-lowest text-on-surface font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Product Cards Grid (matches Stitch: 1 col sm, 2 col md, 4 col lg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group flex flex-col rounded-lg bg-surface-container-lowest shadow-xs hover:shadow-[0_12px_32px_rgba(14,165,233,0.12)] transition-all duration-300 overflow-hidden border border-surface-container/70"
            >
              <div
                onClick={() => onSelectProduct(product)}
                className="relative w-full aspect-square overflow-hidden bg-surface-container-low cursor-pointer"
              >
                <img
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  alt={product?.name || 'Beverage'}
                  src={product?.image_url || ''}
                />
                {product?.badge && (
                  <span className="absolute top-space-sm left-space-sm px-space-sm py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md font-label-sm text-label-sm text-primary font-semibold shadow-xs">
                    {product.badge}
                  </span>
                )}
              </div>

              <div className="p-space-lg flex flex-col flex-grow justify-between space-y-space-md">
                <div onClick={() => onSelectProduct(product)} className="cursor-pointer">
                  <span className="font-label-sm text-label-sm text-primary tracking-wide uppercase font-semibold">
                    {product?.category_name || 'Handcrafted'}
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5 group-hover:text-primary transition-colors">
                    {product?.name || 'Handcrafted Beverage'}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-space-xs">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Rp {product.price.toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() => onSelectProduct(product)}
                    className="w-10 h-10 rounded-full bg-surface-container-low text-primary flex items-center justify-center hover:bg-primary-container hover:text-on-primary transition-colors shadow-xs active:scale-95 cursor-pointer"
                    type="button"
                    title="Kustomisasi & Pesan"
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

        <div className="flex justify-center pt-space-sm">
          <button
            onClick={onViewFullMenu}
            className="inline-flex items-center gap-space-xs px-space-xl py-3 rounded-full bg-surface-container-lowest text-primary hover:bg-surface-container-low font-label-md font-bold shadow-xs border border-surface-container transition-all cursor-pointer"
          >
            <span>Lihat Menu Lengkap & Order Online</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </section>
  );
};
