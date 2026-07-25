import { DISCIPLINE_CHIPS } from '../constants';

export function DisciplineStrip() {
  return (
    <div className="trust">
      <div className="container trust-row">
        {DISCIPLINE_CHIPS.map((chip) => (
          <span key={chip} className="chip">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
