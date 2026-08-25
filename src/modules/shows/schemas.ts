import { z } from 'zod';
import { MAX_STABLES, MAX_STALLS_PER_STABLE } from '@/modules/shows/constants';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

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

    venueName: optionalText(160),

    startDate: isoDate,
    endDate: isoDate,

    dateLabel: optionalText(80),

    disciplines: z.array(z.enum(DISCIPLINES)).min(1, 'Pick at least one discipline'),
    governingBodies: z.array(z.enum(GOVERNING_BODIES)),

    showType: z.enum(['rated', 'schooling']),

    timezone: optionalText(60),

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

  awardScope: z.enum(['class', 'division', 'group']),
});

export type CreateClassInput = z.input<typeof createClassSchema>;

export const updateClassReviewSchema = z.object({
  classId: z.uuid(),
  showId: z.uuid(),
  arena: z.string().trim().max(120).nullable().optional(),
  judgesCount: z.coerce.number().int().min(1).max(9).optional(),
  fee: z.coerce.number().min(0).max(100000).optional(),
  sponsor: z.string().trim().max(120).nullable().optional(),
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

export const RING_SIZES = [
  { id: 'standard', label: 'Standard (20m × 60m)' },
  { id: 'small', label: 'Small (20m × 40m)' },
] as const;

export const updateShowDetailsSchema = z
  .object({
    showId: z.uuid(),
    name: z.string().trim().min(3, 'Show name is required').max(160),

    org: optionalText(160),
    showType: z.enum(['rated', 'schooling']),

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
  order: z.enum(['low', 'high', 'custom']),
  warmup: z.enum(['yes', 'no']),
  lunch: z.boolean(),
  extraBreaks: z.coerce.number().int().min(0).max(6),
  extraBreakMin: z.coerce.number().int().min(0).max(30),

  dayStartTimes: z.array(z.union([clockTime, z.literal('')])),
  dayEndTimes: z.array(z.union([clockTime, z.literal('')])),
});

export type UpdateSchedulePrefsInput = z.input<typeof updateSchedulePrefsSchema>;

export const reorderClassesSchema = z.object({
  showId: z.uuid(),
  orderedClassIds: z.array(z.uuid()).min(1).max(500),
});

export type ReorderClassesInput = z.input<typeof reorderClassesSchema>;

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

export const WAIVER_TEXT_DEFAULT =
  'ASSUMPTION OF RISK, WAIVER AND RELEASE OF LIABILITY\n\n' +
  "[DEFAULT DRAFT — adapted from a real USDF-published waiver of liability (Revised form 10/2020), not a substitute for review by an attorney licensed in your state. The Equine Liability Act warning below is Georgia's exact required language as an example only — replace it with your own state's required warning language before relying on this.]\n\n" +
  'I, the undersigned Participant (which term includes Participant\'s parent or legally-appointed guardian, if a minor), freely and voluntarily seek to participate in {{SHOW_NAME}} on {{SHOW_DATES}}, produced by {{ORGANIZER_NAME}} (the "Event"), and any related educational or training programs, youth programs, clinics, or competitions (collectively, "the Activities"). {{ORGANIZER_NAME}}, together with its sponsors, managers, property owners, officials, organizers, affiliates, and their respective directors, officers, members, employees, agents, volunteers, representatives, and designated officials, are collectively referred to as the "Event Sponsor."\n\n' +
  'In consideration of the Event Sponsor allowing Participant to participate in the Activities, Participant agrees as follows:\n\n' +
  "1. ACKNOWLEDGMENT OF INHERENT RISKS OF EQUINE ACTIVITIES/ASSUMPTION OF RISKS. Participant acknowledges that there are numerous inherent risks of equine activities, whether preparing for, entering, attending, participating in, or leaving the Event. The inherent risks include those dangers and conditions which are an integral part of equine activities, including, but not limited to: (a) the propensity of an equine or other animal to behave in ways that may result in injury, harm, or death to persons on or around them; (b) the unpredictability of the equine's reaction to such things as sounds, sudden movements and unfamiliar objects, persons, or other animals; (c) certain hazards such as surface or subsurface conditions; (d) collisions with other animals or objects; (e) the potential of a participant or other Participant to act in a negligent manner that may contribute to injury to the participant, Participant, or others, such as failing to maintain control over the equine or not acting within their ability; (f) the breakage or failure of tack or other equipment; (g) the potential that an equine or animal may cause injury or harm to the rider or other persons or animals in the vicinity; and (h) the potential transmission of communicable diseases to both humans and equines. Participant is not relying on Event Sponsor to list within this document all possible inherent risks or all risks of participating in any of the Activities at any location.\n\n" +
  "2. WAIVER AND RELEASE OF LIABILITY. With full knowledge and appreciation of these and other inherent risks associated with equine activities and the Activities, Participant freely and voluntarily assumes the risks of the equine activities involved in any aspect of them. Participant also voluntarily agrees to waive any and all rights to sue and hereby releases the Event Sponsor from all liability, loss, claims, or actions for injury, death, expenses, or damage to person or property resulting from the inherent risks of the Event, or resulting from any action or inaction by the Event Sponsor. This waiver and release is effective even if the injury, death or damage to person or property is caused by, or contributed to by, actions or failure to act of the Event Sponsor and which actions or inactions constitute ordinary negligence or a violation of any applicable law pertaining to equine activity liabilities. Neither Participant nor Participant's representatives shall make any claim against, maintain an action against, or recover from the Event Sponsor or its sponsors, directors, officers, members, employees, agents, volunteers, representatives, designated officials, or others acting on their behalf for injury, loss, damage or death of the Participant, to the Participant's horse, or to the Participant's personal property (regardless of ordinary negligence by the Event Sponsor or regardless of an alleged violation of an applicable equine activity liability law).\n\n" +
  "3. EQUINE LIABILITY ACT. Should the Activities take place in a state with an equine activity liability law, Participant acknowledges reading the applicable state warning below (example only — replace with your own state's required language).\n\nGEORGIA WARNING (example): Under Georgia law, an equine activity sponsor or equine professional is not liable for an injury to or the death of a participant in equine activities resulting from the inherent risks of equine activities, pursuant to Chapter 12 of Title 4 of the Official Code of Georgia Annotated.\n\n" +
  '4. MEDICAL TREATMENT. In the event of injury to me during the Event, I authorize the Organizer and Event medical staff to arrange for necessary emergency medical treatment on my behalf, at my expense, if I am unable to consent at the time.\n\n' +
  "5. MINORS. If Participant is under 18 years of age, this agreement is signed on Participant's behalf by Participant's parent or legally-appointed guardian, who represents that they have the legal authority to bind the minor to this agreement and agree to its terms on the minor's behalf as well as their own.\n\n" +
  '6. MISCELLANEOUS. This document is intended to be as broad and inclusive as applicable state law permits. If any clause conflicts with applicable law, only that clause will be void, but the remainder shall stay in full force and effect.\n\n' +
  'I HAVE READ THIS ASSUMPTION OF RISK, WAIVER AND RELEASE OF LIABILITY. I UNDERSTAND THAT IT IS A RELEASE OF CLAIMS AND THAT I AM ASSUMING RISKS INHERENT TO MY PARTICIPATION, AND I AGREE TO BE FULLY BOUND BY ITS TERMS.\n\n' +
  "By typing my name and today's date below, I acknowledge that I have read and understood this release in its entirety, that I am signing it voluntarily, and that I agree to be bound by its terms.";

export const updateTicketWindowSchema = z
  .object({
    showId: z.uuid(),
    ticketOpen: z
      .union([isoDate, z.literal('')])
      .optional()
      .transform((v) => v ?? ''),
    ticketCloseDate: z
      .union([isoDate, z.literal('')])
      .optional()
      .transform((v) => v ?? ''),
    ticketCloseTime: z
      .union([
        z
          .string()
          .trim()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM'),
        z.literal(''),
      ])
      .optional()
      .transform((v) => v ?? ''),
  })
  .refine((d) => !d.ticketOpen || !d.ticketCloseDate || d.ticketCloseDate >= d.ticketOpen, {
    message: 'Ticket sales cannot close before they open',
    path: ['ticketCloseDate'],
  });

export type UpdateTicketWindowInput = z.input<typeof updateTicketWindowSchema>;

export const addCatalogGroupSchema = z.object({
  showId: z.uuid(),
  category: z.string().trim().min(1).max(120),
  group: z.string().trim().min(1).max(120),
  division: z.string().trim().min(1).max(80).optional(),
  tests: z.array(z.string().trim().min(1).max(160)).min(1).max(40),
  fee: z.coerce.number().min(0).max(100000),

  location: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v ?? ''),
});

export type AddCatalogGroupInput = z.input<typeof addCatalogGroupSchema>;

export const addCustomClassSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(2, 'Name this class').max(160),
  division: optionalText(120),
  fee: z.coerce.number().min(0).max(100000),
  sponsor: optionalText(120),
});

