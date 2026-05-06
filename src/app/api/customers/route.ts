import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snap = await adminDb.collection('customers').orderBy('createdAt', 'desc').get();
    return NextResponse.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const docRef = await adminDb.collection('customers').add({
      name: body.name || '',
      email: (body.email || '').toLowerCase(),
      phone: body.phone || '',
      source: body.source || 'otro',
      totalPurchases: Number(body.totalPurchases) || 0,
      lastPurchase: body.lastPurchase || null,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ 
      id: docRef.id, 
      name: body.name, 
      email: body.email,
      phone: body.phone,
      source: body.source || 'otro',
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email.toLowerCase();
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.totalPurchases !== undefined) updateData.totalPurchases = Number(body.totalPurchases);
    if (body.lastPurchase !== undefined) updateData.lastPurchase = body.lastPurchase;
    await adminDb.collection('customers').doc(body.id).update(updateData);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await adminDb.collection('customers').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
