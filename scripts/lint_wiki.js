#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function listMarkdownFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) {
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

function parseMarkdownLinks(content) {
  const matches = [];
  const regex = /\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

function normalizeRel(p) {
  return p.replace(/\\/g, "/");
}

function stripAnchorAndQuery(link) {
  return link.split("#")[0].split("?")[0];
}

function hasMeaningfulContent(content) {
  return content.replace(/\s+/g, "").length > 0;
}

function extractIndexLinkedMarkdownFiles(indexPath, indexContent, wikiDir) {
  const linkedFiles = [];
  const links = parseMarkdownLinks(indexContent);

  for (const rawLink of links) {
    const target = stripAnchorAndQuery(rawLink);
    if (!target || target.startsWith("#")) continue;
    if (/^(https?:|mailto:)/i.test(target)) continue;
    if (!target.toLowerCase().endsWith(".md")) continue;

    const resolved = path.resolve(path.dirname(indexPath), target);
    if (resolved.startsWith(wikiDir)) {
      linkedFiles.push(resolved);
    }
  }

  return linkedFiles;
}

function isConventionRuleExampleLine(filePathRel, lineText) {
  if (filePathRel !== "docs/maintainer-wiki/convention-protocol-fact-provenance.md") {
    return false;
  }

  const text = lineText.trim().toLowerCase();
  if (text.startsWith("#")) return true;
  if (text.includes("citation requirement")) return true;
  if (text.includes("open/deferred/known-bug/status claim")) return true;
  if (text.includes("if a protocol-facing value cannot be confirmed")) return true;
  return false;
}

function lineContainsStatusMarker(lineText) {
  return /(\bTODO\b|\bFIXME\b|known bug|open issue|not implemented|deferred|unresolved|\bunverified\b|needs verification|Unknown:|Needs verification:|UNVERIFIED)/i.test(lineText);
}

function isNonClaimContextLine(lineText) {
  const text = lineText.trim();
  if (text.startsWith("#")) return true;
  if (/\[[^\]]+\]\([^)]*\)/.test(text)) return true;
  if (/\b(include|including|rules|policy|handling|references?|citation|marker|example|examples?)\b/i.test(text)) return true;
  return false;
}