export type AddCustomClassInput = z.input<typeof addCustomClassSchema>;

export const createTocClassSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(2, 'Name this Test of Choice event').max(160),
  division: optionalText(120),
  fee: z.coerce.number().min(0).max(100000),
  testOptions: z.array(z.string().trim().min(1).max(200)).min(1, 'Pick at least one test').max(60),
});

export type CreateTocClassInput = z.input<typeof createTocClassSchema>;

export const addQualTypePresetSchema = z.object({
  showId: z.uuid(),
  body: z.string().trim().min(2).max(40),
  price: z.coerce.number().min(0).max(100000),
});

export type AddQualTypePresetInput = z.input<typeof addQualTypePresetSchema>;

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

const testMovementSchema = z.object({
  num: z.coerce
    .number()
    .int()
    .min(1, 'Movement number must be 1 or higher')
    .max(60, 'Movement number is too high'),
  text: z.string().trim().max(300, 'Movement description is too long (max 300 characters)'),
  coef: z.coerce
    .number()
    .min(1, 'Coefficient must be between 1 and 10')
    .max(10, 'Coefficient must be between 1 and 10'),
});

const testCollectiveSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Collective mark is missing its key')
    .max(60, 'Collective mark key is too long'),
  label: z
    .string()
    .trim()
    .min(1, 'Collective mark needs a label')
    .max(160, 'Collective mark label is too long (max 160 characters)'),
  coef: z.coerce
    .number()
    .min(1, 'Coefficient must be between 1 and 10')
    .max(10, 'Coefficient must be between 1 and 10'),
});

