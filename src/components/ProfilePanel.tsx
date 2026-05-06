'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { user, profile, updateProfile, logout } = useAuth();
  const [dni, setDni] = useState(profile?.dni || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [name, setName] = useState(profile?.displayName || user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Mi perfil</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--bg-soft)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-[var(--bg-soft)]">
          <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm">
            {(name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{name || 'Sin nombre'}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
          </div>
        </div>

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
      </div>
    </div>
  );
}
