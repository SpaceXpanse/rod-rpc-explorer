"use strict";

const fs = require("fs");

const debug = require("debug");
const debugLog = debug("btcexp:utils");
const debugErrorLog = debug("btcexp:error");
const debugErrorVerboseLog = debug("btcexp:errorVerbose");

const Decimal = require("decimal.js");
const axios = require("axios");
const qrcode = require("qrcode");
const bs58check = require("bs58check");
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const moment = require("moment");
const { bech32, bech32m } = require("bech32");

// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc);

const bitcoinjs = require('bitcoinjs-lib');




const config = require("./config.js");
const coins = require("./coins.js");
const coinConfig = coins[config.coin];
const redisCache = require("./redisCache.js");
const statTracker = require("./statTracker.js");


const exponentScales = [
	{val:1000000000000000000000000000000000, name:"?", abbreviation:"V", exponent:"33"},
	{val:1000000000000000000000000000000, name:"?", abbreviation:"W", exponent:"30"},
	{val:1000000000000000000000000000, name:"?", abbreviation:"X", exponent:"27"},
	{val:1000000000000000000000000, name:"yotta", abbreviation:"Y", exponent:"24"},
	{val:1000000000000000000000, name:"zetta", abbreviation:"Z", exponent:"21"},
	{val:1000000000000000000, name:"exa", abbreviation:"E", exponent:"18"},
	{val:1000000000000000, name:"peta", abbreviation:"P", exponent:"15", textDesc:"Q"},
	{val:1000000000000, name:"tera", abbreviation:"T", exponent:"12", textDesc:"T"},
	{val:1000000000, name:"giga", abbreviation:"G", exponent:"9", textDesc:"B"},
	{val:1000000, name:"mega", abbreviation:"M", exponent:"6", textDesc:"M"},
	{val:1000, name:"kilo", abbreviation:"K", exponent:"3", textDesc:"K"}
];

const crawlerBotUserAgentStrings = {
	"google": new RegExp("adsbot-google|Googlebot|mediapartners-google", "i"),
	"microsoft": new RegExp("Bingbot|bingpreview|msnbot", "i"),
	"yahoo": new RegExp("Slurp", "i"),
	"duckduckgo": new RegExp("DuckDuckBot", "i"),
	"baidu": new RegExp("Baidu", "i"),
	"yandex": new RegExp("YandexBot", "i"),
	"teoma": new RegExp("teoma", "i"),
	"sogou": new RegExp("Sogou", "i"),
	"exabot": new RegExp("Exabot", "i"),
	"facebook": new RegExp("facebot", "i"),
	"alexa": new RegExp("ia_archiver", "i"),
	"aol": new RegExp("aolbuild", "i"),
	"moz": new RegExp("dotbot", "i"),
	"semrush": new RegExp("SemrushBot", "i"),
	"majestic": new RegExp("MJ12bot", "i"),
	"python-requests": new RegExp("python-requests", "i"),
	"openai": new RegExp("OAI-SearchBot", "i"),
	"unidentifiedCrawler": new RegExp("Test Certificate Info", "i"),
	"amazon": new RegExp("amazonbot", "i"),
	"bytedance": new RegExp("bytespider", "i"),
	"scrapy": new RegExp("Scrapy", "i"),
};

const ipMemoryCache = {};

let ipRedisCache = null;
if (redisCache.active) {
	const onRedisCacheEvent = function(cacheType, eventType, cacheKey) {
		global.cacheStats.redis[eventType]++;
		//debugLog(`cache.${cacheType}.${eventType}: ${cacheKey}`);
	}

	ipRedisCache = redisCache.createCache("v0", onRedisCacheEvent);
}

let ipMemoryCacheNewItems = false;
const ipCacheFile = `${config.filesystemCacheDir}/ip-address-cache.json`;

if (fs.existsSync(ipCacheFile)) {
	try {
		let rawData = fs.readFileSync(ipCacheFile);

		ipMemoryCache = JSON.parse(rawData);

		debugLog(`Loaded ip address cache (${rawData.length.toLocaleString()} bytes)`);

	} catch (err) {
		// failed to read cache file, delete it in case it's corrupted
		fs.unlinkSync(ipCacheFile);
	}
}

setInterval(() => {
	if (ipMemoryCacheNewItems) {
		try {
			if (!fs.existsSync(config.filesystemCacheDir)){
				fs.mkdirSync(config.filesystemCacheDir);
			}

			debugLog(`Saved updated ip address cache`);

			fs.writeFileSync(ipCacheFile, JSON.stringify(ipMemoryCache, null, 4));

		} catch (e) {
			logError("24308tew7hgde", e);
		}

		ipMemoryCacheNewItems = false;
	}
}, 60000);

const ipCache = {
	get:function(key) {
		return new Promise(function(resolve, reject) {
			if (ipMemoryCache[key] != null) {
				resolve({key:key, value:ipMemoryCache[key]});

				return;
			}

			if (ipRedisCache != null) {
				ipRedisCache.get("ip-" + key).then(function(redisResult) {
					if (redisResult != null) {
						resolve({key:key, value:redisResult});

						return;
					}

					resolve({key:key, value:null});
				});

			} else {
				resolve({key:key, value:null});
			}
		});
	},
	set:function(key, value, expirationMillis) {
		ipMemoryCache[key] = value;

		ipMemoryCacheNewItems = true;

		if (ipRedisCache != null) {
			ipRedisCache.set("ip-" + key, value, expirationMillis);
		}
	}
};



function redirectToConnectPageIfNeeded(req, res) {
	if (!req.session.host) {
		req.session.redirectUrl = req.originalUrl;
		
		res.redirect("/");
		res.end();
		
		return true;
	}
	
	return false;
}

function formatHex(hex, outputFormat="utf8") {
	return Buffer.from(hex, "hex").toString(outputFormat);
}

function splitArrayIntoChunks(array, chunkSize) {
	let j = array.length;
	let chunks = [];
	
	for (let i = 0; i < j; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}

	return chunks;
}

function splitArrayIntoChunksByChunkCount(array, chunkCount) {
	let bigChunkSize = Math.ceil(array.length / chunkCount);
	let bigChunkCount = chunkCount - (chunkCount * bigChunkSize - array.length);

	let chunks = [];

	let chunkStart = 0;
	for (let chunk = 0; chunk < chunkCount; chunk++) {
		let chunkSize = (chunk < bigChunkCount ? bigChunkSize : (bigChunkSize - 1));

		chunks.push(array.slice(chunkStart, chunkStart + chunkSize));

		chunkStart += chunkSize;
	}

	return chunks;
}

function getRandomString(length, chars) {
	let mask = '';
	
	if (chars.indexOf('a') > -1) {
		mask += 'abcdefghijklmnopqrstuvwxyz';
	}
	
	if (chars.indexOf('A') > -1) {
		mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	}
	
	if (chars.indexOf('#') > -1) {
		mask += '0123456789';
	}
	
	if (chars.indexOf('!') > -1) {
		mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
	}
	
	let result = '';
	for (let i = length; i > 0; --i) {
		result += mask[Math.floor(Math.random() * mask.length)];
	}
	
	return result;
}

