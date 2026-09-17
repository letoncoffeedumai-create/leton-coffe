import React, { useState } from 'react';
import { CartItemOption, Product, ProductOptionItem } from '../../types';
import { SYRUP_OPTIONS, TOPPING_OPTIONS } from '../../data/initialData';

interface ProductCustomizationModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, options: CartItemOption, quantity: number) => void;
}

export const ProductCustomizationModal: React.FC<ProductCustomizationModalProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  const [temperature, setTemperature] = useState<string>(
    product.temperature_options && product.temperature_options.length > 0
      ? product.temperature_options[0]
      : 'Iced (Normal)'
  );

  const [sweetness, setSweetness] = useState<string>(
    product.sweetness_options && product.sweetness_options.length > 0
      ? product.sweetness_options[1] || product.sweetness_options[0]
      : '70% Less'
  );

  // Size Cup (Mandatory: Reguler Rp0, Large +Rp5.000)
  const [size, setSize] = useState<'Reguler' | 'Large'>('Reguler');
  const largePriceAddition = product.large_price_addition ?? 5000;
  const sizePrice = size === 'Large' ? largePriceAddition : 0;

  // Selected toppings (default: No Topping)
  const availableToppings = product.toppings || TOPPING_OPTIONS;
  const [selectedToppings, setSelectedToppings] = useState<ProductOptionItem[]>([
    availableToppings[0] || { id: 'top-0', name: 'No Topping', price: 0 }
  ]);

  // Selected syrups (default: No Syrup)
  const availableSyrups = product.syrups || SYRUP_OPTIONS;
  const [selectedSyrups, setSelectedSyrups] = useState<ProductOptionItem[]>([
    availableSyrups[0] || { id: 'syr-0', name: 'No Syrup', price: 0 }
  ]);

  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Toggle topping
  const handleToggleTopping = (topping: ProductOptionItem) => {
    if (topping.name === 'No Topping' || topping.price === 0) {
      setSelectedToppings([topping]);
      return;
    }

    // Remove 'No Topping' if selecting an actual paid topping
    let updated = selectedToppings.filter((t) => t.name !== 'No Topping' && t.price > 0);
    const exists = updated.some((t) => t.id === topping.id);
    if (exists) {
      updated = updated.filter((t) => t.id !== topping.id);
      if (updated.length === 0) {
        updated = [availableToppings[0]];
      }
    } else {
      updated.push(topping);
    }
    setSelectedToppings(updated);
  };

  // Toggle syrup
  const handleToggleSyrup = (syrup: ProductOptionItem) => {
    if (syrup.name === 'No Syrup' || syrup.price === 0) {
      setSelectedSyrups([syrup]);
      return;
    }

    let updated = selectedSyrups.filter((s) => s.name !== 'No Syrup' && s.price > 0);
    const exists = updated.some((s) => s.id === syrup.id);
    if (exists) {
      updated = updated.filter((s) => s.id !== syrup.id);
      if (updated.length === 0) {
        updated = [availableSyrups[0]];
      }
    } else {
      // Single or multiple syrups
      updated.push(syrup);
    }
    setSelectedSyrups(updated);
  };

  // Calculate total price: base + size + toppings + syrups
  const toppingsTotal = selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0);
  const syrupsTotal = selectedSyrups.reduce((sum, s) => sum + (s.price || 0), 0);
  const unitPrice = product.price + sizePrice + toppingsTotal + syrupsTotal;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    onAddToCart(
      product,
      {
        size,
        size_price: sizePrice,
        temperature,
        sweetness,
        toppings: selectedToppings,
        syrups: selectedSyrups,
        notes
      },
      quantity
    );
    onClose();
  };

  const tempOptions = product.temperature_options || ['Iced (Normal)', 'Less Ice', 'Hot Serve'];
  const sweetOptions = product.sweetness_options || ['100%', '70% Less', '40% Low', '0% None'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-surface-container-lowest p-space-lg sm:p-space-xl shadow-2xl border border-surface-container">
        {/* Top Decorative Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-container via-secondary-container to-primary-container"></div>

        {/* Dialog Header */}
        <div className="flex items-center justify-between pb-space-sm border-b border-surface-container/60">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary-container text-[20px]">
              tune
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Customize Drink
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Selected Item Micro-card Preview */}
        <div className="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-low my-space-md">
          <div className="w-14 h-14 rounded-md overflow-hidden bg-surface-container flex-shrink-0">
            <img
              className="w-full h-full object-cover"
              alt={product.name}
              src={product.image_url}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
              {product.name}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Base item: Rp {product.price.toLocaleString('id-ID')}
            </p>
          </div>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-bold">
            {temperature.includes('Hot') ? 'HOT' : 'ICED'}
          </span>
        </div>

        <div className="space-y-space-md">
          {/* Size Cup Selection (Wajib) */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  local_cafe
                </span>
                <label className="font-label-md text-label-md text-on-surface font-bold">
                  Size Cup
                </label>
              </div>
              <span className="font-label-sm text-[11px] px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-bold uppercase tracking-wide">
                Wajib Dipilih
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mb-3">
              Pilih ukuran cup (Reguler atau Large) untuk minuman ini:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSize('Reguler')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  size === 'Reguler'
                    ? 'bg-primary-container text-on-primary border-primary shadow-sm ring-2 ring-primary-container/30'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border-surface-container'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-label-md text-label-md font-bold">Reguler</span>
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      size === 'Reguler' ? 'text-on-primary' : 'text-outline'
                    }`}
                  >
                    {size === 'Reguler' ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      size === 'Reguler' ? 'text-on-primary/90' : 'text-on-surface-variant'
                    }`}
                  >
                    Ukuran Standar
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      size === 'Reguler' ? 'text-on-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    Rp 0
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSize('Large')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  size === 'Large'
                    ? 'bg-primary-container text-on-primary border-primary shadow-sm ring-2 ring-primary-container/30'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border-surface-container'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-label-md text-label-md font-bold">Large</span>
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      size === 'Large' ? 'text-on-primary' : 'text-outline'
                    }`}
                  >
                    {size === 'Large' ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      size === 'Large' ? 'text-on-primary/90' : 'text-on-surface-variant'
                    }`}
                  >
                    Ukuran Besar
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      size === 'Large' ? 'text-on-primary font-extrabold' : 'text-primary font-bold'
                    }`}
                  >
                    +Rp {largePriceAddition.toLocaleString('id-ID')}
                  </span>
                </div>
              </button>
            </div>
          </div>
          {/* Temperature Selection */}
          {tempOptions.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-space-xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Temperature
                </label>
                <span className="font-label-sm text-label-sm text-primary">Required</span>
              </div>
              <div className="grid grid-cols-3 gap-space-xs">
                {tempOptions.map((opt) => {
                  const active = temperature === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setTemperature(opt)}
                      type="button"
                      className={`py-2 px-1 rounded-full text-label-md text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-primary-container text-on-primary shadow-xs font-bold'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sweetness Profile */}
          {sweetOptions.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-space-xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Sweetness Profile
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Current: {sweetness}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {sweetOptions.map((opt) => {
                  const active = sweetness === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setSweetness(opt)}
                      type="button"
                      className={`py-1.5 rounded-md text-label-sm text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-surface-container text-primary font-bold shadow-xs'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toppings Selection */}
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold">
                Topping / Add-ons
              </label>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Bisa pilih lebih dari satu
              </span>
            </div>
            <div className="space-y-1.5">
              {availableToppings.map((top) => {
                const isSelected = selectedToppings.some((t) => t.id === top.id);
                return (
                  <label
                    key={top.id}
                    onClick={() => handleToggleTopping(top)}
                    className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-surface-container text-on-surface font-medium'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container/60'
                    }`}
                  >
                    <div className="flex items-center gap-space-xs">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-surface-container-highest'
                        }`}
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined text-[14px]">
                            check
                          </span>
                        )}
                      </div>
                      <span className="font-body-sm text-body-sm">{top.name}</span>
                    </div>
                    <span
                      className={`font-label-md text-label-md font-bold ${
                        isSelected ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      {top.price === 0 ? 'Rp0' : `+Rp ${top.price.toLocaleString('id-ID')}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Syrups Selection */}
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <label className="font-label-md text-label-md text-on-surface font-semibold">
                Infused Syrups
              </label>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Pilihan rasa sirup
              </span>
            </div>
            <div className="space-y-1.5">
              {availableSyrups.map((syr) => {
                const isSelected = selectedSyrups.some((s) => s.id === syr.id);
                return (
                  <label
                    key={syr.id}
                    onClick={() => handleToggleSyrup(syr)}
                    className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-surface-container text-on-surface font-medium'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container/60'
                    }`}
                  >
                    <div className="flex items-center gap-space-xs">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-surface-container-highest'
                        }`}
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined text-[14px]">
                            check
                          </span>
                        )}
                      </div>
                      <span className="font-body-sm text-body-sm">{syr.name}</span>
                    </div>
                    <span
                      className={`font-label-md text-label-md font-bold ${
                        isSelected ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      {syr.price === 0 ? 'Rp0' : `+Rp ${syr.price.toLocaleString('id-ID')}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Barista Notes */}
          <div>
            <label className="font-label-md text-label-md text-on-surface font-semibold block mb-space-xs">
              Notes for Barista
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. separate ice, oat-milk swap, extra cup please..."
              className="w-full px-space-md py-2 rounded-md bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:bg-surface-container"
            />
          </div>

          {/* Quantity & Dynamic Add Button */}
          <div className="pt-space-sm space-y-space-sm border-t border-surface-container/60">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Total Custom Price:
              </span>
              <div className="flex items-center gap-space-sm bg-surface-container-low px-space-sm py-1 rounded-full border border-surface-container">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary hover:bg-surface-container transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="font-label-lg text-label-lg text-on-surface font-bold px-2">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary hover:bg-surface-container transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-space-xs py-3.5 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg uppercase tracking-wide shadow-md hover:bg-primary transition-all active:scale-98 cursor-pointer font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                shopping_bag
              </span>
              <span>ADD TO CART — Rp {totalPrice.toLocaleString('id-ID')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
