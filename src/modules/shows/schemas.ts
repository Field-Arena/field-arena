import { z } from 'zod';
import { MAX_STABLES, MAX_STALLS_PER_STABLE } from './constants';

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

/**
 * Schedule / Review tab: per-class arena, judges and fee edits, matching the
 * legacy Review table where these stayed editable after Select Events set the
 * class up. Location is set from the show's rings during Select Events and is
 * read-only here, same as the legacy view.
 *
 * All three fields are optional and each commits as its own request — the
 * Review table has three separate inputs per row, each saving on its own
 * blur. Sending only the field that actually changed (rather than the whole
 * row every time) means two fields blurring in quick succession can't race
 * and clobber each other's write.
 */
export const updateClassReviewSchema = z.object({
  classId: z.uuid(),
  showId: z.uuid(),
  arena: z.string().trim().max(120).nullable().optional(),
  judgesCount: z.coerce.number().int().min(1).max(9).optional(),
  fee: z.coerce.number().min(0).max(100000).optional(),
});

export type UpdateClassReviewInput = z.input<typeof updateClassReviewSchema>;

export const removeClassSchema = z.object({
  classId: z.uuid(),
  showId: z.uuid(),
});

export type RemoveClassInput = z.input<typeof removeClassSchema>;

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

/* ── Show Manager — Setup tab ────────────────────────────────────────────
   "Show Details", "Venue", and "Schedule preferences" — three of the eight
   cards on Setup (see the module's ui/show-manager/ directory for why only
   these three are built yet). Values and option lists below are ported
   from field-and-arena-main/public/views/showstaff.html's TIMEZONE_OPTIONS,
   RING_SIZES, and defaultRules(), the current real ShowManager — not from
   showbuilder.html, whose own comments say Setup was moved out of it into
   showstaff.html. */

/** Ported verbatim from showstaff.html's TIMEZONE_OPTIONS (minus the empty first entry — "not set" is just an unset field here, not a real option to choose). */
export const TIMEZONE_OPTIONS = [
  { id: 'America/New_York', label: 'Eastern (America/New_York)' },
  { id: 'America/Chicago', label: 'Central (America/Chicago)' },
  { id: 'America/Denver', label: 'Mountain (America/Denver)' },
  { id: 'America/Phoenix', label: 'Mountain, no DST (America/Phoenix)' },
  { id: 'America/Los_Angeles', label: 'Pacific (America/Los_Angeles)' },
  { id: 'America/Anchorage', label: 'Alaska (America/Anchorage)' },
  { id: 'Pacific/Honolulu', label: 'Hawaii (Pacific/Honolulu)' },
  { id: 'America/Toronto', label: 'Eastern — Canada (America/Toronto)' },
  { id: 'Europe/London', label: 'UK (Europe/London)' },
] as const;

/** Ported verbatim from showstaff.html's RING_SIZES. */
export const RING_SIZES = [
  { id: 'standard', label: 'Standard (20m × 60m)' },
  { id: 'small', label: 'Small (20m × 40m)' },
] as const;

export const updateShowDetailsSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(3, 'Show name is required').max(160),
  /** Free text, matching shows.show_details.org. Distinct from org_id: this is the club/association name shown to riders, not the platform account. */
  org: optionalText(160),
  showType: z.enum(['rated', 'schooling']),
  /**
   * Blank is allowed, unlike createShowSchema's required dates.
   *
   * "+ New Show" now creates the row before anything is filled in, so a show
   * legitimately sits with no dates while its organizer works down the Setup
   * card. This card also autosaves the whole card on every field change — so
   * requiring dates here rejected an edit to the timezone or club name on a
   * show that simply had not been dated yet.
   */
  startDate: z
    .union([isoDate, z.literal('')])
    .optional()
    .transform((v) => v ?? ''),
  endDate: z
    .union([isoDate, z.literal('')])
    .optional()
    .transform((v) => v ?? ''),
  timezone: optionalText(60),
  startingRiderNumber: z.coerce.number().int().min(1).max(99999),
  governingBodies: z.array(z.enum(GOVERNING_BODIES)),
})
  // Only once both are set — half-dated is a normal state mid-setup.
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: 'End date cannot be before the start date',
    path: ['endDate'],
  });

export type UpdateShowDetailsInput = z.input<typeof updateShowDetailsSchema>;

