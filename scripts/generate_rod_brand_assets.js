"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const { execFileSync } = require("child_process");

const projectRoot = path.join(__dirname, "..");
const spacexpanseLogoUrl = "https://www.spacexpanse.org/img/about.png";
const cachedLogoPath = "public/img/brand/spacexpanse-logo-source.png";
const tempDir = "tmp/rod-brand-assets";

const edgeExecutableCandidates = [
	process.env.EDGE_PATH,
	"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
	"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
	"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
].filter(Boolean);

const renderJobs = [
	{
		type: "icon",
		output: "public/img/brand/spacexpanse-rod-icon.png",
		width: 256,
		height: 256
	},
	{
		type: "social-preview",
		output: "public/img/rod-social-preview.png",
		width: 1200,
		height: 630
	}
];

const copyJobs = [
	{
		source: "public/img/brand/spacexpanse-rod-icon.png",
		output: "public/img/network-mainnet/coin-icon.png"
	},
	{
		source: "public/img/brand/spacexpanse-rod-icon.png",
		output: "public/img/network-mainnet/logo.png"
	}
];

function resolveBrowserExecutable() {
	for (const executablePath of edgeExecutableCandidates) {
		if (fs.existsSync(executablePath)) {
			return executablePath;
		}
	}

	throw new Error("Unable to find a Chromium-based browser executable for PNG asset generation.");
}

function toAbsolutePath(relativePath) {
	return path.join(projectRoot, relativePath);
}

function escapeHtml(value) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;");
}

function toFileUrl(relativePath) {
	const absolutePath = toAbsolutePath(relativePath).replace(/\\/g, "/");

	return `file:///${absolutePath}`;
}

function writeTextFile(relativePath, contents) {
	const absolutePath = toAbsolutePath(relativePath);

	fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
	fs.writeFileSync(absolutePath, contents, "utf8");

	return relativePath;
}

function downloadFile(url, outputPath) {
	return new Promise((resolve, reject) => {
		const fileStream = fs.createWriteStream(outputPath);

		https.get(url, response => {
			if (response.statusCode !== 200) {
				fileStream.close(() => fs.rmSync(outputPath, { force: true }));
				reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
				return;
			}

			response.pipe(fileStream);
			fileStream.on("finish", () => fileStream.close(resolve));
		}).on("error", error => {
			fileStream.close(() => fs.rmSync(outputPath, { force: true }));
			reject(error);
		});
	});
}

async function ensureSourceLogo() {
	const absoluteCachedLogoPath = toAbsolutePath(cachedLogoPath);

	fs.mkdirSync(path.dirname(absoluteCachedLogoPath), { recursive: true });

	try {
		await downloadFile(spacexpanseLogoUrl, absoluteCachedLogoPath);
	} catch (error) {
		if (!fs.existsSync(absoluteCachedLogoPath) || fs.statSync(absoluteCachedLogoPath).size <= 0) {
			throw error;
		}

		console.warn(`Falling back to cached SpaceXpanse logo source at ${cachedLogoPath}: ${error.message}`);
	}

	if (!fs.existsSync(absoluteCachedLogoPath) || fs.statSync(absoluteCachedLogoPath).size <= 0) {
		throw new Error(`Missing SpaceXpanse logo source PNG at ${cachedLogoPath}`);
	}

	return cachedLogoPath;
}

