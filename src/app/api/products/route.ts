import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

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

    if (!body.name || !body.price) {
      return NextResponse.json({ error: 'Nombre y precio son requeridos' }, { status: 400 });
    }

    const docRef = await adminDb.collection('products').add({
      name: body.name,
      description: body.description || '',
      price: Number(body.price),
      stock: Number(body.stock) || 0,
      image: body.image || '',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      id: docRef.id, 
      name: body.name, 
      price: Number(body.price),
      description: body.description || '',
      stock: Number(body.stock) || 0,
      image: body.image || '',
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
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.stock !== undefined) updateData.stock = Number(body.stock);
    if (body.image !== undefined) updateData.image = body.image;

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
