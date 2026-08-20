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
