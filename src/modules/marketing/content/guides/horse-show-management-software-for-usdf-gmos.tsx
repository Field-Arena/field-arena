import type { ReactElement } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';
import { GuideBreadcrumb } from '@/modules/marketing/content/guides/guide-breadcrumb';
import { DemoLink } from '@/modules/marketing/content/guides/demo-link';
import { CtaBand } from '@/modules/marketing/content/guides/cta-band';

export function HorseShowManagementSoftwareForUsdfGmos(): ReactElement {
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
          processes they used years ago. Field-Arena helps organizations reduce office labor,
          minimize paperwork, improve communication, save time during show setup, streamline
          show-day operations, and create a better experience for competitors and volunteers.
        </p>

        <hr />
        <h2>Everything You Need to Run a Horse Show</h2>
        <h3>Show Setup</h3>
        <p>Build divisions, classes, rings, schedules, and pricing in minutes.</p>
        <h3>Registration and Entries</h3>
        <p>Manage competitors, waitlists, stall requests, payments, and required documents.</p>
        <h3>Show Preparation</h3>
        <p>
          Coordinate volunteers, sponsors, vendors, and office staff from a centralized dashboard.
        </p>
        <h3>Show Execution</h3>
        <p>
          Track scratches, publish scores, manage schedules, and communicate updates in real time.
        </p>
        <h3>Reporting</h3>
        <p>
          Generate financial reports, participation data, and operational insights for your board.
        </p>

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
          Field-Arena can reduce administrative work, simplify horse show operations, and support
          your entire team.
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
