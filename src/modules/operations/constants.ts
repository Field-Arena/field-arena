/** Revalidated after ShowStaff's one write path — uploading a document. */
export const OPERATIONS_DOCUMENTS_PATH = '/dashboard/operations/documents';

/** Platform/org-level roles that hold every operations permission implicitly — they're never a staff_assignments row at all. */
export const ORG_LEVEL_ROLES = new Set(['Organizer', 'Show Admin', 'SuperAdmin']);

/** Ported from showstaff-ops.html's RIBBONS/ribbon()/ribBorder() — colors for 1st through 8th place. */
export const RIBBONS: { bg: string; fg: string; name: string }[] = [
  { bg: '#1E5AA8', fg: '#ffffff', name: 'Blue' },
  { bg: '#C0392B', fg: '#ffffff', name: 'Red' },
  { bg: '#E4B21E', fg: '#3a2f00', name: 'Yellow' },
  { bg: '#FFFFFF', fg: '#22271F', name: 'White' },
  { bg: '#E58FB0', fg: '#4a1f30', name: 'Pink' },
  { bg: '#2E7D46', fg: '#ffffff', name: 'Green' },
  { bg: '#6B4E9E', fg: '#ffffff', name: 'Purple' },
  { bg: '#7A5230', fg: '#ffffff', name: 'Brown' },
];
