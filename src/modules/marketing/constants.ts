export const NAV_LINKS = [
  { label: 'Product', href: '#features' },
  { label: 'Book a demo', href: '#demo' },
] as const;

export const FEATURES = [
  {
    icon: 'calendar',
    title: 'ShowManager',
    body: 'Build your schedule, classes, and pricing in an afternoon — official USEF, USDF, and FEI tests included, not re-typed.',
  },
  {
    icon: 'scale',
    title: "Scoring That's Actually Yours",
    body: 'Judges and scribes score live, side by side, on the real test sheet — no runner carrying paper across the arena.',
  },
  {
    icon: 'users',
    title: 'Your Team, Without the Group Text',
    body: "Invite judges, scribes, and show staff, and actually see who's confirmed — not guessing from a reply-all thread.",
  },
  {
    icon: 'receipt',
    title: 'Get Paid Without the Chasing',
    body: "Entry fees and payouts move through Stripe automatically — you see what came in and what's headed to your account.",
  },
] as const;

export const DEMO_POINTS = [
  'No slideshow — a real walkthrough of your show',
  'Straight answers on pricing and payouts',
  'No pressure — most organizers ask questions for a season before switching',
] as const;
