import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 });
    }

    const batch = adminDb.batch();
    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const name = row['Nombre'] || row['nombre'] || row['Name'] || row['Comprador'] || row['comprador'] || '';
      const email = (row['Email'] || row['email'] || row['E-mail'] || row['Mail'] || '').toLowerCase();
      const phone = row['Teléfono'] || row['telefono'] || row['Phone'] || row['Tel'] || '';
      
      if (!name && !email) {
        skipped++;
        continue;
      }

      const existingSnap = await adminDb.collection('customers')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingSnap.empty) {
        const existingDoc = existingSnap.docs[0];
        const existingData = existingDoc.data() as any;
        batch.update(existingDoc.ref, {
          totalPurchases: (existingData.totalPurchases || 0) + 1,
          lastPurchase: new Date().toISOString(),
          name: name || existingData.name,
          phone: phone || existingData.phone,
        });
      } else {
        const newRef = adminDb.collection('customers').doc();
        batch.set(newRef, {
          name,
          email,
          phone,
          source: 'mercadolibre',
          totalPurchases: 1,
          lastPurchase: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
      imported++;
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      imported, 
      skipped,
      total: rows.length 
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
