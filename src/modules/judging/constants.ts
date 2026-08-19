/** Revalidated after every panel write (assignJudgeToClasses/assignScribeToClasses/setClassPanel). */
export const JUDGING_PATH = '/dashboard/judging';

/**
 * Real external URLs, ported from legacy judge-scribe.html's
 * TEST_SHEETS_URL/DR_RULES_URL/RULEBOOK_URL constants.
 */
export const USDF_TEST_SHEETS_URL = 'https://www.usdf.org/downloads/forms/index.asp?TypePass=Tests';
export const USEF_DR_RULES_URL = 'https://www.usef.org/forms-pubs/F3p8pgrWgAo/dr-dressage-division';
export const USEF_RULEBOOK_URL = 'https://www.usef.org/compete/regulation/rulebook';

/**
 * The Documents tab's reference list, ported from Judge Workspace.dc.html's
 * `DOCS` mock array (names/details) with real hrefs from legacy
 * judge-scribe.html's DOCS array — org-agnostic rule references, not
 * per-show data, so this is a constant rather than a query.
 */
export const JUDGING_REFERENCE_DOCS = [
  { name: 'USEF Rulebook — Dressage (DR) chapter', detail: 'Official USEF rulebook', url: USEF_DR_RULES_URL },
  { name: 'USEF DR123 — scoring & rounding rules', detail: 'USEF rulebook · DR chapter', url: USEF_DR_RULES_URL },
  {
    name: 'Errors of course — deduction schedule',
    detail: 'USEF rulebook · DR chapter',
    url: USEF_DR_RULES_URL,
  },
  { name: 'Complete USEF Rulebook', detail: 'All divisions · official', url: USEF_RULEBOOK_URL },
] as const;

/**
 * What a SuperAdmin sees when previewing this workspace from the console's
 * ROLES rail — a role they hold no real panel seats for. Legacy's own
 * platform.html rail had the same gap (no org/email ever threaded through
 * for Judge/Scribe previews) and papered over it with a hardcoded demo judge,
 * "Margaret Ellison" — the exact name Judge Workspace.dc.html's own mock data
 * still carries, which is why this reuses the design's own TODAY/UPCOMING/
 * PANEL arrays rather than inventing new fictional people. See
 * `judging/utils.ts`'s `buildDemoAssignments`/`buildDemoPanelContacts` for
 * where these turn into real AssignmentRow/PanelContact shapes.
 */
export const DEMO_JUDGE_NAME = 'Margaret Ellison';

export const DEMO_TODAY_ASSIGNMENTS = [
  {
    classLabel: 'Training Level Test 3',
    showName: 'Autumn Leaves Dressage Classic',
    time: '08:00',
    ring: 'Ring 1',
    position: 'C',
    partnerName: 'Emily Carter',
  },
  {
    classLabel: 'First Level Test 1',
    showName: 'Autumn Leaves Dressage Classic',
    time: '09:15',
    ring: 'Ring 1',
    position: 'C',
    partnerName: 'Emily Carter',
  },
] as const;

export const DEMO_UPCOMING_ASSIGNMENTS = [
  {
    classLabel: 'Second Level Test 2',
    showName: 'Chattahoochee Fall Classic',
    time: null,
    ring: 'Ring 2',
    position: 'H',
    partnerName: 'Derek Shaw',
  },
] as const;

export const DEMO_PANEL_CONTACTS = [
  {
    staffId: 'demo-staff-robert-tan',
    name: 'Robert Tan',
    role: 'judge' as const,
    showName: 'Autumn Leaves Dressage Classic',
    position: 'H',
    classIds: ['demo-class-today-0', 'demo-class-today-1'],
  },
  {
    staffId: 'demo-staff-emily-carter',
    name: 'Emily Carter',
    role: 'scribe' as const,
    showName: 'Autumn Leaves Dressage Classic',
    position: 'C',
    classIds: ['demo-class-today-0', 'demo-class-today-1'],
  },
  {
    staffId: 'demo-staff-derek-shaw',
    name: 'Derek Shaw',
    role: 'scribe' as const,
    showName: 'Chattahoochee Fall Classic',
    position: 'H',
    classIds: ['demo-class-upcoming-0'],
  },
];
