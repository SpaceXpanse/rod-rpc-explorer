# Concept: ROD Chainparams Parity

Explorer-side ROD configuration must stay aligned with canonical core chain parameters.

## Why parity matters
- Mismatches can cause incorrect explorer rendering, address/network validation errors, or misleading protocol presentation.
- Local behavior is currently defined in [`app/coins/rod.js`](app/coins/rod.js).

## Working references
- Local validation snapshot: [`ROD_VALIDATION_SUMMARY.md`](../../ROD_VALIDATION_SUMMARY.md)
- Local protocol-facing config: [`app/coins/rod.js`](app/coins/rod.js)
- Local protocol-focused tests: [`test/rod-followup.test.js`](../../test/rod-followup.test.js)
- Canonical upstream source set: [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md)

## Current parity notes (2026-06-01)
- ROD explorer block/script limits are set to `400000` weight, `100000` size, `8000` sigops, and `2048` script element bytes in [`app/coins/rod.js`](../../app/coins/rod.js).
- Reward schedule now uses explicit pre-release boundary (`0..55559` = `1 ROD`) and starts standard emission at height `55560`, with post-five-year inflation by yearly (`1,054,080` blocks) 3% compounding intervals in [`app/coins/rod.js`](../../app/coins/rod.js).
- API/UI address parsing is unified via [`utils.tryParseAddress()`](../../app/utils.js) in [`routes/apiRouter.js`](../../routes/apiRouter.js) and covered by [`test/rod-followup.test.js`](../../test/rod-followup.test.js).

## Rule
Do not change protocol-facing values in explorer config unless verified against canonical upstream core/spec sources; mark uncertain fields as `UNVERIFIED` (Evidence: [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md)).
