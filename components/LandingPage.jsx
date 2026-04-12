'use client';

import { signIn } from 'next-auth/react';

export default function LandingPage() {
  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
          <div className="header-logo">◆</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: 'var(--text)', margin: 0 }}>
            PerformanceHub
          </h1>
        </div>

        <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 40 }}>
          Performance-Management für Engineering-Teams. Kompetenzen bewerten, SMART-Ziele verwalten, GitHub-Aktivität tracken und datenbasierte Gehaltsempfehlungen berechnen.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginBottom: 48 }}>
          {[
            { icon: '◈', text: 'Kompetenz-Matrix mit Entwicklungszielen' },
            { icon: '◉', text: 'SMART-Ziele mit Markdown-Import' },
            { icon: '◎', text: 'GitHub-Aktivität automatisch synchronisieren' },
            { icon: '◇', text: 'Datenbasierte Gehaltsempfehlungen' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)', fontSize: 16 }}>{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>

        <button
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          style={{
            padding: '14px 32px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: 'var(--bg)',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseOver={(e) => { e.target.style.boxShadow = '0 0 24px var(--accent-glow)'; e.target.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none'; }}
        >
          Mit GitHub anmelden
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 16 }}>
          Deine Daten werden isoliert gespeichert. Nur du hast Zugriff.
        </p>
      </div>
    </div>
  );
}
