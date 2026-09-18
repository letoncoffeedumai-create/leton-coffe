export type Role = 'SUPER_ADMIN' | 'OUTLET_ADMIN' | 'CUSTOMER';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  outlet_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Outlet {
  id: string;
  code: string;
  name: string;
  chapter_label: string;
  subtitle: string;
  address: string;
  description: string;
  opening_hours: string;
  features: string[];
  is_active: boolean;
  image_url: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active?: boolean;
}

export interface ProductOptionItem {
  id: string;
  name: string;
  price: number;
  is_default?: boolean;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: ProductOptionItem[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  category_name?: string;
  price: number;
  large_price_addition?: number;
  large_price?: number;
  has_size_options?: boolean;
  display_order?: number;
  is_hidden?: boolean;
  description: string;
  image_url: string;
  is_active: boolean;
  is_bestseller?: boolean;
  badge?: string;
  outlet_ids?: string[];
  temperature_options?: string[];
  sweetness_options?: string[];
  toppings?: ProductOptionItem[];
  syrups?: ProductOptionItem[];
  requires_topping?: boolean;
  allowed_topping_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ToppingItem {
  id: string;
  name: string;
  price: number;
  category: 'SNACK' | 'BEVERAGE' | 'GENERAL';
  is_active: boolean;
  created_at?: string;
}

export interface CartItemOption {
  size?: 'Reguler' | 'Large';
  size_price?: number;
  temperature?: string;
  sweetness?: string;
  toppings: ProductOptionItem[];
  syrups: ProductOptionItem[];
  notes?: string;
}

export interface CartItem {
  id: string; // unique item cart row ID
  product: Product;
  quantity: number;
  options: CartItemOption;
  unit_price: number;
  subtotal: number;
}

export type OrderType = 'DINE IN' | 'TAKE AWAY';

export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'QRIS' | 'TUNAI';

export type PaymentStatus =
  | 'WAITING PAYMENT'
  | 'WAITING VERIFICATION'
  | 'PAY AT STORE'
  | 'PAID'
  | 'PAYMENT REJECTED';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  options_summary: string;
  options_detail: CartItemOption;
}

export interface Order {
  id: string;
  order_number: string;
  outlet_id: string;
  outlet_name: string;
  customer_name: string;
  customer_phone: string;
  order_type: OrderType;
  table_number?: string;
  items: OrderItem[];
  subtotal: number;
  pb1_tax: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  customer_note?: string;
  rejection_reason?: string;
  payment_proof_url?: string;
  payment_proof_filename?: string;
  created_at: string;
  updated_at: string;
}

export interface Barista {
  id: string;
  name: string;
  role: string;
  outlet: string;
  quote: string;
  favorite_drink: string;
  image_url: string;
  is_on_duty: boolean;
}

export interface WebsiteContent {
  hero: {
    tagline: string;
    title: string;
    subtitle: string;
    description: string;
    featured_item_name: string;
    featured_item_price: number;
    featured_item_desc: string;
    featured_image: string;
  };
  chapters: {
    sudirman: {
      chapter_num: string;
      title: string;
      description: string;
      seating: number;
      daylight: string;
      wifi: string;
      image_url: string;
    };
    ratusima: {
      chapter_num: string;
      title: string;
      description: string;
      features: string[];
      image_url: string;
    };
  };
  open_booth: {
    tag: string;
    title: string;
    description: string;
    bullets: string[];
    wa_link: string;
    image_url: string;
  };
  contact: {
    whatsapp: string;
    instagram: string;
    address: string;
    hours: string;
  };
  settings: {
    site_title: string;
    tax_percent: number;
    eco_discount: number;
    qris_nmid: string;
  };
}
