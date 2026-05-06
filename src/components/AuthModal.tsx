'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana. Permití popups o usá email.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError('');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado. Usá email para iniciar sesión.');
      } else {
        setError('No se pudo iniciar sesión con Google. Probá con email.');
      }
    }
    setLoading(false);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      onClose();
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Email ya registrado'
        : err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
          ? 'Email o contraseña incorrectos'
          : err.code === 'auth/weak-password'
            ? 'Contraseña debe tener al menos 6 caracteres'
            : err.code === 'auth/invalid-email'
              ? 'Email inválido'
              : err.code === 'auth/missing-password'
                ? 'Ingresá una contraseña'
                : 'Error al autenticar';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--bg-soft)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-2.5 rounded-full border border-[var(--border)] flex items-center justify-center gap-2 font-medium text-sm hover:bg-[var(--bg-soft)] transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[var(--border)]"/>
          <span className="text-xs text-[var(--text-muted)]">o</span>
          <div className="flex-1 h-px bg-[var(--border)]"/>
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre completo"
              required
              className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />

          {error && <p className="text-sm text-[var(--danger)] text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-4">
          {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            className="text-[var(--accent)] font-medium hover:underline"
          >
            {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
