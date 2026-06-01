# Concept: ROD Chainparams Parity

Explorer-side ROD configuration must stay aligned with canonical core chain parameters.

## Why parity matters
- Mismatches can cause incorrect explorer rendering, address/network validation errors, or misleading protocol presentation.
- Local behavior is currently defined in [`app/coins/rod.js`](app/coins/rod.js).

## Working references
- Local validation snapshot: [`ROD_VALIDATION_SUMMARY.md`](../../ROD_VALIDATION_SUMMARY.md)
- Local protocol-facing config: [`app/coins/rod.js`](app/coins/rod.js)
- Canonical upstream source set: [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md)

## Rule
Do not change protocol-facing values in explorer config unless verified against canonical upstream core/spec sources; mark uncertain fields as `UNVERIFIED` (Evidence: [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md)).
