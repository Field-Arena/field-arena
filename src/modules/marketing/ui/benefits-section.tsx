import { BENEFIT_METRICS } from '../constants';

export function BenefitsSection() {
  return (
    <section id="results">
      <div className="container results-grid">
        <div>
          <span className="eyebrow">Benefits</span>
          <h2>Less administrative work. Faster information. More confidence.</h2>
          <p style={{ color: 'var(--fa-muted)', fontSize: '18px' }}>
            Field &amp; Arena is designed to reduce repeated data entry and give organizers a clearer
            operational picture without forcing officials, staff, volunteers, or exhibitors to learn
            a complicated enterprise system.
          </p>

          <div className="metric-stack">
            {BENEFIT_METRICS.map((metric) => (
              <div key={metric.label} className="metric">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <aside className="quote">
          <blockquote>
            “The organizer should know what is happening, the staff should know what to do, the
            official should have the correct tools, and the exhibitor should not have to wait hours
            for information.”
          </blockquote>
          <small>Field &amp; Arena product principle</small>
        </aside>
      </div>
    </section>
  );
}
