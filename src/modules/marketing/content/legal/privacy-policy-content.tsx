import type { ReactElement } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';
import { LegalBreadcrumb } from '@/modules/marketing/content/legal/legal-breadcrumb';

export function PrivacyPolicyContent(): ReactElement {
  return (
    <ArticleShell
      variant="legal"
      eyebrow="Legal"
      title="Privacy Policy"
      lede={`What we collect, why, and how it's handled.`}
      breadcrumb={<LegalBreadcrumb label="Privacy Policy" />}
    >
      <div className="container">
        <div className="draft-banner">
          <strong>DRAFT — NOT LEGAL ADVICE.</strong> This document was prepared as a starting point
          and has not been reviewed by an attorney. It has not been checked for compliance with
          GDPR, CCPA, or other applicable privacy law. Have qualified counsel review and finalize
          this before relying on it in production.
        </div>
      </div>

      <article>
        <p className="meta">Last updated: draft, pending legal review</p>
        <p>
          {`This Privacy Policy describes how Field & Arena ("we," "us," "our") collects, uses, and shares information when you use the Field & Arena platform (the "Service").`}
        </p>

        <h2>1. Information we collect</h2>
        <table className="compare">
          <tbody>
            <tr>
              <th>Category</th>
              <th>Examples</th>
            </tr>
            <tr>
              <td>Account information</td>
              <td>Name, email, phone, password (stored hashed, never in plain text)</td>
            </tr>
            <tr>
              <td>Organization data</td>
              <td>Show details, divisions/classes, staff assignments, member records</td>
            </tr>
            <tr>
              <td>{`Entry & competitor data`}</td>
              <td>Rider/horse information, entries, stall requests, scratches</td>
            </tr>
            <tr>
              <td>Documents</td>
              <td>
                Coggins/vaccination records and other uploaded files, stored in access-controlled
                storage
              </td>
            </tr>
            <tr>
              <td>Scoring data</td>
              <td>Judge and scribe marks, results</td>
            </tr>
            <tr>
              <td>Payment data</td>
              <td>
                Processed directly by our payment processor (Stripe); we do not store full card
                numbers
              </td>
            </tr>
            <tr>
              <td>Usage data</td>
              <td>
                Log data such as IP address and access times, used for security and rate limiting
              </td>
            </tr>
          </tbody>
        </table>

        <h2>2. How we use information</h2>
        <ul>
          <li>
            To operate the Service — running shows, processing entries, coordinating staff and
            scoring, processing payments and payouts.
          </li>
          <li>
            To send transactional email — invitations, entry confirmations, and account notices.
          </li>
          <li>
            To secure the platform — detecting abuse, rate-limiting login attempts, and
            investigating suspicious activity.
          </li>
          <li>To communicate with organization owners about material changes to the Service.</li>
        </ul>

        <h2>3. How information is shared</h2>
        <p>
          {`Within a show, information is shared with the relevant parties as the platform's normal functionality requires — for example, an organizer's staff can see entries for their show, and a rider's documents are visible to the show secretary. We share data with service providers who help us operate the platform, including our database host, file storage provider, email provider, and payment processor. We do not sell personal information.`}
        </p>

        <h2>4. Data retention</h2>
        <p>
          We retain account and show data for as long as the account is active, and as needed to
          comply with legal, tax, and payment-processor recordkeeping obligations. Uploaded
          documents are retained per the retention rules configured by the organization, subject to
          legal minimums.
        </p>

        <h2>5. Security</h2>
        <p>
          Passwords are hashed (never stored in plain text); sessions use httpOnly cookies;
          documents are stored with access-controlled, non-public URLs. No system is perfectly
          secure, and we cannot guarantee absolute security.
        </p>

        <h2>6. Your choices</h2>
        <p>
          You can request access to, correction of, or deletion of your personal information by
          contacting us. Deletion requests are subject to the retention obligations described above.
        </p>

        <h2>{`7. Children's privacy`}</h2>
        <p>
          The Service is intended for use by adults managing or participating in equestrian
          competitions. Where minors participate as riders, their information is provided and
          managed by a parent, guardian, or trainer on their behalf.
        </p>

        <h2>8. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be communicated
          to organization owners by email.
        </p>

        <h2>9. Contact</h2>
        <p>Questions about this Privacy Policy can be sent to support@field-arena.com.</p>
      </article>
    </ArticleShell>
  );
}
