import Image from 'next/image';
import { HERO_NOTES } from '../constants';

export function HeroSection() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Horse shows, finally connected</span>
          <h1>Run your entire equestrian event from one modern platform.</h1>
          <p>
            Field &amp; Arena connects entries, payments, scheduling, officials, show-day operations,
            scoring, results, vendors, volunteers, and communication in one system built for
            equestrian competition.
          </p>
          <p>
            From dressage and Western dressage to hunter/jumper, eventing, Quarter Horse, breed
            shows, and multi-discipline events, Field &amp; Arena adapts to the way your shows
            actually run.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary" href="#demo">
              See it in action
            </a>
            <a className="btn btn-secondary" href="#platform">
              Explore the platform
            </a>
          </div>

          <div className="hero-note">
            {HERO_NOTES.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
        </div>

        <div
          className="product-stage live-product-stage"
          aria-label="Live organizer dashboard preview"
        >
          <div className="live-browser">
            <div className="live-browser-bar">
              <span className="browser-dots">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span className="browser-address">Field &amp; Arena · Live Show Operations</span>
              <span className="live-label">
                <b></b> LIVE
              </span>
            </div>
            <div className="live-frame-wrap">
              <Image
                src="/screenshots/organizer-dashboard.png"
                alt="Field and Arena organizer dashboard with live show stats and revenue"
                width={1440}
                height={900}
                priority
              />
            </div>
          </div>
          <div className="float-card float-one">
            Live show control<small>Arenas, rides, scratches, and staffing</small>
          </div>
          <div className="float-card float-two">
            One connected workflow<small>Organizer through published results</small>
          </div>
        </div>
      </div>
    </section>
  );
}
