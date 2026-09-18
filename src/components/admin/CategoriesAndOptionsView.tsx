import React, { useEffect, useState } from 'react';
import { Category, Product, Profile, ToppingItem } from '../../types';
import { productService } from '../../services/productService';
import { generateCategorySlug } from '../../lib/slug';

interface CategoriesAndOptionsViewProps {
  categories: Category[];
  products?: Product[];
  profile?: Profile | null;
  onRefreshCategories: () => void;
}

export const CategoriesAndOptionsView: React.FC<CategoriesAndOptionsViewProps> = ({
  categories = [],
  products = [],
  profile = null,
  onRefreshCategories
}) => {
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  // Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'options'>('categories');

  // Modal / Editing states for Categories
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formActive, setFormActive] = useState<boolean>(true);

  // Feedback & Loading
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Deletion modals
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [blockedDeleteCategory, setBlockedDeleteCategory] = useState<{
    category: Category;
    products: Product[];
  } | null>(null);

  // Options & Toppings state
  const [toppings, setToppings] = useState<ToppingItem[]>([]);
  const [isLoadingToppings, setIsLoadingToppings] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState(4000);
  const [newOptionCat, setNewOptionCat] = useState<'SNACK' | 'BEVERAGE' | 'GENERAL'>('BEVERAGE');
  const [editingTopping, setEditingTopping] = useState<ToppingItem | null>(null);

  // Fetch real toppings from Supabase on mount
  const loadToppings = async () => {
    setIsLoadingToppings(true);
    try {
      const data = await productService.getToppings();
      if (Array.isArray(data)) {
        setToppings(data);
      }
    } catch (err) {
      console.error('Failed to load toppings:', err);
    } finally {
      setIsLoadingToppings(false);
    }
  };

  useEffect(() => {
    loadToppings();
  }, []);

  // Sorted categories
  const sortedCategories = [...categories].sort(
    (a, b) => (a.display_order || 0) - (b.display_order || 0)
  );

  // Show feedback helper
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    if (!isSuperAdmin) return;
    const nextOrder = categories.length > 0
      ? Math.max(...categories.map((c) => c.display_order || 0)) + 1
      : 1;
    setFormName('');
    setFormSlug('');
    setIsManualSlug(false);
    setFormOrder(nextOrder);
    setFormActive(true);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat: Category) => {
    if (!isSuperAdmin) return;
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setIsManualSlug(true);
    setFormOrder(cat.display_order || 1);
    setFormActive(cat.is_active !== false);
  };

  // Save Add Category
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    if (!formName.trim()) {
      showFeedback('error', 'Nama kategori wajib diisi.');
      return;
    }

    setIsProcessing(true);
    try {
      await productService.createCategory({
        name: formName.trim(),
        display_order: Number(formOrder) || 1,
        is_active: formActive
      });
      showFeedback('success', 'Kategori berhasil ditambahkan ke Supabase');
      setIsAddModalOpen(false);
      await onRefreshCategories();
    } catch (err: any) {
      console.error('Error creating category:', err);
      showFeedback('error', `Gagal menambahkan kategori: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !editingCategory) return;
    if (!formName.trim()) {
      showFeedback('error', 'Nama kategori tidak boleh kosong.');
      return;
    }

    setIsProcessing(true);
    try {
      await productService.updateCategory(editingCategory.id, {
        name: formName.trim(),
        display_order: Number(formOrder) || 1,
        is_active: formActive
      });
      showFeedback('success', 'Kategori berhasil diperbarui');
      setEditingCategory(null);
      await onRefreshCategories();
    } catch (err: any) {
      console.error('Error updating category:', err);
      showFeedback('error', `Gagal memperbarui kategori: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Active/Nonaktif
  const handleToggleActive = async (cat: Category) => {
    if (!isSuperAdmin) return;
    setIsProcessing(true);
    try {
      await productService.toggleCategoryActive(cat.id);
      const newStatus = cat.is_active === false ? 'diaktifkan' : 'dinonaktifkan';
      showFeedback('success', `Kategori "${cat.name}" berhasil ${newStatus}`);
      await onRefreshCategories();
    } catch (err: any) {
      console.error('Error toggling category status:', err);
      showFeedback('error', `Gagal mengubah status kategori: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reorder (Move Up / Move Down)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (!isSuperAdmin) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    const newOrderList = [...sortedCategories];
    const temp = newOrderList[index];
    newOrderList[index] = newOrderList[targetIndex];
    newOrderList[targetIndex] = temp;

    const orderedIds = newOrderList.map((c) => c.id);
    setIsProcessing(true);
    try {
      await productService.reorderCategories(orderedIds);
      showFeedback('success', 'Urutan kategori berhasil diperbarui');
      await onRefreshCategories();
    } catch (err: any) {
      console.error('Error reordering categories:', err);
      showFeedback('error', `Gagal mengubah urutan kategori: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete category clicked
  const handleDeleteClick = (cat: Category) => {
    if (!isSuperAdmin) return;

    // Check if category has associated products
    const associatedProducts = products.filter(
      (p) => p.category_id === cat.id || p.category_id === cat.slug
    );

    if (associatedProducts.length > 0) {
      setBlockedDeleteCategory({
        category: cat,
        products: associatedProducts
      });
      return;
    }

    setCategoryToDelete(cat);
  };

  // Confirm delete category
  const handleConfirmDelete = async () => {
    if (!isSuperAdmin || !categoryToDelete) return;
    setIsProcessing(true);
    try {
      await productService.deleteCategory(categoryToDelete.id);
      showFeedback('success', 'Kategori berhasil dihapus');
      setCategoryToDelete(null);
      await onRefreshCategories();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      showFeedback('error', `Gagal menghapus kategori: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Option & Topping handlers
  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim()) return;

    setIsProcessing(true);
    try {
      await productService.createTopping({
        name: newOptionName.trim(),
        category: newOptionCat,
        price: Number(newOptionPrice) || 0,
        is_active: true
      });
      showFeedback('success', `Topping "${newOptionName}" berhasil ditambahkan ke Supabase`);
      setNewOptionName('');
      setNewOptionPrice(4000);
      await loadToppings();
    } catch (err: any) {
      console.error('Error creating topping:', err);
      showFeedback('error', `Gagal menambahkan topping: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleOption = async (id: string, currentActive: boolean) => {
    setIsProcessing(true);
    try {
      await productService.updateTopping(id, { is_active: !currentActive });
      showFeedback('success', 'Status topping berhasil diubah');
      await loadToppings();
    } catch (err: any) {
      console.error('Error toggling topping:', err);
      showFeedback('error', 'Gagal mengubah status topping');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteOption = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus topping "${name}"?`)) return;
    setIsProcessing(true);
    try {
      await productService.deleteTopping(id);
      showFeedback('success', 'Topping berhasil dihapus dari Supabase');
      await loadToppings();
    } catch (err: any) {
      console.error('Error deleting topping:', err);
      showFeedback('error', 'Gagal menghapus topping');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEditTopping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopping || !editingTopping.name.trim()) return;

    setIsProcessing(true);
    try {
      await productService.updateTopping(editingTopping.id, {
        name: editingTopping.name.trim(),
        price: Number(editingTopping.price) || 0,
        category: editingTopping.category,
        is_active: editingTopping.is_active
      });
      showFeedback('success', 'Topping berhasil diperbarui di Supabase');
      setEditingTopping(null);
      await loadToppings();
    } catch (err: any) {
      console.error('Error updating topping:', err);
      showFeedback('error', 'Gagal memperbarui topping');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {feedbackMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Role Banner if not Super Admin */}
      {!isSuperAdmin && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 text-[20px] mt-0.5">
            lock
          </span>
          <div>
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
              Akses Terbatas: Khusus Admin Pusat
            </h4>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-400 mt-0.5">
              Hanya Super Admin / Admin Pusat yang dapat menambah, mengubah, mengurutkan, atau menghapus kategori menu. Admin outlet (Sudirman / Kelakap 7) hanya memiliki akses baca.
            </p>
          </div>
        </div>
      )}

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-surface-container pb-2">
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'categories'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">category</span>
          <span>Kategori Menu</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary-container/20 text-on-primary">
            {categories.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('options')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'options'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">liquor</span>
          <span>Topping, Syrup & Add-ons</span>
        </button>
      </div>

      {activeSubTab === 'categories' ? (
        <div className="space-y-4">
          {/* Header & Actions */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">category</span>
                <h3 className="font-headline-sm font-bold text-on-surface text-base sm:text-lg">
                  Manajemen Kategori Menu
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                  Admin Pusat
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Kelola kategori yang digunakan pada filter menu customer. Perubahan langsung tersinkronisasi ke Supabase.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={handleOpenAddModal}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Tambah Kategori Baru</span>
              </button>
            )}
          </div>

          {/* Categories Table / List */}
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container">
                    <th className="py-3 px-4 w-16 text-center">Urutan</th>
                    <th className="py-3 px-4">Nama Kategori</th>
                    <th className="py-3 px-4">Slug URL</th>
                    <th className="py-3 px-4 text-center">Jumlah Produk</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {isSuperAdmin && (
                      <th className="py-3 px-4 text-right">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-xs">
                  {sortedCategories.map((cat, idx) => {
                    const productCount = products.filter(
                      (p) => p.category_id === cat.id || p.category_id === cat.slug
                    ).length;
                    const isActive = cat.is_active !== false;

                    return (
                      <tr
                        key={cat.id}
                        className={`hover:bg-surface-container-low/50 transition-colors ${
                          !isActive ? 'opacity-60 bg-surface-container-low/20' : ''
                        }`}
                      >
                        {/* Order & Move Buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="w-6 h-6 rounded-full bg-surface-container font-mono text-xs font-bold flex items-center justify-center text-on-surface">
                              {cat.display_order ?? idx + 1}
                            </span>
                            {isSuperAdmin && (
                              <div className="flex flex-col ml-1">
                                <button
                                  onClick={() => handleMoveOrder(idx, 'up')}
                                  disabled={idx === 0 || isProcessing}
                                  className="text-outline hover:text-primary disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed leading-none p-0.5"
                                  title="Pindah ke atas"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    expand_less
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleMoveOrder(idx, 'down')}
                                  disabled={idx === sortedCategories.length - 1 || isProcessing}
                                  className="text-outline hover:text-primary disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed leading-none p-0.5"
                                  title="Pindah ke bawah"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    expand_more
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Category Name */}
                        <td className="py-3 px-4 font-bold text-on-surface">
                          <div className="flex items-center gap-2">
                            <span>{cat.name}</span>
                            {cat.slug === 'all' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-container text-outline">
                                DEFAULT
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant">
                          #{cat.slug}
                        </td>

                        {/* Product Count */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-block ${
                              productCount > 0
                                ? 'bg-primary/10 text-primary'
                                : 'bg-surface-container text-outline'
                            }`}
                          >
                            {productCount} Menu
                          </span>
                        </td>

                        {/* Status (Active / Inactive) */}
                        <td className="py-3 px-4 text-center">
                          {isSuperAdmin ? (
                            <button
                              onClick={() => handleToggleActive(cat)}
                              disabled={isProcessing}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                              title={isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              ></span>
                              <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          )}
                        </td>

                        {/* Actions (Super Admin Only) */}
                        {isSuperAdmin && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(cat)}
                                disabled={isProcessing}
                                className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                title="Edit Kategori"
                              >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(cat)}
                                disabled={isProcessing}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                title="Hapus Kategori"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add Option / Topping Form */}
          {isSuperAdmin && (
            <form
              onSubmit={handleAddOption}
              className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-wrap items-end gap-3"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nama Topping / Add-on <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Keju Parut, Boba, Saus Tartar"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="w-44">
                <label className="block text-xs font-bold text-on-surface mb-1">Kategori Topping</label>
                <select
                  value={newOptionCat}
                  onChange={(e) => setNewOptionCat(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                >
                  <option value="BEVERAGE">🥤 Minuman (Beverage)</option>
                  <option value="SNACK">🍟 Makanan / Snack</option>
                  <option value="GENERAL">✨ Semua Menu (General)</option>
                </select>
              </div>

              <div className="w-36">
                <label className="block text-xs font-bold text-on-surface mb-1">Harga Tambahan (Rp)</label>
                <input
                  type="number"
                  step={500}
                  min={0}
                  value={newOptionPrice}
                  onChange={(e) => setNewOptionPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Menyimpan...' : '+ Tambah Topping'}
              </button>
            </form>
          )}

          {/* Options / Toppings Table */}
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container overflow-hidden shadow-xs">
            <div className="p-4 border-b border-surface-container flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-on-surface">Daftar Topping & Add-on (Supabase)</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Topping ini dapat ditautkan ke kategori Snack atau Minuman, atau produk tertentu.
                </p>
              </div>
              <button
                type="button"
                onClick={loadToppings}
                disabled={isLoadingToppings}
                className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className={`material-symbols-outlined text-[15px] ${isLoadingToppings ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                Muat Ulang
              </button>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container">
                  <th className="py-3 px-4">Nama Topping</th>
                  <th className="py-3 px-4">Tipe Menu</th>
                  <th className="py-3 px-4">Harga Tambahan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-xs">
                {toppings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-outline">
                      {isLoadingToppings ? 'Memuat data topping...' : 'Belum ada topping. Tambahkan topping di atas.'}
                    </td>
                  </tr>
                ) : (
                  toppings.map((opt) => (
                    <tr key={opt.id} className="hover:bg-surface-container-low/40">
                      <td className="py-3 px-4 font-bold text-on-surface">{opt.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          opt.category === 'SNACK'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
                            : opt.category === 'BEVERAGE'
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-surface-container text-primary'
                        }`}>
                          {opt.category === 'SNACK' ? '🍟 Snack' : opt.category === 'BEVERAGE' ? '🥤 Minuman' : '✨ Umum'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        + Rp {Number(opt.price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            opt.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                          }`}
                        >
                          {opt.is_active ? 'Tersedia' : 'Nonaktif'}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleOption(opt.id, opt.is_active)}
                            disabled={isProcessing}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer disabled:opacity-40"
                          >
                            {opt.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            onClick={() => setEditingTopping(opt)}
                            disabled={isProcessing}
                            className="text-xs font-bold text-amber-700 hover:underline cursor-pointer disabled:opacity-40"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOption(opt.id, opt.name)}
                            disabled={isProcessing}
                            className="text-xs font-bold text-red-600 hover:underline cursor-pointer disabled:opacity-40"
                          >
                            Hapus
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Edit Topping Modal */}
          {editingTopping && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl border border-surface-container">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-container">
                  <h4 className="font-title-lg font-bold text-on-surface">Edit Topping / Add-on</h4>
                  <button
                    onClick={() => setEditingTopping(null)}
                    className="p-1 rounded-lg text-outline hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <form onSubmit={handleSaveEditTopping} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Nama Topping <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTopping.name}
                      onChange={(e) => setEditingTopping({ ...editingTopping, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Kategori Menu</label>
                      <select
                        value={editingTopping.category || 'BEVERAGE'}
                        onChange={(e) => setEditingTopping({ ...editingTopping, category: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                      >
                        <option value="BEVERAGE">🥤 Minuman</option>
                        <option value="SNACK">🍟 Snack</option>
                        <option value="GENERAL">✨ Umum</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Harga Tambahan (Rp)</label>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={editingTopping.price}
                        onChange={(e) => setEditingTopping({ ...editingTopping, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={editingTopping.is_active}
                        onChange={(e) => setEditingTopping({ ...editingTopping, is_active: e.target.checked })}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-xs font-bold text-on-surface">Topping Aktif / Tersedia</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-surface-container">
                    <button
                      type="button"
                      onClick={() => setEditingTopping(null)}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-full bg-surface-container text-xs font-semibold text-on-surface cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-5 py-2 rounded-full bg-primary text-on-primary font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Tambah Kategori Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl border border-surface-container">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  create_new_folder
                </span>
                <h4 className="font-title-lg font-bold text-on-surface">Tambah Kategori Baru</h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Snack & Finger Food"
                  value={formName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormName(val);
                    if (!isManualSlug) {
                      setFormSlug(generateCategorySlug(val));
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-on-surface">
                    Slug Kategori (URL identifier)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManualSlug(!isManualSlug)}
                    className="text-[11px] text-primary hover:underline cursor-pointer font-semibold"
                  >
                    {isManualSlug ? 'Auto-generate' : 'Edit Manual'}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-outline font-mono">#</span>
                  <input
                    type="text"
                    required
                    value={formSlug || (formName ? generateCategorySlug(formName) : '')}
                    onChange={(e) => {
                      setIsManualSlug(true);
                      setFormSlug(generateCategorySlug(e.target.value));
                    }}
                    placeholder="snack-finger-food"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Slug dibuat otomatis dari nama kategori dan digunakan untuk filter & tab menu.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Status Kategori
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-on-surface">Aktif di Menu</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-full bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isProcessing ? 'Menyimpan...' : 'Simpan Kategori'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Kategori */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl border border-surface-container">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">edit</span>
                <h4 className="font-title-lg font-bold text-on-surface">Edit Kategori Menu</h4>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Status Kategori
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-on-surface">Aktif di Menu</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-full bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PERINGATAN: Kategori Masih Memiliki Produk (DILARANG HAPUS) */}
      {blockedDeleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl border border-surface-container">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h4 className="font-title-lg font-bold text-on-surface">
                  Kategori Tidak Dapat Dihapus
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  Kategori <strong>&ldquo;{blockedDeleteCategory.category.name}&rdquo;</strong> masih memiliki{' '}
                  <span className="text-amber-600 font-bold">
                    {blockedDeleteCategory.products.length} produk menu
                  </span>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface space-y-2 mb-4">
              <p className="font-semibold text-on-surface-variant">
                Untuk mencegah produk terhapus atau hilang dari menu, silakan pindahkan produk-produk berikut ke kategori lain terlebih dahulu pada menu <strong>Menu & Produk</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto pl-1 text-[11px] text-on-surface font-medium">
                {blockedDeleteCategory.products.slice(0, 10).map((prod) => (
                  <li key={prod.id}>{prod.name}</li>
                ))}
                {blockedDeleteCategory.products.length > 10 && (
                  <li className="italic text-outline">
                    ... dan {blockedDeleteCategory.products.length - 10} produk lainnya
                  </li>
                )}
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setBlockedDeleteCategory(null)}
                className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container cursor-pointer transition-colors"
              >
                Mengerti & Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI: Hapus Kategori Kosong */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl border border-surface-container">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">delete</span>
              </div>
              <div>
                <h4 className="font-title-lg font-bold text-red-700 dark:text-red-400">
                  Konfirmasi Hapus Kategori
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  Apakah Anda yakin ingin menghapus kategori{' '}
                  <strong>&ldquo;{categoryToDelete.name}&rdquo;</strong> (#{categoryToDelete.slug})?
                </p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant mb-5">
              Kategori ini tidak memiliki produk di dalamnya dan akan dihapus secara permanen dari daftar kategori.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-full bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{isProcessing ? 'Menghapus...' : 'Ya, Hapus Kategori'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
