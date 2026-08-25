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

export function EventingAndCombinedTrainingSoftware(): ReactElement {
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
        <p>
          Field-Arena helps bring these moving parts together into one connected system, managing:
        </p>
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
          in equestrian sport. Field-Arena helps simplify entry management, competitor records,
          phase tracking, results preparation, and communication — letting secretaries focus on
          managing the event rather than chasing information.
        </p>

        <hr />
        <h2>Eventing and Combined Training Software for Different Competition Levels</h2>
        <p>
          Field-Arena supports organizers managing schooling horse trials, recognized competitions,
          combined training events, and regional championships.
        </p>

        <hr />
        <h2>Field-Arena vs. Traditional Event Management Methods</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Traditional Process</TableHead>
              <TableHead>Field-Arena</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Multiple spreadsheets</TableCell>
              <TableCell>One connected system</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Manual score calculations</TableCell>
              <TableCell>Integrated scoring workflow</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Separate records</TableCell>
              <TableCell>Centralized competitor information</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Repeated data entry</TableCell>
              <TableCell>Connected event data</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Slow results preparation</TableCell>
              <TableCell>Faster results management</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="callout">
          Generic event software was not designed for horse sports. Field-Arena understands horse
          and rider combinations, competition divisions, multi-phase scoring, show office workflows,
          and equestrian event operations — it is designed around how horse competitions actually
          run.
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
