import { z } from 'zod';
import { DEMO_VOLUMES, DEMO_DISCIPLINES } from '@/modules/marketing/landing-content';

export const demoRequestSchema = z.object({
  name: z.string().trim().min(2, 'Tell us who you are').max(120),
  email: z.email('Enter a valid email address'),
  organization: z.string().trim().max(160).optional(),
  discipline: z.enum(DEMO_DISCIPLINES),
  volume: z.enum(DEMO_VOLUMES),
  notes: z.string().trim().max(1000).optional(),
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;
