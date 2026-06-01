"use strict";

const Decimal = require("decimal.js");
const Decimal8 = Decimal.clone({ precision:8, rounding:8 });

const PRE_RELEASE_BLOCK_COUNT = 55560;
const PRE_RELEASE_BLOCK_REWARD = new Decimal8(1);
const STANDARD_BLOCK_REWARD = new Decimal8(800);
const HALVING_INTERVAL = 1054080;
const HALVING_YEARS = 5;
const ANNUAL_INFLATION_RATE = new Decimal8(0.03);

const blockRewardEras = [ STANDARD_BLOCK_REWARD ];
for (let i = 1; i <= HALVING_YEARS; i++) {
	let previous = blockRewardEras[i - 1];
	blockRewardEras.push(new Decimal8(previous).dividedBy(2));
}

const postHalvingBaseReward = blockRewardEras[HALVING_YEARS];

const currencyUnits = [
	{
		type:"native",
		name:"ROD",
		multiplier:1,
		default:true,
		values:["", "rod", "ROD"],
		decimalPlaces:8
	},
	{
		type:"native",
		name:"mROD",
		multiplier:1000,
		values:["mrod"],
		decimalPlaces:5
	},
	{
		type:"native",
		name:"Bar",
		multiplier:100000000,
		values:["bar", "Bar"],
		decimalPlaces:0
	},
	{
		type:"native",
		name:"KBar",
		multiplier:100000,
		values:["kbar", "KBar"],
		decimalPlaces:0
	},
	{
		type:"native",
		name:"MBar",
		multiplier:100,
		values:["mbar", "MBar"],
		decimalPlaces:0
	},
	{
		type:"native",
		name:"rodits",
		multiplier:100000000,
		values:["rodits", "roditi"],
		decimalPlaces:0
	},
	{
		type:"exchanged",
		name:"USD",
		multiplier:"usd",
		values:["usd"],
		decimalPlaces:2,
		symbol:"$"
	},
	{
		type:"exchanged",
		name:"EUR",
		multiplier:"eur",
		values:["eur"],
		decimalPlaces:2,
		symbol:"€"
	},
];

