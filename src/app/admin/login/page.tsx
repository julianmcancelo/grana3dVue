'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

const ADMIN_EMAILS = [
  'jcancelo.dev@gmail.com',
];

export default function AdminLogin() {
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
          router.push('/admin');
        } else {
          setError('Este email no tiene permisos de administrador');
          signOut(auth);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Permití las ventanas emergentes para este sitio');
      } else {
        setError('Error al iniciar sesión. Intentá de nuevo.');
      }
    }
    setSigningIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-soft)]">
        <svg className="animate-spin w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-soft)]">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-[0.03]" style={{ background: '#e17055' }}/>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-[0.03]" style={{ background: '#00cec9' }}/>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <a href="/landing" className="flex items-center gap-2.5">
              <img src="/logo-grana3d.png" alt="Grana 3D" className="h-8 w-auto"/>
            </a>
            <a href="/tienda" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              Volver a la tienda
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #e17055/10, #00cec9/10)' }}>
              <img src="/logo-grana3d.png" alt="Grana 3D" className="h-16 w-auto"/>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              Panel de <span style={{ color: '#e17055' }}>administración</span>
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-2">Ingresá con tu cuenta autorizada</p>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <button
              onClick={handleGoogleLogin}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-soft)] hover:border-[var(--border-hover)] transition-all text-sm font-medium text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingIn ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {signingIn ? 'Conectando...' : 'Continuar con Google'}
            </button>

            {error && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger-border)]">
                <svg className="w-4 h-4 text-[var(--danger)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                <span className="text-xs text-[var(--danger)] font-medium">{error}</span>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
                Solo los emails autorizados pueden acceder al panel.
              </p>
            </div>
          </div>

          {/* Footer info */}
          <p className="text-center text-[10px] text-[var(--text-muted)] mt-6">
            Grana 3D · Impresión 3D de calidad
          </p>
        </div>
      </main>
    </div>
  );
}
