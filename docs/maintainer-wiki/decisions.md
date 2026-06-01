# Decision Log

- 2026-06-01: Adopted tool-agnostic docs validation command `docs:check` alongside `wiki:lint` to keep existing workflow compatibility (Evidence: [`package.json`](../../package.json), [`.githooks/pre-push`](../../.githooks/pre-push)).
- 2026-06-01: Added evidence-aware wiki lint checks for required non-empty pages and status-claim evidence validation (Evidence: [`scripts/lint_wiki.js`](../../scripts/lint_wiki.js)).
- 2026-06-01: Kept volatile memory local-only and noncanonical under `.kilocode/`; durable knowledge remains in maintainer wiki pages (Evidence: [`.gitignore`](../../.gitignore), [`AGENTS.md`](../../AGENTS.md)).

