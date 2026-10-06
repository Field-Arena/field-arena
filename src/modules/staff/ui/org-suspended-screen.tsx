'use client';

import { useSignOut } from '@/modules/auth/public';

const COPY = {
  suspended: {
    title: 'This account is suspended',
    body: 'Your organization’s Field & Arena account has been suspended, so its workspace is closed for now. Contact Field & Arena support or your organization’s owner to have it reinstated.',
  },
  deleted: {
    title: 'This organization has been closed',
    body: 'The Field & Arena organization this account belongs to has been deleted, so there is no workspace to open. Contact Field & Arena support if you think this is a mistake.',
  },
} as const;

/** Shown by the dashboard layout when every org the staff user works for is
 * suspended or deleted. SuperAdmins never see it. */
export function OrgSuspendedScreen({ reason }: { reason: 'suspended' | 'deleted' }) {
  const signOut = useSignOut();
  const copy = COPY[reason];

  return (
    <main className="bg-cream grid min-h-screen place-items-center px-5 py-12">
      <div className="border-border w-full max-w-[520px] rounded-2xl border bg-white p-8 shadow-[0_18px_60px_rgba(13,44,35,0.10)]">
        <h1 className="text-hunter-deep mb-2 font-serif text-2xl font-bold">{copy.title}</h1>
        <p className="text-fa-muted mb-6 text-[15px] leading-relaxed">{copy.body}</p>
        <button
          type="button"
          disabled={signOut.isPending}
          onClick={() => {
            signOut.mutate();
          }}
          className="bg-hunter-deep rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {signOut.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </main>
  );
}
