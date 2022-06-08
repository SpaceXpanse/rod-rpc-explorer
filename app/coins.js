var btc = require("./coins/btc.js");
var ltc = require("./coins/ltc.js");
var rod = require("./coins/rod.js");

module.exports = {
	"BTC": btc,
	"LTC": ltc,
	"ROD":rod,

	"coins":["BTC", "LTC","ROD"]
};
