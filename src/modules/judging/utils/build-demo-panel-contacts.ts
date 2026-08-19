import type { PanelContact } from '@/modules/judging/data/queries';
import { DEMO_PANEL_CONTACTS } from '@/modules/judging/constants';

/** Turns the static DEMO_PANEL_CONTACTS constant into real PanelContact shapes — see buildDemoAssignments for the fuller reasoning. */
export function buildDemoPanelContacts(): PanelContact[] {
  return DEMO_PANEL_CONTACTS.map((c) => ({ ...c, classIds: [...c.classIds] }));
}
