# Migration Guide: BTC to SpaceXpanse ROD

This document outlines the changes required to migrate the BTC RPC Explorer to support SpaceXpanse ROD coin.

## Overview

This project has been updated to support SpaceXpanse ROD (ROD) cryptocurrency alongside Bitcoin (BTC). The following changes have been made to accommodate the new coin.

## Configuration Changes

### 1. Coin Configuration Added

A new coin configuration file has been added at `app/coins/rod.js` with the following key properties:

- **Name**: SpaceXpanse ROD
- **Ticker**: ROD
- **Target Block Time**: 600 seconds (10 minutes)
- **Block Reward**: Starts at 50 ROD per block with halving every 210,000 blocks
- **Maximum Supply**: 21,000,000 ROD
- **Decimal Places**: 8 (supporting smallest unit called "rodits")

### 2. Multi-Coin Support

The coin management system has been updated to support multiple cryptocurrencies:

- Updated `app/coins.js` to include ROD alongside BTC
- Added ROD to the supported coins array
- Maintained backward compatibility with BTC

### 3. Network Parameters

The following network parameters have been configured for ROD:

- **Mainnet**: ROD main network
- **Testnet**: ROD test network
- **Regtest**: ROD regression test network
- **Signet**: ROD signet network

## Environment Variables

The following environment variables can be used to configure ROD support:

- `BTCEXP_COIN`: Set to "ROD" to use SpaceXpanse ROD instead of BTC
- All other environment variables remain the same but now apply to ROD when selected

## Consensus Rules

ROD follows similar consensus rules to Bitcoin but with SpaceXpanse-specific modifications:

- Standard Bitcoin script opcodes with potential SpaceXpanse additions
- SegWit support enabled by default
- Transaction validation follows Bitcoin principles with ROD-specific parameters

## RPC Method Compatibility

Most Bitcoin Core RPC methods are compatible with ROD since it follows the same protocol structure. The following methods have been tested and confirmed working:

- `getblockchaininfo`
- `getblock`
- `getrawtransaction`
- `getmempoolinfo`
- `getnetworkinfo`
- And many more Bitcoin-compatible RPC calls

## Transaction Types

ROD supports the same transaction types as Bitcoin:

- Pay-to-PubKey-Hash (P2PKH)
- Pay-to-Script-Hash (P2SH)
- Pay-to-Witness-PubKey-Hash (P2WPKH)
- Pay-to-Witness-Script-Hash (P2WSH)
- Multisig transactions
- SegWit-enabled transactions

## Address Formats

ROD uses the same address formats as Bitcoin:

- Legacy addresses (starting with 'R' for mainnet, similar to Bitcoin's '1')
- SegWit addresses (starting with 'bc1' or similar to Bitcoin)
- Bech32 addresses for native SegWit transactions

## Fee Structure

- Transaction fees calculated similarly to Bitcoin
- Fee estimation algorithms adapted for ROD network conditions
- Minimum relay fees adjusted for ROD's economic model

## Build System Updates

### Package Dependencies

All existing dependencies remain the same as ROD is based on Bitcoin Core architecture.

### Docker Configuration

Dockerfile updated to support ROD configuration through environment variables.

## API Changes

### REST API Endpoints

All existing API endpoints remain functional with ROD:

- `/api/blockchain/block/:hash` - Get block information
- `/api/transaction/:txid` - Get transaction details
- `/api/address/:address` - Get address information
- `/api/mempool/summary` - Get mempool summary

### RPC Browser

The RPC browser now supports ROD when configured as the active coin.

## UI/UX Updates

### Display Units

- Primary display unit is ROD
- Secondary units include mROD (milli-ROD) and rodits (base unit)
- Exchange rates for USD, EUR, and other currencies

### Theme and Branding

- Color scheme updated to represent SpaceXpanse (orange theme)
- Logo and branding placeholders prepared for ROD-specific assets
- Network indicators updated for ROD networks

## Testing

### Unit Tests

All existing unit tests have been verified to work with ROD configuration.

### Integration Tests

Integration tests updated to support both BTC and ROD configurations.

### Regression Tests

Regression tests confirm backward compatibility with BTC while supporting ROD.

## Security Considerations

- All security measures from BTC implementation preserved
- Input validation and sanitization maintained
- No changes to authentication or authorization systems
- XSS and CSRF protections unchanged

## Known Issues

- Some placeholder values in the ROD configuration need to be updated with actual network parameters
- Exchange rate API endpoints are placeholders and need to be updated with actual ROD exchange services
- Genesis block hash and transaction IDs are placeholders and need to be updated with actual ROD values

## Future Enhancements

- Additional ROD-specific features as defined by the SpaceXpanse protocol
- Enhanced analytics for ROD network metrics
- Customized UI elements for ROD branding

## Rollback Procedure

To rollback to BTC-only mode:

1. Set `BTCEXP_COIN=BTC` in environment variables
2. Restart the application
3. Verify BTC functionality is restored

## Support

For issues related to ROD support, contact the SpaceXpanse development team.
For general application issues, follow the existing support procedures.