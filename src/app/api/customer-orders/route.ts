import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const dni = searchParams.get('dni');

    if (!email && !dni) {
      return NextResponse.json({ error: 'Email o DNI requerido' }, { status: 400 });
    }

    let query: any = adminDb.collection('orders');

    if (email) {
      query = query.where('customerEmail', '==', email.toLowerCase().trim());
    } else if (dni) {
      query = query.where('customerDni', '==', dni.replace(/\D/g, ''));
    }

    query = query.orderBy('createdAt', 'desc');

    const snap = await query.get();
    const orders = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Customer orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
