# Reference: Tech Stack

## Core runtime and build
- Node.js runtime (18+ required, 22+ recommended) with npm scripts as standard entry points (Evidence: [`package.json`](../../package.json), [`README.md`](../../README.md)).
- Express-based server architecture for the explorer backend (Evidence: [`package.json`](../../package.json), [`app.js`](../../app.js)).
- Pug (^3.0.3) is used for server-side templating (Evidence: [`package.json`](../../package.json)).
- Sass (^1.90.0) is used for stylesheet compilation with multiple theme variants (Evidence: [`package.json`](../../package.json), [`package.json`"scripts"](../../package.json)).

## Testing and quality
- Mocha (^11.7.5) is used for test execution, including ROD-specific test suites (Evidence: [`package.json`](../../package.json), [`bin/test.js`](../../bin/test.js)).
- ESLint (^9.34.0) is configured for application linting with file-based routing (Evidence: [`package.json`](../../package.json), [`.eslintrc.js`](../../.eslintrc.js)).

## Blockchain and protocol libraries
- `bitcoinjs-lib` (^6.1.7) for Bitcoin transaction/script handling (Evidence: [`package.json`](../../package.json)).
- `bech32` (2.0.0) and `bs58check` (^4.0.0) for address encoding/decoding (Evidence: [`package.json`](../../package.json)).
- `bip32` (^4.0.0) for hierarchical deterministic wallet support (Evidence: [`package.json`](../../package.json)).
- `tiny-secp256k1` (^2.2.4) for elliptic curve cryptography (Evidence: [`package.json`](../../package.json)).

## Data and communication
- Axios (^1.11.0) for HTTP requests to external APIs (Evidence: [`package.json`](../../package.json)).
- Redis client (^4.7.1) for optional caching layer (Evidence: [`package.json`](../../package.json), [`app/redisCache.js`](../../app/redisCache.js)).
- `electrum-client` (github:janoside/electrum-client) for Electrum protocol integration (Evidence: [`package.json`](../../package.json), [`app/api/electrumAddressApi.js`](../../app/api/electrumAddressApi.js)).
- `zeromq` (^6.0.0) for potential real-time event streaming (Evidence: [`package.json`](../../package.json)).

## Utilities and DX
- `decimal.js` (^10.6.0) for precise financial calculations (Evidence: [`package.json`](../../package.json), [`app/coins/rod.js`](../../app/coins/rod.js)).
- `moment` (^2.30.1) and `moment-duration-format` (^2.3.2) for date/time handling (Evidence: [`package.json`](../../package.json)).
- `chart.js` (^4.5.0) for analytics charting (Evidence: [`package.json`](../../package.json), [`public/scss/`](../../public/scss/)).
- `qrcode` (^1.5.4) for QR code generation (Evidence: [`package.json`](../../package.json)).
- `lru-cache` (^10.4.3) for in-memory caching (Evidence: [`package.json`](../../package.json)).
- `markdown-it` (^14.1.0) for Markdown rendering (Evidence: [`package.json`](../../package.json)).

## Optional dependencies
- `event-loop-stats` (^1.4.1) for performance monitoring when available (Evidence: [`package.json`](../../package.json)).
