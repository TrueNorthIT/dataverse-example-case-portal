# Dataverse Example Case Portal

## What it does — user, customer & business value

This is an **example case management portal** — a realistic, working demonstration of the kind of citizen/staff-facing web portal a local authority can build on top of Microsoft Dataverse using the Dataverse Contact API. It is part of the "Contact Portal API" pillar of the LA Stack and is the flagship showcase for the [dataverse-contact-api](https://github.com/TrueNorthIT/dataverse-contact-api): where the sibling `dataverse-contact-example` project demonstrates individual SDK calls, this portal shows a complete, joined-up application.

A signed-in user can see their own cases ("My Cases") and their team's cases ("Team Cases"); search, sort and group them by status, priority or type; open a case to read its details, notes timeline and activity history; raise a new case with just a title and description (the API auto-links the contact and account behind the scenes); and add notes to existing cases. When anyone else changes a record — through this portal, the REST API, or an AI agent via MCP — every connected user's screen updates in real time without a refresh.

The business value is proof of pattern: it demonstrates that a council can put a secure, modern, self-service case portal in front of Dataverse data without Dynamics licences for every user, without writing OData or Azure AD plumbing, and with citizen-grade sign-in (Microsoft Entra External ID). It also serves as the reference codebase to copy when building a portal for any other Dataverse table — the docs include a three-step recipe for onboarding a new entity.

## Architecture overview

A single-page React application (static SPA, no backend of its own) — all data and authorisation comes from the deployed Dataverse Contact API over HTTPS.

- **Tech stack:** Vite + React 18 + TypeScript + Tailwind CSS v4
- **Auth:** Microsoft Entra External ID (CIAM) via MSAL (`@azure/msal-browser` / `@azure/msal-react`), PKCE flow with silent token refresh
- **Data access:** `@truenorth-it/dataverse-client` SDK + TanStack Query for caching/refetching
- **Real-time:** Azure SignalR via the SDK's `useRealtime` hook — server pushes invalidate the query cache so the UI refreshes automatically
- **Key modules:** `src/tables/` (one config file per Dataverse entity: case, casenote, caseactivity), `src/hooks/` (generic `useApiClient` / `useDataverseList` primitives plus feature hooks like `useCaseList`, `useCaseNotes`, `useCreateCase`), `src/components/` (presentational panels that own their data via the matching hook)
- **Secrets:** `.env` rendered from 1Password (`npm run env:pull`); see `docs/SETUP-SECRETS.md`
- **Deployment:** static SPA on Vercel (`vercel.json` handles SPA routing, region `lhr1`)

```
Browser (React SPA)
  ├─ MSAL ──────────────► Entra External ID  (sign-in, access token)
  ├─ dataverse-client ──► Dataverse Contact API ──► Microsoft Dataverse
  │      (REST, /me /team scopes)
  └─ useRealtime ◄────── Azure SignalR  (push: record created/updated)
```

Data flow: `useApiClient` wraps the SDK with the current MSAL access token; `useDataverseList<T>` combines an SDK call with TanStack Query; feature hooks add table-specific query config; components just render hook output. To support a new table, you add a table config, a feature hook, and a component — the generic layer does the rest.