function formatCurrencyAmountWithForcedDecimalPlaces(amount, formatType, forcedDecimalPlaces) {
	formatType = formatType.toLowerCase();

	let currencyType = global.currencyTypes[formatType];

	if (currencyType == null) {
		throw `Unknown currency type: ${formatType}`;
	}

	let dec = new Decimal(amount);

	let decimalPlaces = currencyType.decimalPlaces;
	//if (decimalPlaces == 0 && dec < 1) {
	//	decimalPlaces = 5;
	//}

	if (forcedDecimalPlaces >= 0) {
		decimalPlaces = forcedDecimalPlaces;
	}

	if (currencyType.type == "native") {
		dec = dec.times(currencyType.multiplier);

		if (forcedDecimalPlaces >= 0) {
			// toFixed will keep trailing zeroes
			let baseStr = addThousandsSeparators(dec.toFixed(decimalPlaces));

			return {val:baseStr, currencyUnit:currencyType.name, simpleVal:baseStr, intVal:parseInt(dec)};

		} else {
			// toDP excludes trailing zeroes but doesn't "fix" numbers like 1e-8
			// instead, we use toFixed and (optionally) manually strip trailing zeroes
			// old method is kept for reference since this is sensitive, high-volume code
			let baseStr = addThousandsSeparators(dec.toFixed(decimalPlaces).replace(/\.$/, ""));

			// with Issue #500, the idea was raised that stripping trailing zeroes can
			// make values more difficult to parse visually; now the stripping is
			// dynamic, based on the value - if any of the 4 least-significant digits
			// are non-zero (i.e. sat-value is NOT evenly divisible by 10,000), then
			// no stripping is performed, otherwise it is performed, to preserve some
			// of the UX benefit of larger, "even" amounts (e.g. 0.1BTC).
			let trailingZeroesStrippedStr = baseStr.replace(/0+$/, "");
			if (baseStr.length - trailingZeroesStrippedStr.length >= 4) {
				baseStr = trailingZeroesStrippedStr

				if (baseStr.endsWith(".")) {
					baseStr = baseStr.slice(0, -1);
				}
			}

			//let baseStr = addThousandsSeparators(dec.toDP(decimalPlaces)); // old version, failed to properly format "1e-8" (left unchanged)

			let returnVal = {currencyUnit:currencyType.name, simpleVal:baseStr, intVal:parseInt(dec)};

			// max digits in "val"
			let maxValDigits = config.site.valueDisplayMaxLargeDigits;

			// todo: make this section locale-aware (don't hardcode ".")

			if (baseStr.indexOf(".") == -1) {
				returnVal.val = baseStr;
				
			} else {
				if (baseStr.length - baseStr.indexOf(".") - 1 > maxValDigits) {
					returnVal.val = baseStr.substring(0, baseStr.indexOf(".") + maxValDigits + 1);
					returnVal.lessSignificantDigits = baseStr.substring(baseStr.indexOf(".") + maxValDigits + 1);

				} else {
					returnVal.val = baseStr;
				}
			}

			return returnVal;
		}
	} else if (currencyType.type == "exchanged") {
		//console.log(JSON.stringify(global.exchangeRates) + " - " + currencyType.name);
		if (global.exchangeRates != null && global.exchangeRates[currencyType.id] != null) {
			dec = dec.times(global.exchangeRates[currencyType.id]);

			let baseStr = addThousandsSeparators(dec.toDecimalPlaces(decimalPlaces));

			return {val:baseStr, currencyUnit:currencyType.name, simpleVal:baseStr, intVal:parseInt(dec)};

		} else {
			return formatCurrencyAmountWithForcedDecimalPlaces(amount, coinConfig.defaultCurrencyUnit.name, forcedDecimalPlaces);
		}
	} else {
		throw `Unknown currency type: ${currencyType.type}`;
	}
}

function formatCurrencyAmount(amount, formatType) {
	return formatCurrencyAmountWithForcedDecimalPlaces(amount, formatType, -1);
}

function formatCurrencyAmountInSmallestUnits(amount, forcedDecimalPlaces) {
	return formatCurrencyAmountWithForcedDecimalPlaces(amount, coins[config.coin].baseCurrencyUnit.name, forcedDecimalPlaces);
}

// ref: https://stackoverflow.com/a/2901298/673828
function addThousandsSeparators(x) {
	let parts = x.toString().split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

	return parts.join(".");
}

function satoshisPerUnitOfLocalCurrency(localCurrency) {
	if (global.exchangeRates != null) {
		let exchangeType = localCurrency;

		if (!global.exchangeRates[localCurrency]) {
			// if current display currency is a native unit, default to USD for exchange values
			exchangeType = "usd";
		}

		let dec = new Decimal(1);
		let one = new Decimal(1);
		dec = dec.times(global.exchangeRates[exchangeType]);
		
		// USD/BTC -> BTC/USD
		dec = one.dividedBy(dec);

		let baseCurrencyType = coins[config.coin].baseCurrencyUnit;
		let localCurrencyType = global.currencyTypes[exchangeType];

		// BTC/USD -> sat/USD, or equivalent base units for other coins
		dec = dec.times(baseCurrencyType.multiplier);

		let exchangedAmt = parseInt(dec);

		return {amt:addThousandsSeparators(exchangedAmt),amtRaw:exchangedAmt, unit:`${baseCurrencyType.name}/${localCurrencyType.symbol}`}
	}

	return null;
}

function coinsPerUnitOfLocalCurrency(localCurrency) {
	if (global.exchangeRates != null) {
		let exchangeType = localCurrency;

		if (!global.exchangeRates[localCurrency]) {
			// if current display currency is a native unit, default to USD for exchange values
			exchangeType = "usd";
		}

		let dec = new Decimal(1).dividedBy(global.exchangeRates[exchangeType]);
		let localCurrencyType = global.currencyTypes[exchangeType];
		let coinCurrencyType = coins[config.coin].defaultCurrencyUnit;
		let compactData = formatLargeNumberSignificant(dec, 3);
		let compactAmount = compactData[1].abbreviation ? `${compactData[0]}${compactData[1].abbreviation}` : compactData[0].toString();

		return {
			amt:compactAmount,
			amtRaw:dec,
			unit:`${coinCurrencyType.name}/${localCurrencyType.symbol}`,
			fullAmount:addThousandsSeparators(dec.toDP(coinCurrencyType.decimalPlaces).toString())
		};
	}

	return null;
}

function getExchangedCurrencyFormatData(amount, exchangeType, includeUnit=true) {
	if (global.exchangeRates != null && global.exchangeRates[exchangeType.toLowerCase()] != null) {
		let dec = new Decimal(amount);
		dec = dec.times(global.exchangeRates[exchangeType.toLowerCase()]);
		let exchangedAmt = parseFloat(Math.round(dec * 100) / 100).toFixed(2);

		return {
			symbol: global.currencySymbols[exchangeType],
			value: addThousandsSeparators(exchangedAmt),
			unit: exchangeType
		}
		
	} else if (exchangeType == "au") {
		if (global.exchangeRates != null && global.goldExchangeRates != null) {
			let dec = new Decimal(amount);
			dec = dec.times(global.exchangeRates.usd).dividedBy(global.goldExchangeRates.usd);
			let exchangedAmt = parseFloat(Math.round(dec * 100) / 100).toFixed(2);

			return {
				symbol: "AU",
				value: addThousandsSeparators(exchangedAmt),
				unit: "oz"
			}
		}
	}

	return "";
}

function formatExchangedCurrency(amount, exchangeType, decimals=2) {
	if (global.exchangeRates != null && global.exchangeRates[exchangeType.toLowerCase()] != null) {
		let dec = new Decimal(amount);
		dec = dec.times(global.exchangeRates[exchangeType.toLowerCase()]);
		let exchangedAmt = parseFloat(Math.round(dec * 100) / 100).toFixed(decimals);

		return {
			val: addThousandsSeparators(exchangedAmt),
			symbol: global.currencyTypes[exchangeType].symbol,
			unit: exchangeType,
			valRaw: exchangedAmt
		};
	} else if (exchangeType == "au") {
		if (global.exchangeRates != null && global.goldExchangeRates != null) {
			let dec = new Decimal(amount);
			dec = dec.times(global.exchangeRates.usd).dividedBy(global.goldExchangeRates.usd);
			let exchangedAmt = parseFloat(Math.round(dec * 100) / 100).toFixed(decimals);

			return {
				val: addThousandsSeparators(exchangedAmt),
				unit: "oz",
				symbol: "AU",
				valRaw: exchangedAmt
			};
		}
	}

	return "";
}

function formatExchangedCurrencyForDisplay(amount, exchangeType, decimals=2, significantDigits=3) {
	if (global.exchangeRates != null && global.exchangeRates[exchangeType.toLowerCase()] != null) {
		let dec = new Decimal(amount).times(global.exchangeRates[exchangeType.toLowerCase()]);
		let roundedAmt = dec.toDecimalPlaces(decimals);
		let displayAmt = roundedAmt;

		if (!dec.isZero() && roundedAmt.isZero()) {
			displayAmt = dec.toSignificantDigits(significantDigits);
		}

		let baseStr = addThousandsSeparators(displayAmt.toFixed());
		let fullStr = addThousandsSeparators(dec.toFixed());

		return {
			val:baseStr,
			symbol: global.currencyTypes[exchangeType].symbol,
			unit: exchangeType,
			valRaw: dec.toString(),
			fullVal: fullStr
		};
	}

	return formatExchangedCurrency(amount, exchangeType, decimals);
}

function seededRandom(seed) {
	let x = Math.sin(seed++) * 10000;
	return x - Math.floor(x);
}

function seededRandomIntBetween(seed, min, max) {
	let rand = seededRandom(seed);
	return (min + (max - min) * rand);
}

