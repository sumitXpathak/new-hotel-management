import { BRAND } from '../lib';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <section className="auth-art">
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
        <div className="auth-art-inner">
          <h1 className="wordmark">{BRAND}.</h1>
          <p>Rooms, guests and bookings, all in one front desk.</p>
          <ul>
            <li>See who arrives and leaves today</li>
            <li>Book only rooms that are really free</li>
            <li>Track revenue as guests check out</li>
          </ul>
        </div>
      </section>
      <section className="auth-form">
        <div className="auth-card">
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth-foot">{footer}</p>
        </div>
      </section>
    </div>
  );
}
