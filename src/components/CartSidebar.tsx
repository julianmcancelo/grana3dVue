'use client';

import { useCart } from '@/hooks/useCart';

export default function CartSidebar() {
  const { items, isOpen, close, remove, updateQty, subtotal } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={close} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text)]">Tu carrito</h2>
          <button onClick={close} className="p-2 rounded-full hover:bg-[var(--bg-soft)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-[var(--text-muted)]/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
              </svg>
              <p className="text-[var(--text-secondary)] font-medium">Carrito vacío</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Agregá productos para empezar</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.product.id} className="flex gap-3 p-3 rounded-xl bg-[var(--bg-soft)]">
                <div className="w-20 h-20 rounded-lg bg-[var(--bg-muted)] overflow-hidden flex-shrink-0">
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--text-muted)]/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-[var(--text)] truncate">{item.product.name}</h3>
                  <p className="text-[var(--accent)] font-bold mt-1">${(item.product.price * item.quantity).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-white transition-colors text-sm"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-white transition-colors text-sm disabled:opacity-40"
                    >
                      +
                    </button>
                    <button
                      onClick={() => remove(item.product.id)}
                      className="ml-auto p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-[var(--border)] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Subtotal</span>
              <span className="text-xl font-bold text-[var(--text)]">${subtotal.toLocaleString()}</span>
            </div>
            <a
              href="/checkout"
              className="block w-full py-3 rounded-full bg-[var(--accent)] text-white font-semibold text-center hover:bg-[var(--accent-hover)] transition-colors"
            >
              Ir a pagar
            </a>
          </div>
        )}
      </div>
    </>
  );
}
