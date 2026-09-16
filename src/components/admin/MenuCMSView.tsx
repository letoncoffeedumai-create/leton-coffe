import React, { useMemo, useState } from 'react';
import { Category, Outlet, Product, Profile } from '../../types';
import { productService } from '../../services/productService';
import { normalizeOutletId } from '../../services/authService';

interface MenuCMSViewProps {
  products: Product[];
  categories: Category[];
  outlets: Outlet[];
  profile: Profile | null;
  selectedOutletFilter: string;
  onRefreshProducts: () => void;
}

export const MenuCMSView: React.FC<MenuCMSViewProps> = ({
  products,
  categories,
  outlets,
  profile,
  selectedOutletFilter,
  onRefreshProducts
}) => {
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    category_id: string;
    price: number;
    description: string;
    image_url: string;
    is_active: boolean;
    is_bestseller: boolean;
    badge: string;
    outlet_ids: string[];
  }>({
    name: '',
    category_id: categories[0]?.id || 'cat-signature',
    price: 25000,
    description: '',
    image_url: '',
    is_active: true,
    is_bestseller: false,
    badge: '',
    outlet_ids: ['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo']
  });

  const [isSaving, setIsSaving] = useState(false);

  // Scope products
  const scopedProducts = useMemo(() => {
    return products.filter((p) => {
      // Role scope
      if (!isSuperAdmin) {
        const adminOutlet = normalizeOutletId(profile?.outlet_id || 'sudirman');
        const hasOutlet = p.outlet_ids?.some((oid) => normalizeOutletId(oid) === adminOutlet);
        if (!hasOutlet) return false;
      } else if (selectedOutletFilter !== 'all') {
        const target = normalizeOutletId(selectedOutletFilter);
        const hasOutlet = p.outlet_ids?.some((oid) => normalizeOutletId(oid) === target);
        if (!hasOutlet) return false;
      }

      // Category
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }

      return true;
    });
  }, [products, isSuperAdmin, profile, selectedOutletFilter, selectedCategory, searchQuery]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || 'cat-signature',
      price: 25000,
      description: '',
      image_url: '',
      is_active: true,
      is_bestseller: false,
      badge: '',
      outlet_ids: ['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo']
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category_id: prod.category_id,
      price: prod.price,
      description: prod.description,
      image_url: prod.image_url,
      is_active: prod.is_active,
      is_bestseller: Boolean(prod.is_bestseller),
      badge: prod.badge || '',
      outlet_ids: prod.outlet_ids || ['outlet-sudirman', 'outlet-ratusima', 'outlet-letgo']
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (prod: Product) => {
    try {
      await productService.updateProduct(prod.id, { is_active: !prod.is_active });
      onRefreshProducts();
    } catch (err) {
      console.error('Error toggling product status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const catObj = categories.find((c) => c.id === formData.category_id);
      const productPayload: Product = {
        id: editingProduct?.id || `prod-${Date.now()}`,
        name: formData.name.trim(),
        slug: formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        category_id: formData.category_id,
        category_name: catObj?.name || 'Beverage',
        price: Number(formData.price),
        description: formData.description.trim(),
        image_url: formData.image_url.trim() || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
        is_active: formData.is_active,
        is_bestseller: formData.is_bestseller,
        badge: formData.badge ? formData.badge.trim() : undefined,
        outlet_ids: formData.outlet_ids
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productPayload);
      } else {
        await productService.createProduct(productPayload);
      }

      onRefreshProducts();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute inset-y-0 left-0 pl-3 flex items-center text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama kopi / minuman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-full bg-surface-container-low border border-surface-container text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary-container"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-full bg-surface-container-low border border-surface-container text-xs sm:text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Super admin create button */}
        {isSuperAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-primary-container transition-all shadow-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Tambah Menu Baru</span>
          </button>
        )}
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scopedProducts.map((prod) => (
          <div
            key={prod.id}
            className={`p-4 rounded-2xl bg-surface-container-lowest border transition-all duration-200 flex flex-col justify-between shadow-xs ${
              prod.is_active ? 'border-surface-container' : 'border-surface-container opacity-60'
            }`}
          >
            <div>
              <div className="flex gap-4">
                <img
                  src={prod.image_url}
                  alt={prod.name}
                  className="w-20 h-20 rounded-xl object-cover border border-surface-container shrink-0 bg-surface-container"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-sm text-on-surface truncate">{prod.name}</h4>
                    {prod.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary uppercase shrink-0">
                        {prod.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant block mt-0.5">
                    {prod.category_name}
                  </span>
                  <span className="font-headline-sm text-sm font-bold text-primary mt-1 block">
                    Rp {prod.price.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant line-clamp-2 mt-3 leading-relaxed">
                {prod.description}
              </p>

              {/* Outlet badges */}
              <div className="mt-3 flex flex-wrap gap-1">
                {prod.outlet_ids?.map((oid) => (
                  <span
                    key={oid}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-low text-outline"
                  >
                    {oid.replace('outlet-', '')}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom action buttons */}
            <div className="pt-3 mt-3 border-t border-surface-container flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleActive(prod)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  prod.is_active
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
                type="button"
              >
                {prod.is_active ? 'Tersedia' : 'Kosong / Nonaktif'}
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container cursor-pointer"
                  title="Edit Menu"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
              <h3 className="font-title-lg font-bold text-on-surface">
                {editingProduct ? 'Edit Menu Produk' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nama Menu / Minuman
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kopi Susu Aren Spesial"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Kategori</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Harga (IDR)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs sm:text-sm text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Cerita rasa, komposisi espresso atau susu..."
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  URL Foto Produk
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-on-surface">
                  <input
                    type="checkbox"
                    checked={formData.is_bestseller}
                    onChange={(e) =>
                      setFormData({ ...formData, is_bestseller: e.target.checked })
                    }
                    className="rounded text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Tandai Bestseller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-on-surface">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Tersedia untuk Dipesan</span>
                </label>
              </div>

              {/* Outlet checkboxes */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Tersedia di Outlet:
                </label>
                <div className="flex flex-wrap gap-2">
                  {outlets.map((o) => {
                    const isChecked = formData.outlet_ids.includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container-low text-on-surface border-surface-container'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                outlet_ids: [...formData.outlet_ids, o.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                outlet_ids: formData.outlet_ids.filter((id) => id !== o.id)
                              });
                            }
                          }}
                        />
                        {o.name.replace('Leton Coffee — ', '')}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-surface-container flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-surface-container text-xs font-semibold text-on-surface cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
