# Setting up env for local development

This portal renders its local `.env` file from a committed template using the **1Password CLI** — matching the workflow used by `dataverse-contact-api`. New developers should never need plaintext values passed by Slack, email, or copy-paste.

> The portal currently has no real secrets — every value in `.env.tpl` is a public Entra/SPA identifier or an HTTPS URL kept literal in the template. The 1Password flow is in place so that any future secret (e.g. a Vite-baked Application Insights connection string) drops in seamlessly without changing dev onboarding.

## One-time setup

### 1. Install the 1Password CLI

| OS | Command |
|---|---|
| macOS | `brew install --cask 1password-cli` |
| Windows | `winget install 1Password.CLI` |
| Linux | See [developer.1password.com/docs/cli/get-started](https://developer.1password.com/docs/cli/get-started/) |

Verify: `op --version` (need 2.0+).

### 2. Sign in

```bash
op signin
```

If your 1Password account is integrated with the desktop app, enable **Settings → Developer → Integrate with 1Password CLI** instead — `op` will use the desktop app for biometric unlock.

### 3. Confirm vault access

```bash
npm run env:check
```

Expected output:

```
OK: LA stack vault accessible
```

If you see `[ERROR] could not find vault "LA stack"`, ask the team to grant you read access to the `LA stack` vault.

### 4. Render the env file

```bash
npm run env:pull
```

This populates `.env` (gitignored) from `.env.tpl`. While the template currently contains only literal values, the command still verifies that your `op` session is healthy.

### 5. Run the portal

```bash
npm install
npm run dev
```

## What's in the template

The single committed template at the repo root is **`.env.tpl`** → renders to `.env`.

Non-secret config (tenant IDs, OIDC audiences, public SPA client IDs, API base URL) sits in the template as **literal values** so it's self-documenting. Any real secrets added later use `op://` references that get resolved at render time:

```
VITE_APPINSIGHTS_CONNECTION_STRING=op://LA stack/dataverse-example-case-portal-app-insights-conn/password
```

## Bootstrapping the vault (first time only — when a secret is added)

If new secret items don't yet exist in `LA stack`, someone needs to populate them from their working local `.env`:

**Windows (PowerShell):**

```
.\scripts\bootstrap-1password.ps1
```

**macOS/Linux (or any shell where `op` can be spawned by Node):**

```
node scripts/bootstrap-1password.mjs
```

Both scripts read the current `.env` and `op item create` each value into the vault. Idempotent — items that already exist are skipped.

> **Windows gotcha:** the Node version fails on Windows because 1Password's desktop integration only trusts immediate-parent processes (it sees `node` as the parent, not `powershell`). Use the `.ps1` version.

The `$Items` / `ITEMS` array in each script is currently empty — populate it once the portal has a secret to track.

## Rotating a secret (when one exists)

1. Generate a new value (e.g. roll the App Insights instrumentation key).
2. Update the matching value in **Vercel** (production source of truth).
3. Update the matching item in **1Password** (`LA stack` vault).
4. Devs re-run `npm run env:pull`.

No code changes, no commits, no per-dev DMs.

## Adding a new secret

1. Add the variable to `.env.tpl`:

   ```
   NEW_SECRET=op://LA stack/dataverse-example-case-portal-<new-item-name>/password
   ```

2. Create the item in 1Password (`LA stack` vault, name `dataverse-example-case-portal-<new-item-name>`, value in the `password` field).

3. Add the variable to **Vercel** project settings for the relevant environment(s).

4. Add an entry to the `ITEMS` / `$Items` array in both bootstrap scripts so future onboarders can seed their own value if needed.

5. Commit the template + script changes. Other devs run `npm run env:pull` to pick it up.

## Why not just `vercel env pull`?

`vercel env pull` is fine for non-sensitive vars but treats vars marked **Sensitive** in Vercel as write-only — they're never returned to the CLI. Once secrets in Vercel are flagged Sensitive (to harden production), `vercel env pull` can't be the dev-onboarding path. 1Password covers both cases consistently.

If you specifically need a snapshot of the production Vercel environment, run `vercel env pull .env.local` directly — it's a separate flow.
