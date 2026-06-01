# Reference: Workflows

## Getting started
- First-time setup: `npm install` (Evidence: [`package.json`](../../package.json)).
- Start the explorer: `npm start` (launches server on port 3002 by default) (Evidence: [`package.json`](../../package.json), [`bin/www`](../../bin/www)).

## Development and testing
- Run all tests: `npm test` (Evidence: [`package.json`](../../package.json), [`bin/test.js`](../../bin/test.js)).
- Run ROD-specific tests: `npm run test-rod` (mocha test/rod-tests.js) (Evidence: [`package.json`](../../package.json)).
- Run ROD address validation tests: `npm run test-rod-address` (mocha test/rod-address-validation.test.js) (Evidence: [`package.json`](../../package.json)).
- Run all ROD tests: `npm run test-all` (Evidence: [`package.json`](../../package.json)).

## Build and CSS
- Build all CSS variants (light, dark, dark-v1): `npm run css` (compiles and compresses with integrity hashes) (Evidence: [`package.json`](../../package.json), [`bin/frontend-resource-integrity.js`](../../bin/frontend-resource-integrity.js)).
- Debug CSS (uncompressed): `npm run css-debug` (Evidence: [`package.json`](../../package.json)).
- Individual themes: `npm run css-light`, `npm run css-dark`, `npm run css-dark-v1` (Evidence: [`package.json`](../../package.json)).

## Mining pool configuration
- Refresh mining pool configs: `npm run miners` (Evidence: [`package.json`](../../package.json), [`bin/refresh-mining-pool-configs.js`](../../bin/refresh-mining-pool-configs.js)).

## Code quality
- Lint application code: `npm run lint` (Evidence: [`package.json`](../../package.json), [`.eslintrc.js`](../../.eslintrc.js)).

## Wiki/documentation checks
- Run docs validation: `npm run docs:check` (Evidence: [`package.json`](../../package.json), [`scripts/lint_wiki.js`](../../scripts/lint_wiki.js)).
- Legacy alias: `npm run wiki:lint` (Evidence: [`package.json`](../../package.json)).
- Pre-push hook automatically blocks push when docs checks fail (Evidence: [`.githooks/pre-push`](../../.githooks/pre-push)).

## Docker
- Build Docker image: `docker build -t btc-rpc-explorer .` (Evidence: [`Dockerfile`](../../Dockerfile), [`docker-compose.yml`](../../docker-compose.yml)).
- Run container: `docker run -it -p 3002:3002 -e BTCEXP_HOST=0.0.0.0 btc-rpc-explorer` (Evidence: [`docker-compose.yml`](../../docker-compose.yml)).

## Maintainer wiki updates
- Add durable protocol and behavior notes under [`docs/maintainer-wiki/`](./) ensuring they are referenced in [`index.md`](index.md) (Evidence: [`docs/maintainer-wiki/index.md`](index.md)).
- Always run `npm run docs:check` before committing wiki changes (Evidence: [`scripts/lint_wiki.js`](../../scripts/lint_wiki.js)).

