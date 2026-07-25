import './dashboard.css';
import { OrganizerShell } from '@/modules/staff/ui/organizer-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <OrganizerShell>{children}</OrganizerShell>;
}
