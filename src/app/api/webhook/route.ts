import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPaymentApproved } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Fetch payment details from MP to get external_reference (order ID)
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });
      const payment = await response.json();
      
      const orderId = payment.external_reference;
      const status = payment.status === 'approved' ? 'approved' : 'rejected';

      if (orderId) {
        const orderRef = adminDb.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
          const orderData = orderDoc.data();
          if (!orderData) return NextResponse.json({ received: true });
          
          // Only process if status is changing to approved and not already processed
          if (status === 'approved' && orderData.status !== 'approved') {
            // Decrement stock for each item
            const batch = adminDb.batch();
            for (const item of orderData.items) {
              const productRef = adminDb.collection('products').doc(item.productId);
              batch.update(productRef, {
                stock: FieldValue.increment(-item.quantity)
              });
            }
            
            // Increment coupon usedCount if coupon was used
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

          // Send WhatsApp notification for approved payment
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
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
