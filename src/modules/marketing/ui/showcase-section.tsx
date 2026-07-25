import Image from 'next/image';
import { SHOWCASE } from '../constants';

export function ShowcaseSection() {
  return (
    <section id="showcase">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Inside the organizer workspace</span>
          <h2>What running a show actually looks like.</h2>
          <p>
            No mockups — this is the real organizer workspace, with live demo data standing in for
            yours.
          </p>
        </div>

        <div className="showcase-grid">
          {SHOWCASE.map((item) => (
            <div key={item.title} className="showcase-card">
              <Image src={item.image} alt={item.alt} width={1440} height={900} />
              <div className="showcase-cap">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