function randomInt(min, max) {
	return min + Math.floor(Math.random() * max);
}

function ellipsize(str, length, ending="…") {
	if (str.length <= length) {
		return str;

	} else {
		return str.substring(0, length - ending.length) + ending;
	}
}

function ellipsizeMiddle(str, length, replacement="…", extraCharAtStart=true) {
	if (str.length <= length) {
		return str;

	} else {
		//"abcde"(3)->"a…e"
		//"abcdef"(3)->"a…f"
		//"abcdef"(5)->"ab…ef"
		//"abcdef"(4)->"ab…f"
		if ((length - replacement.length) % 2 == 0) {
			return str.substring(0, (length - replacement.length) / 2) + replacement + str.slice(-(length - replacement.length) / 2);

		} else {
			if (extraCharAtStart) {
				return str.substring(0, Math.ceil((length - replacement.length) / 2)) + replacement + str.slice(-Math.floor((length - replacement.length) / 2));

			} else {
				return str.substring(0, Math.floor((length - replacement.length) / 2)) + replacement + str.slice(-Math.ceil((length - replacement.length) / 2));
			}
			
		}
	}
}



// options:
//  - oneElement (default: false)
//  - stripZeroes (default: true)
//  - shortenDurationNames (default: true)
//  - outputCommas (default: true)
function summarizeDuration(duration, options={}) {
	let oneElement = "oneElement" in options ? options.oneElement : false;
	let stripZeroes = "stripZeroes" in options ? options.stripZeroes : true;
	let shortenDurationNames = "shortenDurationNames" in options ? options.shortenDurationNames : true;
	let outputCommas = "outputCommas" in options ? options.outputCommas : true;
	let decimalPlaces = "decimalPlaces" in options ? options.decimalPlaces : 1;

	//console.log(JSON.stringify(options) + " - " + oneElement + " - " + stripZeroes + " - " + shortenDurationNames + " - " + outputCommas);

	let formatParts = duration.format().split(",").map(x => x.trim());
	let str = formatParts.join(", ");

	if (oneElement) {
		let parts = [duration.asYears(), duration.asMonths(), duration.asWeeks(), duration.asDays(), duration.asHours(), duration.asMinutes(), duration.asSeconds()];
		let partNames = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];

		for (let i = 0; i < parts.length; i++) {
			if (parts[i] > 1) {
				str = `${new Decimal(parts[i]).toDP(decimalPlaces)} ${partNames[i]}`;

				break;
			}
		}
	} else if (stripZeroes) {
		// strip duration elements with zero magnitude (e.g. 11 months 0 days 12 hours)
		formatParts = formatParts.map(x => { return x.startsWith("0 ") ? "" : x; }).filter(x => x.length > 0);

		// hack: moment.js seems to have a bug where there can be formatted items that include "-0" magnitude elements
		formatParts = formatParts.map(x => { return x.startsWith("-0 ") ? "" : x; }).filter(x => x.length > 0);

		str = formatParts.join(", ");
	}
	

	if (shortenDurationNames) {
		str = str.replace(" years", "y");
		str = str.replace(" year", "y");

		str = str.replace(" months", "mo");
		str = str.replace(" month", "mo");

		str = str.replace(" weeks", "w");
		str = str.replace(" week", "w");

		str = str.replace(" days", "d");
		str = str.replace(" day", "d");

		str = str.replace(" hours", "hr");
		str = str.replace(" hour", "hr");

		str = str.replace(" minutes", "min");
		str = str.replace(" minute", "min");
	}

	if (!outputCommas) {
		str = str.split(", ").join(" ");
	}

	return str;
}

function logMemoryUsage() {
	let mbUsed = process.memoryUsage().heapUsed / 1024 / 1024;
	mbUsed = Math.round(mbUsed * 100) / 100;

	let mbTotal = process.memoryUsage().heapTotal / 1024 / 1024;
	mbTotal = Math.round(mbTotal * 100) / 100;

	//debugLog("memoryUsage: heapUsed=" + mbUsed + ", heapTotal=" + mbTotal + ", ratio=" + parseInt(mbUsed / mbTotal * 100));
}

function identifyMiner(coinbaseTx, blockHeight) {
	if (coinbaseTx == null || coinbaseTx.vin == null || coinbaseTx.vin.length == 0) {
		return null;
	}
	
	if (global.miningPoolsConfigs) {
		for (let i = 0; i < global.miningPoolsConfigs.length; i++) {
			let miningPoolsConfig = global.miningPoolsConfigs[i];

			for (let payoutAddress in miningPoolsConfig.payout_addresses) {
				if (miningPoolsConfig.payout_addresses.hasOwnProperty(payoutAddress)) {
					if (coinbaseTx.vout && coinbaseTx.vout.length > 0) {
						if (getVoutAddresses(coinbaseTx.vout[0]).includes(payoutAddress)) {
							let minerInfo = miningPoolsConfig.payout_addresses[payoutAddress];
							minerInfo.identifiedBy = "payout address " + payoutAddress;

							return minerInfo;
						}
					}
				}
			}

			for (let coinbaseTag in miningPoolsConfig.coinbase_tags) {
				if (miningPoolsConfig.coinbase_tags.hasOwnProperty(coinbaseTag)) {
					if (formatHex(coinbaseTx.vin[0].coinbase, "utf8").indexOf(coinbaseTag) != -1) {
						let minerInfo = miningPoolsConfig.coinbase_tags[coinbaseTag];
						minerInfo.identifiedBy = "coinbase tag '" + coinbaseTag + "'";

						return minerInfo;
					}
				}
			}

			for (let blockHash in miningPoolsConfig.block_hashes) {
				if (blockHash == coinbaseTx.blockhash) {
					let minerInfo = miningPoolsConfig.block_hashes[blockHash];
					minerInfo.identifiedBy = "known block hash '" + blockHash + "'";

					return minerInfo;
				}
			}

			if (global.activeBlockchain == "main" && miningPoolsConfig.block_heights) {
				for (let minerName in miningPoolsConfig.block_heights) {
					let minerInfo = miningPoolsConfig.block_heights[minerName];
					minerInfo.name = minerName;

					if (minerInfo.heights.includes(blockHeight)) {
						minerInfo.identifiedBy = "known block height #" + blockHeight;

						return minerInfo;
					}
				}
			}
		}
	}

	if (coinbaseTx.vout && coinbaseTx.vout.length > 0) {
		for (let i = 0; i < coinbaseTx.vout.length; i++) {
			const vout = coinbaseTx.vout[i];

			const voutValue = new Decimal(vout.value);
			if (voutValue > 0) {
				const address = getVoutAddress(vout);

				if (address) {
					return {
						name: address,
						type: "address-only",
						identifiedBy: "payout address " + address,
					};
				}
			}
		}
	}

	return null;
}

function getTxTotalInputOutputValues(tx, txInputs, blockHeight) {
	let totalInputValue = new Decimal(0);
	let totalOutputValue = new Decimal(0);

	try {
		if (txInputs) {
			for (let i = 0; i < tx.vin.length; i++) {
				if (tx.vin[i].coinbase) {
					totalInputValue = totalInputValue.plus(new Decimal(coinConfig.blockRewardFunction(blockHeight, global.activeBlockchain)));

				} else {
					let txInput = txInputs[i];

					if (txInput) {
						try {
							let vout = txInput;

							if (vout.value) {
								totalInputValue = totalInputValue.plus(new Decimal(vout.value));
							}
						} catch (err) {
							logError("2397gs0gsse", err, {txid:tx.txid, vinIndex:i});
						}
					}
				}
			}
		} else {
			totalInputValue = null
		}

		for (let i = 0; i < tx.vout.length; i++) {
			totalOutputValue = totalOutputValue.plus(new Decimal(tx.vout[i].value));
		}
	} catch (err) {
		logError("2308sh0sg44", err, {tx:tx, txInputs:txInputs, blockHeight:blockHeight});
	}

	return {input:totalInputValue, output:totalOutputValue};
}

function getBlockTotalFeesFromCoinbaseTxAndBlockHeight(coinbaseTx, blockHeight) {
	if (coinbaseTx == null) {
		return 0;
	}

	let blockReward = coinConfig.blockRewardFunction(blockHeight, global.activeBlockchain);

	let totalOutput = new Decimal(0);
	for (let i = 0; i < coinbaseTx.vout.length; i++) {
		let outputValue = coinbaseTx.vout[i].value;
		if (outputValue > 0) {
			totalOutput = totalOutput.plus(new Decimal(outputValue));
		}
	}

	if (blockReward < 1e-8 || blockReward == null) {
		return totalOutput;
		
	} else {
		return totalOutput.minus(new Decimal(blockReward));
	}
}

