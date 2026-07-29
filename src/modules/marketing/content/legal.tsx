import Link from 'next/link';
import type { ReactElement } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';

const CRUMB_SEP = ' › ';

function LegalBreadcrumb({ label }: { label: string }): ReactElement {
  return (
    <>
      <Link href="/">Home</Link>
      {CRUMB_SEP}
      {label}
    </>
  );
}

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
              <td>Log data such as IP address and access times, used for security and rate limiting</td>
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
            To secure the platform — detecting abuse, rate-limiting login attempts, and investigating
            suspicious activity.
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
          comply with legal, tax, and payment-processor recordkeeping obligations. Uploaded documents
          are retained per the retention rules configured by the organization, subject to legal
          minimums.
        </p>

        <h2>5. Security</h2>
        <p>
          Passwords are hashed (never stored in plain text); sessions use httpOnly cookies; documents
          are stored with access-controlled, non-public URLs. No system is perfectly secure, and we
          cannot guarantee absolute security.
        </p>

        <h2>6. Your choices</h2>
        <p>
          You can request access to, correction of, or deletion of your personal information by
          contacting us. Deletion requests are subject to the retention obligations described above.
        </p>

        <h2>{`7. Children's privacy`}</h2>
        <p>
          The Service is intended for use by adults managing or participating in equestrian
          competitions. Where minors participate as riders, their information is provided and managed
          by a parent, guardian, or trainer on their behalf.
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

export function TermsOfServiceContent(): ReactElement {
  return (
    <ArticleShell
      variant="legal"
      eyebrow="Legal"
      title="Terms of Service"
      lede="The terms that govern use of the Field & Arena platform."
      breadcrumb={<LegalBreadcrumb label="Terms of Service" />}
    >
      <div className="container">
        <div className="draft-banner">
          <strong>DRAFT — NOT LEGAL ADVICE.</strong> This document was prepared as a starting point
          and has not been reviewed by an attorney. Do not treat it as binding or complete. Have
          qualified counsel review and finalize this before relying on it in production.
        </div>
      </div>

      <article>
        <p className="meta">Last updated: draft, pending legal review</p>
        <p>
          {`These Terms of Service ("Terms") govern access to and use of the Field & Arena platform (the "Service"), operated by Field & Arena ("we," "us," "our"). By creating an account or using the Service, you agree to these Terms.`}
        </p>

        <h2>1. Who these Terms cover</h2>
        <p>
          These Terms apply to show organizers, organization staff (secretaries, judges, scribes,
          announcers), vendors, and any other party who creates an account or otherwise accesses the
          Service. Riders, trainers, and other competitors who submit entries through a show hosted on
          the Service are also bound by these Terms for purposes of their use of the entry, payment,
          and results features.
        </p>

        <h2>2. Accounts and access</h2>
        <ul>
          <li>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activity under your account.
          </li>
          <li>
            Organization owners are responsible for the staff and role assignments they grant within
            their organization, and for revoking access when appropriate.
          </li>
          <li>
            We may suspend or terminate accounts that violate these Terms, engage in fraud, or create
            risk to other users of the Service.
          </li>
        </ul>

        <h2>3. Show organizer responsibilities</h2>
        <p>
          Organizers are solely responsible for the accuracy of show information, class rules,
          eligibility requirements, scoring, and results they publish through the Service. Field &
          Arena provides the platform; it does not sanction, judge, or officiate competitions.
        </p>

        <h2>4. Payments and payouts</h2>
        <p>
          {`Entry fees and other payments processed through the Service are handled via our payment processor (Stripe). Payouts to organizers are subject to the payout cadence and any holdback configured for their organization, our processor's terms, and applicable fraud/dispute holds. Fees charged by the Service are disclosed at the point of transaction.`}
        </p>

        <h2>5. Content and data you provide</h2>
        <p>
          {`You retain ownership of the data you submit (entries, documents, scores, show content). You grant us a license to host, process, and display that data as needed to operate the Service on your behalf, including sharing it with the relevant show staff, riders, and vendors as the platform's normal functionality requires.`}
        </p>

        <h2>6. Acceptable use</h2>
        <ul>
          <li>No attempting to circumvent security, rate limits, or access controls.</li>
          <li>No uploading unlawful, infringing, or fraudulent content or documents.</li>
          <li>
            No using the Service to process payments unrelated to legitimate equestrian competition
            activity.
          </li>
        </ul>

        <h2>7. Disclaimers and limitation of liability</h2>
        <p>
          {`The Service is provided "as is." To the maximum extent permitted by law, Field & Arena disclaims warranties of any kind and is not liable for indirect, incidental, or consequential damages arising from use of the Service, including disputes between organizers and competitors, scoring or eligibility disputes, or losses arising from third-party payment processing.`}
        </p>

        <h2>8. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will be communicated to
          organization owners by email.
        </p>

        <h2>9. Contact</h2>
        <p>Questions about these Terms can be sent to support@field-arena.com.</p>
      </article>
    </ArticleShell>
  );
}
