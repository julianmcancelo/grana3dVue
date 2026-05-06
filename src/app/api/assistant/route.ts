import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente virtual de Grana 3D, una tienda de impresión 3D en Argentina.

TU ROL:
- Ayudar a los clientes ANTES, DURANTE y DESPUÉS de sus compras
- Ser amigable, profesional y usar tono argentino (vos, che, genial)
- Responder de forma concisa (máximo 3-4 oraciones por respuesta)
- Si no podés resolver algo, escalá al dueño

INFORMACIÓN DE CONTACTO DE LA TIENDA:
- Instagram: @grana.3d
- WhatsApp: +54 9 11 2635-4636
- Web: grana3d.com.ar
- Email: jcancelo.dev@gmail.com

CONTEXTO ACTUAL:
{context}

PRODUCTOS DISPONIBLES:
{products}

CARRITO ACTUAL:
{cart}

USUARIO LOGUEADO:
{user}

PEDIDOS RECIENTES DEL USUARIO:
{orders}

CAPACIDADES:
1. ANTES DE COMPRAR: Recomendar productos, explicar materiales, comparar opciones, dar consejos de impresión 3D
2. DURANTE LA COMPRA: Guiar al carrito, aplicar cupones, explicar métodos de pago (Mercado Pago), resolver dudas de checkout
3. DESPUÉS DE COMPRAR: Buscar pedidos por DNI o ID, explicar estado del pedido, dar estimaciones de entrega
4. SOPORTE: Resolver problemas comunes (producto dañado, cambio de dirección, consulta de garantía)
5. CONTACTO: Si piden hablar con alguien, dar los datos de contacto o usar acción "contact"
6. ESCALACIÓN: Si el problema requiere intervención humana urgente, usá la acción "escalate"

REGLAS:
- Siempre respondé en español argentino
- No inventes precios ni stock - usá solo los datos proporcionados
- Si piden contacto, WhatsApp, Instagram o email → dáles los datos directamente
- Para tracking: pedí DNI o ID de orden si no los tenés
- Sé proactivo: si ves que tiene algo en el carrito, preguntá si necesita ayuda
- Si el usuario está frustrado o enojado → escalá inmediatamente

ACCIONES DISPONIBLES (respondé con JSON si necesitás ejecutar una):
{"action": "add_to_cart", "productId": "..."} - Agregar producto al carrito
{"action": "open_cart"} - Abrir el carrito
{"action": "apply_coupon", "code": "..."} - Aplicar cupón
{"action": "track_order", "query": "..."} - Buscar pedido (DNI o ID)
{"action": "contact", "channel": "whatsapp"|"instagram"|"email"} - Abrir contacto directo
{"action": "escalate", "reason": "..."} - Notificar al dueño (caso urgente)
{"action": "none"} - Solo responder texto

FORMATO DE RESPUESTA:
Siempre respondé con un JSON:
{"text": "tu respuesta al usuario", "action": {...}}

Si no necesitás acción, usá {"text": "...", "action": {"action": "none"}}`;

function getUserSnippet(user: any) {
  if (!user) return 'No logueado';
  const parts: string[] = [];
  if (user.name) parts.push(`Nombre: ${user.name}`);
  if (user.email) parts.push(`Email: ${user.email}`);
  if (user.dni) parts.push(`DNI: ${user.dni}`);
  if (user.phone) parts.push(`Teléfono: ${user.phone}`);
  return parts.length > 0 ? parts.join('\n') : 'No logueado';
}

function getProductsSnippet(products: any[]) {
  if (products.length === 0) return 'No hay productos disponibles';
  return products.map(p =>
    `- ${p.name}: $${p.price.toLocaleString()} (${p.stock} en stock) - ${p.description || 'Sin descripción'}`
  ).join('\n');
}

function getCartSnippet(cart: any[]) {
  if (cart.length === 0) return 'Vacío';
  return cart.map(i =>
    `- ${i.product.name} × ${i.quantity} = $${(i.product.price * i.quantity).toLocaleString()}`
  ).join('\n') + `\nTotal: $${cart.reduce((s, i) => s + i.product.price * i.quantity, 0).toLocaleString()}`;
}

function getOrdersSnippet(orders: any[]) {
  if (orders.length === 0) return 'No hay pedidos recientes';
  const statusLabels: Record<string, string> = {
    pending: 'Pago pendiente',
    approved: 'Pago confirmado',
    rejected: 'Pago rechazado',
  };
  const trackingLabels: Record<string, string> = {
    confirmed: 'Pedido confirmado',
    preparing: 'En preparación',
    shipped: 'Enviado',
    delivered: 'Entregado',
  };
  return orders.slice(0, 5).map(o =>
    `- Orden #${o.id?.slice(-6) || o.id}: ${statusLabels[o.status] || o.status} | ${trackingLabels[o.trackingStatus] || 'Sin tracking'} | Total: $${o.finalTotal?.toLocaleString() || o.total?.toLocaleString()} | ${o.createdAt?.slice(0, 10)}`
  ).join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const { message, history, context } = await request.json();

    const products = context?.products || [];
    const cart = context?.cart || [];
    const user = context?.user || null;
    const orders = context?.orders || [];

    const systemPrompt = SYSTEM_PROMPT
      .replace('{context}', `Fecha: ${new Date().toLocaleDateString('es-AR')}. Tienda: Grana 3D (impresión 3D en Argentina). Pagos: Mercado Pago.`)
      .replace('{products}', getProductsSnippet(products))
      .replace('{cart}', getCartSnippet(cart))
      .replace('{user}', getUserSnippet(user))
      .replace('{orders}', getOrdersSnippet(orders));

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of (history || []).slice(-10)) {
      if (msg.content && typeof msg.content === 'string') {
        messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
      }
    }

    messages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { text: responseText, action: { action: 'none' } };
      }
    } catch {
      parsed = { text: responseText, action: { action: 'none' } };
    }

    if (parsed.action?.action === 'escalate') {
      await adminDb.collection('support_tickets').add({
        userId: user?.uid || null,
        userEmail: user?.email || null,
        userName: user?.name || null,
        reason: parsed.action.reason || 'Escalación del asistente AI',
        lastMessage: message,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      parsed.text = parsed.text || 'Ya notifiqué al dueño sobre tu consulta. Te va a responder lo antes posible. Gracias por tu paciencia.';
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Assistant API error:', error);
    return NextResponse.json(
      { text: 'Disculpá, tuve un problema técnico. ¿Podés intentar de nuevo?', action: { action: 'none' } },
      { status: 500 }
    );
  }
}
