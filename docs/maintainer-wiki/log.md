# Maintainer Wiki Log

- 2025-06-01: Bootstrapped maintainer wiki structure and initial operating pages under [`docs/maintainer-wiki/`](docs/maintainer-wiki/).
- 2025-06-01: Updated wiki tech-stack.md with comprehensive dependency inventory from `package.json` (v3.5.1).
- 2025-06-01: Updated wiki workflows.md with current development, testing, build, and Docker workflows.
- 2025-06-01: Simplified open-work.md to reflect current clean state and periodic verification needs.
- 2025-06-01: Updated memory bank context with latest codebase analysis and wiki status.
- 2026-06-01: Implemented ROD ordered follow-up updates: unified API address parsing via [`utils.tryParseAddress()`](../../app/utils.js), updated ROD block/script limits and reward schedule in [`app/coins/rod.js`](../../app/coins/rod.js), added focused coverage in [`test/rod-followup.test.js`](../../test/rod-followup.test.js), and documented remaining genesis verification gaps.
- 2026-06-01: Documented post-audit remediation outcomes for ROD compliance: API tx fee unit now follows active coin unit and ROD mode hides BTC-only tools; recorded that supply/UTXO checkpoints in [`app/coins/rod.js`](../../app/coins/rod.js) remain `UNVERIFIED` placeholders pending canonical verification (Evidence: [`app/coins/rod.js`](../../app/coins/rod.js), [`docs/maintainer-wiki/open-work.md`](open-work.md)).
- 2026-06-01: Corrected stale test-workflow note; [`npm run test-rod-address`](../../package.json) now maps to existing [`test/rod-address-validation.test.js`](../../test/rod-address-validation.test.js) (Evidence: [`package.json`](../../package.json), [`test/rod-address-validation.test.js`](../../test/rod-address-validation.test.js)).
- 2026-06-02: Documented API docs route consistency cleanup for public references: migration/docs wording now uses current endpoints (`/api/block/:hashOrHeight`, `/api/tx/:txid`) to match API router/docs behavior, with changelog tracking in [`CHANGELOG-API.md`](../../CHANGELOG-API.md) and [`CHANGELOG.md`](../../CHANGELOG.md).
