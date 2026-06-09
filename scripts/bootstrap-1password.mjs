#!/usr/bin/env node
// One-shot: create 1Password items in the "LA stack" vault from values in
// the current .env. Idempotent — items that already exist are skipped.
//
// Prereqs: `op` CLI installed and signed in (`op signin`).
// Usage:   node scripts/bootstrap-1password.mjs
//
// Once items exist in 1Password you can delete .env and re-render it
// with `npm run env:pull`. This script can be deleted after first use.
//
// NOTE: the portal currently has no real secrets — every value in .env.tpl
// is a public Entra/SPA identifier or an HTTPS URL, kept literal in the
// template so it's self-documenting. The ITEMS list is empty for now and
// this script is a no-op; add an entry when the portal grows a secret
// (e.g. a Vite-baked Application Insights connection string).

import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const VAULT = "LA stack";
const ENV_FILE = ".env";

// Map of 1Password item name → .env variable name.
// Example for when a secret gets added:
//   { name: "dataverse-example-case-portal-app-insights-conn",
//     envVar: "VITE_APPINSIGHTS_CONNECTION_STRING", required: false },
const ITEMS = [];

function loadEnv(path) {
  if (!existsSync(path)) {
    console.error(`✘ ${path} not found. Run this from the repo root.`);
    process.exit(1);
  }
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1);
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[key] = value;
  }
  return env;
}

function runOp(args, opts = {}) {
  return spawnSync("op", args, { encoding: "utf8", ...opts });
}

function checkPrereqs() {
  const v = runOp(["--version"]);
  if (v.status !== 0) {
    console.error("✘ `op` CLI not found on PATH.");
    console.error("  Install: winget install 1Password.CLI (Windows) or brew install --cask 1password-cli (macOS)");
    process.exit(1);
  }
  const who = runOp(["whoami"]);
  if (who.status !== 0) {
    console.error("✘ Not signed in to 1Password CLI.");
    console.error("  Run: op signin");
    console.error(who.stderr || who.stdout);
    process.exit(1);
  }
  const vault = runOp(["vault", "get", VAULT]);
  if (vault.status !== 0) {
    console.error(`✘ Cannot access vault "${VAULT}".`);
    console.error("  Ask your 1Password admin for read/write access.");
    console.error(vault.stderr || vault.stdout);
    process.exit(1);
  }
  console.log(`✓ op CLI ready, signed in, vault "${VAULT}" accessible.\n`);
}

function itemExists(name) {
  const r = runOp(["item", "get", name, "--vault", VAULT, "--format=json"]);
  return r.status === 0;
}

function createItem(name, value) {
  const r = runOp([
    "item", "create",
    "--category=password",
    `--title=${name}`,
    `--vault=${VAULT}`,
    `password=${value}`,
  ]);
  if (r.status !== 0) {
    throw new Error(`op item create failed: ${r.stderr || r.stdout}`);
  }
}

function main() {
  console.log(`Bootstrapping 1Password items in vault "${VAULT}" from ${ENV_FILE}\n`);
  checkPrereqs();

  if (ITEMS.length === 0) {
    console.log("No items configured for bootstrap — the portal currently has no secrets.");
    console.log("Edit scripts/bootstrap-1password.mjs and add to ITEMS when a secret is introduced.");
    return;
  }

  const env = loadEnv(ENV_FILE);
  let created = 0, skipped = 0, missing = 0;
  for (const { name, envVar, required } of ITEMS) {
    const value = env[envVar];
    if (!value) {
      if (required) {
        console.error(`✘ ${name} — required env var ${envVar} is missing from ${ENV_FILE}`);
        missing++;
      } else {
        console.log(`⊘ ${name} — optional env var ${envVar} not set, skipping`);
      }
      continue;
    }
    if (itemExists(name)) {
      console.log(`= ${name} — already exists, skipping`);
      skipped++;
      continue;
    }
    try {
      createItem(name, value);
      console.log(`✓ ${name} — created`);
      created++;
    } catch (err) {
      console.error(`✘ ${name} — ${err.message}`);
      missing++;
    }
  }

  console.log(`\nDone. Created: ${created}, already existed: ${skipped}, failed/missing: ${missing}`);
  if (missing > 0) process.exit(1);
  console.log("\nNext: run `npm run env:pull` to verify the templates render.");
}

main();
