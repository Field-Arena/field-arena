/** One judge in an organization's directory, with the shows they are in. */
export interface JudgeListItem {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phone: string | null;
  usefId: string | null;
  usefIdSource: string | null;
  usefIdEnteredBy: string | null;
  usefIdVerifiedAt: string | null;
  usefIdUpdatedAt: string | null;
  shows: { id: string; name: string; upcoming: boolean }[];
}

/** The slim shape the "add from my judges" picker needs. */
export interface JudgePickerOption {
  id: string;
  name: string;
  email: string | null;
  usefId: string | null;
  /** Show ids this judge is already on, so the picker can grey them out. */
  showIds: string[];
}
