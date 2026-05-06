import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { TrackingStatus } from '@/lib/types';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, trackingStatus } = body as { id: string; trackingStatus: TrackingStatus };

    if (!id || !trackingStatus) {
      return NextResponse.json({ error: 'ID and trackingStatus required' }, { status: 400 });
    }

    const validStatuses: TrackingStatus[] = ['confirmed', 'preparing', 'shipped', 'delivered'];
    if (!validStatuses.includes(trackingStatus)) {
      return NextResponse.json({ error: 'Invalid tracking status' }, { status: 400 });
    }

    await adminDb.collection('orders').doc(id).update({
      trackingStatus,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
