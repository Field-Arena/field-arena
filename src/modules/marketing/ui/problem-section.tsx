import { PROBLEMS } from '../constants';
import { Icon } from './icon';

export function ProblemSection() {
  return (
    <section>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">The problem</span>
          <h2>Replace disconnected show management with one live platform.</h2>
          <p>
            Every equestrian discipline has its own rules, terminology, class structures, and scoring
            methods. But organizers across the sport face many of the same operational problems:
            scattered entries, complicated schedules, manual calculations, last-minute changes,
            delayed results, and too many separate systems.
          </p>
          <p>
            Field &amp; Arena gives every person the right information at the right time—from
            registration through final results.
          </p>
        </div>

        <div className="problem-grid">
          {PROBLEMS.map((problem) => (
            <article key={problem.title} className="problem-card">
              <div className="problem-icon">
                <Icon name={problem.icon} />
              </div>
              <h3>{problem.title}</h3>
              <p>{problem.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
