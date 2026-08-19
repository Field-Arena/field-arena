import type { ReactElement } from 'react';
import { ArticleShell } from '@/modules/marketing/ui/article-shell';
import { LegalBreadcrumb } from '@/modules/marketing/content/legal/legal-breadcrumb';

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
