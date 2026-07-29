'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DemoDialog } from './demo-dialog';
import { useDemoDialogStore } from '../../store';

/**
 * Mounts the demo dialog once per page and honours a `?demo=1` deep link.
 *
 * The param is read ONCE on mount, not used as the open state — see the store
 * for why. That keeps a shared or bookmarked link working while every in-page
 * trigger stays a plain button.
 */
export function DemoDialogMount() {
  const params = useSearchParams();
  const deepLinked = params.get('demo') !== null;
  const openDialog = useDemoDialogStore((state) => state.openDialog);
  const open = useDemoDialogStore((state) => state.open);
  const setOpen = useDemoDialogStore((state) => state.setOpen);

  useEffect(() => {
    if (deepLinked) openDialog();
  }, [deepLinked, openDialog]);

  return <DemoDialog open={open} onOpenChange={setOpen} />;
}
