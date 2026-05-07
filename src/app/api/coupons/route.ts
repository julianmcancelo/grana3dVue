import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { couponSchema } from '@/lib/validation';

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
    const validation = couponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos invalidos', details: validation.error.issues }, { status: 400 });
    }

    const { code, discount, active, maxUses, expiresAt, minPurchase, variant } = validation.data;

    const existing = await adminDb.collection('coupons').where('code', '==', code).get();
    if (!existing.empty) {
      return NextResponse.json({ error: 'El codigo ya existe' }, { status: 400 });
    }

    const docRef = await adminDb.collection('coupons').add({
      code,
      discount,
      active,
      maxUses: maxUses || 0,
      usedCount: 0,
      expiresAt: expiresAt || null,
      minPurchase: minPurchase || 0,
      variant,
      customerId: null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: docRef.id,
      code,
      discount,
      active,
      maxUses: maxUses || 0,
      usedCount: 0,
      expiresAt: expiresAt || null,
      minPurchase: minPurchase || 0,
      variant,
      customerId: null,
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
    if (body.code !== undefined) {
      const code = String(body.code).toUpperCase().trim().slice(0, 50);
      if (!code) return NextResponse.json({ error: 'Codigo invalido' }, { status: 400 });
      updateData.code = code;
    }
    if (body.discount !== undefined) {
      const discount = Number(body.discount);
      if (isNaN(discount) || discount < 1 || discount > 90) {
        return NextResponse.json({ error: 'Descuento debe ser entre 1 y 90' }, { status: 400 });
      }
      updateData.discount = discount;
    }
    if (body.active !== undefined) updateData.active = Boolean(body.active);
    if (body.maxUses !== undefined) {
      const maxUses = Number(body.maxUses);
      if (isNaN(maxUses) || maxUses < 0) {
        return NextResponse.json({ error: 'Max usos invalido' }, { status: 400 });
      }
      updateData.maxUses = maxUses;
    }
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt || null;
    if (body.minPurchase !== undefined) {
      const minPurchase = Number(body.minPurchase);
      if (isNaN(minPurchase) || minPurchase < 0) {
        return NextResponse.json({ error: 'Compra minima invalida' }, { status: 400 });
      }
      updateData.minPurchase = minPurchase;
    }
    if (body.variant !== undefined) {
      if (!['standard', 'post-purchase'].includes(body.variant)) {
        return NextResponse.json({ error: 'Variante invalida' }, { status: 400 });
      }
      updateData.variant = body.variant;
    }

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
