import React, { useMemo } from 'react';
import { Outlet, Product, Profile } from '../../types';
import { productService } from '../../services/productService';
import { normalizeOutletId } from '../../services/authService';

interface StockManagementViewProps {
  products: Product[];
  outlets: Outlet[];
  profile: Profile | null;
  selectedOutletFilter: string;
  onRefreshProducts: () => void;
}

export const StockManagementView: React.FC<StockManagementViewProps> = ({
  products,
  outlets,
  profile,
  selectedOutletFilter,
  onRefreshProducts
}) => {
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  const currentOutletScope = useMemo(() => {
    if (!isSuperAdmin) {
      return normalizeOutletId(profile?.outlet_id || 'sudirman');
    }
    if (selectedOutletFilter === 'all') return 'all';
    return normalizeOutletId(selectedOutletFilter);
  }, [isSuperAdmin, profile, selectedOutletFilter]);

  const handleToggleStock = async (product: Product) => {
    try {
      await productService.updateProduct(product.id, {
        is_active: !product.is_active
      });
      onRefreshProducts();
    } catch (err) {
      console.error('Error updating stock status:', err);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (currentOutletScope === 'all') return true;
      return p.outlet_ids?.some((oid) => normalizeOutletId(oid) === currentOutletScope);
    });
  }, [products, currentOutletScope]);

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
            Manajemen Stok & Ketersediaan Menu
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Kontrol cepat ketersediaan menu per cabang secara real-time. Menu nonaktif tidak akan bisa dipesan pelanggan.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
          {filteredProducts.filter((p) => p.is_active).length} / {filteredProducts.length} Tersedia
        </span>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container">
                <th className="py-3 px-4">Menu Minuman</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga</th>
                <th className="py-3 px-4">Cabang</th>
                <th className="py-3 px-4 text-center">Status Stok</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-xs">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover bg-surface-container shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="font-bold text-on-surface block">{p.name}</span>
                        {p.is_bestseller && (
                          <span className="text-[10px] text-primary font-semibold">★ Bestseller</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant">{p.category_name}</td>
                  <td className="py-3 px-4 font-semibold text-on-surface">
                    Rp {p.price.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {p.outlet_ids?.map((oid) => (
                        <span
                          key={oid}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container text-outline"
                        >
                          {oid.replace('outlet-', '')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        p.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.is_active ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      ></span>
                      {p.is_active ? 'In Stock (Siap)' : 'Out of Stock (Habis)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleStock(p)}
                      className={`px-3 py-1.5 rounded-full font-bold text-xs transition-colors cursor-pointer ${
                        p.is_active
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {p.is_active ? 'Tandai Habis' : 'Tandai Tersedia'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