module.exports = {
	name:"SpaceXpanse ROD",
	ticker:"ROD",
	logoUrlsByNetwork:{
		"main":"./img/network-mainnet/logo.svg",
		"test":"./img/network-testnet/logo.svg",
		"regtest":"./img/network-regtest/logo.svg",
		"signet":"./img/network-signet/logo.svg"
	},
	coinIconUrlsByNetwork:{
		"main":"./img/network-mainnet/coin-icon.svg",
		"test":"./img/network-testnet/coin-icon.svg",
		"signet":"./img/network-signet/coin-icon.svg",
		"regtest":"./img/network-regtest/coin-icon.svg"
	},
	coinColorsByNetwork: {
		"main": "#1E3A8A", // Deep blue color representing space
		"test": "#1daf00",
		"signet": "#af008c",
		"regtest": "#777"
	},
	siteTitlesByNetwork: {
		"main":"SpaceXpanse ROD Explorer",
		"test":"ROD Testnet Explorer",
		"regtest":"ROD Regtest Explorer",
		"signet":"ROD Signet Explorer",
	},
	addressValidation: {
		base58VersionBytesByNetwork: {
			"main": {
				p2pkh: [60],
				p2sh: [75]
			},
			"test": {
				p2pkh: [111],
				p2sh: [196]
			},
			"regtest": {
				p2pkh: [111],
				p2sh: [196]
			},
			"signet": {
				p2pkh: [111],
				p2sh: [196]
			}
		},
		bech32HrpByNetwork: {
			"main": ["rod"],
			"test": ["rod", "trod"],
			"regtest": ["rod", "bcrt"],
			"signet": ["rod", "tb"]
		}
	},
	demoSiteUrlsByNetwork: {
		"main": "https://rod.space", // Official SpaceXpanse explorer
		"test": "https://testnet.rod.space",
		"signet": "https://signet.rod.space",
	},
	knownTransactionsByNetwork: {
		main: "e0e442db4534d8821148b4e29d3fab135a89d2616a07a178b9e8813e8c43f0a9", // SpaceXpanse ROD genesis transaction
		test: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b", // Placeholder
		signet: "39332e10af6fe491e8ae4ba1e2dd674698fedf8aa3c8c42bf71572debc1bb5b9" // Placeholder
	},
	miningPoolsConfigUrls:[
		"https://raw.githubusercontent.com/SpaceXpanse/ROD-Known-Miners/master/miners.json", // Official SpaceXpanse miners list
		"https://raw.githubusercontent.com/SpaceXpanse/ROD-Mining-Pools/master/pools.json", // Official SpaceXpanse pools list
	],
	maxBlockWeight: 400000,
	maxBlockSize: 100000,
	maxBlockSigops: 8000,
	maxScriptElementSize: 2048,
	minTxBytes: 166, // Same as BTC for compatibility
	minTxWeight: 166 * 4, // Same as BTC for compatibility
	difficultyAdjustmentBlockCount: 2016, // Same as BTC for compatibility
	maxSupplyByNetwork: {
		"main": new Decimal("4615066365"), // 4.615 billion ROD maximum supply as per SpaceXpanse specifications
		"test": new Decimal("4615066365"),
		"regtest": new Decimal("4615066365"),
		"signet": new Decimal("4615066365")
	},
	targetBlockTimeSeconds: 30, // 30 seconds as per SpaceXpanse specifications
	targetBlockTimeMinutes: 0.5,
	currencyUnits:currencyUnits,
	currencyUnitsByName:{"ROD":currencyUnits[0], "mROD":currencyUnits[1], "Bar":currencyUnits[2], "KBar":currencyUnits[3], "MBar":currencyUnits[4], "rodits":currencyUnits[5]},
	baseCurrencyUnit:currencyUnits[2], // Bar as base unit (smallest divisible unit)
	defaultCurrencyUnit:currencyUnits[0], // ROD as default display unit
	feeSatoshiPerByteBucketMaxima: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 50, 75, 100, 150],
	
	halvingBlockIntervalsByNetwork: {
		"main": 1054080, // Approximately 1 year as per SpaceXpanse specifications
		"test": 1054080, // Same as mainnet for consistency
		"regtest": 150,  // Keep small for testing
		"signet": 1054080 // Same as mainnet for consistency
	},

	terminalHalvingCountByNetwork: {
		"main": 5,
		"test": 5,
		"regtest": 5,
		"signet": 5
	},

	// used for supply estimates that don't need full gettxout accuracy
	coinSupplyCheckpointsByNetwork: {
		"main": [ 0, new Decimal(0) ], // Placeholder
		"test": [ 0, new Decimal(0) ], // Placeholder
		"signet": [ 0, new Decimal(0) ], // Placeholder
		"regtest": [ 0, new Decimal(0) ] // Placeholder
	},

	utxoSetCheckpointsByNetwork: {
		// This includes values from running gettxoutsetinfo with both "muhash" and "hash_serialized_2" params
		"main": {
			// Placeholder data - to be updated with actual ROD values
			"height": 0,
			"bestblock": "0000000000000000000000000000000000000000000000000000000000000000",
			"txouts": 0,
			"bogosize": 0,
			"muhash": "0000000000000000000000000000000000000000000000000000000000000000",
			"total_amount": "0",
			"total_unspendable_amount": "0",

			// "hash_serialized_2"
			"transactions": 0,
			"disk_size": 0,
			"hash_serialized_2": "0000000000000000000000000000000000000000000000000000000000000000",

			"lastUpdated": 0
		}
	},
	
	genesisBlockHashesByNetwork:{
		"main":	"5d4b20be4fc87d2333aea5235d9de1c685696fc935f806a9ffd71c9f9abf3c57", // Verified from live ROD node at localhost:11999 (different from chainz.cryptoid.info)
		"test":	"000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943", // Placeholder for testnet
		"regtest": "0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206", // Placeholder for regtest
		"signet":  "00000008819873e925422c1ff0f99f7cc9bbb232af63a077a480a3633bee1ef6",
	},
	genesisCoinbaseTransactionIdsByNetwork: {
		"main":	"afdbec35a16bea610dafafeee5a8cd072dc74a056894a12165da027079d5e138", // Verified from live ROD node at localhost:11999
		"test":	"4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b", // Placeholder for testnet
		"regtest": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b", // Placeholder for regtest
		"signet":  "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b" // Placeholder for signet
	},
	genesisCoinbaseOutputAddressScripthash:"e0e442db4534d8821148b4e29d3fab135a89d2616a07a178b9e8813e8c43f0a9", // SpaceXpanse ROD genesis coinbase output
	
	genesisCoinbaseTransactionsByNetwork:{
		"main": {
			"hex": "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0804ffff001d02fd04ffffffff0100f2052a01000000434104f5eeb2b10c944c6b9fbcfff94c35bdeecd93df977882babc7f3a2cf7f5c81d3b09a68db7f0e04f21de5d4230e75e6dbe7ad16eefe0d4325a62067dc6f369446aac00000000", // SpaceXpanse ROD genesis transaction
			"txid": "e0e442db4534d8821148b4e29d3fab135a89d2616a07a178b9e8813e8c43f0a9",
			"hash": "e0e442db4534d8821148b4e29d3fab135a89d2616a07a178b9e8813e8c43f0a9",
			"size": 204,
			"vsize": 204,
			"version": 1,
			"confirmations":475000,
			"vin": [
				{
					"coinbase": "04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73",
					"sequence": 4294967295
				}
			],
			"vout": [
				{
					"value": 800,
					"n": 0,
					"scriptPubKey": {
						"asm": "04f5eeb2b10c944c6b9fbcfff94c35bdeecd93df977882babc7f3a2cf7f5c81d3b09a68db7f0e04f21de5d4230e75e6dbe7ad16eefe0d4325a62067dc6f369446a OP_CHECKSIG",
						"hex": "4104f5eeb2b10c944c6b9fbcfff94c35bdeecd93df977882babc7f3a2cf7f5c81d3b09a68db7f0e04f21de5d4230e75e6dbe7ad16eefe0d4325a62067dc6f369446aac",
						"reqSigs": 1,
						"type": "pubkey",
						"addresses": [
							"SQ9we3FJ9VvYjA3J6tMDmhCErp7Se8Y8"
						]
					}
				}
			],
			"blockhash": "5d4b20be4fc87d2333aea5235d9de1c685696fc935f806a9ffd71c9f9abf3c57",
			"time": 1230988505,
			"blocktime": 1230988505
		},
		"test": {
			// Similar structure as main, with testnet-specific values
			"hex": "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff4d04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac00000000", // Placeholder
			"txid": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
			"hash": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
			"version": 1,
			"size": 204,
			"vsize": 204,
			"weight": 816,
			"locktime": 0,
			"vin": [
				{
					"coinbase": "04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73",
					"sequence": 4294967295
				}
			],
			"vout": [
				{
					"value": 50.00000000,
					"n": 0,
					"scriptPubKey": {
						"asm": "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f OP_CHECKSIG",
						"hex": "4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac",
						"reqSigs": 1,
						"type": "pubkey",
						"addresses": [
							"mpXwg4jMtRhuSpVq4xS3HFHmCmWp9NyGKt"
						]
					}
				}
			],
			"blockhash": "000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943",
			"time": 1296688602,
			"blocktime": 1296688602
		},
		"regtest": {
			// Similar structure as main, with regtest-specific values
			"hex": "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff4d04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac00000000", // Placeholder
			"txid": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
			"hash": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
			"version": 1,
			"size": 204,
			"vsize": 204,
			"weight": 816,
			"locktime": 0,
			"vin": [
				{
					"coinbase": "04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73",
					"sequence": 4294967295
				}
			],
			"vout": [
				{
					"value": 50.00000000,
					"n": 0,
					"scriptPubKey": {
						"asm": "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f OP_CHECKSIG",
						"hex": "4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac",
						"type": "pubkey"
					}
				}
			],
			"blockhash": "0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206",
			"time": 1296688602,
			"blocktime": 1296688602
		},
		"signet": {
			// Similar structure as main, with signet-specific values
			"hex": "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff4d04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac00000000", // Placeholder
			"txid": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
			"hash": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
			"version": 1,
			"size": 204,
			"vsize": 204,
			"weight": 816,
			"locktime": 0,
			"vin": [
				{
					"coinbase": "04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73",
					"sequence": 4294967295
				}
			],
			"vout": [
				{
					"value": 50.00000000,
					"n": 0,
					"scriptPubKey": {
						"asm": "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f OP_CHECKSIG",
						"hex": "4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac",
						"type": "pubkey"
					}
				}
			],
			"blockhash": "00000008819873e925422c1ff0f99f7cc9bbb232af63a077a480a3633bee1ef6",
			"time": 1598918400,
			"blocktime": 1598918400
		}
	},
	genesisBlockStatsByNetwork:{
		"main": {
			"avgfee": 0,
			"avgfeerate": 0,
			"avgtxsize": 0,
			"blockhash": "5d4b20be4fc87d2333aea5235d9de1c685696fc935f806a9ffd71c9f9abf3c57",
			"feerate_percentiles": [
				0,
				0,
				0,
				0,
				0
			],
			"height": 0,
			"ins": 0,
			"maxfee": 0,
			"maxfeerate": 0,
			"maxtxsize": 0,
			"medianfee": 0,
			"mediantime": 1231006505,
			"mediantxsize": 0,
			"minfee": 0,
			"minfeerate": 0,
			"mintxsize": 0,
			"outs": 1,
			"subsidy": 80000000000,
			"swtotal_size": 0,
			"swtotal_weight": 0,
			"swtxs": 0,
			"time": 1231006505,
			"total_out": 0,
			"total_size": 0,
			"total_weight": 0,
			"totalfee": 0,
			"txs": 1,
			"utxo_increase": 1,
			"utxo_size_inc": 117
		},
		"test": {
			"avgfee": 0,
			"avgfeerate": 0,
			"avgtxsize": 0,
			"blockhash": "000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943",
			"feerate_percentiles": [
				0,
				0,
				0,
				0,
				0
			],
			"height": 0,
			"ins": 0,
			"maxfee": 0,
			"maxfeerate": 0,
			"maxtxsize": 0,
			"medianfee": 0,
			"mediantime": 1296688602,
			"mediantxsize": 0,
			"minfee": 0,
			"minfeerate": 0,
			"mintxsize": 0,
			"outs": 1,
			"subsidy": 5000000000,
			"swtotal_size": 0,
			"swtotal_weight": 0,
			"swtxs": 0,
			"time": 1296688602,
			"total_out": 0,
			"total_size": 0,
			"total_weight": 0,
			"totalfee": 0,
			"txs": 1,
			"utxo_increase": 1,
			"utxo_size_inc": 117
		},
		"regtest": {
			"avgfee": 0,
			"avgfeerate": 0,
			"avgtxsize": 0,
			"blockhash": "0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206",
			"feerate_percentiles": [
				0,
				0,
				0,
				0,
				0
			],
			"height": 0,
			"ins": 0,
			"maxfee": 0,
			"maxfeerate": 0,
			"maxtxsize": 0,
			"medianfee": 0,
			"mediantime": 1296688602,
			"mediantxsize": 0,
			"minfee": 0,
			"minfeerate": 0,
			"mintxsize": 0,
			"outs": 1,
			"subsidy": 5000000000,
			"swtotal_size": 0,
			"swtotal_weight": 0,
			"swtxs": 0,
			"time": 1296688602,
			"total_out": 0,
			"total_size": 0,
			"total_weight": 0,
			"totalfee": 0,
			"txs": 1,
			"utxo_increase": 1,
			"utxo_size_inc": 117
		},
		"signet": {
			"avgfee": 0,
			"avgfeerate": 0,
			"avgtxsize": 0,
			"blockhash": "00000008819873e925422c1ff0f99f7cc9bbb232af63a077a480a3633bee1ef6",
			"feerate_percentiles": [
				0,
				0,
				0,
				0,
				0
			],
			"height": 0,
			"ins": 0,
			"maxfee": 0,
			"maxfeerate": 0,
			"maxtxsize": 0,
			"medianfee": 0,
			"mediantime": 1598918400,
			"mediantxsize": 0,
			"minfee": 0,
			"minfeerate": 0,
			"mintxsize": 0,
			"outs": 1,
			"subsidy": 5000000000,
			"swtotal_size": 0,
			"swtotal_weight": 0,
			"swtxs": 0,
			"time": 1598918400,
			"total_out": 0,
			"total_size": 0,
			"total_weight": 0,
			"totalfee": 0,
			"txs": 1,
			"utxo_increase": 1,
			"utxo_size_inc": 117
		}
	},
	testData: {
		txDisplayTestList: {
			// Placeholder test transactions - to be updated with actual ROD transaction IDs
			"634b57cf0673c50b98560dbdf48d0a8633303b5d9162175e08b304df159c259e" : {
				blockHeight: 694670, blockHash: "0000000000000000000ba61d43854a2460b219b5281db2c731ae03a4347eaf43"
			},
			"f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16" : {
				blockHeight: 170, blockHash: "00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee"
			},
			"a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d" : {
				blockHeight: 57043, blockHash: "00000000152340ca42227603908689183edc47355204e7aca59383b0aaac1fd8"
			},
			"7b6e490670a5cfcc9b66d8aab142ac2e9b489ae7f40cadadfc69c19878ae81b0" : {
				blockHeight: 227835, blockHash: "00000000000001aa077d7aa84c532a4d69bdbff519609d1da0835261b7a74eb6"
			},
			"8f7f13d6b56ea9013f13d298bc0e9e9f4f9825f3e7fd96083a564b10b01025d9" : {
				blockHeight: 694521, blockHash: "00000000000000000009974b5f6011d7ec8af460dafcc668c7ede4324896b9ca"
			},
			"3215f4a32a26938ddf9eeb4de7f5f42e751410876500f6e93d943abb2c3cccc4" : {
				blockHeight: 694521, blockHash: "00000000000000000009974b5f6011d7ec8af460dafcc668c7ede4324896b9ca"
			},
			"333d5f27c6fc2d07ef8c19e17d33568706bc3d6875198aba6cff0a996698d46e" : {
				blockHeight: 694521, blockHash: "00000000000000000009974b5f6011d7ec8af460dafcc668c7ede4324896b9ca"
			},
			"a9ceb47b092f703c30b29cb8b864fb8fa895a5999b24aa56ae08a967b643087c" : {
				blockHeight: 694521, blockHash: "00000000000000000009974b5f6011d7ec8af460dafcc668c7ede4324896b9ca"
			},
			"bc968c93c6ff39f022f974504a22d548902fe5a8c4fb294f052f845e4c388fcb" : {
				blockHeight: 694521, blockHash: "00000000000000000009974b5f6011d7ec8af460dafcc668c7ede4324896b9ca"
			},
			"e4bd7949cbf067d17629a5f588bba051b4436d29b5978d674118539356745bd0" : {
				blockHeight: 227835, blockHash: "00000000000001aa077d7aa84c532a4d69bdbff519609d1da0835261b7a74eb6"
			},
			"54e48e5f5c656b26c3bca14a8c95aa583d07ebe84dde3b7dd4a78f4e4186e713" : {
				blockHeight: 230009, blockHash: "000000000000000743aee48cf264e1aa4a05fc3018677be3c1bdbd2429ffeede"
			},
			"d29c9c0e8e4d2a9790922af73f0b8d51f0bd4bb19940d9cf910ead8fbe85bc9b" : {
				blockHeight: 268060, blockHash: "000000000000000743aee48cf264e1aa4a05fc3018677be3c1bdbd2429ffeede"
			},
			"143a3d7e7599557f9d63e7f224f34d33e9251b2c23c38f95631b3a54de53f024" : {
				blockHeight: 306204, blockHash: "000000000000000038dea6f503ed3593b1495e135d9ed646c2ebb97a1ff35bd7"
			},
			"8f907925d2ebe48765103e6845c06f1f2bb77c6adc1cc002865865eb5cfd5c1c" : {
				blockHeight: 481824, blockHash: "0000000000000000001c8018d9cb3b742ef25114f27563e3fc4a1902167f9893"
			},
			"8f5834d39a634c1b4c6283b546e16e931cb34d28570c77860de1a86256c4344d" : {
				blockHeight: 629999, blockHash: "0000000000000000000d656be18bb095db1b23bd797266b0ac3ba720b1962b1e"
			},
			"7836d12e741ffc6e50dba9b461e117cfbe444e7daa73df648b3a441d5a9ee958" : {
				blockHeight: 230009, blockHash: "000000000000000743aee48cf264e1aa4a05fc3018677be3c1bdbd2429ffeede"
			},
			"29a3efd3ef04f9153d47a990bd7b048a4b2d213daaa5fb8ed670fb85f13bdbcf" : {
				blockHeight: 153509, blockHash: "00000000000000fb62bbadc0a9dcda556925b2d0c1ad8634253ac2e83ab8382f"
			},
			"fe28050b93faea61fa88c4c630f0e1f0a1c24d0082dd0e10d369e13212128f33" : {
				blockHeight: 1000, blockHash: "00000000c937983704a73af28acdec37b049d214adbda81d7e2a3dd146f6ed09"
			},
			"b10c007c60e14f9d087e0291d4d0c7869697c6681d979c6639dbd960792b4d41" : {
				blockHeight: 692261, blockHash: "0000000000000000000f14c35b2d841e986ab5441de8c585d5ffe55ea1e395ad"
			},
			"777c998695de4b7ecec54c058c73b2cab71184cf1655840935cd9388923dc288" : {
				blockHeight: 709632, blockHash: "0000000000000000000687bca986194dc2c1f949318629b44bb54ec0a94d8244"
			},
			"b53e3bc5edbb41b34a963ecf67eb045266cf841cab73a780940ce6845377f141" : {
				blockHeight: 608548, blockHash: "00000000000000000009cf4a72b39c634586e6e328365f0d7293964111148094"
			}
		}
	},
	historicalData: [], // Empty for now - to be populated with ROD-specific historical data
	exchangeRateData:{
		jsonUrl:"https://api.coingecko.com/api/v3/simple/price?ids=spacexpanse&vs_currencies=usd,eur,gbp,jpy", // Updated to use CoinGecko API
		responseBodySelectorFunction:function(responseBody) {
			//console.log("Exchange Rate Response: " + JSON.stringify(responseBody));

			if (responseBody.spacexpanse) {
				var rates = responseBody.spacexpanse;
				var exchangeRates = {};

				for (const [currency, rate] of Object.entries(rates)) {
					exchangeRates[currency.toLowerCase()] = rate;
				}

				return exchangeRates;
			}
			
			return null;
		}
	},
	goldExchangeRateData:{
		jsonUrl:"https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD",
		responseBodySelectorFunction:function(responseBody) {
			//console.log("Exchange Rate Response: " + JSON.stringify(responseBody));

			if (responseBody[0].topo && responseBody[0].topo.platform == "MT5") {
				var prices = responseBody[0].spreadProfilePrices[0];
				
				return {
					usd: prices.ask
				};
			}
			
			return null;
		}
	},
	blockRewardFunction:function(blockHeight, chain) {
		if (blockHeight < PRE_RELEASE_BLOCK_COUNT) {
			return PRE_RELEASE_BLOCK_REWARD;
		}

		let halvingBlockInterval = this.halvingBlockIntervalsByNetwork[chain] || HALVING_INTERVAL;
		let standardEraHeight = blockHeight - PRE_RELEASE_BLOCK_COUNT;
		let halvingIndex = Math.floor(standardEraHeight / halvingBlockInterval);

		if (halvingIndex <= HALVING_YEARS) {
			return blockRewardEras[halvingIndex];
		}

		let inflationStartHeight = PRE_RELEASE_BLOCK_COUNT + (HALVING_YEARS * halvingBlockInterval);
		let inflationIntervalsElapsed = Math.floor((blockHeight - inflationStartHeight) / halvingBlockInterval);
		let inflationMultiplier = new Decimal8(1).plus(ANNUAL_INFLATION_RATE).pow(inflationIntervalsElapsed);

		return new Decimal8(postHalvingBaseReward).times(inflationMultiplier);
	}
};
