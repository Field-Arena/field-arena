import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';

export const GUIDE_SLUGS = [
  'horse-show-management-software',
  'equestrian-event-management-software',
  'horse-show-scoring-software',
  'build-a-horse-show-in-10-minutes',
  'eventing-and-combined-training-software',
  'registration-to-results-software',
  'horse-show-secretary-software',
  'dressage-show-software',
  'horse-show-management-software-for-usdf-gmos',
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

interface Guide {
  slug: GuideSlug;
  tag: string;
  cardTitle: string;
  cardDescription: string;
  Body: () => ReactElement;
}

const CRUMB_SEP = ' › ';

function GuideBreadcrumb({ label }: { label: string }): ReactElement {
  return (
    <>
      <Link href="/">Home</Link>
      {CRUMB_SEP}
      <Link href="/learning-center">Learning Center</Link>
      {CRUMB_SEP}
      {label}
    </>
  );
}

/**
 * Every call to action in the guides opens the demo dialog, the same as the ones
 * on the landing page. The ported version pointed at "/" — the home page — which
 * dropped a reader who had just finished a guide back at the top of the site
 * with nothing asked of them.
 *
 * `no-underline` is explicit: the prose styling in ArticleShell underlines links
 * in gold, which is right for a link inside a sentence and wrong for a button.
 */
function DemoLink({ children }: { children: ReactNode }): ReactElement {
  return (
    <DemoTrigger className="inline-flex items-center gap-2.5 rounded-[10px] bg-gold px-6 py-3.5 text-[14.5px] font-bold text-forest no-underline transition-all duration-150 hover:-translate-y-0.5 hover:bg-gold-light hover:text-forest hover:shadow-[0_12px_34px_rgba(201,162,39,.28)]">
      {children}
    </DemoTrigger>
  );
}

function CtaBand({
  heading,
  body,
  cta,
}: {
  heading: string;
  body: string;
  cta: string;
}): ReactElement {
  return (
    <section className="mt-14 rounded-[14px] border border-line-mint bg-mint px-7 py-10 text-center">
      <h2 className="mb-3 mt-0 font-[family-name:var(--font-nr)] text-[26px] font-medium text-forest">
        {heading}
      </h2>
      <p className="mx-auto mb-6 max-w-[520px] text-[15px] leading-[1.65] text-ink-lead">{body}</p>
      <DemoLink>{cta}</DemoLink>
    </section>
  );
}

/* ── 1. Horse Show Management Software ─────────────────────────────────── */
function HorseShowManagementSoftware(): ReactElement {
  return (
    <ArticleShell
      eyebrow="Overview"
      title="Horse Show Management Software: The Complete Guide to Modern Competition Operations"
      subhead="Run better horse shows with one all-in-one management platform."
      lede="Horse shows are complex operations that require hundreds of moving parts to work together. From entries and payments to schedules, scoring, volunteers, vendors, sponsors, and competitors, successful competitions depend on seamless coordination."
      breadcrumb={<GuideBreadcrumb label="Horse Show Management Software" />}
      ctaRow={<DemoLink>Book a demo</DemoLink>}
    >
      <article>
        <p>
          <strong>
            Field-Arena is the all-in-one horse show management software designed to bring every
            part of your competition into one connected platform.
          </strong>
        </p>
        <p>
          Built for horse show organizers, show secretaries, equestrian associations, GMOs, and
          competition managers, Field-Arena helps reduce paperwork, eliminate disconnected systems,
          and simplify the entire show lifecycle.
        </p>

        <hr />
        <h2>What Is Horse Show Management Software?</h2>
        <p>
          Horse show management software is a digital platform designed to help organizations plan,
          operate, and manage equestrian competitions from start to finish.
        </p>
        <p>Traditional horse show operations often require multiple tools:</p>
        <ul>
          <li>Spreadsheets for entries and schedules</li>
          <li>Email chains for communication</li>
          <li>Paper forms and score sheets</li>
          <li>Separate payment systems</li>
          <li>Manual volunteer coordination</li>
          <li>Independent vendor and sponsor tracking</li>
        </ul>
        <p>
          Horse show management software combines these processes into one centralized system.
          Instead of managing dozens of disconnected tasks, organizers have one place to coordinate
          their entire event.
        </p>

        <hr />
        <h2>Why Horse Shows Need Modern Management Software</h2>
        <p>
          Running a horse show involves more than creating a schedule and accepting entries.
          Organizers must coordinate riders and horses, trainers and owners, judges and officials,
          volunteers, vendors, sponsors, office staff, facility teams, and governing organizations.
        </p>
        <p>
          As competitions grow, manual processes become harder to manage. The biggest challenges
          organizers face include too much paperwork, too many spreadsheets, repetitive
          administrative work, communication breakdowns, difficulty tracking changes, and limited
          visibility into financial performance. Field-Arena was built to solve these challenges.
        </p>

        <hr />
        <h2>The Complete Horse Show Management Solution</h2>

        <h3>1. Show Setup and Planning</h3>
        <p>
          Every successful competition starts with organized preparation. Field-Arena helps
          organizers create shows, build divisions and classes, configure fees, manage schedules,
          organize documents, and prepare competition details — spending less time on setup and
          more time improving the competitor experience.
        </p>

        <h3>2. Online Entries and Registration</h3>
        <p>
          Entry management is one of the most time-consuming parts of running a horse show.
          Field-Arena helps manage online registrations, entry payments, stall requests, waitlists,
          required documents, membership information, and scratches and changes — reducing manual
          entry work and giving competitors a smoother registration experience.
        </p>

        <h3>3. Horse Show Scheduling</h3>
        <p>
          Creating a competition schedule requires balancing multiple divisions, ring availability,
          judge availability, rider conflicts, and timing requirements. Field-Arena helps organizers
          create and manage schedules while keeping the entire team informed.
        </p>

        <h3>4. Digital Scoring and Results</h3>
        <p>
          Accurate scoring is critical to every competition. Field-Arena supports modern scoring
          workflows by helping organizations manage score sheets, track results, publish standings,
          reduce manual errors, and improve communication — whether you manage dressage tests,
          hunter rounds, jumper classes, or eventing scores.
        </p>

        <h3>5. Volunteer Management</h3>
        <p>
          Volunteers are the foundation of many horse shows. Field-Arena connects volunteer
          management directly into your show operations, helping organizers better coordinate ring
          stewards, gate volunteers, office assistants, awards teams, and show-day support staff.
        </p>

        <h3>6. Vendor and Sponsor Management</h3>
        <p>
          Horse shows are also businesses. Successful competitions depend on strong relationships
          with vendors, sponsors, advertisers, and local businesses. Field-Arena helps organizations
          create better visibility and coordination for revenue-generating partnerships.
        </p>

        <hr />
        <h2>Horse Show Management Software Built for Every Discipline</h2>
        <h3>Dressage Show Management Software</h3>
        <p>Manage dressage tests, ride times, score sheets, results, and USDF-focused workflows.</p>
        <h3>Hunter/Jumper Show Management Software</h3>
        <p>Support classes, divisions, entries, scheduling, and results.</p>
        <h3>Eventing Management Software</h3>
        <p>Coordinate dressage, cross-country, show jumping, and combined results.</p>
        <h3>Western Dressage and Breed Shows</h3>
        <p>Manage competitions with flexible workflows designed for different formats.</p>

        <hr />
        <h2>Who Uses Horse Show Management Software?</h2>
        <h3>Horse Show Organizers</h3>
        <p>Create better events with less administrative burden.</p>
        <h3>Horse Show Secretaries</h3>
        <p>Manage entries, paperwork, schedules, and results in one place.</p>
        <h3>GMO Organizations</h3>
        <p>Support volunteers, members, and competitions with modern tools.</p>
        <h3>Associations</h3>
        <p>Create consistency and better reporting across events.</p>
        <h3>Venues</h3>
        <p>Improve event coordination and operational efficiency.</p>

        <hr />
        <h2>How Horse Show Management Software Saves Time</h2>
        <p>
          A modern platform helps reduce manual data entry, spreadsheet management, paper forms,
          email chains, repetitive administrative tasks, communication delays, and last-minute
          confusion. The result is a more efficient organization and a better experience for
          competitors.
        </p>

        <hr />
        <h2>Choosing the Right Horse Show Management Software</h2>
        <p>When evaluating software, organizations should look for:</p>
        <h3>Ease of Use</h3>
        <p>
          Your team includes professionals and volunteers with different levels of technical
          experience.
        </p>
        <h3>Complete Operations Management</h3>
        <p>The best platforms support the entire event — not just entries.</p>
        <h3>Flexibility</h3>
        <p>Different disciplines and competitions require different workflows.</p>
        <h3>Communication Tools</h3>
        <p>Everyone involved should have access to the information they need.</p>
        <h3>Reporting</h3>
        <p>Boards and organizations need visibility into performance and growth.</p>

        <div className="callout">
          The equestrian industry is evolving. Field-Arena is building the future of horse show
          management by connecting the entire competition ecosystem into one platform.
        </div>
      </article>

      <CtaBand
        heading="Ready to modernize your horse show operations?"
        body="See how Field-Arena can help your organization reduce paperwork, simplify administration, and run better competitions."
        cta="Schedule a demo"
      />
    </ArticleShell>
  );
}

/* ── 2. Equestrian Event Management Software ──────────────────────────── */
function EquestrianEventManagementSoftware(): ReactElement {
  return (
    <ArticleShell
      eyebrow="Overview"
      title="What Is Equestrian Event Management Software?"
      lede="Equestrian event management software is a specialized platform designed to help horse show organizers manage every stage of a competition. Unlike general event software, equestrian management systems are designed around the unique requirements of horse sports."
      breadcrumb={<GuideBreadcrumb label="Equestrian Event Management Software" />}
      ctaRow={<DemoLink>Book a demo</DemoLink>}
    >
      <article>
        <p>A complete equestrian event management platform helps manage:</p>
        <ul>
          <li>Horse and rider registrations</li>
          <li>Competition entries</li>
          <li>Classes and divisions</li>
          <li>Scheduling</li>
          <li>Ring management</li>
          <li>Judge information</li>
          <li>Scoring and results</li>
          <li>Payments</li>
          <li>Communications</li>
          <li>Awards</li>
          <li>Event reporting</li>
        </ul>
        <p>Field-Arena brings these processes together into one connected system.</p>

        <hr />
        <h2>Why Equestrian Events Need Specialized Software</h2>
        <p>
          Horse competitions are different from traditional events. A conference may track
          attendees. A concert may track ticket sales. A horse show must manage riders, horses,
          owners, trainers, classes, divisions, judges, officials, scores, results, and competition
          rules.
        </p>
        <p>
          This complexity creates challenges when organizers rely on spreadsheets, email chains, and
          disconnected tools. Equestrian event management software provides the structure needed to
          run professional competitions efficiently.
        </p>

        <hr />
        <h2>The Challenges of Managing Horse Events Without Software</h2>
        <p>Many organizers still rely on manual processes that create unnecessary work.</p>
        <h3>Too Many Spreadsheets</h3>
        <p>Multiple files create confusion, duplicate work, and version-control issues.</p>
        <h3>Manual Entry Management</h3>
        <p>Entering competitor information repeatedly increases errors.</p>
        <h3>Difficult Scheduling</h3>
        <p>Balancing classes, rings, judges, and competitors requires constant adjustments.</p>
        <h3>Slow Results Processing</h3>
        <p>Manual scoring and result preparation delays awards and communication.</p>
        <h3>Communication Overload</h3>
        <p>Important updates become buried in emails and messages.</p>
        <p>Field-Arena helps replace these disconnected processes with one organized workflow.</p>

        <hr />
        <h2>How Field-Arena Simplifies Equestrian Event Management</h2>
        <h3>Create Your Event Faster</h3>
        <p>
          Build your competition structure with the information needed to manage your show — event
          details, competition types, classes, divisions, entry requirements, and scheduling
          information. Spend less time building spreadsheets and more time preparing your event.
        </p>
        <h3>Manage Entries and Registrations</h3>
        <p>
          Registration is one of the most important parts of event preparation. Field-Arena helps
          organizers manage competitor information, horse details, rider registrations, class
          selections, and payment information — creating a better experience for competitors before
          they arrive.
        </p>
        <h3>Organize Competition Scheduling</h3>
        <p>
          A successful horse show depends on an efficient schedule. Equestrian event management
          software helps coordinate classes, rings, judges, competition times, and rider flow — so
          adjustments happen faster and the event keeps running smoothly.
        </p>
        <h3>Manage Scoring and Results</h3>
        <p>
          Accurate results are essential for every competition. Field-Arena supports score
          management, results organization, placings, awards information, and final reporting —
          delivering accurate results while reducing administrative workload.
        </p>
        <h3>Improve Communication Across Your Event</h3>
        <p>
          Successful competitions require everyone to stay informed. Field-Arena keeps information
          organized for competitors, trainers, judges, volunteers, staff, and vendors — reducing
          confusion and creating a more professional event experience.
        </p>

        <hr />
        <h2>Who Uses Equestrian Event Management Software?</h2>
        <h3>Horse Show Organizers</h3>
        <p>Manage complete event operations from planning through completion.</p>
        <h3>Horse Show Secretaries</h3>
        <p>Reduce administrative tasks and improve accuracy.</p>
        <h3>Equestrian Facilities</h3>
        <p>Host more organized competitions and improve customer experience.</p>
        <h3>Breed and Discipline Associations</h3>
        <p>Create consistent event management processes across competitions.</p>
        <h3>Regional and Local Organizations</h3>
        <p>Operate professional-quality events with better technology.</p>

        <hr />
        <h2>Software Built for Different Equestrian Disciplines</h2>
        <p>
          Field-Arena supports a variety of equestrian competitions — dressage events (tests,
          scoring, results, and competition records), hunter/jumper competitions (classes,
          schedules, and results), eventing and combined training (multi-phase competitions and
          scoring), and specialty and breed shows (organized experiences for unique competition
          formats).
        </p>

        <hr />
        <h2>Equestrian Event Software vs. Generic Event Software</h2>
        <p>
          Generic event platforms are designed for attendees. Equestrian event software is designed
          for competition operations.
        </p>
        <table className="compare">
          <thead>
            <tr>
              <th>Generic Event Software</th>
              <th>Field-Arena</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Attendee registration</td>
              <td>Horse and rider entries</td>
            </tr>
            <tr>
              <td>Basic schedules</td>
              <td>Competition scheduling</td>
            </tr>
            <tr>
              <td>Ticket management</td>
              <td>Class management</td>
            </tr>
            <tr>
              <td>General reporting</td>
              <td>Competition results</td>
            </tr>
            <tr>
              <td>Limited customization</td>
              <td>Built for equestrian workflows</td>
            </tr>
          </tbody>
        </table>
        <p>Your event deserves technology designed for your industry.</p>

        <div className="callout">
          Competitors expect easier registration, faster updates, accessible results, and
          professional experiences. Organizers need better efficiency, fewer errors, more control,
          and less administrative burden. Equestrian event management software provides the
          foundation for the future of horse competitions.
        </div>
      </article>

      <CtaBand
        heading="Ready to modernize your equestrian event?"
        body="Whether you manage a local schooling show, regional competition, or large equestrian championship, Field-Arena gives you the tools to organize and operate with confidence."
        cta="Schedule a demo"
      />
    </ArticleShell>
  );
}

/* ── 3. Horse Show Scoring Software ───────────────────────────────────── */
function HorseShowScoringSoftware(): ReactElement {
  return (
    <ArticleShell
      eyebrow="Scoring"
      title="Horse Show Scoring Software: Simplify Competition Results With Modern Equestrian Technology"
      subhead="Accurate, efficient scoring software built for horse shows."
      lede="Scoring is one of the most important parts of any equestrian competition. Riders, trainers, owners, judges, and spectators all depend on accurate results being delivered quickly and professionally."
      breadcrumb={<GuideBreadcrumb label="Horse Show Scoring Software" />}
      ctaRow={<DemoLink>Book a demo</DemoLink>}
    >
      <article>
        <p>
          Traditional scoring methods often rely on paper score sheets, manual calculations,
          spreadsheets, and time-consuming result entry. These processes create opportunities for
          mistakes, delays, and unnecessary pressure on the show office.
        </p>
        <p>
          <strong>
            Field-Arena is horse show scoring software designed to help competition organizers
            collect, manage, calculate, and publish results efficiently
          </strong>{' '}
          — giving your team more confidence and your competitors a better experience.
        </p>

        <hr />
        <h2>What Is Horse Show Scoring Software?</h2>
        <p>
          Horse show scoring software is a digital system that helps competition organizers manage
          scores, rankings, and results throughout an equestrian event. Instead of manually tracking
          results across multiple documents, organizers can use one centralized platform to manage:
        </p>
        <ul>
          <li>Competitor scores</li>
          <li>Horse and rider information</li>
          <li>Class results</li>
          <li>Placings</li>
          <li>Rankings</li>
          <li>Judge submissions</li>
          <li>Awards information</li>
          <li>Published results</li>
        </ul>
        <p>A modern scoring system reduces manual work while improving accuracy and transparency.</p>

        <hr />
        <h2>Why Horse Shows Need Digital Scoring Software</h2>
        <p>
          A horse show can have hundreds of competitors, multiple divisions, and thousands of
          individual scores to manage. A scoring error can impact rider standings, championship
          qualifications, awards, final results, and competitor trust.
        </p>
        <p>Field-Arena helps show managers:</p>
        <h3>Reduce Scoring Errors</h3>
        <p>Automate calculations and reduce mistakes caused by manual data entry.</p>
        <h3>Save Show Office Time</h3>
        <p>Spend less time entering, checking, and correcting results.</p>
        <h3>Publish Results Faster</h3>
        <p>Provide competitors with timely and accurate results.</p>
        <h3>Create a More Professional Experience</h3>
        <p>Deliver the level of organization expected at modern equestrian events.</p>

        <hr />
        <h2>How Horse Show Scoring Software Works</h2>
        <h3>1. Create Your Competition Classes</h3>
        <p>
          Before scoring begins, organizers build the structure of their event — divisions, classes,
          tests, competition levels, and entry information.
        </p>
        <h3>2. Capture Judge Scores Efficiently</h3>
        <p>
          Digital scoring workflows reduce paperwork, improve score organization, minimize
          transcription errors, and keep results moving efficiently.
        </p>
        <h3>3. Calculate Results Automatically</h3>
        <p>
          Manual calculations can become complicated across multiple classes, divisions,
          tie-breaking procedures, percentages, points, and placings. Horse show scoring software
          helps automate calculations so results are consistent and accurate.
        </p>
        <h3>4. Manage Final Results</h3>
        <p>
          Once scoring is complete, organizers can easily manage final standings, class winners,
          award information, and published results.
        </p>

        <hr />
        <h2>Horse Show Scoring Software for Multiple Disciplines</h2>
        <h3>Dressage Scoring Software</h3>
        <p>
          Manage dressage tests, scores, percentages, and final results — useful for schooling
          shows, recognized competitions, dressage championships, and combined training events.
        </p>
        <h3>Hunter/Jumper Scoring Software</h3>
        <p>
          Manage competition results for hunter classes, jumper classes, equitation divisions, and
          medal classes.
        </p>
        <h3>Eventing and Combined Training Scoring Software</h3>
        <p>Coordinate results across dressage, cross country, and stadium jumping.</p>

        <hr />
        <h2>Horse Show Scoring Software vs. Manual Score Sheets</h2>
        <table className="compare">
          <thead>
            <tr>
              <th>Manual Scoring</th>
              <th>Digital Scoring Software</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Paper score sheets</td>
              <td>Centralized digital records</td>
            </tr>
            <tr>
              <td>Manual calculations</td>
              <td>Automated calculations</td>
            </tr>
            <tr>
              <td>Slower results</td>
              <td>Faster publishing</td>
            </tr>
            <tr>
              <td>Higher chance of errors</td>
              <td>Improved accuracy</td>
            </tr>
            <tr>
              <td>Difficult collaboration</td>
              <td>Team access</td>
            </tr>
          </tbody>
        </table>
        <p>As competitions grow, digital scoring becomes increasingly valuable.</p>

        <hr />
        <h2>Benefits for Horse Show Secretaries</h2>
        <p>
          Scoring software helps secretaries organize class results, reduce duplicate data entry,
          keep accurate records, communicate results efficiently, and reduce end-of-day paperwork.
          Instead of spending hours reconciling results, secretaries can focus on running a smooth
          competition.
        </p>

        <h2>Benefits for Judges and Officials</h2>
        <p>
          A well-designed scoring system supports officials by creating clear workflows, organized
          information, fewer administrative distractions, and more reliable results management. The
          goal is not to replace expertise — it is to support the people responsible for delivering
          fair competition.
        </p>

        <h2>Benefits for Competitors and Spectators</h2>
        <p>
          {`Today's competitors expect faster access to information. Digital scoring improves the experience with timely results, easier access to standings, better communication, and greater confidence in competition outcomes.`}
        </p>

        <hr />
        <h2>How Field-Arena Improves Horse Show Scoring</h2>
        <p>
          Field-Arena was designed specifically around the needs of equestrian competitions. Unlike
          generic event software, Field-Arena understands horse and rider combinations, competition
          classes, discipline-specific workflows, show office requirements, and the complexity of
          equestrian scoring.
        </p>
        <p>
          Field-Arena connects scoring with the rest of your horse show operations — including
          registration, scheduling, and results management.
        </p>

        <div className="callout">
          Organizers are looking for better ways to reduce administrative workload, improve accuracy,
          create better competitor experiences, and run more efficient events. Horse show scoring
          software provides the technology foundation for modern competitions.
        </div>
      </article>

      <CtaBand
        heading="Ready to upgrade your horse show scoring process?"
        body="Stop relying on disconnected spreadsheets and manual processes. See how Field-Arena can modernize your horse show scoring workflow."
        cta="Schedule a demo"
      />
    </ArticleShell>
  );
}

/* ── 4. How to Build a Horse Show in 10 Minutes ──────────────────────── */
function BuildAHorseShowIn10Minutes(): ReactElement {
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

/* ── 5. Eventing and Combined Training Software ──────────────────────── */
function EventingAndCombinedTrainingSoftware(): ReactElement {
  return (
    <ArticleShell
      eyebrow="Eventing"
      title="Eventing and Combined Training Software: Manage Every Phase of Your Competition With One Complete Platform"
      subhead="Purpose-built horse show management software for eventing and combined training competitions."
      lede="Eventing and combined training competitions require some of the most complex coordination in equestrian sport. Unlike single-discipline competitions, they require organizers to manage multiple phases, detailed schedules, scoring calculations, competitors, horses, officials, and final standings — all while keeping the competition running smoothly."
      breadcrumb={<GuideBreadcrumb label="Eventing and Combined Training Software" />}
      ctaRow={<DemoLink>Book a demo</DemoLink>}
    >
      <article>
        <p>
          Traditional methods often require multiple spreadsheets, manual score calculations, paper
          records, and constant communication between departments.
        </p>
        <p>
          <strong>
            Field-Arena is eventing and combined training software designed to connect your entire
            competition workflow
          </strong>{' '}
          — from entries and scheduling to phase scores and final results. One platform. Multiple
          phases. Complete competition management.
        </p>

        <hr />
        <h2>What Is Eventing and Combined Training Software?</h2>
        <p>
          Eventing and combined training software is a specialized horse competition management
          system designed to help organizers manage every component of multi-phase competitions. A
          successful event requires coordination between competitors, horses, trainers, judges,
          stewards, volunteers, scoring teams, and show management.
        </p>
        <p>Field-Arena helps bring these moving parts together into one connected system, managing:</p>
        <ul>
          <li>Horse and rider registrations</li>
          <li>Entries and divisions</li>
          <li>Dressage phase information</li>
          <li>Stadium jumping information</li>
          <li>Cross-country phase organization</li>
          <li>Scoring and calculations</li>
          <li>Final standings</li>
          <li>Results publishing</li>
          <li>Competition records</li>
        </ul>

        <hr />
        <h2>Why Eventing Competitions Need Specialized Management Software</h2>
        <p>
          {`Eventing is unlike any other equestrian discipline. A competitor's final placing may depend on performance across multiple phases:`}
        </p>
        <div className="phase-grid">
          <div className="phase-card">
            <h4>Dressage</h4>
            <p>Evaluating accuracy, obedience, and movement.</p>
          </div>
          <div className="phase-card">
            <h4>Cross Country</h4>
            <p>Managing course performance, penalties, time, and safety considerations.</p>
          </div>
          <div className="phase-card">
            <h4>Stadium Jumping</h4>
            <p>Tracking faults, penalties, and final scores.</p>
          </div>
        </div>
        <p>
          Each phase creates additional administrative requirements. Without integrated software,
          organizers often spend countless hours transferring information between systems.
        </p>

        <hr />
        <h2>The Challenge of Managing Eventing Without a Complete System</h2>
        <p>
          Many event organizers rely on separate entry systems, manual spreadsheets, paper score
          sheets, standalone calculators, and multiple result documents. This creates problems:
          duplicate data entry (the same horse, rider, and competition information may need to be
          entered multiple times), increased risk of errors, difficult communication, and slower
          final results.
        </p>
        <p>Field-Arena helps eliminate these disconnected workflows.</p>

        <hr />
        <h2>How Field-Arena Simplifies Eventing and Combined Training Management</h2>
        <h3>1. Manage Entries From the Beginning</h3>
        <p>
          A successful competition starts with organized registration — rider information, horse
          information, trainer details, divisions, classes, and entry requirements — accurate
          information that follows the competitor throughout the competition.
        </p>
        <h3>2. Organize Multi-Phase Competition Structure</h3>
        <p>
          Field-Arena helps organizers manage competition levels, divisions, classes, phase
          requirements, and competition schedules — creating a connected foundation before
          competition day begins.
        </p>
        <h3>3. Simplify Scheduling Across Multiple Phases</h3>
        <p>
          Managing eventing schedules requires balancing dressage times, cross-country order,
          stadium jumping schedules, judges, officials, and competitor needs — kept organized and
          accessible.
        </p>
        <h3>4. Connect Scoring Across the Entire Competition</h3>
        <p>
          Field-Arena helps manage phase scores, penalties, rankings, final results, and placings.
          Instead of manually combining information from different phases, your results workflow
          stays connected.
        </p>
        <h3>5. Publish Accurate Results Faster</h3>
        <p>
          Competitors, trainers, owners, and spectators want timely results. A professional results
          process creates a better experience for everyone involved.
        </p>

        <hr />
        <h2>Benefits for Eventing Organizers</h2>
        <p>
          Reduce administrative work, improve accuracy, save preparation time by building repeatable
          workflows for future events, and create the professional competitions competitors expect.
        </p>

        <h2>Benefits for Horse Trial Secretaries</h2>
        <p>
          Horse trial secretaries manage some of the most demanding administrative responsibilities
          in equestrian sport. Field-Arena helps simplify entry management, competitor records, phase
          tracking, results preparation, and communication — letting secretaries focus on managing
          the event rather than chasing information.
        </p>

        <hr />
        <h2>Eventing and Combined Training Software for Different Competition Levels</h2>
        <p>
          Field-Arena supports organizers managing schooling horse trials, recognized competitions,
          combined training events, and regional championships.
        </p>

        <hr />
        <h2>Field-Arena vs. Traditional Event Management Methods</h2>
        <table className="compare">
          <thead>
            <tr>
              <th>Traditional Process</th>
              <th>Field-Arena</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Multiple spreadsheets</td>
              <td>One connected system</td>
            </tr>
            <tr>
              <td>Manual score calculations</td>
              <td>Integrated scoring workflow</td>
            </tr>
            <tr>
              <td>Separate records</td>
              <td>Centralized competitor information</td>
            </tr>
            <tr>
              <td>Repeated data entry</td>
              <td>Connected event data</td>
            </tr>
            <tr>
              <td>Slow results preparation</td>
              <td>Faster results management</td>
            </tr>
          </tbody>
        </table>

        <div className="callout">
          Generic event software was not designed for horse sports. Field-Arena understands horse and
          rider combinations, competition divisions, multi-phase scoring, show office workflows, and
          equestrian event operations — it is designed around how horse competitions actually run.
        </div>
      </article>

      <CtaBand
        heading="Ready to modernize your eventing competition?"
        body="Bring registration, scheduling, scoring, and results together in one complete horse show management platform."
        cta="Schedule a demo"
      />
    </ArticleShell>
  );
}

/* ── 6. Registration to Results Software ─────────────────────────────── */
function RegistrationToResultsSoftware(): ReactElement {
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

/* ── 7. Horse Show Secretary Software ────────────────────────────────── */
function HorseShowSecretarySoftware(): ReactElement {
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

/* ── 8. Dressage Show Software ───────────────────────────────────────── */
function DressageShowSoftware(): ReactElement {
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
          Accurate scoring is at the heart of every dressage competition. Field-Arena helps streamline
          dressage score sheets, test results, percentage calculations, class standings, final
          results, and awards information.
        </p>

        <hr />
        <h2>Designed for USDF GMO Organizations</h2>
        <p>
          Field-Arena supports the needs of local and regional dressage organizations. GMOs often
          rely on dedicated volunteers and small administrative teams to run successful competitions.
          Field-Arena helps GMOs reduce volunteer workload, improve communication, standardize
          processes, manage multiple shows, track organizational performance, and create better
          experiences for members.
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
          Most dressage shows rely on many people working together. Field-Arena connects show managers
          (monitoring the entire operation), show secretaries (managing entries, documents, schedules,
          and results), judges and officials (accessing the information needed to perform their
          roles), volunteers (understanding assignments and responsibilities), and vendors and
          sponsors (coordinating participation and communication).
        </p>

        <hr />
        <h2>Why Dressage Organizations Are Moving Beyond Spreadsheets</h2>
        <p>
          Traditional dressage show management often requires multiple spreadsheets, paper score
          sheets, manual emails, separate payment systems, volunteer lists, and independent
          communication tools. Field-Arena brings these disconnected processes together — resulting in
          less paperwork, less office labor, better communication, fewer mistakes, and more efficient
          competitions.
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
          Dressage organizations have always valued precision and professionalism. The next evolution
          is bringing that same standard to competition management.
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

/* ── 9. Horse Show Management Software for USDF GMOs ──────────────────── */
function HorseShowManagementSoftwareForUsdfGmos(): ReactElement {
  return (
    <ArticleShell
      eyebrow="USDF GMOs"
      title="Horse Show Management Software for USDF GMOs"
      subhead="Simplify horse show operations with one platform."
      lede="Field-Arena is the all-in-one horse show operations platform built for USDF GMOs, regional organizations, and equestrian associations. Replace spreadsheets, paperwork, and disconnected tools with a single system designed to support your entire team — from board members and office staff to volunteers, vendors, sponsors, and competitors."
      breadcrumb={<GuideBreadcrumb label="Horse Show Management Software for USDF GMOs" />}
      ctaRow={<DemoLink>Book a demo</DemoLink>}
    >
      <article>
        <p>Spend less time managing logistics and more time growing your organization.</p>

        <hr />
        <h2>Built for the Unique Challenges of GMO Organizations</h2>
        <p>
          Running a successful horse show requires coordination across dozens of moving parts. Most
          organizations rely on a patchwork of emails, paper forms, spreadsheets, and multiple
          software systems.
        </p>
        <p>Field-Arena brings every stage of horse show management into one place:</p>
        <ul>
          <li>Show creation and scheduling</li>
          <li>Entry management and payments</li>
          <li>Volunteer coordination</li>
          <li>Vendor and sponsor management</li>
          <li>Digital score sheets and results</li>
          <li>Rider communication</li>
          <li>Financial reporting and analytics</li>
          <li>Document storage and organization</li>
        </ul>

        <hr />
        <h2>Reduce Administrative Work Across Your Entire Team</h2>
        <p>Field-Arena was designed to support every level of your organization.</p>
        <div className="feature-grid">
          <div className="feature-card">
            <h4>Board Members</h4>
            <ul>
              <li>Review reports and performance metrics</li>
              <li>Track show growth and revenue</li>
              <li>Access organizational data from anywhere</li>
            </ul>
          </div>
          <div className="feature-card">
            <h4>Show Secretaries and Office Staff</h4>
            <ul>
              <li>Eliminate repetitive paperwork</li>
              <li>Manage entries, schedules, and results</li>
              <li>Keep all documents organized in one place</li>
            </ul>
          </div>
          <div className="feature-card">
            <h4>Volunteers</h4>
            <ul>
              <li>View assignments and schedules</li>
              <li>Receive updates instantly</li>
              <li>Track hours and responsibilities</li>
            </ul>
          </div>
          <div className="feature-card">
            <h4>Vendors and Sponsors</h4>
            <ul>
              <li>Submit applications online</li>
              <li>Access event information</li>
              <li>Simplify communication and logistics</li>
            </ul>
          </div>
        </div>

        <hr />
        <h2>Why GMO Organizations Are Moving Away From Paper-Based Systems</h2>
        <p>
          Horse shows have evolved, but many organizations still rely on the same administrative
          processes they used years ago. Field-Arena helps organizations reduce office labor, minimize
          paperwork, improve communication, save time during show setup, streamline show-day
          operations, and create a better experience for competitors and volunteers.
        </p>

        <hr />
        <h2>Everything You Need to Run a Horse Show</h2>
        <h3>Show Setup</h3>
        <p>Build divisions, classes, rings, schedules, and pricing in minutes.</p>
        <h3>Registration and Entries</h3>
        <p>Manage competitors, waitlists, stall requests, payments, and required documents.</p>
        <h3>Show Preparation</h3>
        <p>Coordinate volunteers, sponsors, vendors, and office staff from a centralized dashboard.</p>
        <h3>Show Execution</h3>
        <p>Track scratches, publish scores, manage schedules, and communicate updates in real time.</p>
        <h3>Reporting</h3>
        <p>Generate financial reports, participation data, and operational insights for your board.</p>

        <hr />
        <h2>Frequently Asked Questions</h2>
        <div className="faq">
          <h3>Who is Field-Arena designed for?</h3>
          <p>
            Field-Arena was built for USDF GMOs, dressage organizations, horse show managers, and
            equestrian associations of all sizes.
          </p>
        </div>
        <div className="faq">
          <h3>Does Field-Arena replace our existing systems?</h3>
          <p>
            Field-Arena is designed to consolidate the tools your organization already uses into one
            streamlined platform.
          </p>
        </div>
        <div className="faq">
          <h3>Can volunteers and vendors access the system?</h3>
          <p>
            Yes. Volunteers, vendors, sponsors, staff members, and organizers all have access to
            role-specific tools and information.
          </p>
        </div>
        <div className="faq">
          <h3>Is Field-Arena suitable for multiple disciplines?</h3>
          <p>
            Yes. Field-Arena supports dressage, hunter/jumper, eventing, combined training, western
            dressage, and breed shows.
          </p>
        </div>

        <div className="callout">
          Every organization operates differently. Schedule a personalized demo and discover how
          Field-Arena can reduce administrative work, simplify horse show operations, and support your
          entire team.
        </div>
      </article>

      <CtaBand
        heading="See how Field-Arena can support your organization"
        body="Schedule a personalized demo and discover how Field-Arena can reduce administrative work and support your entire team."
        cta="Schedule a demo"
      />
    </ArticleShell>
  );
}

export const GUIDES: Guide[] = [
  {
    slug: 'horse-show-management-software',
    tag: 'Overview',
    cardTitle: 'Horse Show Management Software: The Complete Guide',
    cardDescription:
      'What horse show management software actually does — setup, entries, scheduling, scoring, volunteers, and vendors — and how to choose the right platform.',
    Body: HorseShowManagementSoftware,
  },
  {
    slug: 'equestrian-event-management-software',
    tag: 'Overview',
    cardTitle: 'What Is Equestrian Event Management Software?',
    cardDescription:
      'Why horse shows need software built for the sport, not generic event tools — and what that looks like in practice.',
    Body: EquestrianEventManagementSoftware,
  },
  {
    slug: 'horse-show-scoring-software',
    tag: 'Scoring',
    cardTitle: 'Horse Show Scoring Software',
    cardDescription:
      'How digital scoring replaces paper score sheets and manual calculations — and what it means for judges, secretaries, and competitors.',
    Body: HorseShowScoringSoftware,
  },
  {
    slug: 'build-a-horse-show-in-10-minutes',
    tag: 'Getting started',
    cardTitle: 'How to Build a Horse Show in 10 Minutes',
    cardDescription:
      'The five-step process for setting up a complete show — event details, classes, registration, schedule, and scoring — fast.',
    Body: BuildAHorseShowIn10Minutes,
  },
  {
    slug: 'eventing-and-combined-training-software',
    tag: 'Eventing',
    cardTitle: 'Eventing and Combined Training Software',
    cardDescription:
      'Managing multi-phase competitions — dressage, cross-country, and stadium jumping — without losing track of a single score.',
    Body: EventingAndCombinedTrainingSoftware,
  },
  {
    slug: 'registration-to-results-software',
    tag: 'Overview',
    cardTitle: 'Registration to Results: The Complete Turnkey System',
    cardDescription:
      'Why every handoff between registration, scoring, and results creates risk — and what a single connected workflow looks like.',
    Body: RegistrationToResultsSoftware,
  },
  {
    slug: 'horse-show-secretary-software',
    tag: 'Show secretaries',
    cardTitle: 'Horse Show Secretary Software',
    cardDescription:
      'Everything a show secretary needs in one place — show setup, entries, office management, scoring, and communication.',
    Body: HorseShowSecretarySoftware,
  },
  {
    slug: 'dressage-show-software',
    tag: 'Dressage',
    cardTitle: 'Dressage Show Software',
    cardDescription:
      'Ride times, judges, score sheets, and percentages — built around how dressage shows and USDF GMOs actually run.',
    Body: DressageShowSoftware,
  },
  {
    slug: 'horse-show-management-software-for-usdf-gmos',
    tag: 'USDF GMOs',
    cardTitle: 'Horse Show Management Software for USDF GMOs',
    cardDescription:
      'Reducing office labor for board members, show secretaries, volunteers, vendors, and sponsors — all in one platform.',
    Body: HorseShowManagementSoftwareForUsdfGmos,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
