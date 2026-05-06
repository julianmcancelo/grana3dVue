import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const ML_API = 'https://api.mercadolibre.com';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  }

  try {
    if (action === 'preview') {
      // Get user info
      const userRes = await fetch(`${ML_API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) throw new Error('Token invalido o expirado');
      const user = await userRes.json();

      // Get active items
      const itemsRes = await fetch(`${ML_API}/users/${user.id}/items/search?status=active&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const itemsData = await itemsRes.json();

      // ML search returns array of strings (IDs), fetch full details for each
      const itemIds = (itemsData.results || []).slice(0, 20);
      const items = await Promise.all(
        itemIds.map(async (itemId: string) => {
          const detailRes = await fetch(`${ML_API}/items/${itemId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return detailRes.json();
        })
      );

      return NextResponse.json({
        user: { id: user.id, nickname: user.nickname },
        items: items.map((item: any) => ({
          mlId: item.id,
          title: item.title,
          description: item.description?.plain_text || '',
          price: item.price,
          stock: item.available_quantity || 0,
          images: item.pictures?.map((p: any) => p.url) || [],
          mainImage: item.thumbnail?.replace('I.jpg', 'W.jpg') || '',
          permalink: item.permalink,
          status: item.status,
        })),
        total: itemsData.paging?.total || 0,
      });
    }

    return NextResponse.json({ error: 'Accion invalida' }, { status: 400 });
  } catch (error: any) {
    console.error('ML Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No hay items para importar' }, { status: 400 });
    }

    const imported = [];
    const skipped = [];

    for (const item of items) {
      // Check if already imported
      const existing = await adminDb.collection('products')
        .where('mlId', '==', item.mlId)
        .get();

      if (!existing.empty) {
        skipped.push(item.title);
        continue;
      }

      const docRef = await adminDb.collection('products').add({
        name: item.title,
        description: item.description,
        price: item.price,
        stock: item.stock,
        image: item.mainImage,
        images: item.images,
        mlId: item.mlId,
        mlPermalink: item.permalink,
        createdAt: new Date().toISOString(),
      });

      imported.push({ id: docRef.id, name: item.title });
    }

    return NextResponse.json({
      imported,
      skipped,
      count: imported.length,
    });
  } catch (error: any) {
    console.error('ML Import POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
