const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_BASE_URL = 'https://graph.facebook.com/v18.0';

interface OrderData {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  finalTotal: number;
  status: string;
}

async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.warn('WhatsApp credentials not configured');
    return false;
  }

  try {
    const response = await fetch(`${WHATSAPP_BASE_URL}/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('WhatsApp API error:', data.error);
      return false;
    }

    return !!data.messages?.[0]?.id;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return false;
  }
}

export async function sendOrderConfirmation(order: OrderData, customerPhone: string): Promise<boolean> {
  const itemsList = order.items
    .map(i => `- ${i.name} x${i.quantity}`)
    .join('\n');

  const message = `Hola ${order.customerName}!\n\n` +
    `Tu pedido *#${order.id.slice(-6).toUpperCase()}* fue creado exitosamente.\n\n` +
    `*Resumen:*\n${itemsList}\n\n` +
    `*Total: $${order.finalTotal.toLocaleString()}*\n\n` +
    `Estado: Pendiente de pago\n\n` +
    `Podes seguir tu pedido en:\n${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tracking\n\n` +
    `Cualquier consulta, escribinos por WhatsApp. Gracias por elegir Grana 3D!`;

  return sendWhatsAppMessage(customerPhone, message);
}

export async function sendPaymentApproved(order: OrderData, customerPhone: string): Promise<boolean> {
  const message = `Pago confirmado!\n\n` +
    `Hola ${order.customerName}, tu pedido *#${order.id.slice(-6).toUpperCase()}* ya esta confirmado.\n\n` +
    `*Total pagado: $${order.finalTotal.toLocaleString()}*\n\n` +
    `Estamos preparando tu pedido.\n` +
    `Te avisaremos cuando este en camino.\n\n` +
    `Seguilo en:\n${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tracking\n\n` +
    `Gracias por tu compra!`;

  return sendWhatsAppMessage(customerPhone, message);
}

export async function sendOrderShipped(order: OrderData, customerPhone: string): Promise<boolean> {
  const message = `Tu pedido esta en camino!\n\n` +
    `Hola ${order.customerName}, el pedido *#${order.id.slice(-6).toUpperCase()}* fue enviado.\n\n` +
    `*Resumen:*\n${order.items.map(i => `- ${i.name} x${i.quantity}`).join('\n')}\n\n` +
    `Pronto lo vas a recibir. Gracias por tu compra!`;

  return sendWhatsAppMessage(customerPhone, message);
}

export async function sendOrderDelivered(order: OrderData, customerPhone: string): Promise<boolean> {
  const message = `Pedido entregado!\n\n` +
    `Hola ${order.customerName}, tu pedido *#${order.id.slice(-6).toUpperCase()}* fue entregado.\n\n` +
    `Esperamos que disfrutes tus productos de Grana 3D.\n\n` +
    `Tenes alguna duda o sugerencia? Escribinos!`;

  return sendWhatsAppMessage(customerPhone, message);
}

export async function sendAdminNotification(order: OrderData): Promise<boolean> {
  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE;
  if (!adminPhone) return false;

  const itemsList = order.items
    .map(i => `- ${i.name} x${i.quantity} ($${(i.price * i.quantity).toLocaleString()})`)
    .join('\n');

  const message = `*Nuevo pedido #${order.id.slice(-6).toUpperCase()}*\n\n` +
    `Cliente: ${order.customerName}\n` +
    `Email: ${order.customerEmail || 'No proporcionado'}\n\n` +
    `*Items:*\n${itemsList}\n\n` +
    `*Total: $${order.finalTotal.toLocaleString()}*\n` +
    `Estado: ${order.status}`;

  return sendWhatsAppMessage(adminPhone, message);
}
