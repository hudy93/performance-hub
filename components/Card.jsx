export default function Card({ children, className = '', onClick, style }) {
  const classes = [
    'card',
    onClick && 'card--interactive',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} style={style}>
      {children}
    </div>
  );
}
