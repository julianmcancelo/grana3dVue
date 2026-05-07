'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Order } from '@/lib/types';
import Footer from '@/components/Footer';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders?id=${orderId}`)
        .then(res => {
          if (!res.ok) throw new Error('Order not found');
          return res.json();
        })
        .then(data => {
          setOrder(data);
          setLoading(false);
        })
        .catch(() => { setLoading(false); });
    } else { setLoading(false); }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-[var(--text-muted)] text-sm mt-4">Cargando...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-white items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--danger-soft)] mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">Orden no encontrada</h1>
          <a href="/tienda" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">Volver a la tienda</a>
        </div>
      </div>
    );
  }

  const config = {
    pending: { msg: 'Pago pendiente', sub: 'Estamos procesando tu pago', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-soft)]', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
    approved: { msg: 'Pago confirmado!', sub: 'Gracias por tu compra', color: 'text-[var(--success)]', bg: 'bg-[var(--success-soft)]', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    rejected: { msg: 'Pago rechazado', sub: 'Intentalo con otro medio de pago', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger-soft)]', icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  };

  const c = config[order.status];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <a href="/landing" className="flex items-center gap-2.5">
              <img src="/logo-grana3d.png" alt="Grana 3D" className="h-8 w-auto"/>
            </a>
            <a href="/tienda" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              Ir a la tienda
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16 sm:py-20">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className={`w-14 h-14 rounded-full ${c.bg} mx-auto flex items-center justify-center`}>
              <svg className={`w-7 h-7 ${c.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={c.icon}/>
              </svg>
            </div>
            <h1 className={`text-xl font-bold mt-4 ${c.color}`}>{c.msg}</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">{c.sub}</p>
          </div>

          <div className="bg-[var(--bg-soft)] rounded-xl p-4 space-y-2 text-sm">
            <p className="text-xs text-[var(--text-muted)] font-mono">Orden #{order.id.slice(-6)}</p>
            <div className="border-t border-[var(--border)] pt-2 space-y-1.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">{item.name} x {item.quantity}</span>
                  <span className="font-medium">${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border)] pt-2 space-y-1.5">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Subtotal</span><span>${order.total.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[var(--success)]">
                  <span>Descuento ({order.discount}%)</span><span>-${(order.total * order.discount / 100).toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="border-t border-[var(--border)] pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-lg text-[var(--text)]">${order.finalTotal.toLocaleString()}</span>
            </div>
          </div>

          <a href="/tienda" className="mt-3 w-full block text-center py-2.5 rounded-full bg-[var(--text)] text-white font-semibold text-sm hover:bg-[var(--accent)] transition-colors">
            Volver a la tienda
          </a>
          <a href="/tracking" className="mt-2 w-full block text-center py-2.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-soft)] transition-colors">
            Seguir mi pedido
          </a>
          {order.customerDni && (
            <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
              Tambien podes buscar tu pedido con tu DNI: <span className="font-mono font-semibold text-[var(--text)]">{order.customerDni}</span>
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
