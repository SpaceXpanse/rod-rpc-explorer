# Gotcha: RPC Performance in Slow-Device Mode

RPC calls that are conditionally expensive can regress in slow-device mode if skip-logic is not maintained consistently across code paths.

## Affected local fields
- `/utxo-set` page and snippet route: slow-device mode handling of UTXO set summary fetching in [`routes/snippetRouter.js`](../../routes/snippetRouter.js), [`app.js`](../../app.js), and [`app/utxoSetSummary.js`](../../app/utxoSetSummary.js).
- RPC methods called from slow-device context: `gettxoutsetinfo` (expensive when `coinstatsindex` is not available), and others that scale with chain state size.

## Risk
- Slow-device mode (`BTCEXP_SLOW_DEVICE_MODE=true`) is intended to protect nodes with limited resources.
- If a feature calls an expensive RPC without checking for `coinstatsindex` availability, it can trigger multi-second hangs or OOM even when the node lacks the index.
- Stale or missing skip-logic can cause regressions after refactoring, particularly when routes/models are updated independently.

## Maintainer rule
- Before adding or refactoring RPC calls in slow-device mode paths, verify that:
  1. Check `global.coinstatsindex` or equivalent availability flag exists.
  2. Skip expensive RPC calls (e.g., `gettxoutsetinfo`) if the required index is unavailable; render a clear "not available" or "disabled" UI state.
  3. Use a centralized skip-logic helper function (e.g., [`shouldSkipUtxoSetSummaryFetch()`](../../app/utxoSetSummary.js:5)) to avoid duplicating conditions.
  4. Reset any pending-state flags (e.g., `global.utxoSetSummaryPending`) via `finally` blocks to prevent stale state leaks.
- Test the slow-device path explicitly: set `slowDeviceMode=true` without `coinstatsindex` available and verify that the page loads without triggering the expensive RPC.

## Status note (2026-06-02)
- UTXO Set page: fixed regression where `coreApi.getUtxoSetSummary()` was unconditionally called, causing `gettxoutsetinfo` fallback even when `coinstatsindex` was unavailable.
  - Solution implemented: [`shouldSkipUtxoSetSummaryFetch()`](../../app/utxoSetSummary.js) centralized helper, integrated into [`routes/snippetRouter.js`](../../routes/snippetRouter.js) routing logic.
  - Evidence: [`app.js`](../../app.js:720), [`app/utxoSetSummary.js`](../../app/utxoSetSummary.js:5), [`test/rod-followup.test.js`](../../test/rod-followup.test.js) (11/11 tests passing).
