import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Código requerido' }, { status: 400 });
    }

    const couponsSnap = await adminDb.collection('coupons')
      .where('code', '==', code.toUpperCase())
      .where('active', '==', true)
      .get();

    if (couponsSnap.empty) {
      return NextResponse.json({ valid: false, error: 'Cupón no encontrado' }, { status: 404 });
    }

    const coupon = couponsSnap.docs[0].data() as any;

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: 'El cupón ha expirado' }, { status: 400 });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: 'El cupón alcanzó el límite de usos' }, { status: 400 });
    }

    if (coupon.minPurchase > 0 && subtotal < coupon.minPurchase) {
      return NextResponse.json({ valid: false, error: `Compra mínima de $${coupon.minPurchase.toLocaleString()}` }, { status: 400 });
    }

    return NextResponse.json({ valid: true, discount: coupon.discount, code: coupon.code });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}
