'use client';

import { useMutation } from '@tanstack/react-query';
import { requestDemo } from '@/modules/marketing/data/mutations';
import type { DemoRequestInput } from '@/modules/marketing/schemas';

export function useDemoRequest() {
  return useMutation({
    mutationFn: (input: DemoRequestInput) => requestDemo(input),
  });
}
