'use client';

import { LogOutIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { useSignOut } from '../hooks/use-auth-mutations';

/** Outline "Sign out" button used on full-screen workspace notices. */
export function SignOutButton() {
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();

  return (
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
  );
}
