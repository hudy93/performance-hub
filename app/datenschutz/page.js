import Link from 'next/link';

export const metadata = { title: 'Datenschutzerklärung — PerformanceHub' };

export default function Datenschutz() {
  return (
    <div className="app-shell" style={{ maxWidth: 640, paddingTop: 48, paddingBottom: 64 }}>
      <Link href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>← Zurück</Link>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text)', margin: '24px 0 32px' }}>
        Datenschutzerklärung
      </h1>

      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>1. Verantwortlicher</h2>
        <p>
          Marcel Hudy<br />
          Rumfordstraße 25<br />
          80469 München<br />
          E-Mail: info@hudy.tech
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '24px 0 8px' }}>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
        <p>
          Bei der Nutzung von PerformanceHub werden folgende personenbezogene Daten erhoben und verarbeitet:
        </p>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '16px 0 4px' }}>2.1 GitHub-Authentifizierung</h3>
        <p>
          Die Anmeldung erfolgt ausschließlich über GitHub OAuth. Dabei werden folgende Daten von GitHub übermittelt und gespeichert:
        </p>
        <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
          <li>Name (GitHub-Profilname)</li>
          <li>E-Mail-Adresse (GitHub-E-Mail)</li>
          <li>Profilbild-URL</li>
          <li>GitHub-Benutzer-ID</li>
          <li>OAuth-Zugriffstoken (für die GitHub-API-Integration)</li>
        </ul>
        <p>
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) — die Daten sind für die Bereitstellung des Dienstes erforderlich.
        </p>

        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '16px 0 4px' }}>2.2 Nutzungsdaten</h3>
        <p>
          Im Rahmen der Nutzung der Anwendung speichern Sie selbst folgende Daten:
        </p>
        <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
          <li>Mitarbeiterdaten (Namen, Rollen, Gehaltsinformationen, Leistungsbewertungen)</li>
          <li>Ziele und Kompetenzbewertungen</li>
          <li>GitHub-Aktivitätsdaten (Pull Requests, Reviews — abgerufen über die GitHub-API mit Ihrem Token)</li>
          <li>Einstellungen (Budget, GitHub-Organisation)</li>
        </ul>
        <p>
          Diese Daten werden ausschließlich in Ihrem isolierten Benutzerbereich gespeichert. Andere Nutzer haben keinen Zugriff auf Ihre Daten.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '24px 0 8px' }}>3. Datenspeicherung</h2>
        <p>
          Alle Daten werden in einer PostgreSQL-Datenbank gespeichert, die von Neon (neon.tech) in der EU (Frankfurt, Deutschland) gehostet wird. Die Anwendung wird über Vercel (vercel.com) bereitgestellt.
        </p>
        <p>
          Auftragsverarbeiter:
        </p>
        <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
          <li><strong>Vercel Inc.</strong> — Hosting der Webanwendung (USA, EU-Standardvertragsklauseln)</li>
          <li><strong>Neon Inc.</strong> — Hosting der Datenbank (EU-Region Frankfurt)</li>
          <li><strong>GitHub Inc.</strong> — Authentifizierung und API-Zugriff (USA, EU-Standardvertragsklauseln)</li>
        </ul>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '24px 0 8px' }}>4. Cookies</h2>
        <p>
          PerformanceHub verwendet ausschließlich technisch notwendige Cookies für die Authentifizierung (Session-Cookie). Es werden keine Tracking-, Analyse- oder Werbe-Cookies eingesetzt. Eine Einwilligung ist für technisch notwendige Cookies nach § 25 Abs. 2 TDDDG nicht erforderlich.
        </p>
        <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
          <li><strong>authjs.session-token</strong> — Authentifizierungs-Session (verschlüsseltes JWT, httpOnly, secure)</li>
        </ul>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '24px 0 8px' }}>5. Ihre Rechte</h2>
        <p>
          Sie haben gemäß DSGVO folgende Rechte:
        </p>
        <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
          <li><strong>Auskunft</strong> (Art. 15 DSGVO) — Welche Daten über Sie gespeichert sind</li>
          <li><strong>Berichtigung</strong> (Art. 16 DSGVO) — Korrektur unrichtiger Daten</li>
          <li><strong>Löschung</strong> (Art. 17 DSGVO) — Löschung Ihrer Daten und Ihres Kontos</li>
          <li><strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)</li>
          <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
          <li><strong>Widerspruch</strong> (Art. 21 DSGVO)</li>
        </ul>
        <p>
          Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: info@hudy.tech
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '24px 0 8px' }}>6. Datenlöschung</h2>
        <p>
          Sie können Ihr Konto und alle damit verbundenen Daten jederzeit löschen lassen, indem Sie uns per E-Mail kontaktieren. Bei Widerruf der GitHub-OAuth-Berechtigung wird der Zugriff auf Ihr Konto automatisch gesperrt.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '24px 0 8px' }}>7. Keine Analyse- oder Tracking-Dienste</h2>
        <p>
          PerformanceHub setzt keine Analyse-Tools (wie Google Analytics), keine Tracking-Pixel und keine Social-Media-Plugins ein. Es findet kein Profiling statt.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '24px 0 8px' }}>8. Änderungen</h2>
        <p>
          Diese Datenschutzerklärung kann bei Bedarf aktualisiert werden. Die aktuelle Version ist stets unter dieser URL abrufbar.
        </p>

        <p style={{ marginTop: 32, color: 'var(--text-dim)', fontSize: 12 }}>
          Stand: April 2026
        </p>
      </div>
    </div>
  );
}
