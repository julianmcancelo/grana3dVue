'use client';

import { useEffect, useState } from 'react';

export default function MLCallbackPage() {
  const [status, setStatus] = useState('loading');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setStatus('error');
      setError('No se recibió código de autorización. Verificá que la app de ML tenga el redirect URI correcto.');
      return;
    }

    fetch('/api/ml-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          setToken(data.access_token);
          setStatus('success');
        } else {
          setStatus('error');
          setError(data.error || 'Error al obtener token');
        }
      })
      .catch(() => {
        setStatus('error');
        setError('Error de conexión');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-soft)] flex items-center justify-center p-4">
      <div className="bg-white border border-[var(--border)] rounded-2xl p-8 max-w-md w-full shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#FFE600] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m0 0V3.375M9.75 10.875V3.375m0 7.5h3.375m0 0h3.375m0 0V3.375M9.75 16.875V10.875m0 6h3.375m0 0h3.375m0 0v-3.375"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">Mercado Libre</h1>
        </div>

        {status === 'loading' && (
          <div className="text-center py-8">
            <svg className="animate-spin w-8 h-8 text-[#FFE600] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-sm text-[var(--text-muted)]">Obteniendo token de acceso...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="p-3 rounded-xl bg-[var(--success-soft)] border border-[var(--success-border)] mb-4">
              <p className="text-sm font-medium text-[var(--success)]">Token obtenido exitosamente!</p>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-2">Copiá este token para importar productos:</p>
            <div className="relative">
              <textarea
                readOnly
                value={token}
                className="w-full h-24 p-3 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] text-xs font-mono text-[var(--text)] resize-none focus:outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(token)}
                className="absolute top-2 right-2 px-3 py-1 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                Copiar
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <a href="/admin" className="flex-1 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-medium text-center hover:bg-[var(--accent-hover)] transition-colors">
                Ir al admin
              </a>
              <a href="/tienda" className="flex-1 py-2.5 rounded-full border border-[var(--border)] text-sm font-medium text-center hover:bg-[var(--bg-soft)] transition-colors">
                Ver tienda
              </a>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="p-3 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger-border)] mb-4">
              <p className="text-sm font-medium text-[var(--danger)]">Error</p>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">{error}</p>
            <div className="space-y-2 text-xs text-[var(--text-muted)]">
              <p><strong>Verificá:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>El redirect URI en ML sea exactamente <code className="bg-[var(--bg-soft)] px-1 rounded">https://www.grana3d.com.ar</code></li>
                <li>Tengas permisos de "Publicación y sincronización" en Lectura</li>
                <li>El client secret esté configurado en las variables de Vercel</li>
              </ul>
            </div>
            <a href="/admin" className="mt-4 block py-2.5 rounded-full border border-[var(--border)] text-sm font-medium text-center hover:bg-[var(--bg-soft)] transition-colors">
              Volver al admin
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
