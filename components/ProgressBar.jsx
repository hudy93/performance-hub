export default function ProgressBar({ value, color = 'var(--accent)', height = 6 }) {
  return (
    <div className="progress-track" style={{ height }}>
      <div
        className="progress-fill"
        style={{
          width: `${Math.min(value, 100)}%`,
          background: color,
        }}
      />
    </div>
  );
}
