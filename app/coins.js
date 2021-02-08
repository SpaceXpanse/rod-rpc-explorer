var btc = require("./coins/btc.js");
var ltc = require("./coins/ltc.js");
var xaya = require("./coins/xaya.js");

module.exports = {
	"BTC": btc,
	"LTC": ltc,
	"XAYA":xaya,

	"coins":["BTC", "LTC","XAYA"]
};