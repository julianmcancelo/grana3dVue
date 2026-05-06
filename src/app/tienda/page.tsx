'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { Product } from '@/lib/types';
import ShoppingAssistant, { ShoppingAssistantRef } from '@/components/ShoppingAssistant';
import CartSidebar from '@/components/CartSidebar';
import AuthModal from '@/components/AuthModal';
import ProfilePanel from '@/components/ProfilePanel';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

function Header() {
  const { toggle, count } = useCart();
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <a href="/tienda" className="flex items-center gap-2.5">
              <img src="/logo-grana3d.png" alt="Grana 3D" className="h-9 w-auto"/>
            </a>

            <div className="flex items-center gap-3">
              <a href="/tracking" className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] transition-all text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="hidden sm:inline">Tracking</span>
              </a>

              <button
                onClick={toggle}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-full border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] transition-all text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
                </svg>
                <span className="hidden sm:inline">Carrito</span>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>

              {user ? (
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--border)] hover:bg-[var(--bg-soft)] transition-colors text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-[var(--text-secondary)]">{user.displayName || user.email?.split('@')[0]}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-3 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Ingresar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
    </>
  );
}

function HomeContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const { add: addToCart } = useCart();
  const assistantRef = useRef<ShoppingAssistantRef>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'newest'>('newest');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const filtered = products
    .filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (priceRange === 'low' && p.price >= 10000) return false;
      if (priceRange === 'mid' && (p.price < 10000 || p.price >= 50000)) return false;
      if (priceRange === 'high' && p.price < 50000) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--bg-soft)]">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#e17055]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"/>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00cec9]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"/>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <img src="/logo-grana3d.png" alt="Grana 3D" className="h-14 w-auto mx-auto mb-8"/>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e17055]/8 border border-[#e17055]/15 text-[#e17055] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e17055] animate-pulse"/>
            Impresión 3D de calidad
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-[1.15]">
            Ideas que se
            <span className="block mt-1" style={{ color: '#e17055' }}>hacen reales</span>
          </h1>
          <p className="mt-6 text-[var(--text-secondary)] text-lg max-w-lg mx-auto leading-relaxed">
            Productos diseñados e impresos en 3D con atención al detalle y materiales de primera.
          </p>
          <a
            href="#productos"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--text)] text-white font-medium text-sm hover:bg-[var(--accent)] transition-colors duration-200"
          >
            Ver productos
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"/>
            </svg>
          </a>
        </div>
      </section>

      {/* Products */}
      <main id="productos" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 flex-1">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">Productos</h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {filtered.length} de {products.length} productos
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm bg-white focus:outline-none focus:border-[var(--accent)] text-[var(--text-secondary)]"
            >
              <option value="newest">Mas recientes</option>
              <option value="name">Nombre A-Z</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Precio:</span>
            {(['all', 'low', 'mid', 'high'] as const).map(range => (
              <button
                key={range}
                onClick={() => setPriceRange(range)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${priceRange === range ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-soft)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'}`}
              >
                {range === 'all' ? 'Todos' : range === 'low' ? 'Hasta $10.000' : range === 'mid' ? '$10.000 - $50.000' : '+$50.000'}
              </button>
            ))}
            <div className="ml-auto">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
                />
                <span className="text-xs text-[var(--text-muted)]">Solo con stock</span>
              </label>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[var(--border)] rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-muted)] mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">No se encontraron productos</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Proba cambiando los filtros</p>
            <button
              onClick={() => { setSearch(''); setPriceRange('all'); setInStockOnly(false); }}
              className="mt-4 text-sm text-[var(--accent)] hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(product => (
              <div
                key={product.id}
                className="group rounded-2xl border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-sm transition-all duration-300 overflow-hidden bg-white"
              >
                <div className="relative aspect-square bg-[var(--bg-soft)] overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-[var(--text-muted)]/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)]">Agotado</span>
                    </div>
                  )}
                  {product.stock > 0 && product.stock <= 5 && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[var(--warning-soft)] text-[var(--warning)] text-xs font-semibold">
                      Últimos {product.stock}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-[var(--text)]">{product.name}</h3>
                  {product.description && (
                    <p className="text-[var(--text-muted)] text-sm mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-[var(--text)]">
                      ${product.price.toLocaleString()}
                    </span>
                    {product.stock > 0 && (
                      <span className="text-xs text-[var(--text-muted)]">{product.stock} disponibles</span>
                    )}
                  </div>
                  {product.stock > 0 && (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="mt-4 w-full py-2.5 rounded-full bg-[var(--accent)] text-white font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                      </svg>
                      Agregar al carrito
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <span className="text-sm font-bold text-[var(--text)]">Grana</span>
                <span className="text-sm font-light text-[var(--text-secondary)] ml-0.5">3D</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Pago seguro con Mercado Pago · Envíos a todo el país
            </p>
          </div>
        </div>
      </footer>

      <ShoppingAssistant ref={assistantRef} products={products} />
      <CartSidebar />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
