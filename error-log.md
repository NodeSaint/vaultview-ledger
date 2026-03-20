# VaultView Error Log

> All errors encountered during development are recorded here for review.
> Format: [timestamp] [severity] [module] — description + resolution

---

## Session: 2026-03-20

### Build & Tooling Errors

1. **[14:30] [HIGH] [build]** — Next.js 15.1.6 has CVE-2025-66478 (critical vulnerability)
   - **Resolution:** Upgraded to Next.js 15.5.14 (latest stable patched release)

2. **[14:35] [MED] [build]** — Tailwind CSS v4.0.6 incompatible with Next.js 15.5 (`Missing field 'negated' on ScannerOptions.sources`)
   - **Resolution:** Upgraded `tailwindcss` and `@tailwindcss/postcss` to latest v4.2.2

3. **[14:38] [MED] [lint]** — ESLint 9 flat config does not support `--ext` flag
   - **Resolution:** Changed lint script from `eslint . --ext .ts,.tsx` to `eslint .`

4. **[14:39] [MED] [lint]** — `eslint.config.mjs` and `postcss.config.mjs` not found by TypeScript project service
   - **Resolution:** Added `allowDefaultProject` to ESLint parserOptions for both files

5. **[14:40] [LOW] [lint]** — `no-control-regex` flagged intentional control character stripping in `sanitise.ts`
   - **Resolution:** Extracted regex to module-level const with eslint-disable comment explaining XSS prevention intent

6. **[14:41] [LOW] [lint]** — `@typescript-eslint/require-await` flagged `async` headers function in `next.config.ts`
   - **Resolution:** Replaced `async () =>` with `() => Promise.resolve()` pattern

7. **[14:42] [MED] [test]** — Vitest `jsdom` environment dependency missing
   - **Resolution:** Installed `jsdom` as dev dependency

8. **[14:42] [LOW] [test]** — Vitest exited with code 1: no test files found
   - **Resolution:** Created test files for `sanitise.ts`, `validate.ts`, and `errors.ts`

### Security Audit

9. **[14:30] [LOW] [security]** — `npm audit` reports 2 low-severity vulnerabilities in dependency tree
   - **Status:** OPEN — transitive dependencies, no direct fix available without `--force`
   - **Risk:** Low — not exploitable in our usage context

---
