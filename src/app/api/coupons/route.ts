import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snap = await adminDb.collection('coupons').get();
    return NextResponse.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const docRef = await adminDb.collection('coupons').add({
      code: (body.code || '').toUpperCase(),
      discount: Number(body.discount),
      active: body.active !== undefined ? body.active : true,
      maxUses: body.maxUses ? Number(body.maxUses) : 0,
      usedCount: 0,
      expiresAt: body.expiresAt || null,
      minPurchase: body.minPurchase ? Number(body.minPurchase) : 0,
      variant: body.variant || 'standard',
      customerId: body.customerId || null,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ 
      id: docRef.id, 
      code: body.code.toUpperCase(), 
      discount: Number(body.discount), 
      active: body.active !== undefined ? body.active : true,
      maxUses: body.maxUses ? Number(body.maxUses) : 0,
      usedCount: 0,
      expiresAt: body.expiresAt || null,
      minPurchase: body.minPurchase ? Number(body.minPurchase) : 0,
      variant: body.variant || 'standard',
      customerId: body.customerId || null,
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
    if (body.code !== undefined) updateData.code = body.code.toUpperCase();
    if (body.discount !== undefined) updateData.discount = Number(body.discount);
    if (body.active !== undefined) updateData.active = body.active;
    if (body.maxUses !== undefined) updateData.maxUses = Number(body.maxUses);
    if (body.usedCount !== undefined) updateData.usedCount = Number(body.usedCount);
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt;
    if (body.minPurchase !== undefined) updateData.minPurchase = Number(body.minPurchase);
    if (body.variant !== undefined) updateData.variant = body.variant;
    if (body.customerId !== undefined) updateData.customerId = body.customerId;
    await adminDb.collection('coupons').doc(body.id).update(updateData);
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
    await adminDb.collection('coupons').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
