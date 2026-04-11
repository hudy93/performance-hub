'use client';

import ProgressRing from './ProgressRing';

export default function ScoreGauge({ score, max = 5 }) {
  const pct = (score / max) * 100;
  const color =
    pct >= 80 ? 'var(--accent)' :
    pct >= 60 ? 'var(--blue)' :
    pct >= 40 ? 'var(--warning)' :
    'var(--danger)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <ProgressRing value={pct} size={56} stroke={5} color={color} />
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          {score.toFixed(1)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>von {max}.0</div>
      </div>
    </div>
  );
}
