'use client';

import { useState } from 'react';
import { Order, TrackingStatus } from '@/lib/types';

const trackingSteps: { key: TrackingStatus; label: string; sublabel: string; icon: string }[] = [
  { key: 'confirmed', label: 'Confirmado', sublabel: 'Pedido registrado', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'preparing', label: 'En preparacion', sublabel: 'Armando tu pedido', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
  { key: 'shipped', label: 'En camino', sublabel: 'Salio a tu direccion', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.125a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { key: 'delivered', label: 'Entregado', sublabel: 'Disfrut tu compra!', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export default function TrackingPage() {
  const [searchType, setSearchType] = useState<'order' | 'dni' | 'email'>('order');
  const [searchValue, setSearchValue] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError(null);
    setOrders([]);
    setSelectedOrder(null);

    try {
      const param = searchType === 'order' ? 'id' : searchType === 'dni' ? 'dni' : 'email';
      const res = await fetch(`/api/orders?${param}=${encodeURIComponent(searchValue.trim())}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se encontraron pedidos');
      }
      const data = await res.json();
      const orderList = Array.isArray(data) ? data : [data];
      if (orderList.length === 0) throw new Error('No se encontraron pedidos');
      setOrders(orderList);
      if (orderList.length === 1) setSelectedOrder(orderList[0]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = (trackingStatus: TrackingStatus | null) => {
    if (!trackingStatus) return -1;
    return trackingSteps.findIndex(s => s.key === trackingStatus);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusLabel = (status: string) => {
    if (status === 'approved') return { text: 'Aprobado', color: 'text-[var(--success)]', bg: 'bg-[var(--success-soft)]' };
    if (status === 'rejected') return { text: 'Rechazado', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger-soft)]' };
    return { text: 'Pendiente', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-soft)]' };
  };

  return (
    <div className="min-h-screen bg-[var(--bg-soft)]">
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a href="/tienda" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
            </svg>
            Volver a la tienda
          </a>
          <h1 className="text-2xl font-bold text-[var(--text)]">Seguimiento de pedido</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Busca por orden, DNI o email</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {!selectedOrder && (
          <form onSubmit={handleSearch} className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <div className="flex gap-1 bg-[var(--bg-soft)] rounded-xl p-1 mb-4">
              {[
                { key: 'order' as const, label: 'N de orden' },
                { key: 'dni' as const, label: 'DNI' },
                { key: 'email' as const, label: 'Email' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setSearchType(tab.key); setSearchValue(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${searchType === tab.key ? 'bg-white shadow-sm text-[var(--text)]' : 'text-[var(--text-muted)]'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <input
                type={searchType === 'dni' ? 'text' : searchType === 'email' ? 'email' : 'text'}
                value={searchValue}
                onChange={(e) => {
                  if (searchType === 'dni') setSearchValue(e.target.value.replace(/\D/g, ''));
                  else setSearchValue(e.target.value);
                }}
                placeholder={searchType === 'dni' ? 'Ej: 12345678' : searchType === 'email' ? 'tu@email.com' : 'Ej: abc123...'}
                className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={loading || !searchValue.trim()}
                className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : 'Buscar'}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-[var(--danger-soft)] text-[var(--danger)] text-sm">{error}</div>
            )}
          </form>
        )}

        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-[var(--text-muted)] font-mono">Orden #{selectedOrder.id.slice(-6)}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusLabel(selectedOrder.status).bg} ${statusLabel(selectedOrder.status).color}`}>
                    {statusLabel(selectedOrder.status).text}
                  </span>
                  <button onClick={() => { setSelectedOrder(null); setSearchValue(''); setOrders([]); }} className="text-sm text-[var(--accent)] hover:underline">
                    Buscar otra
                  </button>
                </div>
              </div>

              {selectedOrder.customerName && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Cliente</p>
                    <p className="font-medium text-[var(--text)]">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">DNI</p>
                    <p className="font-medium text-[var(--text)]">{selectedOrder.customerDni || '—'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tracking Timeline */}
            {selectedOrder.trackingStatus && (
              <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--text)] mb-6">Estado del envio</h3>
                <div className="relative">
                  <div className="absolute top-6 left-0 right-0 h-0.5 bg-[var(--border)]" />
                  <div
                    className="absolute top-6 left-0 h-0.5 bg-[var(--accent)] transition-all duration-500"
                    style={{ width: selectedOrder.trackingStatus ? `${(getCurrentStepIndex(selectedOrder.trackingStatus) / (trackingSteps.length - 1)) * 100}%` : '0%' }}
                  />
                  <div className="relative flex justify-between">
                    {trackingSteps.map((step, index) => {
                      const currentIndex = getCurrentStepIndex(selectedOrder.trackingStatus);
                      const isCompleted = currentIndex >= index;
                      const isCurrent = currentIndex === index;
                      return (
                        <div key={step.key} className="flex flex-col items-center flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-white border-[var(--border)] text-[var(--text-muted)]'} ${isCurrent ? 'ring-4 ring-[var(--accent-soft)] scale-110' : ''}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d={step.icon}/>
                            </svg>
                          </div>
                          <p className={`mt-3 text-xs font-semibold text-center ${isCompleted ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{step.label}</p>
                          <p className="text-[10px] text-[var(--text-muted)] text-center mt-0.5">{step.sublabel}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {!selectedOrder.trackingStatus && selectedOrder.status === 'pending' && (
              <div className="bg-[var(--warning-soft)] border border-[var(--warning-border)] rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[var(--warning)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">Pago pendiente</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Tu pedido se procesara cuando se confirme el pago.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-[var(--text)] mb-4">Resumen del pedido</h3>
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{item.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">${(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
                <div className="flex justify-between text-sm text-[var(--text-muted)]"><span>Subtotal</span><span>${selectedOrder.total.toLocaleString()}</span></div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-[var(--success)]"><span>Descuento ({selectedOrder.discount}%)</span><span>-${(selectedOrder.total * selectedOrder.discount / 100).toLocaleString()}</span></div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t border-[var(--border)]"><span>Total</span><span className="text-lg">${selectedOrder.finalTotal.toLocaleString()}</span></div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-[var(--accent-soft)] border border-[var(--accent-border)] rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Necesitas ayuda?</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Contactanos por WhatsApp o Instagram.</p>
                  <div className="flex gap-3 mt-3">
                    <a href="https://wa.me/5491126354636" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--accent)] hover:underline">WhatsApp</a>
                    <a href="https://instagram.com/grana.3d" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--accent)] hover:underline">Instagram</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Orders */}
        {!selectedOrder && orders.length > 1 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text)]">{orders.length} pedidos encontrados</h3>
            {orders.map(order => {
              const sl = statusLabel(order.status);
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full bg-white border border-[var(--border)] rounded-xl p-4 text-left hover:border-[var(--accent)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-[var(--text-muted)]">#{order.id.slice(-6)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sl.bg} ${sl.color}`}>{sl.text}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {order.items.map((item, i) => (
                      <span key={i} className="text-xs bg-[var(--bg-soft)] px-2 py-0.5 rounded">{item.name} x {item.quantity}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">{formatDate(order.createdAt)}</span>
                    <span className="font-semibold text-sm">${order.finalTotal.toLocaleString()}</span>
                  </div>
                  {order.trackingStatus && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${((getCurrentStepIndex(order.trackingStatus) + 1) / trackingSteps.length) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-[var(--accent)] font-medium">{trackingSteps.find(s => s.key === order.trackingStatus)?.label}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
