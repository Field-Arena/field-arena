'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DemoDialog } from '@/modules/marketing/ui/landing/demo-dialog';
import { useDemoDialogStore } from '@/modules/marketing/store';

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
