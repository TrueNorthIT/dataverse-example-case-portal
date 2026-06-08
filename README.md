# dataverse-example-case-portal

Example case management portal built with React + Tailwind CSS, showcasing the [dataverse-contact-api](https://github.com/TrueNorthIT/dataverse-contact-api).

## Features

- View your cases (My Cases) and team cases (Team Cases)
- Search, sort, and group cases by status, priority, or type
- View case details with notes timeline
- **Create new cases** — provide a title and description; contact and account are auto-linked by the API
- Add notes to existing cases
- **Real-time updates** — when data changes via another user or MCP, the UI refreshes automatically via Azure SignalR

## Setup

1. **Register a SPA application** in your Microsoft Entra External ID (CIAM) tenant. Follow [`dataverse-contact-api/docs/SETUP-ENTRA-EXTERNAL-ID.md`](https://github.com/TrueNorthIT/dataverse-contact-api/blob/main/docs/SETUP-ENTRA-EXTERNAL-ID.md). Grant the SPA the API's access scope (e.g. `api://<api-app-id>/access_as_user`).
2. Add the portal's URL (e.g. `https://your-portal.example.com` and `http://localhost:5173` for dev) to the SPA app's **Redirect URIs**.
3. Copy `.env.example` to `.env` and fill in the values.
4. Ensure the API is running with `DEFAULT__AUTH_PROVIDER=entra-external-id` (or the equivalent per-scope key).
5. `npm install && npm run dev`

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_ENTRA_TENANT_ID` | Your Entra External ID tenant ID (GUID) |
| `VITE_ENTRA_CLIENT_ID` | SPA application client ID |
| `VITE_ENTRA_API_SCOPE` | API access scope, e.g. `api://<api-app-id>/access_as_user` |
| `VITE_API_BASE_URL` | Root URL of the deployed API (e.g. `https://your-api.vercel.app`) |

## Real-time notifications

The portal automatically connects to Azure SignalR (via the SDK's `useRealtime` hook) when the API has `SIGNALR_CONNECTION_STRING` configured. When any user creates or updates a record — via the portal, REST API, or MCP — all other connected users see the change immediately without refreshing.

No portal-side configuration needed. The `@microsoft/signalr` package is already included as a dependency.

## Deployment

Deployed as a static SPA on Vercel. The `vercel.json` handles SPA routing.
