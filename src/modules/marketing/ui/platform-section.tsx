import { PLATFORM_FEATURES } from '../constants';

export function PlatformSection() {
  return (
    <section className="platform" id="platform">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">One operating system</span>
          <h2>Everything needed to plan, run, score, and close out an equestrian event.</h2>
          <p>
            Field &amp; Arena gives organizers, officials, staff, exhibitors, vendors, and volunteers
            purpose-built workspaces while keeping the underlying event data connected.
          </p>
        </div>

        <div className="platform-grid">
          {PLATFORM_FEATURES.map((feature) => (
            <article key={feature.number} className="feature">
              <div className="feature-number">{feature.number}</div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