function estimatedSupply(height) {
	const checkpoint = coinConfig.utxoSetCheckpointsByNetwork[global.activeBlockchain];

	let checkpointHeight = 0;
	let checkpointSupply = new Decimal(50);

	if (checkpoint && checkpoint.height <= height) {
		//console.log("using checkpoint");
		checkpointHeight = checkpoint.height;
		checkpointSupply = new Decimal(checkpoint.total_amount);
	}

	let halvingBlockInterval = coinConfig.halvingBlockIntervalsByNetwork[global.activeBlockchain];

	let supply = checkpointSupply;

	let i = checkpointHeight;
	while (i < height) {
		let nextHalvingHeight = halvingBlockInterval * Math.floor(i / halvingBlockInterval) + halvingBlockInterval;
		
		if (height < nextHalvingHeight) {
			let heightDiff = height - i;

			//console.log(`adding(${heightDiff}): ` + new Decimal(heightDiff).times(coinConfig.blockRewardFunction(i, global.activeBlockchain)));
			return supply.plus(new Decimal(heightDiff).times(coinConfig.blockRewardFunction(i, global.activeBlockchain)));
		}

		let heightDiff = nextHalvingHeight - i;

		supply = supply.plus(new Decimal(heightDiff).times(coinConfig.blockRewardFunction(i, global.activeBlockchain)));
		
		i += heightDiff;
	}

	return supply;
}

async function refreshExchangeRates() {
	if (!config.queryExchangeRates) {
		return;
	}

	if (coins[config.coin].exchangeRateData) {
		try {
			const response = await axios.get(coins[config.coin].exchangeRateData.jsonUrl);

			let exchangeRates = coins[config.coin].exchangeRateData.responseBodySelectorFunction(response.data);
			if (exchangeRates != null) {
				global.exchangeRates = exchangeRates;
				global.exchangeRatesUpdateTime = new Date();

				debugLog("Using exchange rates: " + JSON.stringify(global.exchangeRates) + " starting at " + global.exchangeRatesUpdateTime);

			} else {
				debugLog("Unable to get exchange rate data");
			}
		} catch (err) {
			logError("39r7h2390fgewfgds", err);
		}
	}

	if (coins[config.coin].goldExchangeRateData) {
		if (process.env.NODE_ENV == "local") {
			global.goldExchangeRates = {usd: 1731.2};
			global.goldExchangeRatesUpdateTime = new Date();

			debugLog("Using DEBUG gold exchange rates: " + JSON.stringify(global.goldExchangeRates) + " starting at " + global.goldExchangeRatesUpdateTime);

		} else {
			try {
				const response = await axios.get(coins[config.coin].goldExchangeRateData.jsonUrl);

				let exchangeRates = coins[config.coin].goldExchangeRateData.responseBodySelectorFunction(response.data);
				if (exchangeRates != null) {
					global.goldExchangeRates = exchangeRates;
					global.goldExchangeRatesUpdateTime = new Date();

					debugLog("Using gold exchange rates: " + JSON.stringify(global.goldExchangeRates) + " starting at " + global.goldExchangeRatesUpdateTime);

				} else {
					debugLog("Unable to get gold exchange rate data");
				}
			} catch (err) {
				logError("34082yt78yewewe", err);
			}
		}
	}
}

// Uses ipstack.com API
function geoLocateIpAddresses(ipAddresses, provider) {
	return new Promise(function(resolve, reject) {
		if (config.privacyMode || config.credentials.ipStackComApiAccessKey === undefined) {
			resolve({});

			return;
		}

		let ipDetails = {ips:ipAddresses, detailsByIp:{}};

		let promises = [];
		for (let i = 0; i < ipAddresses.length; i++) {
			let ipStr = ipAddresses[i];

			if (ipStr.endsWith(".onion")) {
				// tor, no location possible
				continue;
			}

			if (ipStr == "127.0.0.1") {
				// skip
				continue;
			}

			if (!ipStr.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
				// non-IPv4, skip it
				continue;
			}
			
			promises.push(new Promise(function(resolve2, reject2) {
				ipCache.get(ipStr).then(async function(result) {
					if (result.value == null) {
						let apiUrl = "https://api.ipstack.com/" + result.key + "?access_key=" + config.credentials.ipStackComApiAccessKey;
						
						try {
							const response = await axios.get(apiUrl);

							let ip = response.data.ip;

							ipDetails.detailsByIp[ip] = response.data;

							if (response.data.latitude && response.data.longitude) {
								debugLog(`Successful IP-geo-lookup: ${ip} -> (${response.data.latitude}, ${response.data.longitude})`);

							} else {
								debugLog(`Unknown location for IP-geo-lookup: ${ip}`);
							}									

							ipCache.set(ip, response.data, 1000 * 60 * 60 * 24 * 365);

							resolve2();

						} catch (err) {
							debugLog("Failed IP-geo-lookup: " + result.key);

							logError("39724gdge33a", err, {ip: result.key});

							// we failed to get what we wanted, but there's no meaningful recourse,
							// so we log the failure and continue without objection
							resolve2();
						}

					} else {
						ipDetails.detailsByIp[result.key] = result.value;

						resolve2();
					}
				});
			}));
		}

		Promise.all(promises).then(function(results) {
			resolve(ipDetails);

		}).catch(function(err) {
			logError("80342hrf78wgehdf07gds", err);

			reject(err);
		});
	});
}

function parseExponentStringDouble(val) {
	let [lead,decimal,pow] = val.toString().split(/e|\./);
	return +pow <= 0 
		? "0." + "0".repeat(Math.abs(pow)-1) + lead + decimal
		: lead + ( +pow >= decimal.length ? (decimal + "0".repeat(+pow-decimal.length)) : (decimal.slice(0,+pow)+"."+decimal.slice(+pow)));
}

function formatLargeNumber(n, decimalPlaces) {
	try {
		for (let i = 0; i < exponentScales.length; i++) {
			let item = exponentScales[i];

			let fraction = new Decimal(n / item.val);
			if (Math.abs(fraction) >= 1) {
				return [fraction.toDP(decimalPlaces), item];
			}
		}

		return [new Decimal(n).toDP(decimalPlaces), {}];

	} catch (err) {
		logError("ru92huefhew", err, { n:n, decimalPlaces:decimalPlaces });

		throw err;
	}
}

function formatLargeNumberSignificant(n, significantDigits) {
	try {
		for (let i = 0; i < exponentScales.length; i++) {
			let item = exponentScales[i];

			let fraction = new Decimal(n / item.val);
			if (Math.abs(fraction) >= 1) {
				return [fraction.toDP(Math.max(0, significantDigits - `${Math.floor(fraction)}`.length)), item];
			}
		}

		return [new Decimal(n).toDP(significantDigits), {}];

	} catch (err) {
		logError("38fhcdugdeogwe", err, { n:n, significantDigits:significantDigits });

		throw err;
	}
}

