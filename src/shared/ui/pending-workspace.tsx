'use client';

import { LogOutIcon, HardHatIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { useSignOut } from '@/modules/auth/hooks/use-auth-mutations';
import type { RoleWorkspace } from '@/shared/constants/role-workspaces';

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
    <main className="bg-cream grid min-h-screen place-items-center px-5 py-12">
      <div className="border-border w-full max-w-[560px] rounded-2xl border bg-white p-8 shadow-[0_18px_60px_rgba(13,44,35,0.10)]">
        <div className="bg-gold-pale text-gold-dark mb-5 grid size-12 place-items-center rounded-xl">
          <HardHatIcon className="size-6" aria-hidden />
        </div>

        <h1 className="text-hunter-deep mb-2 font-serif text-2xl font-bold">{workspace.title}</h1>

        <p className="text-fa-muted mb-5 text-[15px] leading-relaxed">{workspace.hint}</p>

        <div className="border-border bg-cream mb-6 rounded-xl border p-4">
          <p className="text-ink text-sm leading-relaxed">
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
