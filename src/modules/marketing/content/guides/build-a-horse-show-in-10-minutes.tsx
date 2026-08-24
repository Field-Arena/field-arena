import type { ReactElement } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';
import { GuideBreadcrumb } from '@/modules/marketing/content/guides/guide-breadcrumb';
import { DemoLink } from '@/modules/marketing/content/guides/demo-link';
import { CtaBand } from '@/modules/marketing/content/guides/cta-band';

export function BuildAHorseShowIn10Minutes(): ReactElement {
  return (
    <ArticleShell
      eyebrow="Getting started"
      title="How to Build a Horse Show in 10 Minutes: The Fastest Way to Create and Manage Your Next Equestrian Event"
      subhead="Create your horse show faster with modern event management software."
      lede="Building a horse show has traditionally required hours of administrative work. Organizers often spend days creating spreadsheets, setting up classes, managing entry forms, coordinating schedules, preparing documents, and communicating updates. What if you could create the foundation of your horse show in minutes instead?"
      breadcrumb={<GuideBreadcrumb label="How to Build a Horse Show in 10 Minutes" />}
      ctaRow={<DemoLink>Build your horse show demo</DemoLink>}
    >
      <article>
        <p>
          <strong>
            Field-Arena makes it possible to build a complete horse show setup in as little as 10
            minutes
          </strong>{' '}
          — giving organizers a faster, simpler way to create, manage, and operate equestrian
          competitions. Whether you are running a schooling show, recognized competition, dressage
          show, hunter/jumper event, combined training, or regional championship, Field-Arena helps
          you move from planning to execution faster.
        </p>

        <hr />
        <h2>What Does It Mean to Build a Horse Show in 10 Minutes?</h2>
        <p>
          Creating a horse show involves more than choosing a date. A complete event setup typically
          includes event information, competition format, classes and divisions, entry requirements,
          rider information, horse information, scheduling structure, scoring requirements, and
          communication tools.
        </p>
        <p>
          Traditional methods require organizers to build these pieces manually across multiple
          documents. Field-Arena simplifies this process by putting your entire event structure into
          one connected platform.
        </p>

        <hr />
        <h2>The Five-Step Setup</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-body">
              <h3>Create Your Horse Show Event</h3>
              <p>
                Start by entering the basic details of your competition: event name, show dates,
                location, competition type, organizer information, and contact details. Your event
                foundation is created instantly.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-body">
              <h3>Add Your Competition Classes</h3>
              <p>
                {`Every horse show has its own unique structure. Field-Arena allows organizers to build their competition format with divisions, classes, levels, categories, and entry options — whether you're organizing dressage tests, hunter classes, jumper rounds, equitation divisions, combined training, or eventing phases.`}
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-body">
              <h3>Set Up Your Registration Process</h3>
              <p>
                Stop building manual entry spreadsheets. Manage competitor information, horse
                details, trainer information, class selections, and entry requirements — giving
                competitors a simpler way to participate while reducing administrative work for your
                show office.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-body">
              <h3>Prepare Your Schedule</h3>
              <p>
                Scheduling is one of the hardest parts of managing a horse show. Field-Arena helps
                organizers coordinate classes, rings, judges, competitors, and timing — creating a
                more organized schedule without rebuilding documents every time changes occur.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">5</div>
            <div className="step-body">
              <h3>Connect Scoring and Results</h3>
              <p>
                A successful horse show ends with accurate results. Field-Arena helps organize
                scores, placings, results, and awards information — so your competition information
                stays connected from entry through final results.
              </p>
            </div>
          </div>
        </div>

        <hr />
        <h2>Why Horse Show Organizers Are Moving Away From Spreadsheets</h2>
        <p>
          For years, horse shows have been managed through Excel files, paper forms, email chains,
          shared documents, and manual calculations. These methods create real challenges: lost time
          (hours spent copying information between systems), increased errors (manual entry creates
          mistakes that affect competitors), communication problems (updates become difficult when
          information is spread across multiple places), and difficult scaling (a system that works
          for 50 entries may fail at 500).
        </p>
        <p>Field-Arena helps organizers build a professional foundation from the beginning.</p>

        <hr />
        <h2>Who Can Build a Horse Show With Field-Arena?</h2>
        <h3>Horse Show Managers</h3>
        <p>Create organized events faster and reduce administrative burden.</p>
        <h3>Horse Show Secretaries</h3>
        <p>Simplify preparation, entries, and results management.</p>
        <h3>Riding Facilities</h3>
        <p>Turn your facility into a more efficient competition venue.</p>
        <h3>Associations and Organizations</h3>
        <p>Create consistent event workflows across multiple shows.</p>
        <h3>New Event Organizers</h3>
        <p>Start with a professional system instead of reinventing the process.</p>

        <hr />
        <h2>The Traditional Setup Timeline vs. the Field-Arena Process</h2>
        <div className="timeline">
          <div className="timeline-card">
            <h4>Traditional process</h4>
            <p>
              <strong>Week 1:</strong> Create spreadsheets, build class lists, organize documents.
              <br />
              <strong>Week 2:</strong> Manage registrations, correct errors, update information.
              <br />
              <strong>Week 3:</strong> Prepare schedules, coordinate staff.
              <br />
              <strong>Competition week:</strong> Manage constant changes.
            </p>
          </div>
          <div className="timeline-card gold">
            <h4>The Field-Arena process</h4>
            <p>
              <strong>Minutes:</strong> Create event, add classes, set up competition structure,
              begin managing entries.
            </p>
          </div>
        </div>
        <p>
          The goal is not just speed. The goal is creating a better system for running the entire
          competition.
        </p>

        <hr />
        <h2>Why Speed Matters in Horse Show Management</h2>
        <p>
          Organizers are often volunteers, small business owners, facility managers, or busy
          professionals. Their time is valuable. Every hour saved on administration is an hour that
          can be spent improving competitor experience, facility preparation, sponsorship
          opportunities, staff coordination, and event quality.
        </p>

        <div className="callout">
          Organizers should not have to choose between professional results, efficient operations,
          and more time. Field-Arena brings the tools together.
        </div>
      </article>

      <CtaBand
        heading="Ready to build your horse show in 10 minutes?"
        body="Create your event faster. Manage your competition smarter. Deliver a better experience for riders, trainers, officials, and spectators."
        cta="Start your demo"
      />
    </ArticleShell>
  );
}
