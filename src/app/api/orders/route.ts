import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const ALLOWED_ORDER_FIELDS = ['status', 'trackingStatus', 'trackingCode', 'courier', 'notes'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const dni = searchParams.get('dni');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (orderId && !/^[a-zA-Z0-9]+$/.test(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    if (orderId) {
      const doc = await adminDb.collection('orders').doc(orderId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ id: doc.id, ...doc.data() });
    }

    let query: any = adminDb.collection('orders');

    if (status && status !== 'all') {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      query = query.where('status', '==', status);
    }

    if (email) {
      query = query.where('customerEmail', '==', email);
    } else if (dni) {
      try {
        query = query.where('customerDni', '==', dni).orderBy('createdAt', 'desc');
      } catch {
        query = query.where('customerDni', '==', dni);
      }
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    const snap = await query.get();
    const orders = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    if (!email && !dni) {
      orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_ORDER_FIELDS.includes(key)) {
        continue;
      }
      filteredUpdates[key] = value;
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    if (filteredUpdates.status && !['pending', 'approved', 'rejected'].includes(filteredUpdates.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (filteredUpdates.trackingStatus && !['confirmed', 'preparing', 'shipped', 'delivered'].includes(filteredUpdates.trackingStatus)) {
      return NextResponse.json({ error: 'Invalid tracking status' }, { status: 400 });
    }

    if (filteredUpdates.trackingCode) {
      filteredUpdates.trackingCode = String(filteredUpdates.trackingCode).trim().slice(0, 100);
    }

    if (filteredUpdates.courier) {
      filteredUpdates.courier = String(filteredUpdates.courier).trim().slice(0, 100);
    }

    if (filteredUpdates.notes) {
      filteredUpdates.notes = String(filteredUpdates.notes).trim().slice(0, 2000);
    }

    const orderRef = adminDb.collection('orders').doc(id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: any = {
      ...filteredUpdates,
      updatedAt: new Date().toISOString(),
    };

    if (filteredUpdates.status === 'approved' && !orderDoc.data()?.trackingStatus) {
      updateData.trackingStatus = 'confirmed';
    }

    await orderRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