const ringRowSchema = z.object({
  name: z.string().trim().min(1, 'Ring name is required').max(80),
  size: z.enum(['standard', 'small']),
});

/** Mirrors api/shows/[id].js's MAX_LOCATIONS. */
export const MAX_RINGS = 30;

export const updateShowLocationsSchema = z.object({
  showId: z.uuid(),
  locations: z
    .array(ringRowSchema)
    .max(MAX_RINGS, `A show can have at most ${String(MAX_RINGS)} rings.`),
});

export type UpdateShowLocationsInput = z.input<typeof updateShowLocationsSchema>;

const clockTime = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time in HH:MM (24-hour) form');

export const updateSchedulePrefsSchema = z.object({
  showId: z.uuid(),
  perMin: z.coerce.number().int().min(3).max(30),
  buffer: z.coerce.number().int().min(0).max(15),
  upper: z.coerce.number().int().min(0).max(15),
  end: clockTime,
  order: z.enum(['low', 'high']),
  warmup: z.enum(['yes', 'no']),
  lunch: z.boolean(),
  extraBreaks: z.coerce.number().int().min(0).max(6),
  extraBreakMin: z.coerce.number().int().min(0).max(30),
  /** One entry per show day, index 0 = first day. Empty string means "use the show-wide default above". */
  dayStartTimes: z.array(z.union([clockTime, z.literal('')])),
  dayEndTimes: z.array(z.union([clockTime, z.literal('')])),
});

export type UpdateSchedulePrefsInput = z.input<typeof updateSchedulePrefsSchema>;

/* ── Show Manager — Setup tab, remaining cards ───────────────────────────
   Contact, Prize list, Class divisions (rename/delete — createDivision
   already existed), Required Documents, Merchandise Sales, and Waiver of
   Liability. Same source pair as the rest of Setup: design markup for
   layout, showstaff.html's renderSetupView for field shapes and limits. */

export const updateContactSchema = z.object({
  showId: z.uuid(),
  website: optionalText(300),
  phone: optionalText(40),
  contactEmail: z.union([z.email(), z.literal('')]).optional(),
});

export type UpdateContactInput = z.input<typeof updateContactSchema>;

export const updatePrizeListSchema = z.object({
  showId: z.uuid(),
  prizeListUrl: optionalText(500),
});

export type UpdatePrizeListInput = z.input<typeof updatePrizeListSchema>;

export const renameDivisionSchema = z.object({
  divisionId: z.uuid(),
  name: z.string().trim().min(2, 'Division name is required').max(120),
});

export type RenameDivisionInput = z.input<typeof renameDivisionSchema>;

const documentRequirementSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1).max(160),
  requiresExpiration: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
});

export const updateDocumentRequirementsSchema = z.object({
  showId: z.uuid(),
  requirements: z.array(documentRequirementSchema).max(50),
});

export type UpdateDocumentRequirementsInput = z.input<typeof updateDocumentRequirementsSchema>;

const merchItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(160),
  price: z.coerce.number().min(0).max(100000),
});

export const updateMerchandiseSchema = z.object({
  showId: z.uuid(),
  enabled: z.boolean(),
  items: z.array(merchItemSchema).max(50),
});

export type UpdateMerchandiseInput = z.input<typeof updateMerchandiseSchema>;

export const saveWaiverTextSchema = z.object({
  showId: z.uuid(),
  waiverText: z.string().trim().max(20000),
});

export type SaveWaiverTextInput = z.input<typeof saveWaiverTextSchema>;

/**
 * Ported verbatim from showstaff.html's WAIVER_TEXT_DEFAULT — a real,
 * USDF-adapted draft, not placeholder lorem. {{SHOW_NAME}}/{{SHOW_DATES}}/
 * {{ORGANIZER_NAME}} are filled in wherever this is actually shown to a
 * rider; this module only stores and edits the template.
 */
