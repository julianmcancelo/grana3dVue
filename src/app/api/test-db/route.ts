import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export async function GET() {
  try {
    const db = getDb();
    const ref = await addDoc(collection(db, 'test_connection'), {
      message: 'test from api',
      timestamp: serverTimestamp(),
    });
    return NextResponse.json({ success: true, id: ref.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
