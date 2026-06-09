# ─────────────────────────────────────────────────────────────────────
# GENERATED FILE — DO NOT EDIT BY HAND.
#
# This .env is rendered from .env.tpl by `npm run env:pull` (which calls
# `op inject` to resolve 1Password references). Any manual edits will be
# overwritten the next time anyone runs the pull.
#
# To change a value: edit this template (for literals) or the matching
# 1Password item in the "LA stack" vault (for op:// references), then
# run `npm run env:pull` again.
# To onboard a new dev: see docs/SETUP-SECRETS.md.
# ─────────────────────────────────────────────────────────────────────

# ── Microsoft Entra External ID — SPA Application ─────────────────────
# Reuses the dataverse-contact-api SPA registration. localhost:5173 and
# any deployment URLs must be listed under the app reg's Redirect URIs.
VITE_ENTRA_TENANT_ID=75fab46b-c8f0-455c-9878-29dd302f9c77
VITE_ENTRA_CLIENT_ID=4636ae2c-7850-4ed6-88bd-2695ac87059a
VITE_ENTRA_API_SCOPE=api://4bef9bf5-ce7a-4242-ac7e-a33da35dbef9/access_as_user

# ── API base URL ──────────────────────────────────────────────────────
VITE_API_BASE_URL=https://api.dataverse-contact.tnapps.co.uk

# ── API scope partition (optional — defaults to "default") ────────────
# VITE_API_SCOPE=default
