"use strict";

const { createClient } = require("redis");

const config = require("./config.js");
const utils = require("./utils.js");

let redisClient = null;
if (config.redisUrl) {
	redisClient = createClient({url:config.redisUrl});
}

function createCache(keyPrefix, onCacheEvent) {
	return {
		get: async function(key) {
			if (!redisClient.isOpen) {
				try {
					await redisClient.connect();
				} catch (connectErr) {
					// Gracefully handle connection errors - return null to fallback to next cache tier
					return null;
				}
			}

			const prefixedKey = `${keyPrefix}-${key}`;

			onCacheEvent("redis", "try", prefixedKey);

			try {
				let result = await redisClient.get(prefixedKey);

				if (result == null) {
					onCacheEvent("redis", "miss", prefixedKey);

					return null;

				} else {
					onCacheEvent("redis", "hit", prefixedKey);

					return JSON.parse(result);
				}
			} catch (err) {
				onCacheEvent("redis", "error", prefixedKey);

				utils.logError("328rhwefghsdgsdss", err, {key:prefixedKey});

				// Return null to allow fallback to next cache tier instead of throwing
				return null;
			}
		},
		set: async function(key, obj, maxAgeMillis) {
			if (!redisClient.isOpen) {
				try {
					await redisClient.connect();
				} catch (connectErr) {
					// Gracefully handle connection errors - silently fail
					return;
				}
			}
			
			const prefixedKey = `${keyPrefix}-${key}`;

			try {
				await redisClient.set(prefixedKey, JSON.stringify(obj), {"PX": maxAgeMillis});
			} catch (err) {
				// Silently fail on Redis errors to prevent cache writes from breaking the application
				utils.logError("redis_set_error", err, {key:prefixedKey});
			}
		}
	};
}

module.exports = {
	active: (redisClient != null),
	createCache: createCache
}