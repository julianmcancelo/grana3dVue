import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const dni = searchParams.get('dni');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (orderId) {
      const doc = await adminDb.collection('orders').doc(orderId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ id: doc.id, ...doc.data() });
    }

    let query: any = adminDb.collection('orders');
    
    if (status && status !== 'all') {
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

    const orderRef = adminDb.collection('orders').doc(id);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build update object with updatedAt
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If status changed to approved, set trackingStatus to confirmed if not set
    if (updates.status === 'approved' && !orderDoc.data()?.trackingStatus) {
      updateData.trackingStatus = 'confirmed';
    }

    await orderRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
