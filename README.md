# dataverse-example-case-portal

Example case management portal built with React + Tailwind CSS, showcasing the [dataverse-contact-api](https://github.com/TrueNorthIT/dataverse-contact-api).

## Features

- View your cases (My Cases) and team cases (Team Cases)
- Search, sort, and group cases by status, priority, or type
- View case details with notes timeline
- **Create new cases** — provide a title and description; contact and account are auto-linked by the API
- Add notes to existing cases

## Setup

1. **Create an Auth0 SPA Application** for this portal (same tenant as the API, same audience)
2. Copy `.env.example` to `.env` and fill in the values
3. Add the portal's Vercel URL to the Auth0 app's **Allowed Callback URLs**, **Allowed Logout URLs**, and **Allowed Web Origins**
4. `npm install && npm run dev`

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_AUTH0_DOMAIN` | Your Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | SPA Application client ID (create a new one for this portal) |
| `VITE_AUTH0_AUDIENCE` | Same API audience as the dataverse-contact-api |
| `VITE_API_BASE_URL` | Root URL of the deployed API (e.g. `https://your-api.vercel.app`) |

## Deployment

Deployed as a static SPA on Vercel. The `vercel.json` handles SPA routing.
