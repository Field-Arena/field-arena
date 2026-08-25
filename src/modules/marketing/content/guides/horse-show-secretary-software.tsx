import type { ReactElement } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';
import { GuideBreadcrumb } from '@/modules/marketing/content/guides/guide-breadcrumb';
import { DemoLink } from '@/modules/marketing/content/guides/demo-link';
import { CtaBand } from '@/modules/marketing/content/guides/cta-band';

export function HorseShowSecretarySoftware(): ReactElement {
  return (
    <ArticleShell
      eyebrow="Show secretaries"
      title="Horse Show Secretary Software"
      subhead="Spend less time on paperwork and more time running exceptional horse shows."
      lede="Field-Arena is the all-in-one horse show secretary software built to simplify every stage of horse show management. From entries and payments to score sheets, schedules, volunteers, and results, Field-Arena helps horse show secretaries eliminate administrative bottlenecks and keep competitions running smoothly."
      breadcrumb={<GuideBreadcrumb label="Horse Show Secretary Software" />}
      ctaRow={<DemoLink>Book a personalized demo</DemoLink>}
    >
      <article>
        <p>
          Designed for dressage, hunter/jumper, eventing, combined training, western dressage, and
          breed shows, Field-Arena brings your entire show operation into one platform.
        </p>

        <hr />
        <h2>Built for the People Who Keep Horse Shows Running</h2>
        <p>
          Horse show secretaries are responsible for thousands of details before, during, and after
          every competition. Managing riders, communicating with volunteers, organizing paperwork,
          and responding to last-minute changes often means juggling multiple systems at once.
        </p>
        <p>
          Field-Arena was created to reduce office labor and replace disconnected spreadsheets,
          emails, and paper processes with one centralized platform.
        </p>

        <hr />
        <h2>Everything a Horse Show Secretary Needs in One Place</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h4>Show Setup</h4>
            <ul>
              <li>Build divisions, classes, and schedules</li>
              <li>Create rings and assign judges</li>
              <li>Upload prize lists and documents</li>
              <li>Configure fees and entry requirements</li>
            </ul>
          </div>
          <div className="feature-card">
            <h4>Entries and Registration</h4>
            <ul>
              <li>Accept online entries and payments</li>
              <li>Track waitlists and stall requests</li>
              <li>Verify memberships and required documents</li>
              <li>Manage scratches and substitutions</li>
            </ul>
          </div>
          <div className="feature-card">
            <h4>Office Management</h4>
            <ul>
              <li>Store competitor information in one location</li>
              <li>Coordinate office staff and volunteers</li>
              <li>Track important deadlines</li>
              <li>Access reports and administrative tools</li>
            </ul>
          </div>
          <div className="feature-card">
            <h4>Scoring and Results</h4>
            <ul>
              <li>Manage digital score sheets</li>
              <li>Publish scores and results in real time</li>
              <li>Track placings and championship standings</li>
              <li>Reduce scoring errors and paperwork</li>
            </ul>
          </div>
        </div>
        <div className="feature-card">
          <h4>Communication</h4>
          <ul>
            <li>Send updates to riders, staff, and volunteers</li>
            <li>Share schedule changes instantly</li>
            <li>Keep vendors and sponsors informed</li>
            <li>Eliminate long email chains</li>
          </ul>
        </div>

        <hr />
        <h2>Replace Spreadsheets, Paper Forms, and Last-Minute Chaos</h2>
        <p>
          Most horse show offices still rely on a combination of paper score sheets, spreadsheets,
          emails, text messages, and multiple software systems. Field-Arena gives horse show
          secretaries one place to manage:
        </p>
        <ul>
          <li>Horse show entries</li>
          <li>Payments and fees</li>
          <li>Competitor documents</li>
          <li>Volunteers and staff</li>
          <li>Vendors and sponsors</li>
          <li>Schedules and ride times</li>
          <li>Results and reporting</li>
          <li>Communications</li>
        </ul>

        <hr />
        <h2>Designed for Every Discipline</h2>
        <p>
          {`Field-Arena supports dressage competitions, hunter/jumper shows, eventing competitions, combined training events, western dressage shows, breed and schooling shows, USDF GMO competitions, and USEF-recognized events. Whether you're organizing a local schooling show or managing a regional championship, Field-Arena scales with your organization.`}
        </p>

        <hr />
        <h2>Why Horse Show Secretaries Choose Field-Arena</h2>
        <h3>Reduce Administrative Work</h3>
        <p>
          Spend less time chasing paperwork and more time focusing on competitors and event quality.
        </p>
        <h3>Keep Your Entire Team Connected</h3>
        <p>Bring office staff, volunteers, vendors, sponsors, and organizers into one platform.</p>
        <h3>Prepare Faster</h3>
        <p>Set up classes, schedules, and documentation in a fraction of the time.</p>
        <h3>Manage Show Weekend With Confidence</h3>
        <p>
          Handle scratches, schedule updates, scoring, and communication from a single dashboard.
        </p>

        <hr />
        <h2>Frequently Asked Questions</h2>
        <div className="faq">
          <h3>Who is Field-Arena built for?</h3>
          <p>
            Field-Arena was designed for horse show secretaries, show managers, equestrian
            organizations, USDF GMOs, and competition boards.
          </p>
        </div>
        <div className="faq">
          <h3>Can Field-Arena replace our current systems?</h3>
          <p>
            Field-Arena is designed to consolidate the software, spreadsheets, and manual processes
            that many horse shows rely on today.
          </p>
        </div>
        <div className="faq">
          <h3>Does the platform support volunteers and vendors?</h3>
          <p>
            Yes. Volunteers, vendors, sponsors, office staff, and organizers all have role-specific
            access and tools.
          </p>
        </div>
        <div className="faq">
          <h3>Is Field-Arena only for dressage?</h3>
          <p>
            No. Field-Arena supports dressage, hunter/jumper, eventing, combined training, western
            dressage, and breed shows.
          </p>
        </div>

        <div className="callout">
          Discover how Field-Arena can reduce paperwork, streamline operations, and support every
          member of your team.
        </div>
      </article>

      <CtaBand
        heading="Ready to simplify your horse show office?"
        body="Schedule a demo and see why horse show secretaries are moving toward a fully connected horse show management platform."
        cta="Schedule a demo"
      />
    </ArticleShell>
  );
}