function rgbToHsl(r, g, b) {
	r /= 255, g /= 255, b /= 255;
	let max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h, s, l = (max + min) / 2;

	if(max == min){
		h = s = 0; // achromatic
	}else{
		let d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch(max){
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	return {h:h, s:s, l:l};
}

function colorHexToRgb(hex) {
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});

	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function colorHexToHsl(hex) {
	let rgb = colorHexToRgb(hex);
	return rgbToHsl(rgb.r, rgb.g, rgb.b);
}


// https://stackoverflow.com/a/31424853/673828
const reflectPromise = p => p.then(v => ({v, status: "resolved" }),
							e => ({e, status: "rejected" }));


global.errorStats = {};

function logError(errorId, err, optionalUserData = {}, logStacktrace=true) {
	debugErrorLog("Error " + errorId + ": " + err + ", json: " + JSON.stringify(err) + (optionalUserData != null ? (", userData: " + optionalUserData + " (json: " + JSON.stringify(optionalUserData) + ")") : ""));
	
	if (err && err.stack && logStacktrace) {
		debugErrorVerboseLog("Stack: " + err.stack);
	}


	if (!global.errorLog) {
		global.errorLog = [];
	}

	if (!global.errorStats[errorId]) {
		global.errorStats[errorId] = {
			count: 0,
			firstSeen: new Date().getTime(),
			properties: {}
		};
	}

	if (optionalUserData && err && err.message) {
		optionalUserData.errorMsg = err.message;
	}

	if (optionalUserData) {
		for (const [key, value] of Object.entries(optionalUserData)) {
			if (!global.errorStats[errorId].properties[key]) {
				global.errorStats[errorId].properties[key] = {};
			}

			if (!global.errorStats[errorId].properties[key][value]) {
				global.errorStats[errorId].properties[key][value] = 0;
			}

			global.errorStats[errorId].properties[key][value]++;
		}
	}

	statTracker.trackEvent(`errors.${errorId}`);
	statTracker.trackEvent(`errors.*`);

	global.errorStats[errorId].count++;
	global.errorStats[errorId].lastSeen = new Date().getTime();

	global.errorLog.push({errorId:errorId, error:err, userData:optionalUserData, date:new Date()});
	while (global.errorLog.length > 100) {
		global.errorLog.splice(0, 1);
	}

	// Cleanup old errorStats entries periodically to prevent memory leak
	const maxErrorStatsEntries = 1000;
	const errorStatsKeys = Object.keys(global.errorStats);
	if (errorStatsKeys.length > maxErrorStatsEntries) {
		// Remove oldest entries (based on firstSeen timestamp)
		const sortedKeys = errorStatsKeys.sort((a, b) => global.errorStats[a].firstSeen - global.errorStats[b].firstSeen);
		const keysToRemove = sortedKeys.slice(0, errorStatsKeys.length - maxErrorStatsEntries);
		keysToRemove.forEach(key => delete global.errorStats[key]);
	}

	
	let returnVal = {errorId:errorId, error:err};
	if (optionalUserData) {
		returnVal.userData = optionalUserData;
	}

	return returnVal;
}

function buildQrCodeUrls(strings) {
	return new Promise(function(resolve, reject) {
		let promises = [];
		let qrcodeUrls = {};

		for (let i = 0; i < strings.length; i++) {
			promises.push(new Promise(function(resolve2, reject2) {
				buildQrCodeUrl(strings[i], qrcodeUrls).then(function() {
					resolve2();

				}).catch(function(err) {
					reject2(err);
				});
			}));
		}

		Promise.all(promises).then(function(results) {
			resolve(qrcodeUrls);

		}).catch(function(err) {
			reject(err);
		});
	});
}

function buildQrCodeUrl(str, results) {
	return new Promise(function(resolve, reject) {
		qrcode.toDataURL(str, function(err, url) {
			if (err) {
				logError("2q3ur8fhudshfs", err, str);

				reject(err);

				return;
			}

			results[str] = url;

			resolve();
		});
	});
}

function outputTypeAbbreviation(outputType) {
	const map = {
		"pubkey": "P2PK",
		"multisig": "P2MS",
		"pubkeyhash": "P2PKH",
		"scripthash": "P2SH",
		"witness_v0_keyhash": "P2WPKH",
		"witness_v0_scripthash": "P2WSH",
		"witness_v1_taproot": "P2TR",
		"nonstandard": "nonstandard",
		"nulldata": "nulldata"
	};

	if (map[outputType]) {
		return map[outputType];

	} else {
		return "???";
	}
}

function outputTypeName(outputType) {
	const map = {
		"pubkey": "Pay to Public Key",
		"multisig": "Pay to MultiSig",
		"pubkeyhash": "Pay to Public Key Hash",
		"scripthash": "Pay to Script Hash",
		"witness_v0_keyhash": "Witness, v0 Key Hash",
		"witness_v0_scripthash": "Witness, v0 Script Hash",
		"witness_v1_taproot": "Witness, v1 Taproot",
		"nonstandard": "Non-Standard",
		"nulldata": "Null Data"
	};

	if (map[outputType]) {
		return map[outputType];

	} else {
		return "???";
	}
}

function asHash(value) {
	return value.replace(/[^a-f0-9]/gi, "");
}

function asHashOrHeight(value) {
	return +value || asHash(value);
}

function asAddress(value) {
	return value.replace(/[^a-z0-9]/gi, "");
}

const arrayFromHexString = hexString =>
	new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const getCrawlerFromUserAgentString = userAgentString => {
	for (const [name, regex] of Object.entries(crawlerBotUserAgentStrings)) {
		if (regex.test(userAgentString)) {
			return name;
		}
	}

	return null;
};

const safePromise = async (uid, promise) => {
	try {
		const response = await promise();

		return response;

	} catch (e) {
		logError(uid, e);
	}
};

const timePromise = async (name, promise, perfResults=null) => {
	const startTime = startTimeNanos();

	try {
		const response = await promise();

		const responseTimeMillis = dtMillis(startTime);

		statTracker.trackPerformance(name, responseTimeMillis);

		if (perfResults) {
			perfResults[name] = Math.max(1, parseInt(responseTimeMillis));
		}

		return response;

	} catch (e) {
		const responseTimeMillis = dtMillis(startTime);

		statTracker.trackPerformance(`${name}_error`, responseTimeMillis);

		if (perfResults) {
			perfResults[`${name}_error`] = Math.max(1, parseInt(responseTimeMillis));
		}

		throw e;
	}
};

const timeFunction = (uid, f, perfResults=null) => {
	const startTime = startTimeNanos();

	f();

	const responseTimeMillis = dtMillis(startTime);

	statTracker.trackPerformance(uid, responseTimeMillis);

	if (perfResults) {
		perfResults[uid] = responseTimeMillis;
	}
};

const fileCache = (cacheDir, cacheName, cacheVersion=1) => {
	const filename = (version) => { return ((version > 1) ? [cacheName, `v${version}`].join("-") : cacheName) + ".json"; };
	const filepath = `${cacheDir}/${filename(cacheVersion)}`;

	if (cacheVersion > 1) {
		// remove old versions
		for (let i = 1; i < cacheVersion; i++) {
			if (fs.existsSync(`${cacheDir}/${filename(i)}`)) {
				fs.unlinkSync(`${cacheDir}/${filename(i)}`);
			}
		}
	}

	return {
		tryLoadJson: () => {
			if (fs.existsSync(filepath)) {
				let rawData = fs.readFileSync(filepath);

				try {
					return JSON.parse(rawData);

				} catch (e) {
					logError("378y43edewe", e);

					fs.unlinkSync(filepath);

					return null;
				}
			}

			return null;
		},
		writeJson: (obj) => {
			if (!fs.existsSync(cacheDir)) {
				fs.mkdirSync(cacheDir);
			}

			fs.writeFileSync(filepath, JSON.stringify(obj, null, 4));
		}
	};
};

const startTimeNanos = () => {
	return process.hrtime.bigint();
};

const dtMillis = (startTimeNanos) => {
	const dtNanos = process.hrtime.bigint() - startTimeNanos;

	return parseInt(dtNanos) * 1e-6;
};

function objectProperties(obj) {
	const props = [];
	for (const prop in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, prop)) {
			props.push(prop);
		}
	}

	return props;
}

function objHasProperty(obj, name) {
	return Object.prototype.hasOwnProperty.call(obj, name);
}

function iterateProperties(obj, action) {
	for (const [key, value] of Object.entries(obj)) {
		action([key, value]);
	}
}

function stringifySimple(object) {
	let simpleObject = {};
	for (let prop in object) {
			if (!object.hasOwnProperty(prop)) {
					continue;
			}

			if (typeof(object[prop]) == 'object') {
					continue;
			}

			if (typeof(object[prop]) == 'function') {
					continue;
			}

			simpleObject[prop] = object[prop];
	}

	return JSON.stringify(simpleObject); // returns cleaned up JSON
}

function getVoutAddress(vout) {
	if (vout && vout.scriptPubKey) {
		if (vout.scriptPubKey.address) {
			return vout.scriptPubKey.address;

		} else if (vout.scriptPubKey.addresses && vout.scriptPubKey.addresses.length > 0) {
			return vout.scriptPubKey.addresses[0];
		}
	}

	return null;
}

function getVoutAddresses(vout) {
	if (vout && vout.scriptPubKey) {
		if (vout.scriptPubKey.address) {
			return [vout.scriptPubKey.address];

		} else if (vout.scriptPubKey.addresses) {
			return vout.scriptPubKey.addresses;
		}
	}

	return [];
}

const xpubPrefixes = new Map([
	['xpub', '0488b21e'],
	['ypub', '049d7cb2'],
	['Ypub', '0295b43f'],
	['zpub', '04b24746'],
	['Zpub', '02aa7ed3'],
	['tpub', '043587cf'],
	['upub', '044a5262'],
	['Upub', '024289ef'],
	['vpub', '045f1cf6'],
	['Vpub', '02575483'],
]);

