import { WORKSPACE } from '../constants';
import { Icon } from './icon';

export function WorkspaceSection() {
  return (
    <section className="workflow" id="organizer">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Organizer workspace</span>
          <h2>One dashboard, every show.</h2>
          <p>
            See entries, horses, exhibitors, classes, rings, officials, vendors, staff, payments, and
            results at a glance.
          </p>
          <p>
            Whether you run one annual schooling show, a regional circuit, a breed association, or
            dozens of competitions each year, Field &amp; Arena keeps every event organized in one
            place.
          </p>
        </div>

        <div className="workspace-grid">
          {WORKSPACE.map((item) => (
            <article key={item.title} className="problem-card">
              <div className="problem-icon">
                <Icon name={item.icon} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
