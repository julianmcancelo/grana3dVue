import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { productSchema } from '@/lib/validation';
import { z } from 'zod';

export async function GET() {
  try {
    const snap = await adminDb.collection('products').get();
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('GET products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos invalidos', details: validation.error.issues }, { status: 400 });
    }

    const { name, description, price, stock, image } = validation.data;

    const docRef = await adminDb.collection('products').add({
      name: name.trim().slice(0, 200),
      description: (description || '').trim().slice(0, 2000),
      price,
      stock,
      image: (image || '').slice(0, 5000000),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: docRef.id,
      name,
      price,
      description: description || '',
      stock,
      image: image || '',
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: error.message || 'Error al crear producto' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim().slice(0, 200);
    if (body.description !== undefined) updateData.description = String(body.description).trim().slice(0, 2000);
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (isNaN(price) || price <= 0 || price > 999999999) {
        return NextResponse.json({ error: 'Precio invalido' }, { status: 400 });
      }
      updateData.price = price;
    }
    if (body.stock !== undefined) {
      const stock = Number(body.stock);
      if (isNaN(stock) || stock < 0 || stock > 99999) {
        return NextResponse.json({ error: 'Stock invalido' }, { status: 400 });
      }
      updateData.stock = stock;
    }
    if (body.image !== undefined) updateData.image = String(body.image).slice(0, 5000000);

    await adminDb.collection('products').doc(body.id).update(updateData);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await adminDb.collection('products').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