const bip32TestnetNetwork = {
	messagePrefix: '\x18Bitcoin Signed Message:\n',
	bech32: 'tb',
	bip32: {
		public: 0x043587cf,
		private: 0x04358394,
	},
	pubKeyHash: 0x6f,
	scriptHash: 0xc4,
	wif: 0xEF,
};

// ref: https://github.com/ExodusMovement/xpub-converter/blob/master/src/index.js
function xpubChangeVersionBytes(xpub, targetFormat) {
	if (!xpubPrefixes.has(targetFormat)) {
		throw new Error("Invalid target version");
	}

	// trim whitespace
	xpub = xpub.trim();

	let data = bs58check.default.decode(xpub);
	data = data.slice(4);
	data = Buffer.concat([Buffer.from(xpubPrefixes.get(targetFormat), 'hex'), data]);

	return bs58check.default.encode(data);
}

// HD wallet addresses
function bip32Addresses(extPubkey, addressType, account, limit=10, offset=0) {
	let network = null;
	if (!extPubkey.match(/^(xpub|ypub|zpub|Ypub|Zpub).*$/)) {
		network = bip32TestnetNetwork;
	}

	let bip32object = bip32.fromBase58(extPubkey, network);

	let addresses = [];
	for (let i = offset; i < (offset + limit); i++) {
		let bip32Child = bip32object.derive(account).derive(i);
		let publicKey = bip32Child.publicKey;

		if (addressType == "p2pkh") {
			addresses.push(bitcoinjs.payments.p2pkh({ pubkey: publicKey, network: network }).address);

		} else if (addressType == "p2sh(p2wpkh)") {
			addresses.push(bitcoinjs.payments.p2sh({ redeem: bitcoinjs.payments.p2wpkh({ pubkey: publicKey, network: network })}).address);

		} else if (addressType == "p2wpkh") {
			addresses.push(bitcoinjs.payments.p2wpkh({ pubkey: publicKey, network: network }).address);

		} else {
			throw new Error(`Unknown address type: "${addressType}" (should be one of ["p2pkh", "p2sh(p2wpkh)", "p2wpkh"])`)
		}
	}

	return addresses;
}

function expressRequestToJson(req) {
	return {
		method: req.method,
		url: req.url,
		headers: req.headers,
		query: req.query,
		params: req.params,
		body: req.body,
		cookies: req.cookies,
		signedCookies: req.signedCookies,
		ip: req.ip,
		ips: req.ips,
		protocol: req.protocol,
		secure: req.secure,
		originalUrl: req.originalUrl,
		hostname: req.hostname,
		baseUrl: req.baseUrl,
	};
}

function difficultyAdjustmentEstimates(eraStartBlockHeader, currentBlockHeader) {
	let difficultyPeriod = parseInt(Math.floor(currentBlockHeader.height / coinConfig.difficultyAdjustmentBlockCount));
	let blocksUntilDifficultyAdjustment = ((difficultyPeriod + 1) * coinConfig.difficultyAdjustmentBlockCount) - currentBlockHeader.height;

	let heightDiff = currentBlockHeader.height - eraStartBlockHeader.height;
	let blockCount = heightDiff + 1;
	let timeDiff = currentBlockHeader.mediantime - eraStartBlockHeader.mediantime;
	let timePerBlock = timeDiff / heightDiff;
	let timePerBlockDuration = moment.duration(timePerBlock * 1000);
	let daysUntilAdjustment = new Decimal(blocksUntilDifficultyAdjustment).times(timePerBlock).dividedBy(60 * 60 * 24);
	let hoursUntilAdjustment = new Decimal(blocksUntilDifficultyAdjustment).times(timePerBlock).dividedBy(60 * 60);
	let duaDP1 = daysUntilAdjustment.toDP(1);
	let daysUntilAdjustmentStr = daysUntilAdjustment > 1 ? `~${duaDP1} day${duaDP1 == "1" ? "" : "s"}` : "< 1 day";
	let hoursUntilAdjustmentStr = hoursUntilAdjustment > 1 ? `~${hoursUntilAdjustment.toDP(0)} hr${hoursUntilAdjustment.toDP(1) == "1" ? "" : "s"}` : "< 1 hr";
	let nowTime = new Date().getTime() / 1000;
	let dt = nowTime - eraStartBlockHeader.time;
	let timePerBlock2 = dt / heightDiff;
	let predictedBlockCount = dt / coinConfig.targetBlockTimeSeconds;

	let blockRatioPercent = new Decimal(blockCount / predictedBlockCount).times(100);
	if (blockRatioPercent > 400) {
		blockRatioPercent = new Decimal(400);
	}
	if (blockRatioPercent < 25) {
		blockRatioPercent = new Decimal(25);
	}


	let diffAdjPercent = blockRatioPercent.minus(new Decimal(100));
	let diffAdjText = `Blocks during the current difficulty epoch have taken this long, on average, to be mined. If this pace continues, then in ${blocksUntilDifficultyAdjustment.toLocaleString()} block${blocksUntilDifficultyAdjustment == 1 ? "" : "s"} (${daysUntilAdjustmentStr}) the difficulty will adjust upward: +${diffAdjPercent.toDP(1)}%`;
	let diffAdjSign = "+";
	let textColorClass = "text-success";

	if (predictedBlockCount > blockCount) {
		diffAdjPercent = new Decimal(100).minus(blockRatioPercent).times(-1);
		diffAdjText = `Blocks during the current difficulty epoch have taken this long, on average, to be mined. If this pace continues, then in ${blocksUntilDifficultyAdjustment.toLocaleString()} block${blocksUntilDifficultyAdjustment == 1 ? "" : "s"} (${daysUntilAdjustmentStr}) the difficulty will adjust downward: -${diffAdjPercent.toDP(1)}%`;
		diffAdjSign = "-";
		textColorClass = "text-danger";
	}

	return {
		estimateAvailable: blockCount > 30 && !isNaN(diffAdjPercent),

		blockCount: blockCount,
		blocksLeft: blocksUntilDifficultyAdjustment,
		daysLeftStr: daysUntilAdjustmentStr,
		timeLeftStr: (daysUntilAdjustment < 1 ? hoursUntilAdjustmentStr : daysUntilAdjustmentStr),
		calculationBlockCount: heightDiff,
		currentEpoch: difficultyPeriod,

		delta: diffAdjPercent,
		sign: diffAdjSign,

		timePerBlock: timePerBlock,
		firstBlockTime: eraStartBlockHeader.time,
		nowTime: nowTime,
		dt: dt,
		predictedBlockCount: predictedBlockCount,

		//nameDesc: `Estimate for the difficulty adjustment that will occur in ${blocksUntilDifficultyAdjustment.toLocaleString()} block${blocksUntilDifficultyAdjustment == 1 ? "" : "s"} (${daysUntilAdjustmentStr}). This is calculated using the average block time over the last ${heightDiff} block(s). This estimate becomes more reliable as the difficulty epoch nears its end.`,
	};
}

function nextHalvingEstimates(eraStartBlockHeader, currentBlockHeader, difficultyAdjustmentDataArg=null) {
	let blockCount = currentBlockHeader.height;
	let halvingBlockInterval = coinConfig.halvingBlockIntervalsByNetwork[global.activeBlockchain];
	let halvingCount = parseInt(blockCount / halvingBlockInterval);
	let nextHalvingIndex = halvingCount + 1;
	let targetBlockTimeSeconds = coinConfig.targetBlockTimeSeconds;
	let nextHalvingBlock = (halvingBlockInterval * nextHalvingIndex);
	let blocksUntilNextHalving = nextHalvingBlock - blockCount;
	
	let terminalHalvingCount = coinConfig.terminalHalvingCountByNetwork[global.activeBlockchain];
	if (nextHalvingIndex > terminalHalvingCount) {
		halvingCount = terminalHalvingCount;
		nextHalvingIndex = -1;

		return {
			halvingCount: terminalHalvingCount,
			nextHalvingIndex: -1
		};
	}

	let difficultyAdjustmentData = difficultyAdjustmentDataArg;
	if (!difficultyAdjustmentData) {
		difficultyAdjustmentData = difficultyAdjustmentEstimates(eraStartBlockHeader, currentBlockHeader);
	}

	let blockCountAffectedByCurrentDifficultyDelta = Math.min(difficultyAdjustmentData.blocksLeft, blocksUntilNextHalving);
	let currDifficultyEraTimeDifferential = (coinConfig.targetBlockTimeSeconds - difficultyAdjustmentData.timePerBlock) * blockCountAffectedByCurrentDifficultyDelta;


	let secondsUntilNextHalving = blocksUntilNextHalving * targetBlockTimeSeconds - currDifficultyEraTimeDifferential;
	let daysUntilNextHalving = secondsUntilNextHalving / 60 / 60 / 24;
	let nextHalvingDate = new Date(new Date().getTime() + secondsUntilNextHalving * 1000);

	return {
		blockCount: blockCount,
		halvingBlockInterval: halvingBlockInterval,
		halvingCount: halvingCount,
		nextHalvingIndex: nextHalvingIndex,
		terminalHalvingCount: terminalHalvingCount,
		nextHalvingBlock: nextHalvingBlock,
		blocksUntilNextHalving: blocksUntilNextHalving,
		targetBlockTimeSeconds: targetBlockTimeSeconds,
		daysUntilNextHalving: daysUntilNextHalving,
		nextHalvingDate: nextHalvingDate,

		difficultyAdjustmentData: difficultyAdjustmentData
	};
}