export const WAIVER_TEXT_DEFAULT =
  'ASSUMPTION OF RISK, WAIVER AND RELEASE OF LIABILITY\n\n' +
  "[DEFAULT DRAFT — adapted from a real USDF-published waiver of liability (Revised form 10/2020), not a substitute for review by an attorney licensed in your state. The Equine Liability Act warning below is Georgia's exact required language as an example only — replace it with your own state's required warning language before relying on this.]\n\n" +
  'I, the undersigned Participant (which term includes Participant\'s parent or legally-appointed guardian, if a minor), freely and voluntarily seek to participate in {{SHOW_NAME}} on {{SHOW_DATES}}, produced by {{ORGANIZER_NAME}} (the "Event"), and any related educational or training programs, youth programs, clinics, or competitions (collectively, "the Activities"). {{ORGANIZER_NAME}}, together with its sponsors, managers, property owners, officials, organizers, affiliates, and their respective directors, officers, members, employees, agents, volunteers, representatives, and designated officials, are collectively referred to as the "Event Sponsor."\n\n' +
  'In consideration of the Event Sponsor allowing Participant to participate in the Activities, Participant agrees as follows:\n\n' +
  '1. ACKNOWLEDGMENT OF INHERENT RISKS OF EQUINE ACTIVITIES/ASSUMPTION OF RISKS. Participant acknowledges that there are numerous inherent risks of equine activities, whether preparing for, entering, attending, participating in, or leaving the Event. The inherent risks include those dangers and conditions which are an integral part of equine activities, including, but not limited to: (a) the propensity of an equine or other animal to behave in ways that may result in injury, harm, or death to persons on or around them; (b) the unpredictability of the equine\'s reaction to such things as sounds, sudden movements and unfamiliar objects, persons, or other animals; (c) certain hazards such as surface or subsurface conditions; (d) collisions with other animals or objects; (e) the potential of a participant or other Participant to act in a negligent manner that may contribute to injury to the participant, Participant, or others, such as failing to maintain control over the equine or not acting within their ability; (f) the breakage or failure of tack or other equipment; (g) the potential that an equine or animal may cause injury or harm to the rider or other persons or animals in the vicinity; and (h) the potential transmission of communicable diseases to both humans and equines. Participant is not relying on Event Sponsor to list within this document all possible inherent risks or all risks of participating in any of the Activities at any location.\n\n' +
  '2. WAIVER AND RELEASE OF LIABILITY. With full knowledge and appreciation of these and other inherent risks associated with equine activities and the Activities, Participant freely and voluntarily assumes the risks of the equine activities involved in any aspect of them. Participant also voluntarily agrees to waive any and all rights to sue and hereby releases the Event Sponsor from all liability, loss, claims, or actions for injury, death, expenses, or damage to person or property resulting from the inherent risks of the Event, or resulting from any action or inaction by the Event Sponsor. This waiver and release is effective even if the injury, death or damage to person or property is caused by, or contributed to by, actions or failure to act of the Event Sponsor and which actions or inactions constitute ordinary negligence or a violation of any applicable law pertaining to equine activity liabilities. Neither Participant nor Participant\'s representatives shall make any claim against, maintain an action against, or recover from the Event Sponsor or its sponsors, directors, officers, members, employees, agents, volunteers, representatives, designated officials, or others acting on their behalf for injury, loss, damage or death of the Participant, to the Participant\'s horse, or to the Participant\'s personal property (regardless of ordinary negligence by the Event Sponsor or regardless of an alleged violation of an applicable equine activity liability law).\n\n' +
  '3. EQUINE LIABILITY ACT. Should the Activities take place in a state with an equine activity liability law, Participant acknowledges reading the applicable state warning below (example only — replace with your own state\'s required language).\n\nGEORGIA WARNING (example): Under Georgia law, an equine activity sponsor or equine professional is not liable for an injury to or the death of a participant in equine activities resulting from the inherent risks of equine activities, pursuant to Chapter 12 of Title 4 of the Official Code of Georgia Annotated.\n\n' +
  '4. MEDICAL TREATMENT. In the event of injury to me during the Event, I authorize the Organizer and Event medical staff to arrange for necessary emergency medical treatment on my behalf, at my expense, if I am unable to consent at the time.\n\n' +
  "5. MINORS. If Participant is under 18 years of age, this agreement is signed on Participant's behalf by Participant's parent or legally-appointed guardian, who represents that they have the legal authority to bind the minor to this agreement and agree to its terms on the minor's behalf as well as their own.\n\n" +
  '6. MISCELLANEOUS. This document is intended to be as broad and inclusive as applicable state law permits. If any clause conflicts with applicable law, only that clause will be void, but the remainder shall stay in full force and effect.\n\n' +
  'I HAVE READ THIS ASSUMPTION OF RISK, WAIVER AND RELEASE OF LIABILITY. I UNDERSTAND THAT IT IS A RELEASE OF CLAIMS AND THAT I AM ASSUMING RISKS INHERENT TO MY PARTICIPATION, AND I AGREE TO BE FULLY BOUND BY ITS TERMS.\n\n' +
  "By typing my name and today's date below, I acknowledge that I have read and understood this release in its entirety, that I am signing it voluntarily, and that I agree to be bound by its terms.";

