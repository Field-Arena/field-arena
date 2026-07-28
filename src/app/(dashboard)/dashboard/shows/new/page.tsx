import type { Metadata } from 'next';
import Link from 'next/link';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { NewShowForm } from '@/modules/shows/ui/new-show-form';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';

export const metadata: Metadata = { title: 'New Show — Field & Arena' };

/**
 * Create a show.
 *
 * Restricted to an organization owner. A ShowAdmin's authority comes from a
 * staff_assignments row for one specific show, so they can edit shows they are
 * staffed on but cannot create new ones for an organization they do not own —
 * the Server Action refuses regardless, and this says so rather than presenting
 * a form that will fail on submit.
 */
export default async function NewShowPage() {
  const context = await getOrganizerContext();
  const canCreate = context.profile.platform_role === 'Organizer' || context.impersonating;

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>New Show</h1>
          <p>The essentials. Classes, divisions and add-ons come next in Show Manager.</p>
        </div>
        <Link href="/dashboard/shows" className="dash-btn dash-btn-outline">
          Back to Show Manager
        </Link>
      </div>

      <div className="dash-card">
        <div className="showbar">
          <span className="showbar-org">{context.orgName}</span>
        </div>

        {canCreate ? (
          <div style={{ marginTop: 16 }}>
            <NewShowForm />
          </div>
        ) : (
          <EmptyPanel
            title="Only an organization owner can create a show"
            note="Your access is scoped to the specific shows you are staffed on. Ask the organizer to create the show, then you can manage it."
          />
        )}
      </div>
    </>
  );
}
