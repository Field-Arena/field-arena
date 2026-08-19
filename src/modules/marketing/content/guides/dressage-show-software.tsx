import type { ReactElement } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';
import { GuideBreadcrumb } from '@/modules/marketing/content/guides/guide-breadcrumb';
import { DemoLink } from '@/modules/marketing/content/guides/demo-link';
import { CtaBand } from '@/modules/marketing/content/guides/cta-band';

export function DressageShowSoftware(): ReactElement {
  return (
    <ArticleShell
      eyebrow="Dressage"
      title="Dressage Show Software"
      subhead="The complete dressage show management platform for modern competitions."
      lede="Running a successful dressage show requires precision, organization, and coordination across hundreds of details. From entries and ride times to judges, score sheets, volunteers, and results, every part of the competition must work together."
      breadcrumb={<GuideBreadcrumb label="Dressage Show Software" />}
      ctaRow={<DemoLink>Book a demo</DemoLink>}
    >
      <article>
        <p>
          <strong>Field-Arena is the all-in-one dressage show software</strong> built to help
          organizers, show secretaries, GMOs, and equestrian organizations simplify operations and
          deliver better competitor experiences. Manage your entire dressage competition in one
          connected platform — from planning and registration through show day execution and final
          results.
        </p>

        <hr />
        <h2>What Is Dressage Show Software?</h2>
        <p>
          Dressage show software is a digital platform designed specifically to help organizations
          manage the unique requirements of dressage competitions. A modern dressage management
          system helps organize:
        </p>
        <ul>
          <li>Dressage tests</li>
          <li>Rider and horse entries</li>
          <li>Ride times</li>
          <li>Judges and officials</li>
          <li>Score sheets</li>
          <li>Results</li>
          <li>Volunteers</li>
          <li>Communication</li>
          <li>Financial reporting</li>
        </ul>
        <p>
          Instead of relying on spreadsheets, paper forms, emails, and separate systems, Field-Arena
          connects every part of your dressage show in one place.
        </p>

        <hr />
        <h2>Built for the Way Dressage Shows Actually Run</h2>
        <p>
          Dressage competitions require a high level of organization. Show managers must coordinate
          multiple levels and tests, amateur and professional competitors, junior and young riders,
          judges and scribes, ring schedules, scores and percentages, and awards and results.
        </p>
        <p>
          Field-Arena was designed around the real workflow of dressage organizations to reduce
          administrative work and improve accuracy.
        </p>

        <hr />
        <h2>Simplify Every Stage of Your Dressage Competition</h2>
        <h3>Dressage Show Setup</h3>
        <p>
          Field-Arena helps organizers build classes and divisions, organize dressage tests,
          configure fees, set competition requirements, manage documents, and prepare schedules —
          spending less time building your show and more time improving the experience.
        </p>
        <h3>Online Dressage Entries and Registration</h3>
        <p>
          Managing entries is one of the biggest administrative challenges for dressage shows.
          Field-Arena helps you manage rider entries, horse information, trainer and owner details,
          membership information, required documents, payments, stall requests, and scratches and
          changes.
        </p>
        <h3>Dressage Scheduling and Ride Times</h3>
        <p>
          Creating a balanced dressage schedule requires careful planning. Field-Arena helps
          organizers coordinate ride times, arenas, judges, divisions, class order, and schedule
          updates.
        </p>
        <h3>Dressage Scoring and Results Management</h3>
        <p>
          Accurate scoring is at the heart of every dressage competition. Field-Arena helps
          streamline dressage score sheets, test results, percentage calculations, class standings,
          final results, and awards information.
        </p>

        <hr />
        <h2>Designed for USDF GMO Organizations</h2>
        <p>
          Field-Arena supports the needs of local and regional dressage organizations. GMOs often
          rely on dedicated volunteers and small administrative teams to run successful
          competitions. Field-Arena helps GMOs reduce volunteer workload, improve communication,
          standardize processes, manage multiple shows, track organizational performance, and create
          better experiences for members.
        </p>

        <hr />
        <h2>Dressage Show Software for Every Level</h2>
        <div className="level-row">
          <span>Introductory Level</span>
          <span>Training Level – Fourth Level</span>
          <span>FEI divisions</span>
          <span>Freestyle</span>
          <span>{`Junior & Young Rider`}</span>
          <span>{`Amateur & Open`}</span>
          <span>Championship events</span>
        </div>

        <hr />
        <h2>Connect Your Entire Dressage Show Team</h2>
        <p>
          Most dressage shows rely on many people working together. Field-Arena connects show
          managers (monitoring the entire operation), show secretaries (managing entries, documents,
          schedules, and results), judges and officials (accessing the information needed to perform
          their roles), volunteers (understanding assignments and responsibilities), and vendors and
          sponsors (coordinating participation and communication).
        </p>

        <hr />
        <h2>Why Dressage Organizations Are Moving Beyond Spreadsheets</h2>
        <p>
          Traditional dressage show management often requires multiple spreadsheets, paper score
          sheets, manual emails, separate payment systems, volunteer lists, and independent
          communication tools. Field-Arena brings these disconnected processes together — resulting
          in less paperwork, less office labor, better communication, fewer mistakes, and more
          efficient competitions.
        </p>

        <hr />
        <h2>How to Choose Dressage Show Software</h2>
        <p>
          When evaluating dressage management software, look for complete show operations (does the
          platform support more than entries?), ease of use (can volunteers and staff quickly learn
          the system?), flexibility (can it support different levels, tests, and competition
          formats?), better communication (can everyone access updated information?), and long-term
          growth (can the platform support your organization as it expands?).
        </p>

        <div className="callout">
          Dressage organizations have always valued precision and professionalism. The next
          evolution is bringing that same standard to competition management.
        </div>
      </article>

      <CtaBand
        heading="Ready to modernize your dressage show?"
        body="Discover how Field-Arena can help your organization simplify administration, reduce paperwork, and run better dressage competitions."
        cta="Schedule a demo"
      />
    </ArticleShell>
  );
}
