import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    const userRes = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 401 });
    }

    const user = await userRes.json();
    const sellerId = user.id;

    const ordersRes = await fetch(
      `https://api.mercadolibre.com/orders/search?seller=${sellerId}&status=paid,processing,shipped,delivered,cancelled&sort=date_desc&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!ordersRes.ok) {
      return NextResponse.json({ error: 'Error al obtener ordenes de ML' }, { status: 500 });
    }

    const ordersData = await ordersRes.json();
    const mlOrders = ordersData.results || [];

    const batch = adminDb.batch();
    const syncedOrders = [];

    for (const mlOrder of mlOrders) {
      const docRef = adminDb.collection('ml_orders').doc(mlOrder.id.toString());
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        const orderData: any = {
          mlOrderId: mlOrder.id.toString(),
          buyerName: mlOrder.buyer?.nickname || 'Cliente ML',
          buyerEmail: mlOrder.buyer?.email || null,
          buyerPhone: mlOrder.buyer?.phone?.number || null,
          items: (mlOrder.order_items || []).map((item: any) => ({
            name: item.item?.title || 'Producto',
            quantity: item.quantity,
            price: item.unit_price,
          })),
          total: mlOrder.total_amount || 0,
          status: mlOrder.status,
          dateCreated: mlOrder.date_created,
          syncedAt: new Date().toISOString(),
        };

        batch.set(docRef, orderData);
        syncedOrders.push({ id: docRef.id, ...orderData });
      } else {
        const existingData = docSnap.data();
        if (existingData?.status !== mlOrder.status) {
          batch.update(docRef, {
            status: mlOrder.status,
            syncedAt: new Date().toISOString(),
          });
        }
        syncedOrders.push({ id: docRef.id, ...existingData });
      }
    }

    if (syncedOrders.length > 0) {
      await batch.commit();
    }

    const allOrdersSnap = await adminDb.collection('ml_orders').orderBy('dateCreated', 'desc').get();
    const allOrders = allOrdersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json(allOrders);
  } catch (error: any) {
    console.error('ML Orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
