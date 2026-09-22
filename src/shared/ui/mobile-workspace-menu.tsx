'use client';

import { useRef, useState, type ReactNode } from 'react';
import { MenuIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/shared/ui/shadcn/dialog';
import styles from './mobile-workspace-menu.module.css';

/** Reuses the desktop controls, including their permission and pending states. */
export function MobileWorkspaceMenu({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className={className} aria-label="Open navigation">
          <MenuIcon aria-hidden />
          <span className="sr-only">Menu</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        ref={contentRef}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.focus();
        }}
        aria-describedby={undefined}
        className="bg-forest top-0 left-0 h-dvh max-h-dvh w-full max-w-[420px] translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 p-0 pt-12 text-white sm:max-w-[420px]"
      >
        <DialogTitle className="sr-only">Workspace navigation</DialogTitle>
        <div
          className={styles.navigation}
          onClick={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest('a[href], [data-navigation-link]')
            )
              setOpen(false);
          }}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
