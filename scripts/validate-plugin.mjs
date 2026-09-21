#!/usr/bin/env node
// Validates FeaturePilot's Claude Code plugin packaging.
// Zero dependencies (Node stdlib only). Exit 0 = valid, 1 = errors found.
//
// Checks:
//   - .claude-plugin/plugin.json      parses; valid name/version/keywords
//   - .claude-plugin/marketplace.json parses; valid owner/plugins; entry sanity
//   - skills/feature/SKILL.md         exists with a frontmatter `name`
//
// Run: node scripts/validate-plugin.mjs

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)*$/;

// Reserved marketplace names (per Claude Code marketplace reference).
const RESERVED_MARKETPLACES = new Set(
  [
    "claude-code-marketplace", "claude-code-plugins", "claude-plugins-official",
    "claude-plugins-community", "claude-community", "anthropic-marketplace",
    "anthropic-plugins", "agent-skills", "anthropic-agent-skills",
    "knowledge-work-plugins", "life-sciences", "claude-for-legal",
    "claude-for-financial-services", "financial-services-plugins",
    "first-party-plugins", "claude-tag-plugins", "healthcare",
    "npm", "pip", "uv", "cargo", "github", "gh",
  ].map((s) => s.toLowerCase()),
);

function readJson(relPath) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) {
    err(`${relPath}: file not found`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(abs, "utf8"));
  } catch (e) {
    err(`${relPath}: invalid JSON — ${e.message}`);
    return null;
  }
}

// --- plugin.json ---
const plugin = readJson(".claude-plugin/plugin.json");
if (plugin) {
  if (typeof plugin.name !== "string" || !KEBAB.test(plugin.name)) {
    err(`plugin.json: "name" must be kebab-case (got ${JSON.stringify(plugin.name)})`);
  }
  if (plugin.version !== undefined && !SEMVER.test(String(plugin.version))) {
    err(`plugin.json: "version" must be semver (got ${JSON.stringify(plugin.version)})`);
  }
  if (plugin.version === undefined) warn(`plugin.json: no "version" — updates won't be pinned`);
  if (plugin.keywords !== undefined && !Array.isArray(plugin.keywords)) {
    err(`plugin.json: "keywords" must be an array (a string here is a Claude Code load error)`);
  }
  if (!plugin.description) warn(`plugin.json: no "description"`);
}

// --- marketplace.json ---
const market = readJson(".claude-plugin/marketplace.json");
if (market) {
  if (typeof market.name !== "string" || !market.name) {
    err(`marketplace.json: "name" is required`);
  } else if (RESERVED_MARKETPLACES.has(market.name.toLowerCase())) {
    err(`marketplace.json: "${market.name}" is a reserved marketplace name`);
  }
  if (!market.owner || typeof market.owner.name !== "string" || !market.owner.name) {
    err(`marketplace.json: "owner.name" is required`);
  }
  if (!Array.isArray(market.plugins) || market.plugins.length === 0) {
    err(`marketplace.json: "plugins" must be a non-empty array`);
  } else {
    market.plugins.forEach((p, i) => {
      const at = `marketplace.json: plugins[${i}]`;
      if (typeof p.name !== "string" || !KEBAB.test(p.name)) {
        err(`${at}: "name" must be kebab-case (got ${JSON.stringify(p.name)})`);
      }
      if (p.source === undefined || p.source === null) {
        err(`${at}: "source" is required`);
      }
      if (p.tags !== undefined && !Array.isArray(p.tags)) {
        err(`${at}: "tags" must be an array`);
      }
      // Relative-path source must live inside the repo and start with "./"
      if (typeof p.source === "string") {
        if (!p.source.startsWith("./")) {
          err(`${at}: relative "source" must start with "./" (got ${JSON.stringify(p.source)})`);
        }
        if (p.source === "./" && plugin && p.name !== plugin.name) {
          warn(`${at}: entry name "${p.name}" differs from root plugin.json name "${plugin.name}"`);
        }
      }
    });
  }
}

// --- skill presence ---
const skillPath = "skills/feature/SKILL.md";
const skillAbs = join(root, skillPath);
if (!existsSync(skillAbs)) {
  err(`${skillPath}: skill file not found`);
} else {
  const md = readFileSync(skillAbs, "utf8");
  const fm = md.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    err(`${skillPath}: missing YAML frontmatter`);
  } else if (!/^\s*name\s*:/m.test(fm[1])) {
    err(`${skillPath}: frontmatter has no "name" field`);
  }
}

// --- report ---
for (const w of warnings) console.warn(`⚠  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗  ${e}`);
  console.error(`\nPlugin validation FAILED with ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`✓  Plugin validation passed (${warnings.length} warning(s)).`);
