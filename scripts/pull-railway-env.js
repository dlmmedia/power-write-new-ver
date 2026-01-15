#!/usr/bin/env node
/**
 * Pull environment variables from the currently linked Railway project/env.
 *
 * Safety defaults:
 * - By default, prints NAMES ONLY (no secret values).
 * - To include values, you must pass --include-values explicitly.
 *
 * Examples:
 *   node scripts/pull-railway-env.js
 *     -> prints variable names only
 *
 *   node scripts/pull-railway-env.js --include-values
 *     -> prints KEY=VALUE pairs to stdout
 *
 *   node scripts/pull-railway-env.js --include-values --write .env.railway.production
 *     -> writes a .env file (be careful: contains secrets)
 *
 *   node scripts/pull-railway-env.js --required-only
 *     -> prints required keys status (present/missing) without values
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function parseArgs(argv) {
  const args = {
    includeValues: false,
    writePath: null,
    keysOnly: false,
    requiredOnly: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--include-values") args.includeValues = true;
    else if (a === "--keys-only") args.keysOnly = true;
    else if (a === "--required-only") args.requiredOnly = true;
    else if (a === "--write") {
      const p = argv[i + 1];
      if (!p) throw new Error("--write requires a path argument");
      args.writePath = p;
      i++;
    } else if (a === "-h" || a === "--help") {
      console.log(
        [
          "Usage: node scripts/pull-railway-env.js [options]",
          "",
          "Options:",
          "  --keys-only        Print variable names only (default behavior).",
          "  --include-values   Include values (DANGEROUS: secrets).",
          "  --write <path>     Write output to a file instead of stdout.",
          "  --required-only    Print required Clerk/Inngest keys status only.",
          "",
        ].join("\n"),
      );
      process.exit(0);
    }
  }

  // Default behavior is names-only unless includeValues is set.
  if (!args.includeValues) args.keysOnly = true;

  return args;
}

function extractPairs(json) {
  // Railway CLI can return either:
  // - an object map: { KEY: "value", ... }
  // - an array of entries: [{ name, value, ... }, ...]
  if (Array.isArray(json)) {
    return json
      .map((x) => ({
        key: x?.name ?? x?.key ?? x?.variable,
        value: x?.value,
      }))
      .filter((x) => typeof x.key === "string" && x.key.length > 0);
  }

  if (json && typeof json === "object") {
    const candidate = json.variables ?? json.serviceVariables ?? json.data ?? json.result ?? json;
    if (Array.isArray(candidate)) return extractPairs(candidate);
    if (candidate && typeof candidate === "object") {
      return Object.entries(candidate).map(([key, value]) => ({ key, value }));
    }
  }

  throw new Error("Unrecognized Railway variables JSON shape");
}

function quoteEnvValue(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Quote if it contains characters that commonly break .env parsing.
  if (!/[ \t\r\n"'#=]/.test(s)) return s;
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n")}"`;
}

function renderEnv(pairs, includeValues) {
  const header = [
    "# Generated from Railway variables",
    `# Generated at: ${new Date().toISOString()}`,
    "# NOTE: Do not commit this file if it contains secrets.",
    "",
  ].join("\n");

  const lines = pairs
    .slice()
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ key, value }) => {
      if (!includeValues) return key;
      return `${key}=${quoteEnvValue(value)}`;
    });

  return header + lines.join("\n") + "\n";
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const raw = execSync("railway variables --json", { encoding: "utf8" });
  const json = JSON.parse(raw);
  const pairs = extractPairs(json);

  if (args.requiredOnly) {
    const required = [
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      "CLERK_SECRET_KEY",
      "INNGEST_EVENT_KEY",
      "INNGEST_SIGNING_KEY",
    ];
    const present = new Set(pairs.map((p) => p.key));
    const out = required.map((k) => `${k}=${present.has(k) ? "present" : "MISSING"}`).join("\n") + "\n";
    if (args.writePath) {
      const abs = path.resolve(process.cwd(), args.writePath);
      fs.writeFileSync(abs, out, "utf8");
    } else {
      process.stdout.write(out);
    }
    return;
  }

  const out = renderEnv(pairs, args.includeValues);
  if (args.writePath) {
    const abs = path.resolve(process.cwd(), args.writePath);
    fs.writeFileSync(abs, out, "utf8");
  } else {
    process.stdout.write(out);
  }
}

main();

