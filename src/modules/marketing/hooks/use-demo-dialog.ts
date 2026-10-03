'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { demoRequestSchema, type DemoRequestInput } from '@/modules/marketing/schemas';
import { useDemoRequest } from '@/modules/marketing/hooks/use-demo-request';

export function useDemoDialog(onOpenChange: (next: boolean) => void) {
  const [sent, setSent] = useState(false);
  const request = useDemoRequest();

  const form = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      name: '',
      email: '',
      organization: '',
      discipline: 'Dressage',
      volume: '4–10',
      notes: '',
    },
  });

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setSent(false);
      form.reset();
      request.reset();
    }
  }

  function submit(values: DemoRequestInput) {
    request.mutate(values, {
      onSuccess: () => {
        setSent(true);
      },
    });
  }

  return { sent, form, request, close, submit };
}
