# Contributing to VaultView

Thanks for your interest in contributing. This document covers the basics.

## Getting Started

```bash
git clone https://github.com/<owner>/vaultview.git
cd vaultview
npm install --frozen-lockfile
npm run dev
```

## Branch Naming

- `feat/` — new features
- `fix/` — bug fixes
- `sec/` — security-related changes
- `docs/` — documentation only

## Commit Messages

Conventional commits, imperative mood, max 72 characters.

```
feat: add SOL balance fetching via Helius RPC
fix: handle device disconnect during derivation
sec: validate RPC URLs against blocklist
```

## Code Standards

- TypeScript strict — no `any`, no untyped casts without a comment
- Functional components only, named exports
- Zod validation on all external data (API responses, localStorage reads)
- Tailwind utilities or CSS modules — no inline styles
- British English in UI copy and documentation

## Security

If you find a security vulnerability, **do not open a public issue**. Please email the maintainers directly (see `SECURITY.md` when available).

All PRs touching `lib/dmk/`, `lib/security/`, `next.config.ts`, or any file importing `fetch` will receive an additional security review.

## Testing

- Unit tests: `npm test` (Vitest)
- E2E tests: `npm run test:e2e` (Playwright)
- Colocate test files as `*.test.ts` next to source
- No snapshot tests — prefer behavioural assertions

## Pull Requests

- One logical change per PR
- Squash merge to `main`
- All CI checks must pass before merge
- Include a brief description of what changed and why
