# Gotcha: Genesis Metadata Verification

Genesis-related fields are easy to drift and high impact when wrong.

## Affected local fields
- [`app/coins/rod.js`](app/coins/rod.js) genesis-related sections (hashes, txids, coinbase transaction objects, and block stats).

## Risk
- Placeholder or stale genesis metadata can make explorer output appear valid while diverging from canonical chain definitions.

## Maintainer rule
- Before editing any genesis metadata, verify against canonical upstream sources in [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md).
- If a field cannot be confirmed from canonical sources at change time, mark the claim as `UNVERIFIED` and cite the exact source inspected (Evidence: [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md)).

## Status note (2026-06-01)
- Mainnet genesis block hash remains the currently verified local value in [`app/coins/rod.js`](../../app/coins/rod.js).
- Test/regtest/signet genesis sections still include placeholders and are treated as `UNVERIFIED` until canonical parity verification against upstream core/spec sources.
