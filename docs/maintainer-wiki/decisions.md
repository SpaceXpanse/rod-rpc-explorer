# Decision Log

- 2026-06-01: Adopted tool-agnostic docs validation command `docs:check` alongside `wiki:lint` to keep existing workflow compatibility (Evidence: [`package.json`](../../package.json), [`.githooks/pre-push`](../../.githooks/pre-push)).
- 2026-06-01: Added evidence-aware wiki lint checks for required non-empty pages and status-claim evidence validation (Evidence: [`scripts/lint_wiki.js`](../../scripts/lint_wiki.js)).
- 2026-06-01: Kept volatile memory local-only and noncanonical under `.kilocode/`; durable knowledge remains in maintainer wiki pages (Evidence: [`.gitignore`](../../.gitignore), [`AGENTS.md`](../../AGENTS.md)).
- 2026-06-01: Kept ROD supply and UTXO checkpoint placeholders unchanged until canonical verification; API supply output must continue to present fallback as estimated when live UTXO summary is unavailable (Evidence: [`app/coins/rod.js`](../../app/coins/rod.js), [`routes/apiRouter.js`](../../routes/apiRouter.js)).
- 2026-06-01: ROD mode hides BTC-specific tools (`Whitepaper Extractor`, `Quotes`, `Holidays`) through `isRodCoin` and per-tool `isEnabled` gating to avoid BTC-only UX leakage (Evidence: [`app/config.js`](../../app/config.js)).
- 2026-06-01: API transaction fee unit rendering is active-coin-based via `global.coinConfig.defaultCurrencyUnit.name`, replacing prior BTC-specific unit behavior (Evidence: [`routes/apiRouter.js`](../../routes/apiRouter.js)).
