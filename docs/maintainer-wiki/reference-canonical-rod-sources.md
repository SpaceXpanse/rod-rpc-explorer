# Reference: Canonical ROD Sources

Use this hierarchy when validating protocol-facing ROD facts.

## Canonical (protocol truth)
1. Local spec bundle and protocol docs under [`docs/`](docs/)
2. Upstream core wallet implementation repository: <https://github.com/SpaceXpanse/rod-core-wallet>
3. Official ROD coin page: <https://www.spacexpanse.org/rod-coin.html>

## Local implementation references (not protocol truth by themselves)
- [`app/coins/rod.js`](app/coins/rod.js)
- [`ROD_VALIDATION_SUMMARY.md`](../../ROD_VALIDATION_SUMMARY.md)

## Non-canonical visibility sources
- CoinGecko: <https://www.coingecko.com/en/coins/spacexpanse>
- CoinPaprika: <https://coinpaprika.com/coin/rod-spacexpanse/>
- Explorer: <https://explorer.rod.spacexpanse.org>
- API endpoint visibility: <http://api.spacexpanse.org:1234>

Use non-canonical sources for operational or market visibility only, never as consensus authority.
