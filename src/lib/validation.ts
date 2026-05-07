import { z } from 'zod';

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(20),
  couponCode: z.string().optional().nullable(),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  customerDni: z.string().min(6).max(10),
  customerPhone: z.string().optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive().max(999999999),
  stock: z.number().int().min(0).max(99999),
  image: z.string().optional(),
});

export const couponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discount: z.number().int().min(1).max(90),
  active: z.boolean().default(true),
  maxUses: z.number().int().min(0).optional(),
  expiresAt: z.string().optional(),
  minPurchase: z.number().min(0).optional(),
  variant: z.enum(['standard', 'post-purchase']).default('standard'),
});

export const customerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  dni: z.string().optional(),
  address: z.string().optional(),
});

export const trackingSchema = z.object({
  id: z.string().min(1),
  trackingStatus: z.enum(['confirmed', 'preparing', 'shipped', 'delivered']),
});

export const orderUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  trackingStatus: z.enum(['confirmed', 'preparing', 'shipped', 'delivered']).optional(),
  trackingCode: z.string().max(100).optional(),
  courier: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const assistantSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000),
  })).max(20).optional(),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().positive(),
});

export const mlImportSchema = z.object({
  items: z.array(z.object({
    mlId: z.string().min(1),
    title: z.string().min(1).max(200),
    price: z.number().positive(),
    stock: z.number().int().min(0),
    mainImage: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),
  })).min(1).max(100),
});
