import React, { useState } from 'react';
import { Category } from '../../types';

interface CustomOption {
  id: string;
  name: string;
  category: 'TOPPING' | 'SYRUP' | 'DAIRY' | 'SHOT';
  price: number;
  is_active: boolean;
}

interface CategoriesAndOptionsViewProps {
  categories: Category[];
  onRefreshCategories: () => void;
}

export const CategoriesAndOptionsView: React.FC<CategoriesAndOptionsViewProps> = ({
  categories
}) => {
  // Initial options for Leton Coffee customization
  const [options, setOptions] = useState<CustomOption[]>([
    { id: 'opt-aren', name: 'Gula Aren Organik', category: 'SYRUP', price: 3000, is_active: true },
    { id: 'opt-vanilla', name: 'French Vanilla Syrup', category: 'SYRUP', price: 4000, is_active: true },
    { id: 'opt-caramel', name: 'Salted Caramel Syrup', category: 'SYRUP', price: 4000, is_active: true },
    { id: 'opt-shot', name: 'Extra Single Origin Shot', category: 'SHOT', price: 6000, is_active: true },
    { id: 'opt-oat', name: 'Oat Milk Sub (Dairy Free)', category: 'DAIRY', price: 7000, is_active: true },
    { id: 'opt-jelly', name: 'Coffee Jelly Topping', category: 'TOPPING', price: 5000, is_active: true },
    { id: 'opt-grass', name: 'Cincau Hitam Tradisional', category: 'TOPPING', price: 4000, is_active: true },
    { id: 'opt-boba', name: 'Brown Sugar Pearl', category: 'TOPPING', price: 5000, is_active: true }
  ]);

  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'options'>('categories');
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState(4000);
  const [newOptionCat, setNewOptionCat] = useState<'TOPPING' | 'SYRUP' | 'DAIRY' | 'SHOT'>('TOPPING');

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim()) return;

    const newOpt: CustomOption = {
      id: `opt-${Date.now()}`,
      name: newOptionName.trim(),
      category: newOptionCat,
      price: Number(newOptionPrice),
      is_active: true
    };

    setOptions([...options, newOpt]);
    setNewOptionName('');
  };

  const handleToggleOption = (id: string) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, is_active: !opt.is_active } : opt))
    );
  };

  const handleDeleteOption = (id: string) => {
    setOptions(options.filter((opt) => opt.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-surface-container pb-2">
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Kategori Menu
        </button>
        <button
          onClick={() => setActiveSubTab('options')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'options'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Topping, Syrup & Add-ons
        </button>
      </div>

      {activeSubTab === 'categories' ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs">
            <h3 className="font-title-lg text-title-lg font-bold text-on-surface mb-1">
              Daftar Kategori Minuman
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Kategori utama yang ditampilkan pada navigasi menu publik.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-on-surface">{cat.name}</span>
                  </div>
                  <span className="text-xs font-mono text-outline">#{cat.slug}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add Option Form */}
          <form
            onSubmit={handleAddOption}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-on-surface mb-1">
                Nama Topping / Syrup
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Hazelnut Syrup"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>

            <div className="w-36">
              <label className="block text-xs font-bold text-on-surface mb-1">Kategori</label>
              <select
                value={newOptionCat}
                onChange={(e) => setNewOptionCat(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none"
              >
                <option value="TOPPING">TOPPING</option>
                <option value="SYRUP">SYRUP</option>
                <option value="DAIRY">SUSU / DAIRY</option>
                <option value="SHOT">EXTRA SHOT</option>
              </select>
            </div>

            <div className="w-32">
              <label className="block text-xs font-bold text-on-surface mb-1">Biaya (IDR)</label>
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
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer"
            >
              + Tambah Add-on
            </button>
          </form>

          {/* Options Table */}
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container">
                  <th className="py-3 px-4">Nama Add-on</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Harga Tambahan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-xs">
                {options.map((opt) => (
                  <tr key={opt.id} className="hover:bg-surface-container-low/40">
                    <td className="py-3 px-4 font-bold text-on-surface">{opt.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container text-primary">
                        {opt.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-primary">
                      + Rp {opt.price.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          opt.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {opt.is_active ? 'Tersedia' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleOption(opt.id)}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        {opt.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => handleDeleteOption(opt.id)}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