/* ── Show Manager — Select Events tab ────────────────────────────────────
   Ticket Sales Window, and the catalog picker that turns checked groups
   into real classes. Ported from showstaff.html's ticket window fields and
   smApplySelected(). */

/**
 * The ticket sales window.
 *
 * Stored as text on shows (ticket_open / ticket_close), matching every other
 * date-as-text column in this schema. Close carries a time as well as a date —
 * the design splits them into two inputs because an organizer thinks "closes
 * Friday at 5", not in ISO — so they are recombined here into one value.
 */
export const updateTicketWindowSchema = z
  .object({
    showId: z.uuid(),
    ticketOpen: z.union([isoDate, z.literal('')]).optional().transform((v) => v ?? ''),
    ticketCloseDate: z.union([isoDate, z.literal('')]).optional().transform((v) => v ?? ''),
    ticketCloseTime: z
      .union([z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM'), z.literal('')])
      .optional()
      .transform((v) => v ?? ''),
  })
  .refine((d) => !d.ticketOpen || !d.ticketCloseDate || d.ticketCloseDate >= d.ticketOpen, {
    message: 'Ticket sales cannot close before they open',
    path: ['ticketCloseDate'],
  });

export type UpdateTicketWindowInput = z.input<typeof updateTicketWindowSchema>;

/**
 * Adds every test in a catalog group as a class.
 *
 * The group, not the test, is what the organizer checks — so one submit creates
 * several classes. `division` carries the group name, which is what makes
 * award_scope='division' pool a level's three tests together, the behaviour the
 * legacy build got by writing the same string into every class it created here.
 */
export const addCatalogGroupSchema = z.object({
  showId: z.uuid(),
  category: z.string().trim().min(1).max(120),
  group: z.string().trim().min(1).max(120),
  tests: z.array(z.string().trim().min(1).max(160)).min(1).max(40),
  fee: z.coerce.number().min(0).max(100000),
  /** A ring name from shows.locations, or '' for "No location set". */
  location: z.string().trim().max(80).optional().transform((v) => v ?? ''),
});

export type AddCatalogGroupInput = z.input<typeof addCatalogGroupSchema>;

/**
 * "Add Custom Class" — one class an organizer types themselves.
 *
 * Its own schema rather than a reuse of createClassSchema because the dialog
 * asks for three fields, not seven: judges, ribbon places and award scope take
 * the column defaults, which is what the design's three-field form implies.
 */
export const addCustomClassSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(2, 'Name this class').max(160),
  division: optionalText(120),
  fee: z.coerce.number().min(0).max(100000),
});

export type AddCustomClassInput = z.input<typeof addCustomClassSchema>;

/**
 * "Test of Choice" — one class where the rider, not the organizer, picks which
 * test they ride from a shortlist.
 *
 * `label` stays the generic "Test of Choice" and the organizer's name goes to
 * display_name, exactly as the legacy saveTocClass did: the label is the
 * scoring identity, and every TOC class scores the same way regardless of what
 * the organizer called this one.
 */
export const createTocClassSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(2, 'Name this Test of Choice event').max(160),
  division: optionalText(120),
  fee: z.coerce.number().min(0).max(100000),
  testOptions: z.array(z.string().trim().min(1).max(200)).min(1, 'Pick at least one test').max(60),
});

export type CreateTocClassInput = z.input<typeof createTocClassSchema>;

/** One of the priced governing-body buttons, added as a qualifying type. */
export const addQualTypePresetSchema = z.object({
  showId: z.uuid(),
  body: z.string().trim().min(2).max(40),
  price: z.coerce.number().min(0).max(100000),
});

export type AddQualTypePresetInput = z.input<typeof addQualTypePresetSchema>;

