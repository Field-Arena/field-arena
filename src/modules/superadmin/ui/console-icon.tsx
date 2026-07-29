import {
  CreditCardIcon,
  EyeIcon,
  FileTextIcon,
  HouseIcon,
  TableIcon,
  TrendingUpIcon,
  TrophyIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';

/**
 * Sidebar icons, keyed by the `icon` field on the console nav constants.
 *
 * A lookup rather than icons stored in constants.ts: that file is the
 * constants layer and may not import runtime code, so it carries a string and
 * this resolves it.
 */
const ICONS: Record<string, LucideIcon> = {
  organizers: HouseIcon,
  users: UsersIcon,
  funnel: TrendingUpIcon,
  catalog: TableIcon,
  documents: FileTextIcon,
  billing: CreditCardIcon,
  preview: EyeIcon,
  demo: TrophyIcon,
};

export function ConsoleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? TableIcon;
  return <Icon className={className} aria-hidden />;
}
