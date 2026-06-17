# Gotcha: Genesis Metadata Verification

Genesis-related fields are easy to drift and high impact when wrong.

## Affected local fields
- [`app/coins/rod.js`](app/coins/rod.js) genesis-related sections (hashes, txids, coinbase transaction objects, and block stats).

## Risk
- Placeholder or stale genesis metadata can make explorer output appear valid while diverging from canonical chain definitions.

## Maintainer rule
- Before editing any genesis metadata, verify against canonical upstream sources in [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md).
- If a field cannot be confirmed from canonical sources at change time, mark the claim as `UNVERIFIED` and cite the exact source inspected (Evidence: [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md)).

## Status note (2026-06-17)
- Mainnet genesis metadata in [`app/coins/rod.js`](../../app/coins/rod.js) was corrected against a live local ROD RPC node after block 0 rendered a nonexistent address and wrong transaction on the explorer. Verified fields now include the mainnet genesis txid, coinbase transaction object, output address, output script, Electrum scripthash, and block-0 fallback stats timestamps (Evidence: [`app/coins/rod.js`](../../app/coins/rod.js), [`app/api/rpcApi.js`](../../app/api/rpcApi.js), [`app/api/electrumAddressApi.js`](../../app/api/electrumAddressApi.js)).
- The mainnet genesis fallback subsidy value in [`genesisBlockStatsByNetwork.main.subsidy`](../../app/coins/rod.js) is documented as display-only because the exact bar-denominated integer exceeds JavaScript `Number.MAX_SAFE_INTEGER` (Evidence: [`app/coins/rod.js`](../../app/coins/rod.js)).
- Test/regtest/signet genesis sections still include placeholders and are treated as `UNVERIFIED` until canonical parity verification against upstream core/spec sources (Evidence: [`app/coins/rod.js`](../../app/coins/rod.js), [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md)).
