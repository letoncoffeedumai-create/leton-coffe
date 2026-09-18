import { Order, OrderStatus, PaymentStatus } from '../types';
import { SAMPLE_ORDERS } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ORDERS_STORAGE_KEY = 'leton_orders_data';

// Event emitter helper for instant intra-window and multi-tab realtime sync
type OrderListener = (orders: Order[]) => void;
const listeners = new Set<OrderListener>();

function notifyListeners(orders: Order[]) {
  listeners.forEach((listener) => {
    try {
      listener(orders);
    } catch (err) {
      console.error('Error notifying order listener:', err);
    }
  });
}

// Multi-tab storage sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === ORDERS_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        notifyListeners(parsed);
      } catch {
        // ignore
      }
    }
  });
}

let activeRealtimeChannel: any = null;

function ensureRealtimeSubscription() {
  if (!isSupabaseConfigured || !supabase || activeRealtimeChannel) {
    return;
  }

  try {
    const channelName = `orders-realtime-${Date.now()}`;
    activeRealtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async () => {
          try {
            const fresh = await orderService.getOrders();
            notifyListeners(fresh);
          } catch (err) {
            console.warn('Realtime order update error:', err);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'TIMED_OUT' || status === 'CLOSED') {
          if (activeRealtimeChannel && supabase) {
            try {
              supabase.removeChannel(activeRealtimeChannel);
            } catch {
              // ignore
            }
            activeRealtimeChannel = null;
          }
        }
      });
  } catch (err) {
    console.warn('Could not establish Supabase realtime channel:', err);
  }
}

function cleanupRealtimeSubscription() {
  if (listeners.size === 0 && activeRealtimeChannel && supabase) {
    try {
      supabase.removeChannel(activeRealtimeChannel);
    } catch {
      // ignore
    }
    activeRealtimeChannel = null;
  }
}

export const orderService = {
  async getOrders(outletId?: string): Promise<Order[]> {
    try {
      const url = outletId ? `/api/orders?outlet_id=${encodeURIComponent(outletId)}` : '/api/orders';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(data));
          return data as Order[];
        }
      }
    } catch (apiErr) {
      console.warn('Failed to fetch orders from /api/orders, checking client supabase / storage:', apiErr);
    }

    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (outletId) {
        query = query.eq('outlet_id', outletId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Order[];
      }
    }

    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    let orders: Order[] = SAMPLE_ORDERS;
    if (stored) {
      try {
        orders = JSON.parse(stored);
      } catch {
        // fallback
      }
    } else {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(SAMPLE_ORDERS));
    }

    if (outletId) {
      return orders.filter((o) => o.outlet_id === outletId);
    }
    return orders;
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find((o) => o.id === orderId || o.order_number === orderId) || null;
  },

  async createOrder(order: Order): Promise<Order> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (res.ok) {
        const created = await res.json();
        const current = await this.getOrders();
        const updated = [created, ...current.filter((o) => o.id !== created.id)];
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
        notifyListeners(updated);
        return created;
      }
    } catch (apiErr) {
      console.warn('API createOrder failed, trying client supabase:', apiErr);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('orders').insert({
          id: order.id,
          order_number: order.order_number,
          outlet_id: order.outlet_id,
          outlet_name: order.outlet_name,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          order_type: order.order_type,
          table_number: order.table_number,
          subtotal: order.subtotal,
          pb1_tax: order.pb1_tax,
          discount: order.discount,
          total: order.total,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          order_status: order.order_status,
          customer_note: order.customer_note,
          payment_proof_url: order.payment_proof_url,
          created_at: order.created_at,
          updated_at: order.updated_at
        });

        if (!error && order.items && order.items.length > 0) {
          const itemsPayload = order.items.map((item) => ({
            id: item.id,
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_image: item.product_image,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
            options_summary: item.options_summary,
            options_detail: item.options_detail
          }));
          await supabase.from('order_items').insert(itemsPayload);
        }
      } catch (err) {
        console.warn('Supabase order creation exception:', err);
      }
    }

    const current = await this.getOrders();
    const updated = [order, ...current];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
    notifyListeners(updated);
    return order;
  },

  async updateOrderStatus(
    orderId: string,
    orderStatus: OrderStatus,
    rejectionReason?: string
  ): Promise<Order | null> {
    const now = new Date().toISOString();

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: orderStatus,
          rejection_reason: rejectionReason
        })
      });
      if (res.ok) {
        const updated = await res.json();
        const current = await this.getOrders();
        const updatedList = current.map((o) => (o.id === orderId ? { ...o, ...updated } : o));
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedList));
        notifyListeners(updatedList);
        return updated;
      }
    } catch (apiErr) {
      console.warn('API updateOrderStatus failed, trying client supabase:', apiErr);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('orders')
        .update({
          order_status: orderStatus,
          rejection_reason: rejectionReason,
          updated_at: now
        })
        .eq('id', orderId);
    }

    const current = await this.getOrders();
    const target = current.find((o) => o.id === orderId);
    if (!target) return null;

    const updatedOrder: Order = {
      ...target,
      order_status: orderStatus,
      rejection_reason: rejectionReason !== undefined ? rejectionReason : target.rejection_reason,
      updated_at: now
    };

    const updatedList = current.map((o) => (o.id === orderId ? updatedOrder : o));
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedList));
    notifyListeners(updatedList);
    return updatedOrder;
  },

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    rejectionReason?: string
  ): Promise<Order | null> {
    const now = new Date().toISOString();

    try {
      const res = await fetch(`/api/orders/${orderId}/payment-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: paymentStatus,
          rejection_reason: rejectionReason
        })
      });
      if (res.ok) {
        const updated = await res.json();
        const current = await this.getOrders();
        const updatedList = current.map((o) => (o.id === orderId ? { ...o, ...updated } : o));
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedList));
        notifyListeners(updatedList);
        return updated;
      }
    } catch (apiErr) {
      console.warn('API updatePaymentStatus failed, trying client supabase:', apiErr);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          rejection_reason: rejectionReason,
          updated_at: now
        })
        .eq('id', orderId);
    }

    const current = await this.getOrders();
    const target = current.find((o) => o.id === orderId);
    if (!target) return null;

    const updatedOrder: Order = {
      ...target,
      payment_status: paymentStatus,
      rejection_reason: rejectionReason !== undefined ? rejectionReason : target.rejection_reason,
      updated_at: now
    };

    const updatedList = current.map((o) => (o.id === orderId ? updatedOrder : o));
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedList));
    notifyListeners(updatedList);
    return updatedOrder;
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const current = await this.getOrders();
        const updatedList = current.filter((o) => o.id !== orderId);
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedList));
        notifyListeners(updatedList);
        return true;
      }
    } catch (apiErr) {
      console.warn('API deleteOrder failed, trying client supabase:', apiErr);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
    }

    const current = await this.getOrders();
    const updatedList = current.filter((o) => o.id !== orderId);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedList));
    notifyListeners(updatedList);
    return true;
  },

  subscribe(listener: OrderListener): () => void {
    listeners.add(listener);
    ensureRealtimeSubscription();

    return () => {
      listeners.delete(listener);
      cleanupRealtimeSubscription();
    };
  }
};
