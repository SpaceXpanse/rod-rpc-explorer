"use strict";

const config = require("./config.js");

function shouldSkipUtxoSetSummaryFetch() {
	return config.slowDeviceMode && (!global.getindexinfo || !global.getindexinfo.coinstatsindex);
}

module.exports = {
	shouldSkipUtxoSetSummaryFetch: shouldSkipUtxoSetSummaryFetch
};
