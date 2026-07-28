'use client';

import { useMutation } from '@tanstack/react-query';
import { requestDemo } from '../data/mutations';
import type { DemoRequestInput } from '../schemas';

/**
 * No toast on success or failure: the dialog swaps to a confirmation panel and
 * renders any error inline beside the form. A toast would announce the same
 * thing a second time, in a corner, while the dialog covers the page.
 */
export function useDemoRequest() {
  return useMutation({
    mutationFn: (input: DemoRequestInput) => requestDemo(input),
  });
}
