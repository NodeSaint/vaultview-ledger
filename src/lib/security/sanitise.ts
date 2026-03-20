// eslint-disable-next-line no-control-regex -- intentional: strip control chars for XSS prevention
const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;
const DANGEROUS_CHARS = /[<>"'&]/g;

/** Sanitise user-configurable strings before render. */
export function sanitiseDisplayString(input: string, maxLength = 256): string {
  return input
    .replace(DANGEROUS_CHARS, "")
    .replace(CONTROL_CHARS, "")
    .slice(0, maxLength)
    .trim();
}
