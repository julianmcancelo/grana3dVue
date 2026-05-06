'use client';

import { useState, useEffect } from 'react';

const WHATSAPP_OPTIONS = [
  { icon: '🛒', label: 'Hacer un pedido', desc: 'Consultar productos disponibles', text: 'Hola! Quiero hacer un pedido. ¿Qué productos tienen disponibles?' },
  { icon: '📦', label: 'Consulta de producto', desc: 'Detalles, materiales, medidas', text: 'Hola! Tengo una consulta sobre un producto de la tienda. ¿Me pueden ayudar?' },
  { icon: '🏢', label: 'Compras mayoristas', desc: 'Precios por cantidad', text: 'Hola! Me interesan las compras mayoristas. ¿Tienen precios especiales por cantidad?' },
  { icon: '🔧', label: 'Pedido personalizado', desc: 'Impresión 3D a medida', text: 'Hola! Quiero hacer un pedido personalizado de impresión 3D. ¿Qué necesitan saber?' },
  { icon: '📍', label: 'Consulta de envío', desc: 'Zonas y tiempos de entrega', text: 'Hola! Quiero consultar sobre los envíos. ¿A qué zonas llegan y cuánto tarda?' },
  { icon: '💬', label: 'Otra consulta', desc: 'Escribí tu mensaje', text: '' },
];

const IG_OPTIONS = [
  { icon: '📷', label: 'Seguir en Instagram', desc: 'Enterate de novedades primero', url: 'https://instagram.com/grana.3d' },
  { icon: '💬', label: 'Enviar mensaje directo', desc: 'Escribinos por DM', url: 'https://ig.me/m/grana.3d' },
  { icon: '🛍️', label: 'Ver productos', desc: 'Mirá nuestro catálogo', url: 'https://instagram.com/grana.3d' },
];

