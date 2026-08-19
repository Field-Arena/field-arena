import { z } from 'zod';
import { DEMO_VOLUMES, DEMO_DISCIPLINES } from '@/modules/marketing/landing-content';

/**
 * The "Book a demo" request.
 *
 * This is the only publicly-callable write on the platform, so the schema is the
 * whole guard: it runs before anything touches the database, and every field is
 * bounded. Lengths are generous enough for real answers and short enough that a
 * single request cannot carry a payload.
 */
export const demoRequestSchema = z.object({
  name: z.string().trim().min(2, 'Tell us who you are').max(120),
  email: z.email('Enter a valid email address'),
  organization: z.string().trim().min(2, 'Which organization is this for?').max(160),
  discipline: z.enum(DEMO_DISCIPLINES),
  volume: z.enum(DEMO_VOLUMES),
  notes: z.string().trim().max(1000).optional(),
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;
