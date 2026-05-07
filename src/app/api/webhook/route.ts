import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPaymentApproved } from '@/lib/whatsapp';

const processedPayments = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const requestId = request.headers.get('x-request-id');

    if (requestId && processedPayments.has(requestId)) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data?.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (type === 'payment') {
      const paymentId = data.id;

      if (!/^\d+$/.test(paymentId.toString())) {
        return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
      }

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
      }

      const payment = await response.json();

      if (payment.status !== 'approved' && payment.status !== 'rejected') {
        return NextResponse.json({ received: true, status: payment.status });
      }

      const orderId = payment.external_reference;
      const status = payment.status === 'approved' ? 'approved' : 'rejected';

      if (!orderId) {
        return NextResponse.json({ error: 'No order reference' }, { status: 400 });
      }

      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const orderData = orderDoc.data();
      if (!orderData) return NextResponse.json({ received: true });

      if (orderData.status === 'approved' && status === 'approved') {
        if (requestId) processedPayments.add(requestId);
        return NextResponse.json({ received: true, alreadyProcessed: true });
      }

      if (status === 'approved' && orderData.status !== 'approved') {
        const batch = adminDb.batch();
        for (const item of orderData.items) {
          const productRef = adminDb.collection('products').doc(item.productId);
          batch.update(productRef, {
            stock: FieldValue.increment(-item.quantity)
          });
        }

        if (orderData.couponId) {
          const couponRef = adminDb.collection('coupons').doc(orderData.couponId);
          batch.update(couponRef, {
            usedCount: FieldValue.increment(1)
          });
        }

        await batch.commit();
      }

      await orderRef.update({
        status,
        mpPaymentId: paymentId.toString(),
        trackingStatus: status === 'approved' ? 'confirmed' : null,
        updatedAt: new Date().toISOString(),
      });

      if (status === 'approved' && orderData.customerPhone) {
        const orderDataForNotif = {
          id: orderId,
          customerName: orderData.customerName || 'Cliente',
          customerPhone: orderData.customerPhone,
          items: orderData.items,
          total: orderData.total,
          finalTotal: orderData.finalTotal,
          status: 'approved',
        };
        sendPaymentApproved(orderDataForNotif, orderData.customerPhone).catch(err => console.error('WhatsApp payment notification failed:', err));
      }
    }

    if (requestId) processedPayments.add(requestId);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
