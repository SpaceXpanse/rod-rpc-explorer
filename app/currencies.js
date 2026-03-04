// Load currency types based on the configured coin
const config = require("./config.js");
const coins = require("./coins.js");
const coinConfig = coins[config.coin];

// Initialize base currency types - ROD specific
global.currencyTypes = {
	"rod": {
		id: "rod",
		type:"native",
		name:"ROD",
		multiplier:1,
		default:true,
		decimalPlaces:8
	},
	"rodits": {
		id: "rodits",
		type:"native",
		name:"rodits",
		multiplier:100000000,
		decimalPlaces:0
	},
	"mrod": {
		id: "mrod",
		type:"native",
		name:"mROD",
		multiplier:1000,
		decimalPlaces:5
	},
	"usd": {
		id: "usd",
		type:"exchanged",
		name:"USD",
		multiplier:"usd",
		decimalPlaces:2,
		symbol:"$"
	},
	"eur": {
		id: "eur",
		type:"exchanged",
		name:"EUR",
		multiplier:"eur",
		decimalPlaces:2,
		symbol:"€"
	},
	"gbp": {
		id: "gbp",
		type:"exchanged",
		name:"GBP",
		multiplier:"gbp",
		decimalPlaces:2,
		symbol:"£"
	},
};

// Add coin-specific currency types from the coin config
if (coinConfig && coinConfig.currencyUnits) {
	for (const unit of coinConfig.currencyUnits) {
		const unitNameLower = unit.name.toLowerCase();
		
		// Add each value alias for this unit
		if (unit.values) {
			for (const value of unit.values) {
				global.currencyTypes[value.toLowerCase()] = {
					id: value.toLowerCase(),
					type: unit.type,
					name: unit.name,
					multiplier: unit.multiplier,
					default: unit.default || false,
					decimalPlaces: unit.decimalPlaces,
					symbol: unit.symbol || ""
				};
			}
		}
		
		// Also add the main unit name
		global.currencyTypes[unitNameLower] = {
			id: unitNameLower,
			type: unit.type,
			name: unit.name,
			multiplier: unit.multiplier,
			default: unit.default || false,
			decimalPlaces: unit.decimalPlaces,
			symbol: unit.symbol || ""
		};
	}
}

global.currencySymbols = {
	"rod": "ROD",
	"mrod": "mROD",
	"rodits": "rodits",
	"usd": "$",
	"eur": "€",
	"gbp": "£"
};
