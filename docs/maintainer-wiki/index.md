# Maintainer Wiki Index

- [README](README.md) — Overview of the maintainer wiki and how to use it.
- [Maintainer log](log.md) — Dated notable decisions, gotchas, and initialization notes.
- [Concept: Architecture overview](concept-architecture-overview.md) — High-level map of explorer runtime and core source directories.
- [Concept: ROD chainparams parity](concept-rod-chainparams-parity.md) — Why explorer-side ROD config must stay aligned with canonical core/spec parameters.
- [Gotcha: Genesis metadata verification](gotcha-genesis-metadata.md) — Genesis fields are high-risk and must be re-verified before edits.
- [Gotcha: Name/value validation](gotcha-name-value-validation.md) — Current validation risk areas and where behavior is defined.
- [Gotcha: RPC performance in slow-device mode](gotcha-rpc-performance-slow-device.md) — Expensive RPC calls can regress if skip-logic is not maintained consistently in slow-device paths.
- [Reference: Canonical ROD sources](reference-canonical-rod-sources.md) — Source hierarchy for protocol facts and non-canonical visibility sources.
- [Convention: Protocol fact provenance](convention-protocol-fact-provenance.md) — Citation rules, UNVERIFIED handling, and code-wins policy.
- [Reference: Tech stack](tech-stack.md) — Evidence-backed inventory of runtime stack and key tools used in this repository.
- [Reference: Workflows](workflows.md) — Practical maintainer workflows anchored to current scripts, hooks, and docs checks.
- [Decision log](decisions.md) — Durable maintainer decisions with dated entries and evidence links.
- [Open work](open-work.md) — Explicit unresolved items with same-line evidence references.
- [Agent guide](agent-guide.md) — Agent operating notes that defer canonical facts to this wiki index and AGENTS policy.