export default function LandingPage() {
  const [entered, setEntered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [waModal, setWaModal] = useState(false);
  const [igModal, setIgModal] = useState(false);
  const [waMessage, setWaMessage] = useState('');
  const [waCustom, setWaCustom] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (waModal || igModal) {
      const t = setTimeout(() => setModalVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setModalVisible(false);
    }
  }, [waModal, igModal]);

  if (entered) {
    window.location.href = '/tienda';
    return null;
  }

  const openWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/5491126354636?text=${encoded}`, '_blank');
    closeModal();
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setWaModal(false);
      setIgModal(false);
      setWaCustom(false);
      setWaMessage('');
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 40%, #f8f6f5 100%)' }}/>
        <div className="absolute w-96 h-96 rounded-full opacity-[0.03] animate-pulse" style={{ background: '#e17055', top: '-10%', left: '60%', animationDuration: '4s' }}/>
        <div className="absolute w-72 h-72 rounded-full opacity-[0.03] animate-pulse" style={{ background: '#00cec9', top: '70%', left: '-5%', animationDelay: '1.5s', animationDuration: '4s' }}/>
        <div className="absolute w-48 h-48 rounded-full opacity-[0.03] animate-pulse" style={{ background: '#6c5ce7', top: '40%', left: '80%', animationDelay: '3s', animationDuration: '4s' }}/>
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, #1a1a1a 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}/>
      </div>

      {/* Header */}
      <header className={`relative z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur-md transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <a href="/landing" className="flex items-center gap-2.5">
              <img src="/logo-grana3d.png" alt="Grana 3D" className="h-9 w-auto"/>
            </a>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e17055]/8 border border-[#e17055]/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e17055] animate-pulse"/>
              <span className="text-xs font-medium text-[#e17055]">Próximamente</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className={`max-w-2xl w-full text-center transition-all duration-1000 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-8">
            <div className="inline-flex items-center justify-center p-1 rounded-2xl mb-2" style={{ background: 'linear-gradient(135deg, #e17055/10, #00cec9/10)' }}>
              <img src="/logo-grana3d.png" alt="Grana 3D" className="h-16 sm:h-20 w-auto"/>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-[1.15]">
            Ideas que se
            <span className="block mt-1" style={{ color: '#e17055' }}>hacen reales</span>
          </h1>

          <p className="mt-5 text-[var(--text-secondary)] text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Productos diseñados e impresos en 3D con atención al detalle y materiales de primera.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#e17055]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Envíos a todo el país
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#e17055]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Pago seguro con Mercado Pago
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#e17055]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Pedidos personalizados
            </span>
          </div>
        </div>

        {/* Contact Cards */}
        <div className={`max-w-lg w-full mt-14 transition-all duration-1000 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-4">Contactanos</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setWaModal(true)}
              className="group rounded-2xl border border-[var(--border)] hover:border-[#25D366]/40 hover:shadow-md transition-all duration-300 overflow-hidden bg-white text-left w-full"
            >
              <div className="p-5 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#25D366]/15 transition-all">
                  <svg className="w-6 h-6 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-sm text-[var(--text)]">WhatsApp</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Escribinos directo</p>
              </div>
            </button>

            <button
              onClick={() => setIgModal(true)}
              className="group rounded-2xl border border-[var(--border)] hover:border-[#E1306C]/40 hover:shadow-md transition-all duration-300 overflow-hidden bg-white text-left w-full"
            >
              <div className="p-5 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#833AB4]/10 via-[#E1306C]/10 to-[#F77737]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#E1306C]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-sm text-[var(--text)]">Instagram</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">@grana.3d</p>
              </div>
            </button>
          </div>

          {/* Store Card */}
          <div className="mt-3 rounded-2xl border border-[var(--border)] bg-white overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #e17055, #fab1a0)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h13.5"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-sm text-[var(--text)]">Tienda Online</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Explorá productos y comprá con Mercado Pago</p>
              </div>
            </div>
          </div>

          {/* Enter Button */}
          <button
            onClick={() => setEntered(true)}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[var(--text)] text-white font-medium text-sm hover:bg-[var(--accent)] transition-colors duration-200 shadow-sm hover:shadow"
          >
            Entrar a la tienda
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
            </svg>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className={`relative z-10 border-t border-[var(--border)] transition-all duration-700 delay-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
              Impresión 3D de calidad · Envíos a todo el país
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Modal */}
      {waModal && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
          <div
            className={`relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-300 ${modalVisible ? 'translate-y-0 sm:scale-100' : 'translate-y-8 sm:scale-95'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-5 pb-4" style={{ background: 'linear-gradient(135deg, #075E54, #128C7E, #25D366)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">WhatsApp</h3>
                  <p className="text-white/70 text-sm">Grana 3D</p>
                </div>
              </div>
              <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              {!waCustom ? (
                <div className="p-5">
                  <p className="text-sm font-medium text-[var(--text)] mb-1">¿Sobre qué querés consultar?</p>
                  <p className="text-xs text-[var(--text-muted)] mb-4">Elegí una opción o escribí tu mensaje</p>
                  <div className="space-y-2">
                    {WHATSAPP_OPTIONS.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (i === WHATSAPP_OPTIONS.length - 1) {
                            setWaCustom(true);
                          } else {
                            openWhatsApp(opt.text);
                          }
                        }}
                        className="w-full text-left p-3.5 rounded-xl border border-[var(--border)] hover:border-[#25D366]/40 hover:bg-[#25D366]/5 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{opt.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-[var(--text)] group-hover:text-[#128C7E] transition-colors">{opt.label}</p>
                            <p className="text-xs text-[var(--text-muted)]">{opt.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <p className="text-sm font-medium text-[var(--text)] mb-3">Escribí tu mensaje:</p>
                  <textarea
                    value={waMessage}
                    onChange={e => setWaMessage(e.target.value)}
                    placeholder="Hola! Quiero consultar sobre..."
                    rows={4}
                    className="w-full border border-[var(--border)] rounded-xl p-3.5 text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10 resize-none placeholder:text-[var(--text-muted)] transition-all"
                  />
                  <button
                    onClick={() => waMessage.trim() && openWhatsApp(waMessage)}
                    disabled={!waMessage.trim()}
                    className="mt-3 w-full py-3 rounded-full text-white font-medium text-sm transition-all disabled:opacity-40 hover:shadow-md"
                    style={{ background: 'linear-gradient(135deg, #128C7E, #25D366)' }}
                  >
                    Enviar por WhatsApp
                  </button>
                  <button
                    onClick={() => { setWaCustom(false); setWaMessage(''); }}
                    className="mt-2 w-full py-2.5 rounded-full border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-soft)] transition-colors"
                  >
                    ← Volver a las opciones
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instagram Modal */}
      {igModal && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
          <div
            className={`relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden shadow-2xl transition-all duration-300 ${modalVisible ? 'translate-y-0 sm:scale-100' : 'translate-y-8 sm:scale-95'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-5 pb-4" style={{ background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Instagram</h3>
                  <p className="text-white/70 text-sm">@grana.3d</p>
                </div>
              </div>
              <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-sm font-medium text-[var(--text)] mb-1">¿Qué querés hacer?</p>
              <p className="text-xs text-[var(--text-muted)] mb-4">Seguinos para novedades y descuentos exclusivos</p>
              <div className="space-y-2 mb-4">
                {IG_OPTIONS.map((opt, i) => (
                  <a
                    key={i}
                    href={opt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/5 transition-all group"
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--text)] group-hover:text-[#E1306C] transition-colors">{opt.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{opt.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-[var(--text-muted)] ml-auto group-hover:text-[#E1306C] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                    </svg>
                  </a>
                ))}
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  💡 <span className="font-medium text-[var(--text-secondary)]">Tip:</span> Seguinos en Instagram para enterarte primero de los nuevos productos y obtener descuentos exclusivos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
