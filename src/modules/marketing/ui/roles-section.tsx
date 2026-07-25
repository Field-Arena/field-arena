import { ROLES } from '../constants';
import { Icon } from './icon';

export function RolesSection() {
  return (
    <section id="roles">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Designed around real roles</span>
          <h2>One platform, with the right workspace for each person.</h2>
        </div>

        <div className="roles-grid">
          {ROLES.map((role) => (
            <article key={role.title} className="role-card">
              <div className="role-icon">
                <Icon name={role.icon} />
              </div>
              <div>
                <h3>{role.title}</h3>
                <p>{role.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
