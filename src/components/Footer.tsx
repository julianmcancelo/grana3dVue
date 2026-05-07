export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo-grana3d.png" alt="Grana 3D" className="h-6 w-auto"/>
            <div>
              <span className="text-sm font-bold text-[var(--text)]">Grana</span>
              <span className="text-sm font-light text-[var(--text-secondary)] ml-0.5">3D</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/juliancancelo/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
            <a
              href="https://www.juliancancelo.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.995 8.995 0 017.843 4.582M12 3a8.995 8.995 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.999 0-5.732-1.148-7.764-3.03m15.528 0A8.962 8.962 0 0012 3c-2.572 0-4.924.99-6.664 2.596"/>
              </svg>
              Portfolio
            </a>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-4">
          Desarrollado por Julian Cancelo © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
