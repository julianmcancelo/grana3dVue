import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function generateUniqueCode(prefix: string, name: string): string {
  const clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${clean}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerIds, discount, expiresAt, minPurchase, prefix = 'ML' } = body;

    if (!customerIds || customerIds.length === 0) {
      return NextResponse.json({ error: 'No hay clientes seleccionados' }, { status: 400 });
    }

    const batch = adminDb.batch();
    const createdCodes: { code: string; customerId: string; customerName: string }[] = [];

    for (const customerId of customerIds) {
      const customerDoc = await adminDb.collection('customers').doc(customerId).get();
      if (!customerDoc.exists) continue;

      const customer = customerDoc.data() as any;
      const code = generateUniqueCode(prefix, customer.name);

      const couponRef = adminDb.collection('coupons').doc();
      batch.set(couponRef, {
        code,
        discount: Number(discount) || 10,
        active: true,
        maxUses: 1,
        usedCount: 0,
        expiresAt: expiresAt || null,
        minPurchase: Number(minPurchase) || 0,
        variant: 'post-purchase' as const,
        customerId,
        createdAt: new Date().toISOString(),
      });

      createdCodes.push({ code, customerId, customerName: customer.name });
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      count: createdCodes.length,
      coupons: createdCodes 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Bulk coupon error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
