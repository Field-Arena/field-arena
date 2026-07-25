import Link from 'next/link';
import { FOOTER_COLUMNS } from '../constants';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <a className="brand" href="#top">
              <span className="brand-mark">
                <span>
                  F<span style={{ color: '#fff' }}>&amp;</span>A
                </span>
              </span>
              <span>Field &amp; Arena</span>
            </a>
            <p style={{ marginTop: '16px' }}>
              Modern infrastructure for planning, operating, scoring, and growing equestrian
              competitions across disciplines.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4>{column.heading}</h4>
              {column.links.map((link) =>
                link.href.startsWith('/') ? (
                  <Link key={link.label} href={link.href}>
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href}>
                    {link.label}
                  </a>
                ),
              )}
            </div>
          ))}
        </div>

        <div className="copyright">© 2026 Field &amp; Arena. All rights reserved.</div>
      </div>
    </footer>
  );
}
