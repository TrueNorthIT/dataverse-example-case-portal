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

Create a `.env` file from `.env.example` with Auth0 credentials before running.

## Architecture

Vite + React + TypeScript + Tailwind CSS v4. Auth via Auth0 PKCE (SPA flow). All data comes from the deployed Dataverse Contact API over HTTP. Deployed as a static SPA on Vercel with `vercel.json` handling SPA routing.

### Key modules

| Module | Purpose |
|--------|---------|
| `src/App.tsx` | Main app — Auth0 gate, layout |
| `src/env.ts` | Environment variable validation (`requireEnvVar`) |
| `src/services/caseApi.ts` | API client for case operations |
| `src/hooks/useCases.ts` | React hook for case data fetching |
| `src/types/case.ts` | TypeScript types for case records |
| `src/utils/format.ts` | Formatting utilities |
| `src/utils/style.ts` | Style/CSS utilities |

### Components

| Component | Purpose |
|-----------|---------|
| `LoginScreen` | Auth0 login UI |
| `Header` | App header with auth status |
| `HeroSection` | Landing/hero section |
| `Toolbar` | Action bar (filters, search) |
| `CaseTable` | Case list table view |
| `CaseDetail` | Single case detail view |

### Design principles

- **No shared code with the API repo**: all data comes via HTTP
- **Auth0 for authentication**: same tenant/audience as the API
- **Clean separation**: services → hooks → components
- **Static SPA deployment**: Vercel with client-side routing

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_AUTH0_DOMAIN` | Yes | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | Yes | Auth0 SPA client ID (create a separate one for this portal) |
| `VITE_AUTH0_AUDIENCE` | Yes | Same API audience as the dataverse-contact-api |
| `VITE_API_BASE_URL` | Yes | Root URL of the deployed API |
