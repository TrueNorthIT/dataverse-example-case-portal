# CLAUDE.md

Project guidelines and build notes for AI-assisted development.

## Project Overview

Example case management portal built with React + Tailwind CSS, showcasing the [dataverse-contact-api](https://github.com/TrueNorthIT/dataverse-contact-api). This is a more realistic example than `dataverse-contact-example` — it demonstrates a full case management UI rather than individual SDK method demos.

**API URL:** Configured via `VITE_API_BASE_URL` environment variable.

## Build & Development

```bash
npm install          # Install dependencies
npm run dev          # Vite dev server
npm run build        # Type-check + Vite production build → dist/
npm run preview      # Preview the production build locally
npm run typecheck    # TypeScript only (tsc --noEmit)
```

No tests in this repo — it's an example/demo project.

Create a `.env` file from `.env.example` with Microsoft Entra External ID credentials before running.

## Architecture

Vite + React + TypeScript + Tailwind CSS v4. Auth via Microsoft Entra External ID (MSAL PKCE in `@azure/msal-browser` + `@azure/msal-react`). All data comes from the deployed Dataverse Contact API over HTTP. Deployed as a static SPA on Vercel with `vercel.json` handling SPA routing.

### Code layout

| Folder | Purpose |
|--------|---------|
| `src/tables/` | One file per Dataverse entity — table name, default field list, TypeScript shape. Copy `case.ts` to onboard a new entity. |
| `src/hooks/` | Generic primitives (`useApiClient`, `useDataverseList`, `useDataverseAggregate`) plus feature hooks (`useCaseList`, `useCaseNotes`, `useCaseActivities`, `useSelectedCase`, `useCreateCase`). |
| `src/components/` | Presentational components. Panels (`CaseNotesPanel`, `CaseActivitiesPanel`) own their own data via the matching hook. |
| `src/components/ui/` | Shared presentational primitives — `RefreshButton`, `SkeletonList`, `ErrorBox`, `EmptyState`. |
| `src/types/ui.ts` | UI-only types (`Tab`, `SortField`, `SortDir`, `GroupBy`). Entity types live in `src/tables/`. |
| `src/utils/` | Pure helpers — date formatting, HTML sanitisation, status/priority styling. |
| `src/env.ts` | Environment variable validation. |

### How the data flow works

```
useApiClient ──► useDataverseList ──► useCaseList / useCaseNotes / …
   │                  │                       │
   └── MSAL token     └── TanStack Query     └── consumed by panels
```

- **`useApiClient`** wraps the Dataverse SDK with the current MSAL access token (acquired via `acquireTokenSilent`, with a redirect fallback on `InteractionRequiredAuthError`).
- **`useDataverseList<T>(table, scope, options)`** is the generic primitive: SDK call + TanStack Query, returning `{ data, isLoading, isRefreshing, error, refetch }`. Every list view in the app uses it.
- **Feature hooks** (`useCaseList`, `useCaseNotes`, `useCaseActivities`) build on the primitive — they add table-specific query config plus UI/form state.
- **Components** own no fetching state themselves. `CaseNotesPanel`, for instance, just calls `useCaseNotes(incidentId, scope)` and renders.

### Build a portal for a new Dataverse table

1. **Add a table config** at `src/tables/contact.ts`:
   ```ts
   export const CONTACT_TABLE = "contact";
   export const CONTACT_FIELDS = ["contactid", "fullname", "emailaddress1", "createdon"];
   export interface Contact { contactid: string; fullname: string; ... }
   ```
2. **Build a feature hook** at `src/hooks/useContactList.ts`:
   ```ts
   export function useContactList(scope: "me" | "team") {
     return useDataverseList<Contact>(CONTACT_TABLE, scope, {
       select: CONTACT_FIELDS, orderBy: "createdon:desc",
     });
   }
   ```
3. **Render** — a component that calls the hook and maps over `data` is all that remains.

### Design principles

- **No shared code with the API repo**: all data comes via HTTP through the SDK.
- **Entra External ID for authentication**: the API must run with `{SCOPE}__AUTH_PROVIDER=entra-external-id`. The portal's `VITE_ENTRA_API_SCOPE` is the Application ID URI of the API app registration.
- **One generic, many features**: every list view goes through `useDataverseList`.
- **Co-locate by entity**: table name + field list + type live together under `src/tables/`.
- **Components own their own data**: panels call the matching feature hook directly — no prop drilling.
- **Static SPA deployment**: Vercel with client-side routing.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ENTRA_TENANT_ID` | Yes | Entra External ID tenant ID (GUID) |
| `VITE_ENTRA_CLIENT_ID` | Yes | SPA application client ID |
| `VITE_ENTRA_API_SCOPE` | Yes | API access scope, e.g. `api://<api-app-id>/access_as_user` |
| `VITE_API_BASE_URL` | Yes | Root URL of the deployed API |
