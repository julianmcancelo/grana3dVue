'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Order {
  id: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  finalTotal: number;
  status: string;
  createdAt: string;
  trackingStatus?: string;
}

export default function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { user, profile, updateProfile, logout } = useAuth();
  const [dni, setDni] = useState(profile?.dni || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [name, setName] = useState(profile?.displayName || user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'orders'>('profile');

  useEffect(() => {
    if (user?.email && activeSection === 'orders') {
      setOrdersLoading(true);
      fetch(`/api/customer-orders?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setOrders(data);
          setOrdersLoading(false);
        })
        .catch(() => setOrdersLoading(false));
    }
  }, [user?.email, activeSection]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      dni: dni.replace(/\D/g, ''),
      phone,
      displayName: name,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const statusLabel = (status: string) => {
    if (status === 'approved') return { text: 'Aprobado', color: 'text-[var(--success)]', bg: 'bg-[var(--success-soft)]' };
    if (status === 'rejected') return { text: 'Rechazado', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger-soft)]' };
    return { text: 'Pendiente', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-soft)]' };
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[var(--border)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Mi cuenta</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--bg-soft)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-soft)]">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm">
              {(name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{name || 'Sin nombre'}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeSection === 'profile' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveSection('orders')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeSection === 'orders' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
          >
            Mis compras
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeSection === 'profile' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">DNI (para seguimiento)</label>
                <input
                  type="text"
                  value={dni}
                  onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="Sin puntos ni guiones"
                  className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Opcional"
                  className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 rounded-full bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
              >
                {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar'}
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-full border border-[var(--danger)] text-[var(--danger)] font-semibold text-sm hover:bg-[var(--danger-soft)] transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <svg className="animate-spin w-6 h-6 text-[var(--accent)] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <p className="text-xs text-[var(--text-muted)]">Cargando...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-[var(--text-muted)]/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                  <p className="text-sm text-[var(--text-muted)]">No tenés compras aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => {
                    const sl = statusLabel(order.status);
                    return (
                      <div key={order.id} className="border border-[var(--border)] rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-[var(--text-muted)]">#{order.id.slice(-6)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sl.bg} ${sl.color}`}>
                            {sl.text}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {order.items.map((item, i) => (
                            <span key={i} className="text-[10px] bg-[var(--bg-soft)] px-2 py-0.5 rounded">
                              {item.name} x{item.quantity}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-sm font-bold">${order.finalTotal.toLocaleString()}</span>
                        </div>
                        {order.status === 'approved' && order.trackingStatus && (
                          <div className="mt-2 pt-2 border-t border-[var(--border)]">
                            <span className="text-[10px] text-[var(--accent)]">
                              Estado: {order.trackingStatus === 'confirmed' ? 'Confirmado' : order.trackingStatus === 'preparing' ? 'En preparación' : order.trackingStatus === 'shipped' ? 'En camino' : 'Entregado'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
