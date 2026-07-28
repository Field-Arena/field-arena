'use client';

import { LogOutIcon, HardHatIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { useSignOut } from '@/modules/auth/hooks/use-auth-mutations';
import type { RoleWorkspace } from '@/shared/constants/role-workspaces';

/**
 * Shown to a role whose workspace has not been migrated yet.
 *
 * The alternative — falling back to whichever workspace happens to exist — is
 * actively harmful: it shows one role another role's data and implies a
 * permission set they do not hold. A Judge dropped into the Organizer workspace
 * would see revenue figures that the permission model says Judges never see.
 *
 * It also beats the legacy behaviour, which was a bare line of text reading
 * "Signed in, but no dashboard is set up for this account yet" with no
 * indication of what was missing or what to do next.
 */
export function PendingWorkspace({
  workspace,
  roleLabel,
  userName,
}: {
  workspace: RoleWorkspace;
  roleLabel: string;
  userName: string;
}) {
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 py-12">
      <div className="w-full max-w-[560px] rounded-2xl border border-border bg-white p-8 shadow-[0_18px_60px_rgba(13,44,35,0.10)]">
        <div className="mb-5 grid size-12 place-items-center rounded-xl bg-gold-pale text-gold-dark">
          <HardHatIcon className="size-6" aria-hidden />
        </div>

        <h1 className="mb-2 font-serif text-2xl font-bold text-hunter-deep">{workspace.title}</h1>

        <p className="text-fa-muted mb-5 text-[15px] leading-relaxed">{workspace.hint}</p>

        <div className="mb-6 rounded-xl border border-border bg-cream p-4">
          <p className="text-sm leading-relaxed text-ink">
            Signed in as <strong className="font-semibold">{userName}</strong> with the{' '}
            <strong className="font-semibold">{roleLabel}</strong> role. This workspace is still
            being migrated, so it is not available yet.
          </p>
          <p className="text-fa-muted mt-2 text-[13px]">
            You are not being shown another role&rsquo;s workspace on purpose — it would expose data
            and actions this role does not have.
          </p>
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            signOut();
          }}
          disabled={isSigningOut}
        >
          <LogOutIcon aria-hidden />
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </main>
  );
}
