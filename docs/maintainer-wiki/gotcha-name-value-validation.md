# Gotcha: Name/Value Validation

ROD name/value constraints are protocol-sensitive and can be under-validated in explorer-side logic.

## Current behavior surface
- Coin-specific protocol configuration is in [`app/coins/rod.js`](app/coins/rod.js).
- Validation and implementation status notes are described in [`ROD_VALIDATION_SUMMARY.md`](../../ROD_VALIDATION_SUMMARY.md).

## Risk pattern
- If name namespace, encoding, or value-shape constraints are assumed rather than verified, explorer output may misrepresent protocol validity.

## Maintainer rule
- Treat strict name/value constraints as `UNVERIFIED` unless confirmed by canonical sources listed in [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md).
- For any open/deferred status claim, include a falsifiable citation to repo code/tests or canonical external source.
