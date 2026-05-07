'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/AuthModal';
import ProfilePanel from '@/components/ProfilePanel';
import Footer from '@/components/Footer';

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setName(profile?.displayName || user.displayName || '');
      setEmail(user.email || '');
      setDni(profile?.dni || '');
      setPhone(profile?.phone || '');
    }
  }, [user, profile]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] font-medium">Tu carrito esta vacio</p>
            <a href="/tienda" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">Volver a la tienda</a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleCoupon = async () => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponDiscount(data.discount);
        setError('');
      } else {
        setError(data.error || 'Cupon invalido');
      }
    } catch {
      setError('Error al validar cupon');
    }
  };

  const finalTotal = subtotal - subtotal * (couponDiscount / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          couponCode: couponDiscount > 0 ? coupon : null,
          customerName: name,
          customerEmail: email,
          customerDni: dni,
          customerPhone: phone || null,
        }),
      });
      const data = await res.json();
      if (data.initPoint) {
        clear();
        window.location.href = data.initPoint;
      } else {
        setError(data.error || 'Error al procesar el pago');
      }
    } catch {
      setError('Error de conexion');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <a href="/landing" className="flex items-center gap-2.5">
              <img src="/logo-grana3d.png" alt="Grana 3D" className="h-8 w-auto"/>
            </a>

            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--border)] hover:bg-[var(--bg-soft)] transition-colors text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 rounded-full bg-[var(--text)] text-white text-sm font-medium hover:bg-[var(--accent)] transition-colors"
                >
                  Ingresar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 sm:py-20 w-full">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
            Finalizar compra
          </h1>
          <p className="mt-3 text-[var(--text-secondary)] text-base">
            Revisa tu pedido y completa tus datos
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Tu pedido</h2>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">{item.product.name} x {item.quantity}</span>
                <span className="font-medium">${(item.product.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border)] mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-[var(--text-muted)]">
              <span>Subtotal</span><span>${subtotal.toLocaleString()}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-[var(--success)]">
                <span>Descuento ({coupon} -{couponDiscount}%)</span><span>-${(subtotal * couponDiscount / 100).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span><span>${finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-[var(--border)] rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Datos de contacto</h2>

          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre completo"
            required
            className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <input
            type="text"
            value={dni}
            onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
            placeholder="DNI (para seguimiento)"
            required
            className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Telefono (para notificaciones WhatsApp)"
            className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />

          <div className="flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
              placeholder="Cupon de descuento"
              className="flex-1 px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={handleCoupon}
              className="px-5 py-2.5 rounded-full border border-[var(--border)] text-sm font-medium hover:bg-[var(--bg-soft)] transition-colors"
            >
              Aplicar
            </button>
          </div>

          {error && <p className="text-sm text-[var(--danger)] text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name || !email || !dni}
            className="w-full py-3 rounded-full bg-[var(--text)] text-white font-semibold hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Procesando...' : `Pagar $${finalTotal.toLocaleString()} con Mercado Pago`}
          </button>

          {!user && (
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="w-full text-center text-xs text-[var(--accent)] hover:underline"
            >
              Queres agilizar futuras compras? Ingresa ahora
            </button>
          )}
        </form>
      </main>

      <Footer />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
    </div>
  );
}
