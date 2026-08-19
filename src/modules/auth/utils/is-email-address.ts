export function isEmailAddress(value: string | undefined): value is string {
  return !!value && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}
