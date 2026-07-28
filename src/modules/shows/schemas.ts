import { z } from 'zod';

/**
 * Field set drawn from the shows table and the legacy ShowManager Setup panel —
 * the "Show Details" card whose fields had no backing columns in the original
 * client-only build, so anything typed into them was lost on reload.
 */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

/** ISO 'YYYY-MM-DD', matching every date-as-text column in this schema. */
const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date in YYYY-MM-DD form');

export const DISCIPLINES = [
  'Dressage',
  'Eventing',
  'Hunter/Jumper',
  'Western Dressage',
  'Quarter Horse',
  'Breed Show',
] as const;

export const GOVERNING_BODIES = ['USEF', 'USDF', 'FEI', 'USEA', 'None'] as const;

export const createShowSchema = z
  .object({
    name: z.string().trim().min(3, 'Show name is required').max(160),

    /**
     * Free text, matching shows.venue_name. Distinct from venue_id: the show
     * builder does not manage real venue rows, and an organizer often types a
     * venue before adding it to their reusable library.
     */
    venueName: optionalText(160),

    startDate: isoDate,
    endDate: isoDate,

    /**
     * The human label riders see ("Jul 10 – Jul 12, 2026"). Derived from the
     * dates when left blank, because the legacy views render this string
     * directly and an empty one shows as a gap.
     */
    dateLabel: optionalText(80),

    disciplines: z.array(z.enum(DISCIPLINES)).min(1, 'Pick at least one discipline'),
    governingBodies: z.array(z.enum(GOVERNING_BODIES)),

    /**
     * A structural discriminator, not a display detail — it drives which default
     * catalog appears when picking events.
     */
    showType: z.enum(['rated', 'schooling']),

    /**
     * Real IANA zone, deliberately per-show rather than inherited from the
     * organization: one organizer runs shows in different time zones.
     */
    timezone: optionalText(60),

    /** What rider #1's bib number starts at. */
    startingRiderNumber: z.coerce.number().int().min(1).max(99999),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'End date cannot be before the start date',
    path: ['endDate'],
  });

export type CreateShowInput = z.input<typeof createShowSchema>;

export const createClassSchema = z.object({
  showId: z.uuid(),
  label: z.string().trim().min(2, 'Class name is required').max(160),
  division: optionalText(120),
  fee: z.coerce.number().min(0).max(100000),
  judgesCount: z.coerce.number().int().min(1).max(9),
  ribbonPlaces: z.coerce.number().int().min(1).max(20),
  /** 'class' ranks alone; 'division'/'group' pool with everything sharing that value. */
  awardScope: z.enum(['class', 'division', 'group']),
});

export type CreateClassInput = z.input<typeof createClassSchema>;

export const createDivisionSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(2, 'Division name is required').max(120),
});

export type CreateDivisionInput = z.input<typeof createDivisionSchema>;

export const createAddOnSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(2, 'Name is required').max(160),
  price: z.coerce.number().min(0).max(100000),
  /** Null means unlimited, which is the schema's own convention. */
  qty: z
    .union([z.coerce.number().int().min(0).max(100000), z.literal('')])
    .optional()
    .transform((value) => (value === '' || value === undefined ? null : value)),
  stalls: z.coerce.number().int().min(0).max(99).default(0),
  nights: z.coerce.number().int().min(0).max(99).default(0),
  shavings: z.coerce.number().int().min(0).max(99).default(0),
  tack: z.coerce.number().int().min(0).max(99).default(0),
});

export type CreateAddOnInput = z.input<typeof createAddOnSchema>;
