import { DISCIPLINES } from '../constants';
import { Icon } from './icon';

export function DisciplinesSection() {
  return (
    <section id="disciplines">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Built for different disciplines</span>
          <h2>One platform. Different ways to compete.</h2>
          <p>
            Field &amp; Arena supports the shared operational needs of equestrian events while
            allowing each discipline to retain its own class structures, terminology, rules, and
            scoring workflows.
          </p>
        </div>

        <div className="discipline-grid roles-grid">
          {DISCIPLINES.map((discipline) => (
            <article key={discipline.title} className="role-card">
              <div className="role-icon">
                <Icon name={discipline.icon} />
              </div>
              <div>
                <h3>{discipline.title}</h3>
                <p>{discipline.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
