import type { ReactElement } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';
import { GuideBreadcrumb } from '@/modules/marketing/content/guides/guide-breadcrumb';
import { DemoLink } from '@/modules/marketing/content/guides/demo-link';
import { CtaBand } from '@/modules/marketing/content/guides/cta-band';

export function RegistrationToResultsSoftware(): ReactElement {
  return (
    <ArticleShell
      eyebrow="Overview"
      title="Horse Show Registration to Results Software: The Complete Turnkey System for Managing Equestrian Competitions"
      subhead="From registration to results — Field-Arena connects every step of your horse show operation."
      lede="Running a successful horse show requires hundreds of details to come together seamlessly. Before competitors ever enter the arena, your team has already managed event creation, entries, horse and rider information, class registrations, payments, scheduling, judge coordination, scoring, results, awards, and communication."
      breadcrumb={<GuideBreadcrumb label="Registration to Results Software" />}
      ctaRow={<DemoLink>Schedule a demo</DemoLink>}
    >
      <article>
        <p>
          Many horse show offices still manage these processes through disconnected spreadsheets,
          paper forms, email threads, and separate scoring systems. While these methods may work for
          smaller events, they create significant administrative burdens as competitions grow.
        </p>
        <p>
          <strong>
            Field-Arena is a complete horse show office software solution that connects your entire
            competition workflow
          </strong>{' '}
          — from the first registration to the final results. One system. One workflow. One complete
          horse show operation.
        </p>

        <hr />
        <h2>The Problem: Horse Shows Are Managed Across Too Many Systems</h2>
        <p>
          A modern horse show office often relies on multiple disconnected tools: registration
          platforms, spreadsheets, payment systems, scheduling documents, score sheets, result
          spreadsheets, and email communication.
        </p>
        <p>
          Each separate system creates additional work. Information has to be entered multiple times,
          checked for accuracy, updated manually, shared between teams, and reconciled after changes.
        </p>
        <p>
          Without an integrated horse show management system, organizers can spend significantly more
          time on manual tasks — often requiring approximately 40% more administrative effort
          compared to a connected workflow. Field-Arena eliminates many of these duplicate processes
          by keeping your show data connected from start to finish.
        </p>

        <hr />
        <h2>A Complete Horse Show Office Software System</h2>
        <p>
          Field-Arena is designed as a turnkey horse show office solution that manages the entire
          competition lifecycle. From the moment a competitor registers until final results are
          published, every step stays connected.
        </p>
        <div className="flow">
          <span>Registration</span>
          <i>→</i>
          <span>{`Horse & Rider Management`}</span>
          <i>→</i>
          <span>Class Management</span>
          <i>→</i>
          <span>Scheduling</span>
          <i>→</i>
          <span>Competition Execution</span>
          <i>→</i>
          <span>Scoring</span>
          <i>→</i>
          <span>Results</span>
          <i>→</i>
          <span>{`Awards & Reporting`}</span>
        </div>
        <p>No more moving information between disconnected systems.</p>

        <hr />
        <h2>1. Streamlined Horse Show Registration</h2>
        <p>
          Registration is the foundation of every competition. Field-Arena helps organizers manage
          rider information, horse information, owner and trainer details, class selections, entry
          requirements, and payments and confirmations. Instead of manually transferring registration
          information into multiple documents, your show office starts with organized, accurate data.
        </p>

        <h2>2. Complete Horse and Rider Management</h2>
        <p>
          Equestrian events have unique requirements that traditional event software does not
          understand. Field-Arena keeps horse records, rider records, trainer relationships, classes
          entered, and competition history connected — your team has the information they need when
          they need it.
        </p>

        <h2>3. Class and Competition Management</h2>
        <p>
          {`Every horse show has a unique structure. Field-Arena helps organizers manage divisions, classes, levels, competition formats, and entry requirements — whether you're running a dressage show, hunter/jumper competition, eventing competition, or schooling show.`}
        </p>

        <h2>4. Scheduling Without the Administrative Chaos</h2>
        <p>
          Scheduling a horse show requires balancing classes, competitors, rings, judges, and timing.
          When changes happen, your team can work from a connected system instead of updating multiple
          spreadsheets.
        </p>

        <h2>5. Integrated Scoring and Results Management</h2>
        <p>
          The competition does not end when the final rider enters the ring. Field-Arena connects
          competition scoring and results management directly into the show workflow — scores,
          placings, rankings, final results, and awards information. Because registration data,
          competition data, and scoring information are connected, organizers spend less time manually
          compiling results.
        </p>

        <hr />
        <h2>Why Integrated Scoring Matters</h2>
        <p>
          Many horse shows rely on separate processes: registration system → spreadsheet → score
          sheets → results spreadsheet → published results. Every handoff creates opportunities for
          data entry errors, missing information, delays, and reconciliation work.
        </p>
        <p>
          Field-Arena creates one continuous workflow: registration → competition → scores → results.
          The information follows the event.
        </p>

        <hr />
        <h2>The Hidden Cost of Manual Horse Show Administration</h2>
        <p>
          Manual administration does not just consume time. It creates additional operational costs —
          duplicate data entry, increased risk of mistakes, longer show office hours, and slower
          results. Field-Arena helps reduce these challenges by connecting the entire horse show
          office.
        </p>

        <hr />
        <h2>Built for Horse Show Secretaries and Organizers</h2>
        <p>
          Field-Arena was designed around the real workflow of competition management. It helps horse
          show secretaries spend less time managing paperwork and more time running the event, show
          managers gain visibility across every part of competition operations, facilities create
          repeatable systems for hosting more events, and associations improve consistency across
          competitions.
        </p>

        <div className="callout">
          Field-Arena is more than registration software. It is more than scoring software. It is more
          than a results platform. It is a complete horse show office management system designed to
          connect every stage of competition — from the first entry to the final score, giving your
          team one reliable source of truth.
        </div>
      </article>

      <CtaBand
        heading="Ready to transform your horse show office?"
        body="See how Field-Arena can take your competition from registration to results with one complete, turnkey horse show management system."
        cta="Schedule your Field-Arena demo"
      />
    </ArticleShell>
  );
}
