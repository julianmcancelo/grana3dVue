'use client';

import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';

const WHATSAPP_OPTIONS = [
  { label: 'Hacer un pedido', desc: 'Consultar productos disponibles', text: 'Hola! Quiero hacer un pedido. ¿Qué productos tienen disponibles?' },
  { label: 'Consulta de producto', desc: 'Detalles, materiales, medidas', text: 'Hola! Tengo una consulta sobre un producto de la tienda. ¿Me pueden ayudar?' },
  { label: 'Compras mayoristas', desc: 'Precios por cantidad', text: 'Hola! Me interesan las compras mayoristas. ¿Tienen precios especiales por cantidad?' },
  { label: 'Pedido personalizado', desc: 'Impresión 3D a medida', text: 'Hola! Quiero hacer un pedido personalizado de impresión 3D. ¿Qué necesitan saber?' },
  { label: 'Consulta de envío', desc: 'Zonas y tiempos de entrega', text: 'Hola! Quiero consultar sobre los envíos. ¿A qué zonas llegan y cuánto tarda?' },
  { label: 'Otra consulta', desc: 'Escribí tu mensaje', text: '' },
];

const IG_OPTIONS = [
  { label: 'Seguir en Instagram', desc: 'Enterate de novedades primero', url: 'https://instagram.com/grana.3d' },
  { label: 'Enviar mensaje directo', desc: 'Escribinos por DM', url: 'https://ig.me/m/grana.3d' },
  { label: 'Ver productos', desc: 'Mirá nuestro catálogo', url: 'https://instagram.com/grana.3d' },
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className={`border-b border-[var(--border)] bg-white transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
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

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 sm:py-32">
        <div className={`max-w-xl w-full text-center transition-all duration-1000 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <img src="/logo-grana3d.png" alt="Grana 3D" className="h-20 sm:h-24 w-auto mx-auto mb-8"/>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text)] leading-tight">
            Impresión 3D de calidad
          </h1>

          <p className="mt-4 text-[var(--text-secondary)] text-base sm:text-lg max-w-sm mx-auto leading-relaxed">
            Productos diseñados con atención al detalle y materiales de primera.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--text-muted)]">
            <span>Envíos a todo el país</span>
            <span className="text-[var(--border)]">·</span>
            <span>Pago seguro con Mercado Pago</span>
            <span className="text-[var(--border)]">·</span>
            <span>Pedidos personalizados</span>
          </div>
        </div>

        {/* CTA */}
        <div className={`mt-12 transition-all duration-1000 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button
            onClick={() => setEntered(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--text)] text-white font-medium text-sm hover:bg-[var(--accent)] transition-colors duration-200"
          >
            Entrar a la tienda
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
            </svg>
          </button>
        </div>

        {/* Contact */}
        <div className={`mt-16 grid grid-cols-2 gap-4 max-w-sm w-full transition-all duration-1000 delay-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button
            onClick={() => setWaModal(true)}
            className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--border)] hover:border-[#25D366]/40 bg-white transition-all"
          >
            <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="text-xs font-medium text-[var(--text)]">WhatsApp</span>
          </button>

          <button
            onClick={() => setIgModal(true)}
            className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--border)] hover:border-[#E1306C]/40 bg-white transition-all"
          >
            <svg className="w-5 h-5 text-[#E1306C]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="text-xs font-medium text-[var(--text)]">Instagram</span>
          </button>
        </div>
      </main>

      <Footer />

      {/* WhatsApp Modal */}
      {waModal && (
        <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`} onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
          <div className={`relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden shadow-2xl transition-all duration-300 ${modalVisible ? 'translate-y-0 sm:scale-100' : 'translate-y-8 sm:scale-95'}`} onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">WhatsApp</h3>
                  <p className="text-xs text-[var(--text-muted)]">+54 9 11 2635-4636</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-[var(--bg-soft)] text-[var(--text-muted)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {!waCustom ? (
                <div className="p-5">
                  <div className="space-y-1">
                    {WHATSAPP_OPTIONS.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (i === WHATSAPP_OPTIONS.length - 1) setWaCustom(true);
                          else openWhatsApp(opt.text);
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-[var(--bg-soft)] transition-colors group"
                      >
                        <p className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)]">{opt.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <textarea
                    value={waMessage}
                    onChange={e => setWaMessage(e.target.value)}
                    placeholder="Escribí tu mensaje..."
                    rows={4}
                    className="w-full border border-[var(--border)] rounded-xl p-3 text-sm focus:outline-none focus:border-[#25D366] resize-none placeholder:text-[var(--text-muted)]"
                  />
                  <button
                    onClick={() => waMessage.trim() && openWhatsApp(waMessage)}
                    disabled={!waMessage.trim()}
                    className="mt-3 w-full py-2.5 rounded-full bg-[#25D366] text-white font-medium text-sm disabled:opacity-40 transition-opacity"
                  >
                    Enviar
                  </button>
                  <button
                    onClick={() => { setWaCustom(false); setWaMessage(''); }}
                    className="mt-2 w-full py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                  >
                    Volver
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instagram Modal */}
      {igModal && (
        <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`} onClick={closeModal}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
          <div className={`relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden shadow-2xl transition-all duration-300 ${modalVisible ? 'translate-y-0 sm:scale-100' : 'translate-y-8 sm:scale-95'}`} onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#E1306C]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">Instagram</h3>
                  <p className="text-xs text-[var(--text-muted)]">@grana.3d</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-[var(--bg-soft)] text-[var(--text-muted)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-5">
              <div className="space-y-1">
                {IG_OPTIONS.map((opt, i) => (
                  <a
                    key={i}
                    href={opt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-soft)] transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)]">{opt.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{opt.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
