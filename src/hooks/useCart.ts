import { useState, useEffect } from 'react';
import { CartItem, CartItemOption, OrderType, Product } from '../types';

const CART_STORAGE_KEY = 'leton_active_cart';
const CART_OUTLET_KEY = 'leton_selected_outlet_id';
const CART_MODE_KEY = 'leton_fulfillment_mode';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (it: any) =>
          it &&
          it.product &&
          typeof it.product === 'object' &&
          typeof it.product.name === 'string'
      );
    } catch {
      return [];
    }
  });

  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    return localStorage.getItem(CART_OUTLET_KEY) || 'outlet-sudirman';
  });

  const [fulfillmentMode, setFulfillmentMode] = useState<OrderType>(() => {
    return (localStorage.getItem(CART_MODE_KEY) as OrderType) || 'DINE IN';
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(CART_OUTLET_KEY, selectedOutletId);
  }, [selectedOutletId]);

  useEffect(() => {
    localStorage.setItem(CART_MODE_KEY, fulfillmentMode);
  }, [fulfillmentMode]);

  const addItem = (product: Product, options: CartItemOption, quantity: number = 1) => {
    // Calculate unit price: product base price + sum of topping prices + sum of syrup prices
    const toppingsPrice = (options.toppings || []).reduce((sum, t) => sum + (t.price || 0), 0);
    const syrupsPrice = (options.syrups || []).reduce((sum, s) => sum + (s.price || 0), 0);
    const unitPrice = product.price + toppingsPrice + syrupsPrice;

    const newItem: CartItem = {
      id: `cart-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      product,
      quantity,
      options,
      unit_price: unitPrice,
      subtotal: unitPrice * quantity
    };

    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: qty,
              subtotal: item.unit_price * qty
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const pb1Tax = Math.round(subtotal * 0.1); // 10% Restaurant Tax PB1
  const ecoDiscount = items.length > 0 ? 0 : 0;
  const total = subtotal + pb1Tax - ecoDiscount;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    selectedOutletId,
    setSelectedOutletId,
    fulfillmentMode,
    setFulfillmentMode,
    addItem,
    addToCart: addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    pb1Tax,
    ecoDiscount,
    total,
    totalQuantity,
    totalItems: totalQuantity
  };
}