/* ── Score-sheet engine (phase 1) — the discipline-neutral structure ──────
   Test → Sections → Scored items → Instructions, plus penalties and a scoring
   config. All optional/defaulted below so the existing movements/collectives
   payload still validates unchanged (backward compatible). */

const templateInstructionSchema = z.object({
  id: z.string(),
  marker: z.string().trim().max(24).default(''),
  instruction: z.string().trim().max(300).default(''),
  gait: z.string().trim().max(80).default(''),
  direction: z.string().trim().max(60).default(''),
});

const templateItemSchema = z.object({
  id: z.string(),
  label: z.string().trim().max(300).default(''),
  directive: z.string().trim().max(600).default(''),
  maxScore: z.coerce.number().min(0).max(1000).default(10),
  coef: z.coerce.number().min(1).max(20).default(1),
  required: z.boolean().default(true),
  instructions: z.array(templateInstructionSchema).max(30).default([]),
});

const templateSectionSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Name this section').max(80),
  /** movements · collective · technical · artistic · conformation · rider · penalties … */
  type: z.string().trim().max(40).default('scored'),
  subtotal: z.boolean().default(true),
  items: z.array(templateItemSchema).max(120).default([]),
});

const templatePenaltySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(120),
  /** fixed · progressive · one_time · section · overall · elimination · disqualification */
  penaltyType: z.string().trim().max(40).default('fixed'),
  value: z.string().trim().max(160).default(''),
  repeat: z.boolean().default(false),
  elimination: z.boolean().default(false),
});

const scoringConfigSchema = z.object({
  scoreType: z.string().trim().max(40).default('0-10'),
  applyCoefficients: z.boolean().default(true),
  finalDisplay: z.string().trim().max(40).default('percentage'),
  formula: z.string().trim().max(60).default('earned_over_possible'),
});

export type TemplateInstructionInput = z.input<typeof templateInstructionSchema>;
export type TemplateItemInput = z.input<typeof templateItemSchema>;
export type TemplateSectionInput = z.input<typeof templateSectionSchema>;
export type TemplatePenaltyInput = z.input<typeof templatePenaltySchema>;
export type ScoringConfigInput = z.input<typeof scoringConfigSchema>;

export const saveTestTemplateSchema = z.object({
  id: z.uuid().optional(),
  orgId: z.uuid(),
  name: z.string().trim().min(2, 'Name this test').max(160),
  level: optionalText(80),
  sourceLabel: optionalText(160),
  movements: z.array(testMovementSchema).max(60).default([]),
  collectives: z.array(testCollectiveSchema).max(20).default([]),

  // New structured fields — all optional so old payloads keep validating.
  discipline: optionalText(80),
  sheetType: optionalText(60),
  governingBody: optionalText(80),
  versionYear: optionalText(16),
  arenaSize: optionalText(40),
  rideTime: optionalText(40),
  scoringMethod: optionalText(60),
  maxPoints: z.coerce.number().min(0).max(100000).optional(),
  sections: z.array(templateSectionSchema).max(40).default([]),
  penalties: z.array(templatePenaltySchema).max(40).default([]),
  scoringConfig: scoringConfigSchema.optional(),
});

export type SaveTestTemplateInput = z.input<typeof saveTestTemplateSchema>;

export const assignTestTemplateToClassSchema = z.object({
  templateId: z.uuid(),
  classId: z.uuid(),
});

export type AssignTestTemplateToClassInput = z.input<typeof assignTestTemplateToClassSchema>;

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

export const applySavedLocationStablesSchema = z.object({
  showId: z.uuid(),
  venueId: z.uuid(),
});

export type ApplySavedLocationStablesInput = z.input<typeof applySavedLocationStablesSchema>;

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

export const createDocumentUploadUrlSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(1, 'A file name is required').max(300),
});

export type CreateDocumentUploadUrlInput = z.input<typeof createDocumentUploadUrlSchema>;

export const registerShowDocumentSchema = z.object({
  showId: z.uuid(),
  name: z.string().trim().min(1, 'A file name is required').max(300),
  path: z.string().trim().min(1).max(400),
});

export type RegisterShowDocumentInput = z.input<typeof registerShowDocumentSchema>;

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
