export interface ActionFailure {
  ok: false;
  error: string;
}

export function fail(error: string): ActionFailure {
  return { ok: false, error };
}

export type CreateOrganizationResult = { ok: true; id: string; name: string } | ActionFailure;
export type AddSuperAdminResult = { ok: true; email: string } | ActionFailure;
