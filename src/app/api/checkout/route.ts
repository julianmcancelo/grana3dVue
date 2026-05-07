import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createPreference } from '@/lib/mercadopago';
import { sendOrderConfirmation, sendAdminNotification } from '@/lib/whatsapp';
import { checkoutSchema } from '@/lib/validation';
import { FieldValue, Transaction } from 'firebase-admin/firestore';
import { checkRateLimit, getIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request);
    const rateKey = `checkout:${ip}`;
    const limit = checkRateLimit(rateKey, 3);

    if (!limit.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá un momento.' }, { status: 429 });
    }

    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos invalidos', details: validation.error.issues }, { status: 400 });
    }

    const { items, couponCode, customerName, customerEmail, customerDni, customerPhone } = validation.data;

    const productsSnap = await adminDb.collection('products').get();
    const products = productsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    const orderItems: { productId: string; name: string; quantity: number; price: number }[] = [];
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

    let couponDocRef = null;
    let couponData: any = null;

    if (couponCode) {
      const couponsSnap = await adminDb.collection('coupons').where('code', '==', couponCode.toUpperCase()).where('active', '==', true).get();
      if (!couponsSnap.empty) {
        couponDocRef = couponsSnap.docs[0].ref;
        couponData = couponsSnap.docs[0].data() as any;

        if (couponData.expiresAt && new Date(couponData.expiresAt) < new Date()) {
          return NextResponse.json({ error: 'El cupon ha expirado' }, { status: 400 });
        }

        if (couponData.minPurchase > 0 && subtotal < couponData.minPurchase) {
          return NextResponse.json({ error: `Compra minima de $${couponData.minPurchase.toLocaleString()} para este cupon` }, { status: 400 });
        }
      }
    }

    const result = await adminDb.runTransaction(async (transaction: Transaction) => {
      let discount = 0;
      let resolvedCouponId = '';

      if (couponDocRef && couponData) {
        const couponSnap = await transaction.get(couponDocRef);
        if (!couponSnap.exists) {
          throw new Error('Cupon no encontrado');
        }

        const currentCoupon = couponSnap.data() as any;

        if (!currentCoupon.active) {
          throw new Error('Cupon desactivado');
        }

        if (currentCoupon.maxUses > 0 && currentCoupon.usedCount >= currentCoupon.maxUses) {
          throw new Error('Cupon agotado');
        }

        discount = Math.min(currentCoupon.discount, 90);
        resolvedCouponId = couponDocRef.id;

        transaction.update(couponDocRef, {
          usedCount: FieldValue.increment(1),
        });
      }

      const discountAmount = subtotal * (discount / 100);
      const finalTotal = Math.max(subtotal - discountAmount, 0);

      const orderRef = adminDb.collection('orders').doc();
      transaction.set(orderRef, {
        items: orderItems,
        total: subtotal,
        discount,
        finalTotal,
        couponCode: couponCode || null,
        couponId: resolvedCouponId || null,
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

      return { orderId: orderRef.id, discount, finalTotal, couponId: resolvedCouponId };
    });

    const { orderId, discount, finalTotal, couponId } = result;

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
        unitPrice: -(subtotal * (discount / 100)),
        quantity: 1,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.grana3d.com.ar';
    const preference = await createPreference(preferenceItems, {
      success: `${baseUrl}/success?order_id=${orderId}`,
      pending: `${baseUrl}/success?order_id=${orderId}`,
      failure: `${baseUrl}/success?order_id=${orderId}`,
    }, orderId);

    const orderData = {
      id: orderId,
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

    return NextResponse.json({ orderId, preferenceId: preference.id, initPoint: preference.init_point });
  } catch (error: any) {
    console.error('Checkout error:', error);
    if (error.message === 'Cupon agotado' || error.message === 'Cupon desactivado' || error.message === 'Cupon no encontrado') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Error al procesar' }, { status: 500 });
  }
}