/* ── Show Manager — Rider Entries tab ────────────────────────────────────
   Branding, Add-Ons, Vendor Space Map, Vendor Spaces, Qualifications.
   showbuilder.html's addCustomAddOn/addCustomQual/addCustomVendor are the
   behavior source for the create/rename/price rules: a trimmed non-empty
   name is required, price falls back to 0 rather than rejecting, and
   neither source enforces a duplicate-name check (add_ons/qual_types/
   vendor_items carry no unique index on name, unlike divisions/classes). */

/** Renaming/re-pricing an existing add-on or qualification — same shape, no qty. */
export const updateCatalogItemSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, 'Name is required').max(160),
  price: z.coerce.number().min(0).max(100000),
});

export type UpdateCatalogItemInput = z.input<typeof updateCatalogItemSchema>;

const optionalQty = z
  .union([z.coerce.number().int().min(0).max(100000), z.literal('')])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value));

export const createVendorItemSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(1, 'Name is required').max(160),
  price: z.coerce.number().min(0).max(100000),
  qty: optionalQty,
});

export type CreateVendorItemInput = z.input<typeof createVendorItemSchema>;

export const updateVendorItemSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, 'Name is required').max(160),
  price: z.coerce.number().min(0).max(100000),
  qty: optionalQty,
});

export type UpdateVendorItemInput = z.input<typeof updateVendorItemSchema>;

export const createQualTypeSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(1, 'Name is required').max(160),
  price: z.coerce.number().min(0).max(100000),
});

export type CreateQualTypeInput = z.input<typeof createQualTypeSchema>;

/** Branding logo/banner upload: bytes arrive base64-encoded from the client, matching uploadDocumentSchema's pattern in the superadmin module. */
export const uploadShowBrandingSchema = z.object({
  showId: z.uuid(),
  kind: z.enum(['logo', 'banner']),
  name: z.string().trim().min(1, 'A file name is required').max(300),
  contentType: z.string().trim().max(200).optional(),
  dataBase64: z.string().min(1, 'File data is required'),
});

export type UploadShowBrandingInput = z.input<typeof uploadShowBrandingSchema>;

export const uploadVendorMapSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(1, 'A file name is required').max(300),
  contentType: z.string().trim().max(200).optional(),
  dataBase64: z.string().min(1, 'File data is required'),
});

export type UploadVendorMapInput = z.input<typeof uploadVendorMapSchema>;

/* ── Show Manager — Documents tab ────────────────────────────────────────
   The document library organizers publish to competitors (prize lists,
   maps, forms) — distinct from Setup's "Required Documents", which is what
   riders must upload. Matches uploadDocumentSchema's pattern in the
   superadmin module. */


export const removeShowDocumentSchema = z.object({
  id: z.uuid(),
  showId: z.uuid(),
});

export type RemoveShowDocumentInput = z.input<typeof removeShowDocumentSchema>;

export const updateDocumentEventsSchema = z.object({
  id: z.uuid(),
  showId: z.uuid(),
  eventIds: z.array(z.uuid()).max(200),
});

export type UpdateDocumentEventsInput = z.input<typeof updateDocumentEventsSchema>;

/* ── Show Manager — Test Builder tab ─────────────────────────────────────
   Org-owned dressage test templates: movements + collective marks an
   organizer authors once and reuses across shows. Distinct from
   class_tests, which is the test actually assigned to one class. */

const testMovementSchema = z.object({
  num: z.coerce.number().int().min(1).max(60),
  text: z.string().trim().max(300),
  coef: z.coerce.number().min(1).max(10),
});

const testCollectiveSchema = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(160),
  coef: z.coerce.number().min(1).max(10),
});

export const saveTestTemplateSchema = z.object({
  /** Present when editing an existing template, absent when creating one. */
  id: z.uuid().optional(),
  orgId: z.uuid(),
  name: z.string().trim().min(2, 'Name this test').max(160),
  level: optionalText(80),
  sourceLabel: optionalText(160),
  movements: z.array(testMovementSchema).max(60).default([]),
  collectives: z.array(testCollectiveSchema).max(20).default([]),
});

export type SaveTestTemplateInput = z.input<typeof saveTestTemplateSchema>;

