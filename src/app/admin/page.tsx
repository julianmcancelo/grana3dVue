'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Coupon, Order, Customer } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

type Tab = 'dashboard' | 'products' | 'coupons' | 'orders' | 'customers' | 'support';

export default function AdminPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [showBulkCouponForm, setShowBulkCouponForm] = useState(false);
  const [bulkCouponForm, setBulkCouponForm] = useState({ discount: '10', expiresAt: '', minPurchase: '', prefix: 'ML' });
  const [showThankYouCard, setShowThankYouCard] = useState(false);
  const [thankYouQrDataUrl, setThankYouQrDataUrl] = useState('');
  const [whatsappQrDataUrl, setWhatsappQrDataUrl] = useState('');
  const [printCopies, setPrintCopies] = useState(1);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '', image: '' });
  const [couponForm, setCouponForm] = useState({ code: '', discount: '', active: true, maxUses: '', expiresAt: '', minPurchase: '', variant: 'standard' as 'standard' | 'post-purchase' });
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/admin/login');
      } else {
        setUserEmail(user.email || '');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchData = useCallback(async () => {
    const [p, c, o, cu, t] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/coupons').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/support').then(r => r.json()),
    ]);
    setProducts(p); setCoupons(c); setOrders(o); setCustomers(cu); setTickets(Array.isArray(t) ? t : []);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Dashboard calculations
  const approvedOrders = orders.filter(o => o.status === 'approved');
  const totalRevenue = approvedOrders.reduce((sum, o) => sum + o.finalTotal, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // Revenue by month (last 6 months)
  const monthlyRevenue = (() => {
    const months: { label: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-AR', { month: 'short' });
      const revenue = approvedOrders
        .filter(o => o.createdAt.startsWith(monthKey))
        .reduce((sum, o) => sum + o.finalTotal, 0);
      months.push({ label, revenue });
    }
    return months;
  })();

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Máximo 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProductForm({ ...productForm, image: base64 });
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || !productForm.price) {
      setSaveError('Nombre y precio son obligatorios');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const body = editingProduct ? { id: editingProduct.id, ...productForm } : productForm;
      const res = await fetch('/api/products', { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      await fetchData();
      setShowProductForm(false); 
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', stock: '', image: '' });
      setImagePreview('');
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    setProducts(products.filter(p => p.id !== id));
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({ name: product.name, description: product.description, price: product.price.toString(), stock: product.stock.toString(), image: product.image });
    setImagePreview(product.image);
    setShowProductForm(true);
  };

  const handleSaveCoupon = async () => {
    const method = editingCoupon ? 'PUT' : 'POST';
    const body = editingCoupon 
      ? { id: editingCoupon.id, ...couponForm } 
      : couponForm;
    await fetch('/api/coupons', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    await fetchData();
    setShowCouponForm(false); 
    setEditingCoupon(null);
    setCouponForm({ code: '', discount: '', active: true, maxUses: '', expiresAt: '', minPurchase: '', variant: 'standard' });
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discount: coupon.discount.toString(),
      active: coupon.active,
      maxUses: coupon.maxUses ? coupon.maxUses.toString() : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
      minPurchase: coupon.minPurchase ? coupon.minPurchase.toString() : '',
      variant: coupon.variant || 'standard',
    });
    setShowCouponForm(true);
  };

  const handleDeleteCoupon = async (id: string) => {
    await fetch(`/api/coupons?id=${id}`, { method: 'DELETE' });
    setCoupons(coupons.filter(c => c.id !== id));
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    await fetch('/api/coupons', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: coupon.id, active: !coupon.active }) });
    await fetchData();
  };

  const handleShowQr = async (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    const QRCode = (await import('qrcode')).default;
    const url = `${window.location.origin}/cupon/${coupon.code}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 250, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } });
    setQrDataUrl(dataUrl);
    setShowQrModal(true);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/customers/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Importados: ${data.imported}, Saltados (duplicados): ${data.skipped}`);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleBulkGenerateCoupons = async () => {
    if (selectedCustomerIds.length === 0) {
      alert('Seleccioná al menos un cliente');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/coupons/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerIds: selectedCustomerIds,
          discount: Number(bulkCouponForm.discount),
          expiresAt: bulkCouponForm.expiresAt || null,
          minPurchase: Number(bulkCouponForm.minPurchase) || 0,
          prefix: bulkCouponForm.prefix || 'ML',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`${data.count} cupones únicos generados`);
      await fetchData();
      setShowBulkCouponForm(false);
      setSelectedCustomerIds([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCustomerSelection = (id: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllCustomers = () => {
    if (selectedCustomerIds.length === customers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(customers.map(c => c.id));
    }
  };

  const handleShowThankYouCard = async () => {
    const QRCode = (await import('qrcode')).default;
    const igDataUrl = await QRCode.toDataURL('https://instagram.com/grana.3d', { width: 250, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } });
    const waDataUrl = await QRCode.toDataURL('https://wa.me/5491126354636', { width: 250, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } });
    setThankYouQrDataUrl(igDataUrl);
    setWhatsappQrDataUrl(waDataUrl);
    setShowThankYouCard(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'products', label: 'Productos' },
    { key: 'coupons', label: 'Cupones' },
    { key: 'orders', label: 'Ordenes' },
    { key: 'customers', label: 'Clientes' },
    { key: 'support', label: `Soporte${tickets.filter(t => t.status === 'pending').length > 0 ? ` (${tickets.filter(t => t.status === 'pending').length})` : ''}` },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-soft)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2.5">
              <img src="/logo-grana3d.png" alt="Grana 3D" className="h-8 w-auto"/>
              <span className="text-xs text-[var(--text-muted)] hidden sm:inline font-medium">Admin</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
              <span className="hidden sm:inline max-w-[120px] truncate">{userEmail}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3"/>
              </svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Ingresos', value: `$${totalRevenue.toLocaleString()}`, accent: true },
            { label: 'Ordenes', value: orders.length },
            { label: 'Pendientes', value: pendingOrders.length, warning: true },
            { label: 'Productos', value: products.length },
            { label: 'Clientes', value: customers.length },
            { label: 'Stock bajo', value: lowStockProducts.length + outOfStockProducts.length, danger: lowStockProducts.length + outOfStockProducts.length > 0 },
          ].map(s => (
            <div key={s.label} className={`bg-white border border-[var(--border)] rounded-xl p-4 ${(s as any).accent ? 'border-[var(--accent-border)]' : ''}`}>
              <p className={`text-2xl font-bold ${(s as any).accent ? 'text-[var(--accent)]' : (s as any).danger ? 'text-[var(--danger)]' : (s as any).warning ? 'text-[var(--warning)]' : 'text-[var(--text)]'}`}>{s.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[var(--border)] rounded-xl p-1 mb-6 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Revenue Chart */}
            <div className="bg-white border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Ingresos ultimos 6 meses</h3>
              <div className="flex items-end gap-3 h-40">
                {monthlyRevenue.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">${m.revenue >= 1000 ? `${(m.revenue / 1000).toFixed(0)}k` : m.revenue}</span>
                    <div className="w-full bg-[var(--bg-soft)] rounded-t-lg relative" style={{ height: '100px' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg transition-all duration-500"
                        style={{ height: `${(m.revenue / maxRevenue) * 100}%`, background: m.revenue > 0 ? 'var(--accent)' : 'var(--border)' }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Alerts */}
            {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
              <div className="bg-white border border-[var(--border)] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Alertas de stock</h3>
                <div className="space-y-2">
                  {outOfStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)]">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--danger)]"/>
                        <span className="text-sm font-medium text-[var(--text)]">{p.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--danger)]">Sin stock</span>
                    </div>
                  ))}
                  {lowStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--warning-soft)] border border-[var(--warning-border)]">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--warning)]"/>
                        <span className="text-sm font-medium text-[var(--text)]">{p.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--warning)]">{p.stock} uds</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div className="bg-white border border-[var(--border)] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text)]">Ordenes recientes</h3>
                <button onClick={() => setActiveTab('orders')} className="text-xs text-[var(--accent)] hover:underline">Ver todas</button>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">No hay ordenes todavia</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-soft)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">#{order.id.slice(-6)} - {order.customerName || 'Sin nombre'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${order.finalTotal.toLocaleString()}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          order.status === 'approved' ? 'bg-[var(--success-soft)] text-[var(--success)]' :
                          order.status === 'rejected' ? 'bg-[var(--danger-soft)] text-[var(--danger)]' :
                          'bg-[var(--warning-soft)] text-[var(--warning)]'
                        }`}>
                          {order.status === 'approved' ? 'Aprobado' : order.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Productos mas vendidos</h3>
              {(() => {
                const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
                approvedOrders.forEach(o => {
                  o.items.forEach(item => {
                    if (!productSales[item.productId]) productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
                    productSales[item.productId].qty += item.quantity;
                    productSales[item.productId].revenue += item.price * item.quantity;
                  });
                });
                const sorted = Object.entries(productSales).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
                if (sorted.length === 0) return <p className="text-sm text-[var(--text-muted)] text-center py-4">Sin datos todavia</p>;
                const maxQty = sorted[0][1].qty;
                return (
                  <div className="space-y-3">
                    {sorted.map(([id, data], i) => (
                      <div key={id} className="flex items-center gap-4">
                        <span className="text-xs font-bold text-[var(--text-muted)] w-4">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--text)]">{data.name}</p>
                          <div className="mt-1 h-1.5 bg-[var(--bg-soft)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${(data.qty / maxQty) * 100}%` }}/>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-[var(--text)]">{data.qty} uds</p>
                          <p className="text-[10px] text-[var(--text-muted)]">${data.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div>
            {outOfStockProducts.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger-border)] flex items-center gap-3">
                <svg className="w-4 h-4 text-[var(--danger)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
                <p className="text-sm text-[var(--danger)] font-medium">{outOfStockProducts.length} {outOfStockProducts.length === 1 ? 'producto sin stock' : 'productos sin stock'}</p>
              </div>
            )}
            {lowStockProducts.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--warning-soft)] border border-[var(--warning-border)] flex items-center gap-3">
                <svg className="w-4 h-4 text-[var(--warning)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                <p className="text-sm text-[var(--warning)] font-medium">{lowStockProducts.length} {lowStockProducts.length === 1 ? 'producto con stock bajo' : 'productos con stock bajo'}</p>
              </div>
            )}
            <button
              onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', stock: '', image: '' }); setImagePreview(''); setShowProductForm(!showProductForm); }}
              className="mb-5 px-4 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              {showProductForm ? 'Cancelar' : 'Nuevo producto'}
            </button>

            {showProductForm && (
              <div className="bg-white border border-[var(--border)] rounded-xl p-5 mb-5">
                <h3 className="text-sm font-semibold mb-4 text-[var(--text)]">{editingProduct ? 'Editar' : 'Nuevo'} producto</h3>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Imagen</label>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--accent)] transition-colors overflow-hidden bg-[var(--bg-soft)] flex-shrink-0"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                      ) : (
                        <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                        </svg>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Click para subir imagen</p>
                      <p className="text-xs text-[var(--text-muted)]/60 mt-0.5">PNG, JPG o WEBP · Max 5MB</p>
                      {imagePreview && (
                        <button onClick={() => { setProductForm({ ...productForm, image: '' }); setImagePreview(''); }} className="text-xs text-[var(--danger)] hover:underline mt-1">
                          Quitar imagen
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Nombre</label>
                    <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]" placeholder="Nombre del producto"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Precio</label>
                    <input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]" placeholder="0"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Stock</label>
                    <input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]" placeholder="0"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">URL imagen (opcional)</label>
                    <input type="text" value={productForm.image.startsWith('data:') ? '' : productForm.image} onChange={e => { setProductForm({ ...productForm, image: e.target.value }); if (e.target.value) setImagePreview(e.target.value); }} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]" placeholder="https://..."/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Descripción</label>
                    <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)] resize-none" rows={2} placeholder="Descripción del producto..."/>
                  </div>
                </div>
                {saveError && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--danger-soft)] text-xs text-[var(--danger)]">
                    {saveError}
                  </div>
                )}
                <button 
                  onClick={handleSaveProduct} 
                  disabled={saving}
                  className="mt-4 px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    editingProduct ? 'Actualizar' : 'Guardar producto'
                  )}
                </button>
              </div>
            )}

            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
              {products.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-muted)]">
                  <p className="text-sm">No hay productos aún</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {products.map(product => (
                    <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-soft)] transition-colors">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--bg-muted)] flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-[var(--text-muted)]/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[var(--text)] truncate">{product.name}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{product.description || '—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm text-[var(--text)]">${product.price.toLocaleString()}</p>
                        <p className={`text-xs font-medium ${product.stock === 0 ? 'text-[var(--danger)]' : product.stock <= 5 ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'}`}>
                          {product.stock === 0 ? 'Sin stock' : `${product.stock} uds`}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            const newStock = prompt('Nuevo stock:', product.stock.toString());
                            if (newStock !== null && !isNaN(Number(newStock))) {
                              fetch('/api/products', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: product.id, stock: Number(newStock) }),
                              }).then(() => fetchData());
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                          title="Editar stock"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/>
                          </svg>
                        </button>
                        <button onClick={() => handleEditProduct(product)} className="p-2 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coupons */}
        {activeTab === 'coupons' && (
          <div>
            <button
              onClick={() => { 
                setShowCouponForm(!showCouponForm); 
                setEditingCoupon(null); 
                setCouponForm({ code: '', discount: '', active: true, maxUses: '', expiresAt: '', minPurchase: '', variant: 'standard' }); 
              }}
              className="mb-5 px-4 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              {showCouponForm ? 'Cancelar' : 'Nuevo cupón'}
            </button>

            {showCouponForm && (
              <div className="bg-white border border-[var(--border)] rounded-xl p-5 mb-5">
                <h3 className="text-sm font-semibold mb-4 text-[var(--text)]">{editingCoupon ? 'Editar' : 'Nuevo'} cupón</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">Tipo de cupón</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCouponForm({ ...couponForm, variant: 'standard' })}
                        className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                          couponForm.variant === 'standard'
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                        }`}
                      >
                        <p className="text-sm font-semibold text-[var(--text)]">Estándar</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Cupón de descuento general</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponForm({ ...couponForm, variant: 'post-purchase' })}
                        className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                          couponForm.variant === 'post-purchase'
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                            : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                        }`}
                      >
                        <p className="text-sm font-semibold text-[var(--text)]">Post-compra</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Para clientes que ya compraron +5% extra</p>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Código</label>
                    <input type="text" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)] uppercase tracking-wider" placeholder="DESC20"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Descuento %</label>
                    <input type="number" value={couponForm.discount} onChange={e => setCouponForm({ ...couponForm, discount: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]" placeholder="20" min="0" max="100"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Usos máximos (0=∞)</label>
                    <input type="number" value={couponForm.maxUses} onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]" placeholder="0" min="0"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Compra mínima ($)</label>
                    <input type="number" value={couponForm.minPurchase} onChange={e => setCouponForm({ ...couponForm, minPurchase: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]" placeholder="0" min="0"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Vencimiento</label>
                    <input type="date" value={couponForm.expiresAt} onChange={e => setCouponForm({ ...couponForm, expiresAt: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] text-[var(--text-secondary)]"/>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={couponForm.active} onChange={e => setCouponForm({ ...couponForm, active: e.target.checked })} className="w-4 h-4 rounded accent-[var(--accent)]"/>
                      <span className="text-sm text-[var(--text-secondary)]">Activo</span>
                    </label>
                  </div>
                </div>
                <button onClick={handleSaveCoupon} className="mt-4 px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors">
                  {editingCoupon ? 'Actualizar' : 'Guardar'} cupón
                </button>
              </div>
            )}

            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
              {coupons.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-muted)]">
                  <p className="text-sm">No hay cupones</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {coupons.map(coupon => (
                    <div key={coupon.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-soft)] transition-colors">
                      <span className="font-mono text-sm font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1.5 rounded-lg">
                        {coupon.code}
                      </span>
                      <span className="text-lg font-bold text-[var(--text)]">{coupon.discount}%</span>
                      {coupon.variant === 'post-purchase' && (
                        <span className="text-[10px] font-medium bg-gradient-to-r from-[#833AB4]/10 to-[#F77737]/10 text-[#833AB4] px-2 py-0.5 rounded-full">Post-compra</span>
                      )}
                      <div className="flex-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        {coupon.maxUses > 0 ? (
                          <span className={coupon.usedCount >= coupon.maxUses ? 'text-[var(--danger)]' : ''}>
                            {coupon.usedCount}/{coupon.maxUses} usos
                          </span>
                        ) : (
                          <span>{coupon.usedCount} usos</span>
                        )}
                        {coupon.minPurchase > 0 && <span>Min. ${coupon.minPurchase.toLocaleString()}</span>}
                        {coupon.expiresAt && (
                          <span className={new Date(coupon.expiresAt) < new Date() ? 'text-[var(--danger)]' : ''}>
                            {new Date(coupon.expiresAt).toLocaleDateString('es-AR')}
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${coupon.active ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}>
                        {coupon.active ? 'Activo' : 'Inactivo'}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleShowQr(coupon)} className="p-2 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" title="Ver QR">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"/>
                          </svg>
                        </button>
                        <button onClick={() => handleEditCoupon(coupon)} className="p-2 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" title="Editar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                          </svg>
                        </button>
                        <button onClick={() => handleToggleCoupon(coupon)} className="p-2 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" title={coupon.active ? 'Desactivar' : 'Activar'}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            {coupon.active ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            )}
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors" title="Eliminar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-[var(--text-muted)]">
                <p className="text-sm">No hay órdenes</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {orders.map(order => (
                  <div key={order.id} className="p-4 hover:bg-[var(--bg-soft)] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-[var(--text-muted)]">#{order.id.slice(-6)}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {order.items.map((item, i) => (
                        <span key={i} className="text-xs bg-[var(--bg-soft)] border border-[var(--border)] px-2.5 py-1 rounded-full">
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.status === 'approved' ? 'bg-[var(--success-soft)] text-[var(--success)]' :
                          order.status === 'rejected' ? 'bg-[var(--danger-soft)] text-[var(--danger)]' :
                          'bg-[var(--warning-soft)] text-[var(--warning)]'
                        }`}>
                          {order.status === 'approved' ? 'Aprobado' : order.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                        </span>
                        {order.discount > 0 && (
                          <span className="text-xs bg-[var(--accent-soft)] text-[var(--accent)] px-2.5 py-1 rounded-full">-{order.discount}%</span>
                        )}
                        {order.status === 'approved' && (
                          <select
                            value={order.trackingStatus || ''}
                            onChange={async (e) => {
                              if (e.target.value) {
                                await fetch('/api/orders/tracking', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: order.id, trackingStatus: e.target.value }),
                                });
                                await fetchData();
                              }
                            }}
                            className="text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-full px-2.5 py-1 text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                          >
                            <option value="">Sin tracking</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="preparing">En preparación</option>
                            <option value="shipped">En camino</option>
                            <option value="delivered">Entregado</option>
                          </select>
                        )}
                      </div>
                      <span className="font-bold text-[var(--text)]">${order.finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Customers */}
        {activeTab === 'customers' && (
          <div>
            <div className="flex flex-wrap gap-3 mb-5">
              <label className="px-4 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors inline-flex items-center gap-2 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                </svg>
                Importar Excel
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} className="hidden"/>
              </label>
              <button
                onClick={handleShowThankYouCard}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Tarjeta agradecimiento
              </button>
              {customers.length > 0 && (
                <button
                  onClick={() => setShowBulkCouponForm(!showBulkCouponForm)}
                  className="px-4 py-2 rounded-full bg-[var(--text)] text-white text-sm font-medium hover:bg-[var(--text-secondary)] transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.5c0 .621.504 1.125 1.125 1.125h4.5c.621 0 1.125-.504 1.125-1.125V5.25A2.25 2.25 0 009.568 3zM15.568 3h-4.5c-.621 0-1.125.504-1.125 1.125v4.5c0 .621.504 1.125 1.125 1.125h4.5c.621 0 1.125-.504 1.125-1.125V5.25A2.25 2.25 0 0015.568 3zM3 15.75h18M3 15.75a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 15.75"/>
                  </svg>
                  {showBulkCouponForm ? 'Cancelar' : `Generar cupones (${selectedCustomerIds.length})`}
                </button>
              )}
            </div>

            {showBulkCouponForm && (
              <div className="bg-white border border-[var(--border)] rounded-xl p-5 mb-5">
                <h3 className="text-sm font-semibold mb-4 text-[var(--text)]">Generar cupones únicos</h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">{selectedCustomerIds.length} clientes seleccionados</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Prefijo código</label>
                    <input type="text" value={bulkCouponForm.prefix} onChange={e => setBulkCouponForm({ ...bulkCouponForm, prefix: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)] uppercase" placeholder="ML"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Descuento %</label>
                    <input type="number" value={bulkCouponForm.discount} onChange={e => setBulkCouponForm({ ...bulkCouponForm, discount: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" placeholder="10" min="0" max="100"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Vencimiento</label>
                    <input type="date" value={bulkCouponForm.expiresAt} onChange={e => setBulkCouponForm({ ...bulkCouponForm, expiresAt: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] text-[var(--text-secondary)]"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Compra mínima ($)</label>
                    <input type="number" value={bulkCouponForm.minPurchase} onChange={e => setBulkCouponForm({ ...bulkCouponForm, minPurchase: e.target.value })} className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" placeholder="0" min="0"/>
                  </div>
                </div>
                <button onClick={handleBulkGenerateCoupons} disabled={saving || selectedCustomerIds.length === 0} className="mt-4 px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {saving ? 'Generando...' : `Generar ${selectedCustomerIds.length} cupones únicos`}
                </button>
              </div>
            )}

            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
              {customers.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-muted)]">
                  <p className="text-sm">No hay clientes</p>
                  <p className="text-xs mt-1">Importá un Excel de Mercado Libre para comenzar</p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-soft)] flex items-center gap-3">
                    <button onClick={selectAllCustomers} className="text-xs text-[var(--accent)] hover:underline">
                      {selectedCustomerIds.length === customers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                    <span className="text-xs text-[var(--text-muted)]">{selectedCustomerIds.length} seleccionados</span>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {customers.map(customer => (
                      <div key={customer.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-soft)] transition-colors">
                        <input 
                          type="checkbox" 
                          checked={selectedCustomerIds.includes(customer.id)} 
                          onChange={() => toggleCustomerSelection(customer.id)}
                          className="w-4 h-4 rounded accent-[var(--accent)] flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[var(--text)] truncate">{customer.name || 'Sin nombre'}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{customer.email || '—'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] font-medium bg-[var(--bg-muted)] text-[var(--text-muted)] px-2 py-0.5 rounded-full uppercase">{customer.source}</span>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{customer.totalPurchases} compras</p>
                        </div>
                        <button onClick={async () => { await fetch(`/api/customers?id=${customer.id}`, { method: 'DELETE' }); await fetchData(); }} className="p-2 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Support Tickets */}
        {activeTab === 'support' && (
          <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
            {tickets.length === 0 ? (
              <div className="text-center py-16 text-[var(--text-muted)]">
                <p className="text-sm">No hay tickets de soporte</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="p-4 hover:bg-[var(--bg-soft)] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          ticket.status === 'pending' ? 'bg-[var(--warning-soft)] text-[var(--warning)]' :
                          ticket.status === 'resolved' ? 'bg-[var(--success-soft)] text-[var(--success)]' :
                          'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                        }`}>
                          {ticket.status === 'pending' ? 'Pendiente' : ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                        </span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">#{ticket.id?.slice(-6)}</span>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(ticket.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text)] mb-1">{ticket.reason}</p>
                    <p className="text-xs text-[var(--text-muted)] mb-2">Último mensaje: "{ticket.lastMessage}"</p>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      {ticket.userName && <span>👤 {ticket.userName}</span>}
                      {ticket.userEmail && <span>📧 {ticket.userEmail}</span>}
                    </div>
                    {ticket.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={async () => {
                            await fetch(`/api/support?id=${ticket.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'resolved' }),
                            });
                            await fetchData();
                          }}
                          className="px-3 py-1.5 rounded-full bg-[var(--success)] text-white text-xs font-medium hover:opacity-90 transition-colors"
                        >
                          Marcar resuelto
                        </button>
                        <button
                          onClick={async () => {
                            await fetch(`/api/support?id=${ticket.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'closed' }),
                            });
                            await fetchData();
                          }}
                          className="px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-soft)] transition-colors"
                        >
                          Cerrar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {showThankYouCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print" onClick={() => setShowThankYouCard(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden print-card" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200 no-print">
              <h3 className="font-semibold text-gray-800 text-sm">Tarjeta agradecimiento</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-medium hover:bg-gray-700 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/>
                  </svg>
                  Imprimir
                </button>
                <button onClick={async () => {
                  const html2pdf = (await import('html2pdf.js')).default;
                  const preview = document.getElementById('thank-you-card-preview');
                  if (!preview) return;
                  
                  const originalDisplay = preview.style.display;
                  const originalPosition = preview.style.position;
                  const originalLeft = preview.style.left;
                  const originalZIndex = preview.style.zIndex;
                  const originalOpacity = preview.style.opacity;
                  
                  preview.style.display = 'block';
                  preview.style.position = 'fixed';
                  preview.style.left = '0';
                  preview.style.top = '0';
                  preview.style.zIndex = '-1000';
                  preview.style.opacity = '1';
                  preview.style.pointerEvents = 'none';
                  
                  await new Promise(r => setTimeout(r, 300));
                  
                  const opt: any = {
                    margin: 0,
                    filename: 'tarjeta-grana3d.pdf',
                    image: { type: 'jpeg' as const, quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: { unit: 'mm', format: [65, 90], orientation: 'portrait' },
                  };
                  
                  await html2pdf().set(opt).from(preview).save();
                  
                  preview.style.display = originalDisplay;
                  preview.style.position = originalPosition;
                  preview.style.left = originalLeft;
                  preview.style.zIndex = originalZIndex;
                  preview.style.opacity = originalOpacity;
                }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C41E3A] text-white text-xs font-medium hover:bg-[#a01830] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                  </svg>
                  PDF
                </button>
                <button onClick={() => setShowThankYouCard(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-4 no-print">
                <span className="text-xs text-gray-500">Cantidad</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPrintCopies(Math.max(1, printCopies - 1))} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold">−</button>
                  <span className="text-sm font-bold text-gray-800 w-6 text-center">{printCopies}</span>
                  <button onClick={() => setPrintCopies(Math.min(50, printCopies + 1))} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold">+</button>
                </div>
              </div>

              {/* Card preview */}
              <div id="thank-you-card-preview" className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="relative bg-[#2d3436] px-4 py-3 flex items-center justify-between overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="none">
                      <polygon points="0,0 40,0 20,25" fill="#00cec9"/>
                      <polygon points="40,0 80,0 60,25" fill="#e17055"/>
                      <polygon points="80,0 120,0 100,25" fill="#d63031"/>
                      <polygon points="120,0 160,0 140,25" fill="#00cec9"/>
                      <polygon points="160,0 200,0 180,25" fill="#e17055"/>
                      <polygon points="0,25 20,25 0,50" fill="#d63031"/>
                      <polygon points="20,25 40,50 0,50" fill="#00cec9"/>
                      <polygon points="40,0 60,25 40,50" fill="#e17055"/>
                      <polygon points="60,25 80,50 40,50" fill="#d63031"/>
                      <polygon points="80,0 100,25 80,50" fill="#00cec9"/>
                      <polygon points="100,25 120,50 80,50" fill="#e17055"/>
                      <polygon points="120,0 140,25 120,50" fill="#d63031"/>
                      <polygon points="140,25 160,50 120,50" fill="#00cec9"/>
                      <polygon points="160,0 180,25 160,50" fill="#e17055"/>
                      <polygon points="180,25 200,50 160,50" fill="#d63031"/>
                    </svg>
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <img src="/logo-grana3d.svg" alt="Grana 3D" className="h-6 w-auto brightness-0 invert"/>
                  </div>
                  <span className="relative z-10 text-[9px] text-gray-400 font-medium">grana3d.com.ar</span>
                </div>

                <div className="px-4 py-5 text-center bg-white">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#d63031]/10 mb-3">
                    <svg className="w-5 h-5 text-[#d63031]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">¡Gracias por tu compra!</h2>
                  <p className="text-gray-500 text-[10px] mb-4 leading-relaxed px-2">Tu apoyo nos permite seguir creando. Seguinos para obtener beneficios exclusivos.</p>

                  <div className="rounded-xl p-3 text-white mb-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)' }}>
                    <div className="absolute inset-0 bg-white/5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
                        </svg>
                        <span className="font-bold text-xs">Seguinos y obtené +5% OFF</span>
                      </div>
                      <p className="text-[9px] text-white/80 mb-2">@grana.3d</p>
                      <div className="w-20 h-20 bg-white rounded-lg mx-auto flex items-center justify-center p-1.5">
                        {thankYouQrDataUrl && <img src={thankYouQrDataUrl} alt="QR Instagram" className="w-full h-full"/>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#25D366] rounded-xl p-3 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="font-bold text-xs">WhatsApp</span>
                      </div>
                      <div className="w-20 h-20 bg-white rounded-lg mx-auto flex items-center justify-center p-1.5">
                        {whatsappQrDataUrl && <img src={whatsappQrDataUrl} alt="QR WhatsApp" className="w-full h-full"/>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Card Modal */}
      {showQrModal && selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print" onClick={() => setShowQrModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden print-card" onClick={e => e.stopPropagation()}>
            {/* Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 no-print">
              <h3 className="font-semibold text-gray-800 text-sm">
                {selectedCoupon.variant === 'post-purchase' ? 'Tarjeta post-compra' : 'Tarjeta de cupón'}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E07A5F] text-white text-xs font-medium hover:bg-[#c96a52] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/>
                  </svg>
                  Imprimir
                </button>
                <button onClick={() => setShowQrModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Printable Card */}
            <div className="p-6">
              <div className="print-card-inner border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
                {/* Header */}
                <div className="relative bg-white px-8 py-5 flex items-center justify-between">
                  <div className="absolute left-0 top-0 bottom-0 w-24 opacity-[0.08]">
                    <svg viewBox="0 0 96 120" className="w-full h-full" preserveAspectRatio="none">
                      <polygon points="0,0 48,0 24,30" fill="#00BFA5"/>
                      <polygon points="48,0 96,0 72,30" fill="#FF6B35"/>
                      <polygon points="0,30 24,30 0,60" fill="#FF6B8A"/>
                      <polygon points="24,30 48,60 0,60" fill="#4A0E4E"/>
                      <polygon points="48,0 72,30 48,60" fill="#00BFA5"/>
                      <polygon points="72,30 96,60 48,60" fill="#FF6B35"/>
                      <polygon points="0,60 48,60 24,90" fill="#4A0E4E"/>
                      <polygon points="48,60 96,60 72,90" fill="#00BFA5"/>
                      <polygon points="0,90 24,90 0,120" fill="#FF6B35"/>
                      <polygon points="24,90 48,120 0,120" fill="#00BFA5"/>
                      <polygon points="48,60 72,90 48,120" fill="#FF6B8A"/>
                      <polygon points="72,90 96,120 48,120" fill="#4A0E4E"/>
                    </svg>
                  </div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                      <polygon points="24,4 44,16 24,28" fill="#FF6B35"/>
                      <polygon points="24,28 4,16 24,4" fill="#4A0E4E"/>
                      <polygon points="24,28 44,16 44,40 24,44" fill="#00BFA5"/>
                      <polygon points="24,28 4,16 4,40 24,44" fill="#4A0E4E" opacity="0.7"/>
                      <polygon points="24,44 44,40 24,28" fill="#00BFA5" opacity="0.7"/>
                      <polygon points="24,44 4,40 24,28" fill="#FF6B35" opacity="0.5"/>
                      <line x1="24" y1="4" x2="24" y2="28" stroke="white" strokeWidth="1.5"/>
                      <line x1="4" y1="16" x2="24" y2="28" stroke="white" strokeWidth="1.5"/>
                      <line x1="44" y1="16" x2="24" y2="28" stroke="white" strokeWidth="1.5"/>
                    </svg>
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-gray-800 tracking-tight">GRANA</span>
                        <span className="text-xl font-bold text-[#C41E3A] tracking-tight">3D</span>
                      </div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] mt-0.5">Hacemos realidad tus ideas</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-400">
                    {selectedCoupon.variant === 'post-purchase' ? 'Gracias por tu compra' : 'Cupón de descuento'}
                  </span>
                </div>

                {selectedCoupon.variant === 'post-purchase' ? (
                  /* Post-purchase variant */
                  <>
                    {/* Thank you banner */}
                    <div className="bg-gradient-to-r from-[#FF6B35]/10 via-[#00BFA5]/10 to-[#4A0E4E]/10 px-8 py-6 text-center">
                      <p className="text-2xl font-bold text-gray-800 mb-1">¡Gracias por tu compra!</p>
                      <p className="text-sm text-gray-500">Queremos seguir siendo parte de tus proyectos</p>
                    </div>

                    {/* Body */}
                    <div className="px-8 py-8">
                      <div className="flex items-start gap-8">
                        {/* QR */}
                        <div className="flex-shrink-0">
                          <div className="w-36 h-36 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center p-3 shadow-sm">
                            {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full"/>}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="mb-4">
                            <span className="text-5xl font-bold text-[#C41E3A]">{selectedCoupon.discount}%</span>
                            <span className="text-xl text-gray-400 ml-2 font-light">OFF</span>
                            <span className="block text-xs text-[#00BFA5] font-semibold mt-1">+5% extra por seguirnos</span>
                          </div>
                          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Código</p>
                            <p className="font-mono font-bold text-2xl text-gray-800 tracking-[0.3em]">{selectedCoupon.code}</p>
                          </div>
                        </div>
                      </div>

                      {/* Instagram CTA */}
                      <div className="mt-6 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-xl p-5 text-white">
                        <div className="flex items-center gap-3 mb-3">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          <span className="font-bold text-lg">@grana.3d</span>
                        </div>
                        <p className="text-sm text-white/90 mb-2">Seguinos en Instagram y obtené un <span className="font-bold text-white">5% adicional</span> en tu próxima compra</p>
                        <p className="text-xs text-white/70">Escaneá el QR o visitá <span className="font-medium text-white">grana3d.com.ar</span></p>
                      </div>

                      {/* Offers section */}
                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                          <p className="text-lg font-bold text-[#FF6B35]">🎨</p>
                          <p className="text-[10px] text-gray-500 mt-1">Nuevos diseños cada semana</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                          <p className="text-lg font-bold text-[#00BFA5]">⚡</p>
                          <p className="text-[10px] text-gray-500 mt-1">Envíos rápidos a todo el país</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                          <p className="text-lg font-bold text-[#4A0E4E]">💎</p>
                          <p className="text-[10px] text-gray-500 mt-1">Calidad premium garantizada</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Standard variant */
                  <>
                    <div className="px-8 py-8 flex items-center gap-8">
                      <div className="flex-shrink-0">
                        <div className="w-36 h-36 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center p-3 shadow-sm">
                          {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full"/>}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-4">
                          <span className="text-5xl font-bold text-[#C41E3A]">{selectedCoupon.discount}%</span>
                          <span className="text-xl text-gray-400 ml-2 font-light">OFF</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 border border-gray-100">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Código</p>
                          <p className="font-mono font-bold text-2xl text-gray-800 tracking-[0.3em]">{selectedCoupon.code}</p>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Escaneá el QR o ingresá el código en <span className="font-medium text-gray-600">grana3d.com.ar</span>
                        </p>
                        {selectedCoupon.maxUses > 0 && (
                          <p className="text-[10px] text-gray-300 mt-2">
                            Válido para {selectedCoupon.maxUses - selectedCoupon.usedCount} usos restantes
                          </p>
                        )}
                        {selectedCoupon.expiresAt && (
                          <p className="text-[10px] text-gray-300 mt-1">
                            Vence: {new Date(selectedCoupon.expiresAt).toLocaleDateString('es-AR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Footer */}
                <div className="border-t border-gray-100 px-8 py-4 flex items-center justify-between">
                  <p className="text-[10px] text-gray-300">Válido hasta agotar stock</p>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="text-xs">@grana.3d</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
