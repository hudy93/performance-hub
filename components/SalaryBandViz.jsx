export default function SalaryBandViz({ current, band, market, newSalary }) {
  const range = band.max - band.min;
  const pos = (v) => Math.max(0, Math.min(100, ((v - band.min) / range) * 100));

  return (
    <div className="salary-band">
      <div className="salary-band-track">
        <div className="salary-band-bg" />
        <div
          className="salary-band-range"
          style={{ left: `${pos(band.min)}%`, width: `${pos(band.max) - pos(band.min)}%` }}
        />
        <div
          className="salary-dot salary-dot--current"
          style={{ left: `${pos(current)}%` }}
          title={`Aktuell: €${current.toLocaleString('de-DE')}`}
        />
        {newSalary && (
          <div
            className="salary-dot salary-dot--recommended"
            style={{ left: `${pos(newSalary)}%` }}
            title={`Empfohlen: €${newSalary.toLocaleString('de-DE')}`}
          />
        )}
        <div className="salary-marker" style={{ left: `${pos(market)}%` }}>
          <div className="salary-marker-line" />
        </div>
      </div>

      <div className="salary-labels">
        <span>€{band.min.toLocaleString('de-DE')}</span>
        <span style={{ color: 'var(--text-muted)' }}>Mitte: €{band.mid.toLocaleString('de-DE')}</span>
        <span>€{band.max.toLocaleString('de-DE')}</span>
      </div>

      <div className="salary-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--accent)' }} /> Aktuell
        </span>
        {newSalary && (
          <span className="legend-item">
            <span className="legend-dot" style={{ background: 'var(--purple)' }} /> Empfohlen
          </span>
        )}
        <span className="legend-item">
          <span style={{ width: 2, height: 10, background: 'var(--warning)', display: 'inline-block' }} /> Markt
        </span>
      </div>
    </div>
  );
}
