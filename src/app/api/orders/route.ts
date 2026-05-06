import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const dni = searchParams.get('dni');
    const email = searchParams.get('email');

    if (orderId) {
      const doc = await adminDb.collection('orders').doc(orderId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ id: doc.id, ...doc.data() });
    }

    if (email) {
      const snap = await adminDb.collection('orders')
        .where('customerEmail', '==', email)
        .get();
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return NextResponse.json(orders);
    }

    if (dni) {
      try {
        const snap = await adminDb.collection('orders')
          .where('customerDni', '==', dni)
          .orderBy('createdAt', 'desc')
          .get();
        return NextResponse.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err: any) {
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
          const fallbackSnap = await adminDb.collection('orders')
            .where('customerDni', '==', dni)
            .get();
          const orders = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return NextResponse.json(orders);
        }
        throw err;
      }
    }

    const snap = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();
    return NextResponse.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
