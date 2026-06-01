# Concept: Architecture Overview

This repository is an RPC-driven blockchain explorer service for Bitcoin and SpaceXpanse ROD.

## Runtime entry points
- [`app.js`](app.js): Express application assembly (middleware, routes, app wiring).
- [`bin/www`](bin/www): Process startup wrapper that launches the HTTP server.

## Core implementation areas
- [`app/`](app/): Application logic, shared helpers, and APIs.
- [`app/coins/`](app/coins/): Per-coin configuration and policy.
- [`app/coins/rod.js`](app/coins/rod.js): SpaceXpanse ROD network, units, checkpoints, and protocol-facing explorer config.
- [`app/api/`](app/api/): RPC and external API integration layers.

## Static and documentation areas
- [`public/`](public/): Static assets served by the web UI.
- [`docs/`](docs/): Local repository documentation and operational notes.

## Scope note
Protocol-facing values should be treated as controlled configuration and updated only with canonical-source verification (see [`reference-canonical-rod-sources.md`](reference-canonical-rod-sources.md)).
