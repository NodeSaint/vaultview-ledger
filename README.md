# VaultView

> Hardware-wallet-connected portfolio tracker with a retro terminal aesthetic.

```
╔══════════════════════════════════════╗
║  VAULTVIEW v0.1.0                    ║
║  Hardware Wallet Portfolio Tracker   ║
╚══════════════════════════════════════╝
```

## What is this?

VaultView connects directly to a Ledger hardware wallet via WebHID, reads on-chain balances across multiple networks, and renders them in a CRT-style terminal dashboard. Live price feeds via public APIs. DCA tracking with local-only storage.

**No accounts. No cloud. No telemetry.** Plug in your Ledger, confirm on-device, see your balances. Close the tab and nothing persists except what you explicitly save.

## Browser Support

**Chromium-based browsers only** (Chrome, Edge, Brave, Arc, Opera).
WebHID is not available in Firefox or Safari.

## Supported Chains (v1)

| Chain | Balances | Tokens |
|---|---|---|
| Ethereum | ETH | ERC-20 (curated list + custom) |
| Solana | SOL | SPL tokens |

## Quick Start

```bash
git clone https://github.com/<owner>/vaultview.git
cd vaultview
npm install --frozen-lockfile
npm run dev
```

Open `http://localhost:3000` in a Chromium browser.

## Tech Stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **Ledger Device Management Kit** (DMK) + WebHID
- **Tailwind CSS** — CRT terminal aesthetic
- **CoinGecko** (primary) + **CoinCap** (fallback) for price data
- **Vitest** + **Playwright** for testing

## Security

- Strict Content Security Policy
- All API responses validated with Zod
- No third-party analytics or tracking
- WebHID scoped to Ledger vendor ID only
- Session data never logged or persisted
- `npm audit` enforced in CI

See [CONTRIBUTING.md](CONTRIBUTING.md) for security reporting guidelines.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE)
