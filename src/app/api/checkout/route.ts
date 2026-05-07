import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createPreference } from '@/lib/mercadopago';
import { sendOrderConfirmation, sendAdminNotification } from '@/lib/whatsapp';
import { checkoutSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos invalidos', details: validation.error.issues }, { status: 400 });
    }

    const { items, couponCode, customerName, customerEmail, customerDni, customerPhone } = validation.data;

    const productsSnap = await adminDb.collection('products').get();
    const products = productsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    const orderItems = [];
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: `Producto no encontrado` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuficiente para ${product.name}` }, { status: 400 });
      }
      if (product.stock <= 0) {
        return NextResponse.json({ error: `${product.name} agotado` }, { status: 400 });
      }
      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discount = 0;
    let couponId = '';
    if (couponCode) {
      const couponsSnap = await adminDb.collection('coupons').where('code', '==', couponCode.toUpperCase()).where('active', '==', true).get();
      if (!couponsSnap.empty) {
        const coupon = couponsSnap.docs[0].data() as any;

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return NextResponse.json({ error: 'El cupon ha expirado' }, { status: 400 });
        }

        if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
          return NextResponse.json({ error: 'El cupon alcanzo el limite de usos' }, { status: 400 });
        }

        if (coupon.minPurchase > 0 && subtotal < coupon.minPurchase) {
          return NextResponse.json({ error: `Compra minima de $${coupon.minPurchase.toLocaleString()} para este cupon` }, { status: 400 });
        }

        discount = Math.min(coupon.discount, 90);
        couponId = couponsSnap.docs[0].id;
      }
    }

    const discountAmount = subtotal * (discount / 100);
    const finalTotal = Math.max(subtotal - discountAmount, 0);

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
      customerName: customerName.trim().slice(0, 100),
      customerEmail: customerEmail.toLowerCase().trim().slice(0, 200),
      customerDni: customerDni.replace(/\D/g, '').slice(0, 10),
      customerPhone: customerPhone ? customerPhone.replace(/\D/g, '').slice(0, 15) : null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    });

    const preferenceItems = orderItems.map(item => ({
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.grana3d.com.ar';
    const preference = await createPreference(preferenceItems, {
      success: `${baseUrl}/success?order_id=${orderRef.id}`,
      pending: `${baseUrl}/success?order_id=${orderRef.id}`,
      failure: `${baseUrl}/success?order_id=${orderRef.id}`,
    }, orderRef.id);

    const orderData = {
      id: orderRef.id,
      customerName: customerName || 'Cliente',
      items: orderItems,
      total: subtotal,
      finalTotal,
      status: 'pending',
    };

    if (customerPhone) {
      sendOrderConfirmation(orderData, customerPhone).catch(err => console.error('WhatsApp customer notification failed:', err));
    }
    sendAdminNotification(orderData).catch(err => console.error('WhatsApp admin notification failed:', err));

    return NextResponse.json({ orderId: orderRef.id, preferenceId: preference.id, initPoint: preference.init_point });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar' }, { status: 500 });
  }
}