function buildIconHtml(logoFileUrl) {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
html,body{margin:0;width:256px;height:256px;overflow:hidden;background:#022e70}
body{display:grid;place-items:center}
.frame{position:relative;width:256px;height:256px;border-radius:52px;background:linear-gradient(180deg,#06357f 0%,#022e70 100%);overflow:hidden}
.orb{position:absolute;inset:35px;border-radius:999px;background:#1c2d66;border:8px solid #f4b73f;box-sizing:border-box}
.logo{position:absolute;left:45px;top:45px;width:166px;height:166px;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(0,0,0,.35))}
</style>
</head>
<body>
<div class="frame"><div class="orb"></div><img class="logo" src="${escapeHtml(logoFileUrl)}" alt="SpaceXpanse logo"></div>
</body>
</html>`;
}

function buildSocialPreviewHtml(logoFileUrl) {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{font-family:Ubuntu,"Segoe UI",sans-serif;background:linear-gradient(135deg,#031a40 0%,#022e70 56%,#021126 100%);color:#fff;position:relative}
.halo{position:absolute;inset:-80px -40px auto auto;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(47,141,255,.34) 0%,rgba(47,141,255,0) 65%)}
.rails{position:absolute;left:74px;right:74px;top:142px;bottom:142px;border-top:1px solid rgba(255,255,255,.13);border-bottom:1px solid rgba(255,255,255,.13)}
.trail{position:absolute;left:52px;right:52px;bottom:136px;height:220px;border-bottom:4px solid rgba(244,183,63,.52);border-radius:0 0 65% 35% / 0 0 100% 100%;transform:skewX(-18deg)}
.copy{position:absolute;left:84px;top:156px}
.eyebrow{font-size:38px;font-weight:300;letter-spacing:7px;color:#f4b73f;margin:0 0 28px}
.title{font-size:78px;font-weight:700;line-height:1.05;margin:0 0 28px}
.subtitle{font-size:32px;color:#c9d9f7;margin:0 0 52px}
.meta{font-size:27px;color:#ecf4ff;margin:0}
.badge{position:absolute;right:174px;top:156px;width:236px;height:236px;border-radius:54px;background:#061d43;border:8px solid #f4b73f;display:grid;place-items:center;box-sizing:border-box}
.badge::before{content:"";position:absolute;inset:24px;border-radius:50%;background:#1c2d66}
.badge img{position:relative;width:150px;height:150px;object-fit:contain;filter:drop-shadow(0 12px 20px rgba(0,0,0,.35))}
.dot-a,.dot-b,.dot-c{position:absolute;border-radius:50%}
.dot-a{right:129px;top:108px;width:12px;height:12px;background:#f4b73f}
.dot-b{right:84px;bottom:99px;width:8px;height:8px;background:rgba(255,255,255,.7)}
.dot-c{left:713px;top:100px;width:6px;height:6px;background:rgba(255,255,255,.55)}
</style>
</head>
<body>
<div class="halo"></div>
<div class="rails"></div>
<div class="trail"></div>
<div class="copy">
<p class="eyebrow">SPACEXPANSE</p>
<h1 class="title">ROD RPC Explorer</h1>
<p class="subtitle">Self-hosted chain insight for ROD nodes</p>
<p class="meta">Blocks • transactions • addresses • RPC diagnostics</p>
</div>
<div class="badge"><img src="${escapeHtml(logoFileUrl)}" alt="SpaceXpanse logo"></div>
<div class="dot-a"></div><div class="dot-b"></div><div class="dot-c"></div>
</body>
</html>`;
}

function buildRenderSource(job, logoRelativePath) {
	const logoFileUrl = toFileUrl(logoRelativePath);

	if (job.type === "icon") {
		return writeTextFile(path.join(tempDir, "spacexpanse-rod-icon.html"), buildIconHtml(logoFileUrl));
	}

	if (job.type === "social-preview") {
		return writeTextFile(path.join(tempDir, "rod-social-preview.html"), buildSocialPreviewHtml(logoFileUrl));
	}

	throw new Error(`Unsupported render job type: ${job.type}`);
}

function renderPngAsset(browserExecutable, job, logoRelativePath) {
	const absoluteOutputPath = toAbsolutePath(job.output);
	const renderSourcePath = buildRenderSource(job, logoRelativePath);

	fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });

	execFileSync(browserExecutable, [
		"--headless",
		"--disable-gpu",
		`--screenshot=${absoluteOutputPath}`,
		`--window-size=${job.width},${job.height}`,
		toFileUrl(renderSourcePath)
	], { stdio: "inherit" });

	if (!fs.existsSync(absoluteOutputPath) || fs.statSync(absoluteOutputPath).size <= 0) {
		throw new Error(`PNG render failed for ${job.output}`);
	}
}

function copyPngAsset(job) {
	const absoluteSourcePath = toAbsolutePath(job.source);
	const absoluteOutputPath = toAbsolutePath(job.output);

	fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
	fs.copyFileSync(absoluteSourcePath, absoluteOutputPath);

	if (!fs.existsSync(absoluteOutputPath) || fs.statSync(absoluteOutputPath).size <= 0) {
		throw new Error(`PNG copy failed for ${job.output}`);
	}
}

async function main() {
	const browserExecutable = resolveBrowserExecutable();
	const logoRelativePath = await ensureSourceLogo();

	renderJobs.forEach(job => renderPngAsset(browserExecutable, job, logoRelativePath));
	copyJobs.forEach(copyPngAsset);

	console.log("Generated ROD PNG brand assets.");
}

main().catch(error => {
	console.error(error.message);
	process.exit(1);
});
