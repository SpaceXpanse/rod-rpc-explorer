"use strict";

const btc = require("./coins/btc.js");
const rod = require("./coins/rod.js");

module.exports = {
	"BTC": btc,
	"ROD": rod,

	"coins":["BTC", "ROD"]
};