function buildAddressError(code, message, details={}) {
	let err = { code, message };

	if (details && Object.keys(details).length > 0) {
		err.details = details;
	}

	return err;
}

function getAddressValidationConfigForActiveCoin() {
	if (coinConfig && coinConfig.addressValidation) {
		return coinConfig.addressValidation;
	}

	return null;
}

const addressValidationCache = {
	base58VersionsByNetwork: new Map(),
	bech32HrpsByNetwork: new Map()
};

function getAllowedBase58VersionsForActiveNetwork() {
	const activeNetwork = global.activeBlockchain;

	if (addressValidationCache.base58VersionsByNetwork.has(activeNetwork)) {
		return addressValidationCache.base58VersionsByNetwork.get(activeNetwork);
	}

	const validationConfig = getAddressValidationConfigForActiveCoin();
	if (!validationConfig || !validationConfig.base58VersionBytesByNetwork) {
		addressValidationCache.base58VersionsByNetwork.set(activeNetwork, null);
		return null;
	}

	const networkConfig = validationConfig.base58VersionBytesByNetwork[activeNetwork];
	if (!networkConfig) {
		addressValidationCache.base58VersionsByNetwork.set(activeNetwork, null);
		return null;
	}

	let versions = [];
	if (Array.isArray(networkConfig.p2pkh)) {
		versions.push(...networkConfig.p2pkh);
	}

	if (Array.isArray(networkConfig.p2sh)) {
		versions.push(...networkConfig.p2sh);
	}

	const allowedVersions = new Set(versions);
	addressValidationCache.base58VersionsByNetwork.set(activeNetwork, allowedVersions);

	return allowedVersions;
}

function getAllowedBech32HrpsForActiveNetwork() {
	const activeNetwork = global.activeBlockchain;

	if (addressValidationCache.bech32HrpsByNetwork.has(activeNetwork)) {
		return addressValidationCache.bech32HrpsByNetwork.get(activeNetwork);
	}

	const validationConfig = getAddressValidationConfigForActiveCoin();
	if (!validationConfig || !validationConfig.bech32HrpByNetwork) {
		addressValidationCache.bech32HrpsByNetwork.set(activeNetwork, null);
		return null;
	}

	const networkHrps = validationConfig.bech32HrpByNetwork[activeNetwork];
	if (!Array.isArray(networkHrps)) {
		addressValidationCache.bech32HrpsByNetwork.set(activeNetwork, null);
		return null;
	}

	const allowedHrps = new Set(networkHrps.map(x => x.toLowerCase()));
	addressValidationCache.bech32HrpsByNetwork.set(activeNetwork, allowedHrps);

	return allowedHrps;
}

function looksLikeBech32Address(address) {
	if (!/^[A-Za-z0-9]+$/.test(address)) {
		return false;
	}

	const separatorIndex = address.lastIndexOf("1");
	if (separatorIndex <= 0) {
		return false;
	}

	const dataPart = address.substring(separatorIndex + 1);
	if (dataPart.length < 6) {
		return false;
	}

	// Bech32 data part excludes 1, b, i, o
	if (/[1bio]/i.test(dataPart)) {
		return false;
	}

	return true;
}

function parseBase58Address(address) {
	try {
		const decoded = bitcoinjs.address.fromBase58Check(address);
		const allowedVersions = getAllowedBase58VersionsForActiveNetwork();

		if (allowedVersions && !allowedVersions.has(decoded.version)) {
			return {
				errors: [
					buildAddressError(
						"ERR_ADDRESS_VERSION_UNSUPPORTED",
						`Unsupported base58 version byte for active network: ${decoded.version}`,
						{ version: decoded.version, network: global.activeBlockchain }
					)
				]
			};
		}

		return {
			encoding: "base58",
			parsedAddress: {
				version: decoded.version,
				hash: decoded.hash.toString("hex")
			}
		};

	} catch (err) {
		const message = err && err.message ? err.message : "Unable to decode base58 address";
		const code = message.includes("Non-base58") ? "ERR_ADDRESS_CHARSET" : "ERR_ADDRESS_BASE58_CHECKSUM";

		return {
			errors: [buildAddressError(code, message)]
		};
	}
}

function parseBech32Address(address) {
	const allowedHrps = getAllowedBech32HrpsForActiveNetwork();
	const errors = [];

	const codecs = [
		{ name: "bech32", impl: bech32 },
		{ name: "bech32m", impl: bech32m }
	];

	for (const codec of codecs) {
		try {
			const decoded = codec.impl.decode(address);

			if (!decoded.words || decoded.words.length === 0) {
				return {
					errors: [
						buildAddressError(
							"ERR_ADDRESS_BECH32_MALFORMED",
							`Malformed ${codec.name} address payload`,
							{ encoding: codec.name }
						)
					]
				};
			}

			const hrp = decoded.hrp.toLowerCase();

			if (allowedHrps && !allowedHrps.has(hrp)) {
				return {
					errors: [
						buildAddressError(
							"ERR_ADDRESS_BECH32_HRP",
							`Unsupported bech32 HRP for active network: ${decoded.hrp}`,
							{ hrp: decoded.hrp, network: global.activeBlockchain }
						)
					]
				};
			}

			let witnessVersion = null;
			let data = "";

			witnessVersion = decoded.words[0];

			if (witnessVersion < 0 || witnessVersion > 16) {
				return {
					errors: [
						buildAddressError(
							"ERR_ADDRESS_WITNESS_VERSION",
							`Invalid witness version: ${witnessVersion}`,
							{ version: witnessVersion, encoding: codec.name }
						)
					]
				};
			}

			const witnessProgramWords = decoded.words.slice(1);
			const witnessProgram = Buffer.from(codec.impl.fromWords(witnessProgramWords));
			data = witnessProgram.toString("hex");

			return {
				encoding: codec.name,
				parsedAddress: {
					hrp: decoded.hrp,
					version: witnessVersion,
					data: data
				}
			};

		} catch (err) {
			const message = err && err.message ? err.message : `Unable to decode ${codec.name} address`;
			errors.push(buildAddressError("ERR_ADDRESS_BECH32_CHECKSUM", message, { encoding: codec.name }));
		}
	}

	return { errors };
}

