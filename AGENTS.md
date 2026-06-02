# ROD RPC Explorer — Maintainer Operating Manual

## Project identity
- This repository is a self-hosted explorer for Bitcoin and SpaceXpanse ROD, with ROD coin configuration centered in `app/coins/rod.js`.

## Source-of-truth policy
- Runtime behavior and tests are authoritative over wiki prose.
- Canonical ROD protocol facts must be verified against upstream core/spec sources before changing protocol-facing values.
- Market trackers and third-party dashboards are visibility sources, not consensus truth.

## Maintainer wiki rule
- Before architecture, protocol, explorer config, RPC, supply, or validation work, read `docs/maintainer-wiki/index.md`.
- When changing non-obvious behavior or fixing bugs documented by the wiki, update the relevant wiki page in the same change.
- Append dated notable decisions/gotchas to `docs/maintainer-wiki/log.md`.

## Citation rule
- Every open/deferred/known-bug/status claim in the wiki must include a falsifiable citation to a repo path, test, or canonical external source.

## Security rule
- Never store credentials, private keys, tokens, local machine secrets, or sensitive RPC credentials in wiki content.

## Tooling rule
- Run `npm run wiki:lint` (or `npm run docs:check`) before completing wiki-related changes.

## Volatile memory rule (noncanonical)
- If local volatile memory exists at `.kilocode/rules/memory-bank/`, update `.kilocode/rules/memory-bank/context.md` and `.kilocode/rules/memory-bank/active.md` after significant work, on explicit memory-update requests, and before final completion of multi-step tasks.
- During each such volatile memory update loop, also update `CHANGELOG.md` with a concise `Unreleased` release-note entry that reflects task codebase/docs/test changes, or explicitly confirm in the memory update that `CHANGELOG.md` is already up to date for the task.
- Durable knowledge must be written to `docs/maintainer-wiki/` and indexed in `docs/maintainer-wiki/index.md`.
