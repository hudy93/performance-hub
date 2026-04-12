export const metadata = { title: 'Impressum — PerformanceHub' };

export default function Impressum() {
  return (
    <div className="app-shell" style={{ maxWidth: 640, paddingTop: 48, paddingBottom: 64 }}>
      <a href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>← Zurück</a>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text)', margin: '24px 0 32px' }}>
        Impressum
      </h1>

      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>Angaben gemäß § 5 TMG</h2>
        <p>
          Marcel Hudy<br />
          Rumfordstraße 25<br />
          80469 München
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '24px 0 8px' }}>Kontakt</h2>
        <p>
          E-Mail: info@hudy.tech
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '24px 0 8px' }}>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>
          Marcel Hudy<br />
          Rumfordstraße 25<br />
          80469 München
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '24px 0 8px' }}>Haftungsausschluss</h2>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '16px 0 4px' }}>Haftung für Inhalte</h3>
        <p>
          Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
        </p>

        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '16px 0 4px' }}>Haftung für Links</h3>
        <p>
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
        </p>
      </div>
    </div>
  );
}
