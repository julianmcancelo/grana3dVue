import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createPreference } from '@/lib/mercadopago';
import { sendOrderConfirmation, sendAdminNotification } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, couponCode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });
    }

    const productsSnap = await adminDb.collection('products').get();
    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const orderItems = items.map((item: { productId: string; quantity: number }) => {
      const product = products.find(p => p.id === item.productId) as any;
      if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
      return { productId: product.id, name: product.name, quantity: item.quantity, price: product.price };
    });

    const subtotal = orderItems.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);

    let discount = 0;
    let couponId = '';
    if (couponCode) {
      const couponsSnap = await adminDb.collection('coupons').where('code', '==', couponCode.toUpperCase()).where('active', '==', true).get();
      if (!couponsSnap.empty) {
        const coupon = couponsSnap.docs[0].data() as any;
        
        // Check if expired
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return NextResponse.json({ error: 'El cupón ha expirado' }, { status: 400 });
        }
        
        // Check max uses
        if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
          return NextResponse.json({ error: 'El cupón alcanzó el límite de usos' }, { status: 400 });
        }
        
        // Check min purchase
        if (coupon.minPurchase > 0 && subtotal < coupon.minPurchase) {
          return NextResponse.json({ error: `Compra mínima de $${coupon.minPurchase.toLocaleString()} para este cupón` }, { status: 400 });
        }
        
        discount = coupon.discount;
        couponId = couponsSnap.docs[0].id;
      }
    }

    const discountAmount = subtotal * (discount / 100);
    const finalTotal = subtotal - discountAmount;

    const orderRef = await adminDb.collection('orders').add({
      items: orderItems,
      total: subtotal,
      discount,
      finalTotal,
      couponCode: couponCode || null,
      couponId: couponId || null,
      status: 'pending',
      trackingStatus: null,
      mpPaymentId: null,
      customerName: body.customerName || null,
      customerEmail: body.customerEmail || null,
      customerDni: body.customerDni || null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    });

    const preferenceItems = orderItems.map((item: { productId: string; name: string; price: number; quantity: number }) => ({
      id: item.productId,
      title: item.name,
      unitPrice: item.price,
      quantity: item.quantity,
    }));

    if (discount > 0) {
      preferenceItems.push({
        id: 'discount',
        title: `Descuento (${couponCode})`,
        unitPrice: -discountAmount,
        quantity: 1,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const preference = await createPreference(preferenceItems, {
      success: `${baseUrl}/success?order_id=${orderRef.id}`,
      pending: `${baseUrl}/success?order_id=${orderRef.id}`,
      failure: `${baseUrl}/success?order_id=${orderRef.id}`,
    }, orderRef.id);

    // Send WhatsApp notifications (non-blocking)
    const orderData = {
      id: orderRef.id,
      customerName: body.customerName || 'Cliente',
      items: orderItems,
      total: subtotal,
      finalTotal,
      status: 'pending',
    };

    if (body.customerPhone) {
      sendOrderConfirmation(orderData, body.customerPhone).catch(err => console.error('WhatsApp customer notification failed:', err));
    }
    sendAdminNotification(orderData).catch(err => console.error('WhatsApp admin notification failed:', err));

    return NextResponse.json({ orderId: orderRef.id, preferenceId: preference.id, initPoint: preference.init_point });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar' }, { status: 500 });
  }
}
