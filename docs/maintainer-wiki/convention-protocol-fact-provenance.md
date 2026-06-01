# Convention: Protocol Fact Provenance

## Core policy
- Runtime code and tests are authoritative over prose.
- Wiki content must never override executable behavior.

## Citation requirements
- Every open/deferred/known-bug/status claim must cite a falsifiable source:
  - repository path and/or test, or
  - canonical external source.

## `UNVERIFIED` handling
- If a protocol-facing value cannot be confirmed from canonical sources at change time, mark it `UNVERIFIED`.
- Do not present `UNVERIFIED` values as settled facts (Evidence: [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md)).

## Change discipline
- Protocol-facing edits in [`app/coins/rod.js`](app/coins/rod.js) must include provenance notes and source citations in the related wiki page.
