import '@/app/coming-soon.css';

export default function ComingSoon() {
  return (
    <div className="coming-soon">
      <div className="coming-soon__glow" />
      <div className="coming-soon__content">
        <div className="coming-soon__logo">
          <span className="coming-soon__logo-icon">P</span>
        </div>
        <h1 className="coming-soon__title">
          Performance<span className="coming-soon__title-accent">Hub</span>
        </h1>
        <p className="coming-soon__subtitle">Coming Soon</p>
        <div className="coming-soon__divider" />
        <p className="coming-soon__text">
          We&apos;re building something great. Stay tuned.
        </p>
      </div>
    </div>
  );
}
