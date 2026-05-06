'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function CuponPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [coupon, setCoupon] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [followedInstagram, setFollowedInstagram] = useState(false);
  const [extraDiscount, setExtraDiscount] = useState(0);

  useEffect(() => {
    if (!code) return;
    fetch('/api/coupons')
      .then(res => res.json())
      .then(coupons => {
        const found = coupons.find((c: any) => c.code === code.toUpperCase());
        if (found) {
          setCoupon(found);
          QRCode.toDataURL(`${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/?cupon=${found.code}`, {
            width: 200,
            margin: 1,
            color: { dark: '#1a1a1a', light: '#ffffff' },
          }).then(setQrDataUrl);
        }
        setLoading(false);
      });
  }, [code]);

  const handleFollowInstagram = () => {
    window.open('https://www.instagram.com/grana.3d/', '_blank');
    setFollowedInstagram(true);
    setExtraDiscount(5);
  };

  const totalDiscount = coupon ? coupon.discount + extraDiscount : 0;

  const handleGoToStore = () => {
    router.push(`/?cupon=${code}&discount=${totalDiscount}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-soft)] flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="min-h-screen bg-[var(--bg-soft)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--danger-soft)] mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">Cupón no encontrado</h1>
          <p className="text-[var(--text-muted)] text-sm mt-2">Este cupón no existe o ya no está activo</p>
          <a href="/" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">Ir a la tienda</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-soft)] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-[var(--border)] rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/logo-grana3d.svg" alt="Grana 3D" className="h-10 w-auto mx-auto mb-2"/>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.15em]">Hacemos realidad tus ideas</p>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#e17055]/10 border-2 border-[#e17055]/30 mb-3">
            <span className="text-2xl font-bold" style={{ color: '#e17055' }}>{coupon.discount}%</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">¡Tenés un descuento especial!</p>
          {extraDiscount > 0 && (
            <p className="text-xs text-[#00b894] font-medium mt-1">+{extraDiscount}% extra por seguirnos</p>
          )}
        </div>

        {/* Discount Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#e17055]/10 to-[#d63031]/10 border-2 border-[#e17055]/30 mb-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#e17055] to-[#d63031] bg-clip-text text-transparent">{coupon.discount}%</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">¡Tenés un descuento especial!</p>
          {extraDiscount > 0 && (
            <p className="text-xs text-[#00b894] font-medium mt-1">+{extraDiscount}% extra por seguirnos</p>
          )}
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="bg-[var(--bg-soft)] rounded-xl p-4 mb-6 flex justify-center">
            <img src={qrDataUrl} alt="QR Cupón" className="w-40 h-40"/>
          </div>
        )}

        {/* Coupon Code */}
        <div className="bg-[var(--bg-soft)] rounded-xl px-4 py-3 mb-6 text-center">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Código</p>
          <p className="font-mono font-bold text-lg text-[var(--text)] tracking-widest">{coupon.code}</p>
        </div>

        {/* Instagram Follow */}
        {!followedInstagram ? (
          <button
            onClick={handleFollowInstagram}
            className="w-full mb-3 py-3 rounded-xl border-2 border-[var(--border)] hover:border-[#e17055]/40 hover:bg-[#e17055]/5 transition-all text-sm font-medium text-[var(--text)] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Seguinos en Instagram +5%
          </button>
        ) : (
          <div className="w-full mb-3 py-3 rounded-xl bg-[#00b894]/8 border border-[#00b894]/20 text-center">
            <p className="text-sm font-medium text-[#00b894]">✓ ¡Ya seguís a Grana 3D!</p>
            <p className="text-xs text-[#00b894] mt-0.5">Descuento total: {totalDiscount}%</p>
          </div>
        )}

        <button
          onClick={handleGoToStore}
          className="w-full py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity text-sm shadow-sm"
          style={{ background: '#e17055', boxShadow: '0 2px 8px rgba(225,112,85,0.2)' }}
        >
          Ir a la tienda
        </button>

        <p className="text-xs text-[var(--text-muted)] text-center mt-4">
          El descuento se aplicará automáticamente en tu compra
        </p>
      </div>
    </div>
  );
}