/* ── Horses screen ────────────────────────────────────────────────────────
   "+ Add Horse" (writes to shows.manual_horses), the per-document verify
   checkbox, and the missing-documents reminder email. Ported from
   showstaff.html's openManualHorseModal/submitManualHorse (~13596-13622) and
   the Horses table's own verify checkbox / "✉ Remind" button
   (~13505-13802). See modules/shows/data/horses-queries.ts and
   horses-mutations.ts. */

export const addManualHorseSchema = z.object({
  showId: z.uuid(),
  riderName: z.string().trim().min(1, 'A rider name is required').max(160),
  horseName: z.string().trim().min(1, "A horse's name is required").max(160),
  isStallion: z.boolean().default(false),
});

export type AddManualHorseInput = z.input<typeof addManualHorseSchema>;

export const verifyHorseDocumentSchema = z.object({
  showId: z.uuid(),
  horseId: z.uuid(),
  requirementId: z.string().trim().min(1),
  verified: z.boolean(),
});

export type VerifyHorseDocumentInput = z.input<typeof verifyHorseDocumentSchema>;

export const remindHorseDocumentsSchema = z.object({
  showId: z.uuid(),
  horseId: z.uuid(),
});

export type RemindHorseDocumentsInput = z.input<typeof remindHorseDocumentsSchema>;

/* ── Stable Chart ─────────────────────────────────────────────────────────
   shows.stable_chart: {status, stables:[{id, name, stallCount, rowCount,
   stalls:[{id, number, label, horseId, horseName, riderName, shavings,
   closed, isStallion}]}]}. Ported from showstaff.html's Stable Chart screen
   (~13846-14184) — see modules/shows/data/stable-chart-queries.ts and
   stable-chart-mutations.ts. Every write below is scoped by a stable/stall
   *id* rather than an array index, unlike legacy's index-based
   updateStableField/generateStableStalls/renameStall/toggleStallClosed — ids
   survive a concurrent edit reordering or resizing the array out from under
   a stale index the way legacy's own client-only single-tab model never had
   to worry about. */

export const setStableCountSchema = z.object({
  showId: z.uuid(),
  count: z.coerce.number().int().min(0).max(MAX_STABLES),
});

export type SetStableCountInput = z.input<typeof setStableCountSchema>;

export const updateStableFieldSchema = z.object({
  showId: z.uuid(),
  stableId: z.string().trim().min(1),
  name: z.string().trim().min(1, 'Stable name is required').max(80).optional(),
  stallCount: z.coerce.number().int().min(0).max(MAX_STALLS_PER_STABLE).optional(),
  rowCount: z.coerce.number().int().min(1).max(50).optional(),
});

export type UpdateStableFieldInput = z.input<typeof updateStableFieldSchema>;

export const generateStableStallsSchema = z.object({
  showId: z.uuid(),
  stableId: z.string().trim().min(1),
  /**
   * The count to resize to, sent explicitly by the UI's own live input value
   * rather than trusting the stable's last-*saved* stallCount — a name/blur
   * commit and a "Generate stalls" click can race (see stable-config-row.tsx),
   * and generating against a stale saved count would silently ignore whatever
   * the organizer just typed. Falls back to the stable's saved stallCount
   * when omitted.
   */
  stallCount: z.coerce.number().int().min(0).max(MAX_STALLS_PER_STABLE).optional(),
});

export type GenerateStableStallsInput = z.input<typeof generateStableStallsSchema>;

export const renameStallSchema = z.object({
  showId: z.uuid(),
  stableId: z.string().trim().min(1),
  stallId: z.string().trim().min(1),
  label: z.string().trim().min(1, 'Stall name is required').max(20),
});

export type RenameStallInput = z.input<typeof renameStallSchema>;

export const toggleStallClosedSchema = z.object({
  showId: z.uuid(),
  stableId: z.string().trim().min(1),
  stallId: z.string().trim().min(1),
});

export type ToggleStallClosedInput = z.input<typeof toggleStallClosedSchema>;

export const toggleStableChartStatusSchema = z.object({ showId: z.uuid() });

export type ToggleStableChartStatusInput = z.input<typeof toggleStableChartStatusSchema>;

export const autoAssignStableStallsSchema = z.object({ showId: z.uuid() });

export type AutoAssignStableStallsInput = z.input<typeof autoAssignStableStallsSchema>;

