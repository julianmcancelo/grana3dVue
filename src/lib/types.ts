export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  active: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  minPurchase: number;
  variant: 'standard' | 'post-purchase';
  customerId: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: 'mercadolibre' | 'tienda' | 'otro';
  totalPurchases: number;
  lastPurchase: string | null;
  createdAt: string;
}

export type TrackingStatus = 'confirmed' | 'preparing' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  total: number;
  discount: number;
  finalTotal: number;
  couponCode: string | null;
  couponId: string | null;
  status: 'pending' | 'approved' | 'rejected';
  trackingStatus: TrackingStatus | null;
  mpPaymentId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerDni: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