function lineContainsEvidence(lineText) {
  const hasUrl = /https?:\/\//i.test(lineText);
  const hasIssueRef = /(#[0-9]{1,7}|issue\s*#\d+|GH-\d+)/i.test(lineText);
  const hasExplicitEvidence = /\bEvidence\s*:/i.test(lineText);
  const hasRepoPathWithExt = /[A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+\.[A-Za-z0-9]+/.test(lineText);
  const hasTestPath = /\b(test|tests)\/[A-Za-z0-9_./-]+/.test(lineText);

  return hasUrl || hasIssueRef || hasExplicitEvidence || hasRepoPathWithExt || hasTestPath;
}

function run() {
  const wikiArg = process.argv[2] || "docs/maintainer-wiki";
  const repoArg = process.argv[3] || process.cwd();

  const repoRoot = path.resolve(repoArg);
  const wikiDir = path.resolve(repoRoot, wikiArg);
  const markdownFiles = listMarkdownFiles(wikiDir);

  const failures = [];

  if (!fs.existsSync(wikiDir)) {
    failures.push(`Wiki directory does not exist: ${normalizeRel(path.relative(repoRoot, wikiDir))}`);
  }

  // Check 1: Broken internal markdown links
  const brokenLinks = [];
  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const links = parseMarkdownLinks(content);
    for (const rawLink of links) {
      const target = stripAnchorAndQuery(rawLink);
      const lower = target.toLowerCase();
      if (!target || target.startsWith("#")) continue;
      if (/^(https?:|mailto:)/i.test(target)) continue;
      if (!lower.endsWith(".md")) continue;
      const resolved = path.resolve(path.dirname(filePath), target);
      if (!fs.existsSync(resolved)) {
        brokenLinks.push(`${normalizeRel(path.relative(repoRoot, filePath))} -> ${rawLink}`);
      }
    }
  }
  if (brokenLinks.length > 0) {
    failures.push(`Broken internal markdown links (${brokenLinks.length})`);
  }

  // Check 2: index coverage
  const indexPath = path.join(wikiDir, "index.md");
  const excluded = new Set(["index.md", "README.md", "log.md"]);
  const unindexed = [];
  if (!fs.existsSync(indexPath)) {
    failures.push(`Missing index: ${normalizeRel(path.relative(repoRoot, indexPath))}`);
  } else {
    const indexContent = fs.readFileSync(indexPath, "utf8");
    const indexLinks = new Set(
      parseMarkdownLinks(indexContent)
        .map((x) => stripAnchorAndQuery(x))
        .map((x) => normalizeRel(x))
    );

    for (const filePath of markdownFiles) {
      const relFromWiki = normalizeRel(path.relative(wikiDir, filePath));
      if (excluded.has(relFromWiki)) continue;
      const direct = relFromWiki;
      const prefixed = normalizeRel(path.join("docs/maintainer-wiki", relFromWiki));
      if (!indexLinks.has(direct) && !indexLinks.has(prefixed)) {
        unindexed.push(relFromWiki);
      }
    }
  }
  if (unindexed.length > 0) {
    failures.push(`Unindexed wiki pages (${unindexed.length})`);
  }

  // Check 2b: required wiki pages exist and are non-empty
  const requiredPageFailures = [];
  const requiredPages = [
    path.join(wikiDir, "README.md"),
    path.join(wikiDir, "index.md"),
    path.join(wikiDir, "log.md")
  ];

  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, "utf8");
    const linkedFromIndex = extractIndexLinkedMarkdownFiles(indexPath, indexContent, wikiDir);
    requiredPages.push(...linkedFromIndex);
  }

  const uniqueRequired = Array.from(new Set(requiredPages));
  for (const requiredPage of uniqueRequired) {
    if (!fs.existsSync(requiredPage)) {
      requiredPageFailures.push(`Missing required page: ${normalizeRel(path.relative(repoRoot, requiredPage))}`);
      continue;
    }

    const content = fs.readFileSync(requiredPage, "utf8");
    if (!hasMeaningfulContent(content)) {
      requiredPageFailures.push(`Empty required page: ${normalizeRel(path.relative(repoRoot, requiredPage))}`);
    }
  }

  if (requiredPageFailures.length > 0) {
    failures.push(`Required wiki pages missing/empty (${requiredPageFailures.length})`);
  }

  // Check 3: repo-path resolution for backtick paths
  const unresolvedRepoPaths = [];
  const tokenRegex = /`([^`]+)`/g;
  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    let match;
    while ((match = tokenRegex.exec(content)) !== null) {
      const token = match[1].trim();
      if (!token.includes("/")) continue;
      const core = token.split("#")[0].split(".")[0] ? token.split("#")[0] : token;
      const cleaned = token.split("#")[0].replace(/[),.;:]+$/, "");
      if (cleaned.toLowerCase().endsWith(".md")) continue;
      if (!/\.[a-z0-9]+$/i.test(cleaned)) continue;
      const abs = path.resolve(repoRoot, cleaned);
      if (!fs.existsSync(abs)) {
        unresolvedRepoPaths.push(`${normalizeRel(path.relative(repoRoot, filePath))} -> ${token}`);
      }
    }
  }
  if (unresolvedRepoPaths.length > 0) {
    failures.push(`Unresolved repo path tokens (${unresolvedRepoPaths.length})`);
  }

  // Check 4: status claims must include evidence on the same line
  const staleStatusWithoutEvidence = [];
  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    const rel = normalizeRel(path.relative(repoRoot, filePath));

    lines.forEach((line, index) => {
      if (!lineContainsStatusMarker(line)) return;
      if (isConventionRuleExampleLine(rel, line)) return;
      if (isNonClaimContextLine(line)) return;
      if (!lineContainsEvidence(line)) {
        staleStatusWithoutEvidence.push(`${rel}:${index + 1} -> ${line.trim()}`);
      }
    });
  }

  if (staleStatusWithoutEvidence.length > 0) {
    failures.push(`Status claims without same-line evidence (${staleStatusWithoutEvidence.length})`);
  }

  console.log(`CHECK broken-internal-markdown-links: ${brokenLinks.length === 0 ? "PASS" : "FAIL"}`);
  brokenLinks.forEach((x) => console.log(`  - ${x}`));
  console.log(`CHECK index-coverage: ${unindexed.length === 0 ? "PASS" : "FAIL"}`);
  unindexed.forEach((x) => console.log(`  - ${x}`));
  console.log(`CHECK required-pages-non-empty: ${requiredPageFailures.length === 0 ? "PASS" : "FAIL"}`);
  requiredPageFailures.forEach((x) => console.log(`  - ${x}`));
  console.log(`CHECK repo-path-resolution: ${unresolvedRepoPaths.length === 0 ? "PASS" : "FAIL"}`);
  unresolvedRepoPaths.forEach((x) => console.log(`  - ${x}`));
  console.log(`CHECK status-claims-evidence: ${staleStatusWithoutEvidence.length === 0 ? "PASS" : "FAIL"}`);
  staleStatusWithoutEvidence.forEach((x) => console.log(`  - ${x}`));

  if (failures.length > 0) {
    console.log(`SUMMARY: FAIL (${failures.length} checks failed)`);
    process.exit(1);
  }

  console.log("SUMMARY: PASS (all checks passed)");
}

run();
