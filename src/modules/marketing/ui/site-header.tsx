import Link from 'next/link';
import { NAV_LINKS } from '../constants';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav">
        <a className="brand" href="#top" aria-label="Field and Arena home">
          <span className="brand-mark">
            <span>
              F<span style={{ color: '#fff' }}>&amp;</span>A
            </span>
          </span>
          <span>Field &amp; Arena</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <Link className="btn btn-secondary" href="/login">
            Log in
          </Link>
          <a className="btn btn-primary" href="#demo">
            Book a demo
          </a>
        </div>
      </div>
    </header>
  );
}
