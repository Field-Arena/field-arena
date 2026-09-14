import {
  setMark,
  setCollective,
  setRemark,
  setFinalRemarks,
  toggleErrorAt,
} from '@/modules/scoring/data/mutations';

// The subset of scoring writes that are safe to replay later, unattended,
// after a reconnect. Each is idempotent (re-sending the same mark/value is a
// no-op) and scoped to one seat's own entry — see docs/offline-mode-plan.md.
export const OFFLINE_ACTIONS = {
  setMark,
  setCollective,
  setRemark,
  setFinalRemarks,
  toggleErrorAt,
} as const;

export type OfflineActionName = keyof typeof OFFLINE_ACTIONS;
