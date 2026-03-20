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

### Full App Build Errors

9. **[15:00] [MED] [types]** — `ethBalanceResponseSchema.result` can be undefined, but `BigInt()` requires a value
   - **Resolution:** Added `?? "0x0"` fallback for undefined ETH balance results

10. **[15:00] [MED] [types]** — Solana signer `getAddress` output type mismatch — `result.publicKey` not on `string` type
    - **Resolution:** Added runtime type narrowing: `typeof result === "string" ? result : result.publicKey`

11. **[15:01] [LOW] [types]** — `getDcaSummary` return type missing `asset` field
    - **Resolution:** Spread `calculateCostBasis` result with explicit `asset` field

12. **[15:05] [MED] [lint]** — Multiple strict TypeScript-ESLint violations across new modules
    - `no-floating-promises` in DMK client (`stopDiscovering` calls)
    - `no-unsafe-enum-comparison` in ETH/SOL signer state checks
    - `no-misused-promises` on async click handlers
    - `no-non-null-assertion` in DCA update function
    - `no-require-imports` in export module
    - `react-hooks/exhaustive-deps` in Dashboard hooks
    - **Resolution:** All fixed — void operators, String() coercion, stable refs, proper imports

13. **[15:15] [HIGH] [security]** — CSP `script-src 'self'` blocks Next.js inline hydration scripts
    - **Root cause:** Next.js injects inline scripts for client-side hydration bootstrap
    - **Resolution:** Added `'unsafe-inline'` to `script-src` (required by Next.js architecture). Dev mode also adds `'unsafe-eval'` for Turbopack HMR. Added `ws://localhost:*` to `connect-src` in dev only for HMR WebSocket.
    - **Note:** For production hardening, consider migrating CSP to Next.js middleware with per-request nonces

14. **[15:20] [LOW] [e2e]** — Playwright DCA test strict mode violation: `getByText('$3,000.00')` matched 2 elements
    - **Resolution:** Used `.first()` selector to disambiguate

### Security Audit

15. **[14:30] [LOW] [security]** — ESLint `@eslint/plugin-kit` ReDoS vulnerability
    - **Resolution:** Upgraded ESLint from 9.20.0 to 9.27.0

16. **[15:00] [HIGH] [security]** — `bigint-buffer` buffer overflow in `@ledgerhq/device-signer-kit-solana` dependency chain
    - **Status:** OPEN — 4 high severity, all in `bigint-buffer` → `@solana/buffer-layout-utils` → `@solana/spl-token` → Ledger Solana signer
    - **Risk:** Medium — buffer overflow in BigInt conversion. Exploitation requires malicious input to the buffer conversion. In our usage, input comes from Ledger device responses which are trusted.
    - **Mitigation:** Pin Solana signer version. Monitor Ledger SDK releases for fix. Cannot upgrade without breaking changes.

---
