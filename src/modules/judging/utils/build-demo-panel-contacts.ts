import type { PanelContact } from '@/modules/judging/data/queries';
import { DEMO_PANEL_CONTACTS } from '@/modules/judging/constants';

export function buildDemoPanelContacts(): PanelContact[] {
  return DEMO_PANEL_CONTACTS.map((c) => ({ ...c, classIds: [...c.classIds] }));
}