function prioritizeAddressErrors(errors, preferredFamily=null) {
	if (!Array.isArray(errors) || errors.length === 0) {
		return [];
	}

	const basePriorityCodes = [
		"ERR_ADDRESS_EMPTY",
		"ERR_ADDRESS_TYPE",
		"ERR_ADDRESS_VERSION_UNSUPPORTED",
		"ERR_ADDRESS_CHARSET",
		"ERR_ADDRESS_BASE58_CHECKSUM",
		"ERR_ADDRESS_BECH32_HRP",
		"ERR_ADDRESS_BECH32_CHECKSUM",
		"ERR_ADDRESS_WITNESS_VERSION",
		"ERR_ADDRESS_BECH32_MALFORMED",
		"ERR_ADDRESS_INVALID"
	];

	const bech32FirstPriorityCodes = [
		"ERR_ADDRESS_EMPTY",
		"ERR_ADDRESS_TYPE",
		"ERR_ADDRESS_BECH32_HRP",
		"ERR_ADDRESS_BECH32_CHECKSUM",
		"ERR_ADDRESS_WITNESS_VERSION",
		"ERR_ADDRESS_BECH32_MALFORMED",
		"ERR_ADDRESS_VERSION_UNSUPPORTED",
		"ERR_ADDRESS_CHARSET",
		"ERR_ADDRESS_BASE58_CHECKSUM",
		"ERR_ADDRESS_INVALID"
	];

	const base58FirstPriorityCodes = [
		"ERR_ADDRESS_EMPTY",
		"ERR_ADDRESS_TYPE",
		"ERR_ADDRESS_VERSION_UNSUPPORTED",
		"ERR_ADDRESS_CHARSET",
		"ERR_ADDRESS_BASE58_CHECKSUM",
		"ERR_ADDRESS_BECH32_HRP",
		"ERR_ADDRESS_BECH32_CHECKSUM",
		"ERR_ADDRESS_WITNESS_VERSION",
		"ERR_ADDRESS_BECH32_MALFORMED",
		"ERR_ADDRESS_INVALID"
	];

	let priorityCodes = basePriorityCodes;
	if (preferredFamily === "bech32") {
		priorityCodes = bech32FirstPriorityCodes;

	} else if (preferredFamily === "base58") {
		priorityCodes = base58FirstPriorityCodes;
	}

	for (const code of priorityCodes) {
		const match = errors.find(err => err && err.code === code);
		if (match) {
			return [match];
		}
	}

	return [errors[0]];
}

function tryParseAddress(address) {
	if (address == null) {
		return {
			errors: [buildAddressError("ERR_ADDRESS_EMPTY", "Address must be provided")]
		};
	}

	if (typeof address !== "string") {
		return {
			errors: [buildAddressError("ERR_ADDRESS_TYPE", "Address must be a string")]
		};
	}

	const normalizedAddress = address.trim();
	if (normalizedAddress.length === 0) {
		return {
			errors: [buildAddressError("ERR_ADDRESS_EMPTY", "Address cannot be empty")]
		};
	}

	let base58Result = null;
	let bech32Result = null;

	if (looksLikeBech32Address(normalizedAddress)) {
		bech32Result = parseBech32Address(normalizedAddress);
		if (!bech32Result.errors) {
			return bech32Result;
		}

		base58Result = parseBase58Address(normalizedAddress);
		if (!base58Result.errors) {
			return base58Result;
		}

	} else {
		base58Result = parseBase58Address(normalizedAddress);
		if (!base58Result.errors) {
			return base58Result;
		}

		bech32Result = parseBech32Address(normalizedAddress);
		if (!bech32Result.errors) {
			return bech32Result;
		}
	}

	let errors = [];
	if (base58Result && base58Result.errors) {
		errors.push(...base58Result.errors);
	}

	if (bech32Result && bech32Result.errors) {
		errors.push(...bech32Result.errors);
	}

	if (errors.length === 0) {
		errors.push(buildAddressError("ERR_ADDRESS_INVALID", "Unable to parse address"));
	}

	const preferredFamily = looksLikeBech32Address(normalizedAddress) ? "bech32" : "base58";

	return { errors: prioritizeAddressErrors(errors, preferredFamily) };
}


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const awaitPromises = async (promises) => {
	const promiseResults = await Promise.allSettled(promises);

	promiseResults.forEach(x => {
		if (x.status == "rejected") {
			if (x.reason) {
				logError("awaitPromises_rejected", x.reason);
			}
		}
	});

	return promiseResults;
};

const obfuscateProperties = (obj, properties) => {
	if (process.env.BTCEXP_SKIP_LOG_OBFUSCATION) {
		return obj;
	}
	
	let objCopy = Object.assign({}, obj);

	properties.forEach(name => {
		objCopy[name] = "*****";
	});

	return objCopy;
}

const perfLog = [];
let perfLogItemCount = 0;
const perfLogMaxItems = 100;
const perfLogNewItem = (tags) => {
	const newItem = tags;

	newItem.id = getRandomString(12, "aA#");
	newItem.date = new Date();
	newItem.results = {};
	newItem.index = perfLogItemCount;

	perfLogItemCount++;

	perfLog.splice(0, 0, newItem);

	while (perfLog.length > perfLogMaxItems) {
		perfLog.splice(perfLog.length - 1, 1);
	}

	return {
		perfId:newItem.id,
		perfResults:newItem.results
	};
};

function trackAppEvent(name, count=1, params=null) {
	if (!global.appEventStats[name]) {
		global.appEventStats[name] = {count:0};
	}

	global.appEventStats[name].count += count;
	global.appEventStats[name].last = new Date();

	if (params != null) {
		if (global.appEventStats[name].params == null) {
			global.appEventStats[name].params = {};
		}

		let props = objectProperties(params);

		props.forEach(prop => {
			if (global.appEventStats[name].params[`${prop}[${params[prop]}]`] == null) {
				global.appEventStats[name].params[`${prop}[${params[prop]}]`] = {count: 0};
			}

			global.appEventStats[name].params[`${prop}[${params[prop]}]`].count += count;
		});
	}
}

module.exports = {
	reflectPromise: reflectPromise,
	redirectToConnectPageIfNeeded: redirectToConnectPageIfNeeded,
	formatHex: formatHex,
	splitArrayIntoChunks: splitArrayIntoChunks,
	splitArrayIntoChunksByChunkCount: splitArrayIntoChunksByChunkCount,
	getRandomString: getRandomString,
	formatCurrencyAmount: formatCurrencyAmount,
	formatCurrencyAmountWithForcedDecimalPlaces: formatCurrencyAmountWithForcedDecimalPlaces,
	formatExchangedCurrency: formatExchangedCurrency,
	formatExchangedCurrencyForDisplay: formatExchangedCurrencyForDisplay,
	getExchangedCurrencyFormatData: getExchangedCurrencyFormatData,
	satoshisPerUnitOfLocalCurrency: satoshisPerUnitOfLocalCurrency,
	coinsPerUnitOfLocalCurrency: coinsPerUnitOfLocalCurrency,
	addThousandsSeparators: addThousandsSeparators,
	formatCurrencyAmountInSmallestUnits: formatCurrencyAmountInSmallestUnits,
	seededRandom: seededRandom,
	seededRandomIntBetween: seededRandomIntBetween,
	randomInt: randomInt,
	logMemoryUsage: logMemoryUsage,
	identifyMiner: identifyMiner,
	getBlockTotalFeesFromCoinbaseTxAndBlockHeight: getBlockTotalFeesFromCoinbaseTxAndBlockHeight,
	estimatedSupply: estimatedSupply,
	refreshExchangeRates: refreshExchangeRates,
	parseExponentStringDouble: parseExponentStringDouble,
	formatLargeNumber: formatLargeNumber,
	formatLargeNumberSignificant: formatLargeNumberSignificant,
	geoLocateIpAddresses: geoLocateIpAddresses,
	getTxTotalInputOutputValues: getTxTotalInputOutputValues,
	tryParseAddress: tryParseAddress,
	rgbToHsl: rgbToHsl,
	colorHexToRgb: colorHexToRgb,
	colorHexToHsl: colorHexToHsl,
	logError: logError,
	buildQrCodeUrls: buildQrCodeUrls,
	ellipsize: ellipsize,
	ellipsizeMiddle: ellipsizeMiddle,
	summarizeDuration: summarizeDuration,
	outputTypeAbbreviation: outputTypeAbbreviation,
	outputTypeName: outputTypeName,
	asHash: asHash,
	asHashOrHeight: asHashOrHeight,
	asAddress: asAddress,
	arrayFromHexString: arrayFromHexString,
	getCrawlerFromUserAgentString: getCrawlerFromUserAgentString,
	timePromise: timePromise,
	timeFunction: timeFunction,
	startTimeNanos: startTimeNanos,
	dtMillis: dtMillis,
	objectProperties: objectProperties,
	objHasProperty: objHasProperty,
	stringifySimple: stringifySimple,
	safePromise: safePromise,
	getVoutAddress: getVoutAddress,
	getVoutAddresses: getVoutAddresses,
	xpubChangeVersionBytes: xpubChangeVersionBytes,
	bip32Addresses: bip32Addresses,
	difficultyAdjustmentEstimates: difficultyAdjustmentEstimates,
	nextHalvingEstimates: nextHalvingEstimates,
	sleep: sleep,
	obfuscateProperties: obfuscateProperties,
	awaitPromises: awaitPromises,
	perfLogNewItem: perfLogNewItem,
	perfLog: perfLog,
	fileCache: fileCache,
	expressRequestToJson: expressRequestToJson,
	trackAppEvent: trackAppEvent
};
