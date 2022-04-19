var btc = require("./coins/btc.js");
var ltc = require("./coins/ltc.js");
var xaya = require("./coins/spacexpanse.js");

module.exports = {
	"BTC": btc,
	"LTC": ltc,
	"SPACEXPANSE":spacexpanse,

	"coins":["BTC", "LTC","SPACEXPANSE"]
};