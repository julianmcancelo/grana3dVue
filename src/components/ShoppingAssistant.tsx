'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  actions?: QuickAction[];
}

interface QuickAction {
  label: string;
  action: string;
  type: 'product' | 'checkout' | 'info' | 'tracking' | 'escalate' | 'contact';
  data?: any;
}

interface AIResponse {
  text: string;
  action: { action: string; [key: string]: any };
}

export interface ShoppingAssistantRef {
  openAndAdd: (product: Product) => void;
}

const ShoppingAssistant = forwardRef<ShoppingAssistantRef, { products: Product[] }>(({ products }, ref) => {
  const { items: cart, add: addToCartFn, toggle: openCart, count: cartCount } = useCart();
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    openAndAdd: (product: Product) => {
      addToCartFn(product);
      setIsOpen(true);
      addMessage({
        role: 'assistant',
        content: `✅ ${product.name} agregado al carrito.`,
        actions: [
          { label: 'Abrir carrito', action: 'open_cart', type: 'checkout' },
          { label: 'Seguir comprando', action: 'browse', type: 'info' },
        ],
      });
    },
  }));

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (isOpen && user?.email) {
      fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setOrders(data);
        })
        .catch(() => {});
    }
  }, [isOpen, user?.email]);

  const addMessage = (msg: Message) => setMessages(prev => [...prev, msg]);

  const getContext = () => ({
    products: products.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock, description: p.description })),
    cart: cart.map(i => ({ product: { id: i.product.id, name: i.product.name, price: i.product.price }, quantity: i.quantity })),
    user: user ? {
      uid: user.uid,
      name: profile?.displayName || user.displayName,
      email: user.email,
      dni: profile?.dni,
      phone: profile?.phone,
    } : null,
    orders,
  });

  const sendMessage = async (userMessage: string) => {
    setLoading(true);
    addMessage({ role: 'user', content: userMessage });

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          context: getContext(),
        }),
      });

      const ai: AIResponse = await res.json();

      const actions: QuickAction[] = [];

      switch (ai.action?.action) {
        case 'add_to_cart': {
          const product = products.find(p => p.id === ai.action.productId);
          if (product) addToCartFn(product);
          actions.push({ label: 'Abrir carrito', action: 'open_cart', type: 'checkout' });
          break;
        }
        case 'open_cart':
          openCart();
          break;
        case 'apply_coupon':
          actions.push({ label: `Aplicar ${ai.action.code}`, action: `apply_${ai.action.code}`, type: 'info' });
          break;
        case 'track_order':
          actions.push({ label: 'Ver mis pedidos', action: 'my_orders', type: 'tracking' });
          break;
        case 'contact':
          if (ai.action.channel === 'whatsapp') {
            actions.push({ label: '💬 WhatsApp', action: 'whatsapp', type: 'contact' });
          } else if (ai.action.channel === 'instagram') {
            actions.push({ label: '📷 Instagram', action: 'instagram', type: 'contact' });
          } else if (ai.action.channel === 'email') {
            actions.push({ label: '✉️ Email', action: 'email', type: 'contact' });
          }
          break;
        case 'escalate':
          actions.push({ label: '📩 Hablar con el dueño', action: 'contact_owner', type: 'escalate' });
          break;
      }

      if (actions.length === 0) {
        actions.push({ label: 'Ver productos', action: 'browse', type: 'info' });
        if (cartCount > 0) {
          actions.push({ label: `Carrito (${cartCount})`, action: 'open_cart', type: 'checkout' });
        }
      }

      addMessage({ role: 'assistant', content: ai.text, actions });
    } catch {
      addMessage({
        role: 'assistant',
        content: 'Disculpá, tuve un problema técnico. ¿Podés intentar de nuevo?',
        actions: [{ label: 'Ver productos', action: 'browse', type: 'info' }],
      });
    }
    setLoading(false);
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (action.type === 'product' && action.action.startsWith('add_')) {
      addToCartFn(action.data);
      addMessage({
        role: 'assistant',
        content: `✅ ${action.data.name} agregado al carrito.`,
        actions: [
          { label: 'Abrir carrito', action: 'open_cart', type: 'checkout' },
          { label: 'Seguir comprando', action: 'browse', type: 'info' },
        ],
      });
    } else if (action.action === 'browse') {
      const inStock = products.filter(p => p.stock > 0);
      const actions: QuickAction[] = inStock.slice(0, 6).map(p => ({
        label: `${p.name} — $${p.price.toLocaleString()}`,
        action: `add_${p.id}`,
        type: 'product',
        data: p,
      }));
      actions.push({ label: 'Ver todos', action: 'show_all', type: 'info' });
      addMessage({
        role: 'assistant',
        content: `📦 Productos disponibles (${inStock.length}):`,
        actions,
      });
    } else if (action.action === 'show_all') {
      const inStock = products.filter(p => p.stock > 0);
      const actions: QuickAction[] = inStock.map(p => ({
        label: `${p.name} — $${p.price.toLocaleString()}`,
        action: `add_${p.id}`,
        type: 'product',
        data: p,
      }));
      addMessage({
        role: 'assistant',
        content: `📦 Todos los productos (${inStock.length}):`,
        actions: actions.slice(0, 8),
      });
    } else if (action.action === 'open_cart') {
      openCart();
      addMessage({
        role: 'assistant',
        content: cartCount > 0
          ? `Tenés ${cartCount} producto(s) en el carrito. Total: $${cart.reduce((s, i) => s + i.product.price * i.quantity, 0).toLocaleString()}.`
          : 'Tu carrito está vacío. ¿Querés ver los productos?',
        actions: cartCount > 0
          ? [{ label: 'Ir a pagar', action: 'checkout', type: 'checkout' }, { label: 'Seguir comprando', action: 'browse', type: 'info' }]
          : [{ label: 'Ver productos', action: 'browse', type: 'info' }],
      });
    } else if (action.action === 'checkout') {
      window.location.href = '/checkout';
    } else if (action.action === 'my_orders') {
      if (orders.length > 0) {
        const statusLabels: Record<string, string> = {
          pending: '⏳ Pago pendiente',
          approved: '✅ Pago confirmado',
          rejected: '❌ Pago rechazado',
        };
        const trackingLabels: Record<string, string> = {
          confirmed: '📋 Confirmado',
          preparing: '🔧 En preparación',
          shipped: '📦 Enviado',
          delivered: '🏠 Entregado',
        };
        const orderList = orders.slice(0, 3).map(o =>
          `#${o.id?.slice(-6)}: ${statusLabels[o.status] || o.status} → ${trackingLabels[o.trackingStatus] || 'Sin tracking'}`
        ).join('\n');
        addMessage({
          role: 'assistant',
          content: `Tus pedidos recientes:\n\n${orderList}`,
          actions: [{ label: 'Tracking completo', action: 'go_tracking', type: 'tracking' }],
        });
      } else {
        addMessage({
          role: 'assistant',
          content: 'No encontré pedidos recientes. ¿Tenés un número de orden o DNI para buscar?',
        });
      }
    } else if (action.action === 'go_tracking') {
      window.open('/tracking', '_blank');
    } else if (action.action === 'contact_owner') {
      addMessage({
        role: 'assistant',
        content: '📩 Ya notifiqué al dueño. Te va a contactar pronto. También podés escribirle por WhatsApp si es urgente.',
        actions: [{ label: '💬 WhatsApp', action: 'whatsapp', type: 'contact' }],
      });
    } else if (action.action === 'whatsapp') {
      window.open('https://wa.me/5491126354636', '_blank');
    } else if (action.action === 'instagram') {
      window.open('https://instagram.com/grana.3d', '_blank');
    } else if (action.action === 'email') {
      window.open('mailto:jcancelo.dev@gmail.com', '_blank');
    } else if (action.action.startsWith('apply_')) {
      const code = action.action.replace('apply_', '');
      try {
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, subtotal: cart.reduce((s, i) => s + i.product.price * i.quantity, 0) }),
        });
        const data = await res.json();
        if (data.valid) {
          addMessage({ role: 'assistant', content: `🎉 Cupón ${code} aplicado: ${data.discount}% de descuento.` });
        } else {
          addMessage({ role: 'assistant', content: data.error || 'Cupón inválido.' });
        }
      } catch {
        addMessage({ role: 'assistant', content: 'Error al validar el cupón.' });
      }
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    sendMessage(msg);
  };

  const startConversation = () => {
    const greeting = user
      ? `¡Hola ${profile?.displayName || user.displayName?.split(' ')[0] || 'de nuevo'}! 👋 ¿En qué te ayudo hoy?`
      : '¡Hola! 👋 Soy el asistente de Grana 3D. ¿En qué te puedo ayudar?';

    const actions: QuickAction[] = [
      { label: '🛍️ Ver productos', action: 'browse', type: 'info' },
      { label: '📦 Mis pedidos', action: 'my_orders', type: 'tracking' },
    ];
    if (cartCount > 0) {
      actions.push({ label: `🛒 Carrito (${cartCount})`, action: 'open_cart', type: 'checkout' });
    }

    addMessage({ role: 'assistant', content: greeting, actions });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); if (messages.length === 0) startConversation(); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group"
        style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
      >
        <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.625m11.75-3a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H17.25m-5.625 3a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.008v.008h.008V12zm-5.625 3a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H5.625m11.75-3a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H17.25M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-96 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-white/20" style={{ height: 'min(600px, calc(100vh - 3rem))', background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)' }}>
      {/* Header */}
      <div className="p-4 flex justify-between items-center text-white" style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Asistente Grana 3D</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
              <p className="text-xs text-white/80">En línea</p>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
            <div className="max-w-[85%]">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-md'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm'
                }`}
                style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' } : {}}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.actions.map((a, j) => (
                    <button
                      key={j}
                      onClick={() => handleQuickAction(a)}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#6c5ce7] hover:text-[#6c5ce7] disabled:opacity-50 transition-all shadow-sm hover:shadow"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#6c5ce7', animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#a29bfe', animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#d4c8ff', animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
            placeholder="Escribí tu consulta..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]/20 placeholder:text-gray-400 transition-all"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

ShoppingAssistant.displayName = 'ShoppingAssistant';

export default ShoppingAssistant;
