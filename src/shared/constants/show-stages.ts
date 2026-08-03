/**
 * A show's lifecycle stages, in order. Shared across the staff module's
 * Dashboard and the shows module's Show Manager — both render the identical
 * lifecycle bar (see getShowStage for how a show's current stage is derived).
 */
export const SHOW_STAGES = [
  { key: 'setup', label: 'Setup' },
  { key: 'sales-open', label: 'Ticket sales open' },
  { key: 'sales-closed', label: 'Ticket sales closed' },
  { key: 'schedule', label: 'Schedule approved' },
  { key: 'live', label: 'Live' },
  { key: 'complete', label: 'Complete' },
] as const;