/** "Add stables from a saved location" — mirrors applySavedLocationStables (~14124). */
export const applySavedLocationStablesSchema = z.object({
  showId: z.uuid(),
  venueId: z.uuid(),
});

export type ApplySavedLocationStablesInput = z.input<typeof applySavedLocationStablesSchema>;

/* ── Financial (Billing) tab — expenses ──────────────────────────────────
   shows.expenses is a jsonb array of {id,label,amount}. Every write sends
   the whole list rather than patching one element: Postgres has no
   array-element update through PostgREST, and the legacy editor's own
   add/rename/re-price/remove handlers all rewrote show.expenses wholesale
   too. */

export const showExpenseSchema = z.object({
  id: z.string().trim().min(1).max(64),
  label: z.string().trim().max(160),
  amount: z.coerce.number().min(0).max(10_000_000),
});

export type ShowExpenseInput = z.input<typeof showExpenseSchema>;

export const saveShowExpensesSchema = z.object({
  showId: z.uuid(),
  expenses: z.array(showExpenseSchema).max(100, 'A show can carry at most 100 expense lines.'),
});

export type SaveShowExpensesInput = z.input<typeof saveShowExpensesSchema>;

/**
 * Direct-to-Storage document upload, in two steps.
 *
 * The single-step version sent the file base64-encoded in the Server Action's
 * body. Next's own cap was raised to 8 MB for it, but Vercel enforces a 4.5 MB
 * request-body limit on serverless functions that no framework setting can
 * lift — and base64 adds about a third. So any PDF over roughly 3.3 MB uploaded
 * fine locally and failed once deployed.
 *
 * The bytes now go straight from the browser to Supabase Storage against a
 * signed URL, and never pass through a Server Action at all.
 */
export const createDocumentUploadUrlSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(1, 'A file name is required').max(300),
});

export type CreateDocumentUploadUrlInput = z.input<typeof createDocumentUploadUrlSchema>;

/** Step two: record the object the browser just uploaded. */
export const registerShowDocumentSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(1, 'A file name is required').max(300),
  path: z.string().trim().min(1).max(400),
});

export type RegisterShowDocumentInput = z.input<typeof registerShowDocumentSchema>;

/* ── Master Schedule ─────────────────────────────────────────────────────
   The double-booking rule, awards grouping, and the per-class and
   per-entry edits the built schedule offers in place. Ported from
   showstaff.html's saveHardRuleSetting / toggleAwardsByDivision /
   setClassDurationOverride / moveClassToRingDay / scratchFromSchedule /
   dragRiderDrop. */

/**
 * Every field is optional and only the ones sent are written — each control on
 * the rules card commits on its own, and sending the whole set each time would
 * let two controls changed in quick succession clobber each other.
 */
export const updateScheduleRulesSchema = z.object({
  showId: z.uuid(),
  hardRuleEnabled: z.boolean().optional(),
  hardRuleSameHorseMin: z.coerce.number().int().min(0).max(240).optional(),
  hardRuleDiffHorseMin: z.coerce.number().int().min(0).max(240).optional(),
  awardsByDivision: z.boolean().optional(),
});

export type UpdateScheduleRulesInput = z.input<typeof updateScheduleRulesSchema>;

export const setClassDurationSchema = z.object({
  showId: z.uuid(),
  classId: z.uuid(),
  /** Null clears the override and the class falls back to the rules' ride time. */
  minutes: z.coerce.number().int().min(1).max(60).nullable(),
});

export type SetClassDurationInput = z.input<typeof setClassDurationSchema>;

export const moveClassToRingDaySchema = z.object({
  showId: z.uuid(),
  classId: z.uuid(),
  ring: z.string().trim().min(1).max(80),
  day: z.coerce.number().int().min(0).max(30),
});

export type MoveClassToRingDayInput = z.input<typeof moveClassToRingDaySchema>;

export const scratchEntrySchema = z.object({
  showId: z.uuid(),
  entryId: z.uuid(),
});

export type ScratchEntryInput = z.input<typeof scratchEntrySchema>;

export const reorderRideSchema = z.object({
  showId: z.uuid(),
  classId: z.uuid(),
  entryId: z.uuid(),
  toIndex: z.coerce.number().int().min(0).max(500),
});

export type ReorderRideInput = z.input<typeof reorderRideSchema>;
