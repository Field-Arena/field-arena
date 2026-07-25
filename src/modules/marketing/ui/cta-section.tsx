export function CtaSection() {
  return (
    <section className="cta-wrap" id="demo">
      <div className="container">
        <div className="cta">
          <div>
            <span className="eyebrow" style={{ color: '#d9e7e0' }}>
              Bring your next equestrian event online
            </span>
            <h2>See how Field &amp; Arena fits your event.</h2>
            <p>
              See how Field &amp; Arena can adapt to your discipline, competition format, event size,
              and current process.
            </p>
          </div>

          <div className="cta-actions">
            <a className="btn btn-primary" href="mailto:hello@field-arena.com?subject=Book%20a%20demo">
              Book a demo
            </a>
            <a className="btn btn-secondary" href="#platform">
              Explore the platform
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
