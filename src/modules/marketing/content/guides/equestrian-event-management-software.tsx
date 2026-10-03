import type { ReactElement } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';
import { GuideBreadcrumb } from '@/modules/marketing/content/guides/guide-breadcrumb';
import { DemoLink } from '@/modules/marketing/content/guides/demo-link';
import { CtaBand } from '@/modules/marketing/content/guides/cta-band';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';

export function EquestrianEventManagementSoftware(): ReactElement {
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Generic Event Software</TableHead>
              <TableHead>Field-Arena</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Attendee registration</TableCell>
              <TableCell>Horse and rider entries</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Basic schedules</TableCell>
              <TableCell>Competition scheduling</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Ticket management</TableCell>
              <TableCell>Class management</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>General reporting</TableCell>
              <TableCell>Competition results</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Limited customization</TableCell>
              <TableCell>Built for equestrian workflows</TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
