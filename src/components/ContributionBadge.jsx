const labels = { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' };

export default function ContributionBadge({ level }) {
  const key = level || 'medium';
  return <span className={`contribution contribution--${key}`}>● {labels[key]}</span>;
}
