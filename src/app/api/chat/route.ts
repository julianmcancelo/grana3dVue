import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { firestoreDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });
  const body = await request.json();
  const { messages } = body;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const products = await firestoreDb.products.getAll();
    const productContext = products
      .map(p => `- ${p.name}: $${p.price}, Stock: ${p.stock}, ${p.description}`)
      .join('\n');

    const systemPrompt = `Eres un asistente de ventas de una mini tienda.
Responde de forma amable y concisa.
Productos disponibles:
${productContext}

Si un producto no tiene stock, sugiere alternativas o avisa que no hay.
No inventes precios ni productos.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    return NextResponse.json({
      content: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
