# One-file demo — list cases in ~40 lines

A single React file. No TanStack Query, no extra hooks — just the SDK, MSAL, and `useState`/`useEffect`.

## Where to paste it

Open **[StackBlitz](https://stackblitz.com/fork/vite-react-ts)** — it spins up a Vite + React + TypeScript sandbox in your browser. No install, no sign-in.

1. Open `package.json` and add to `"dependencies"`:
   ```json
   "@azure/msal-browser": "^5.11.0",
   "@azure/msal-react": "^5.4.2",
   "@truenorth-it/dataverse-client": "^1.0.8"
   ```
2. Replace `src/main.tsx` and `src/App.tsx` with the files below.
3. In your Microsoft Entra External ID SPA app registration, add the StackBlitz preview URL (e.g. `https://vitejs-vite-abc123.stackblitz.io`) to **Redirect URIs**.

## `src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { EventType, PublicClientApplication, type AuthenticationResult } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import App from "./App";

const TENANT_ID = "00000000-0000-0000-0000-000000000000"; // your Entra External ID tenant
const CLIENT_ID = "00000000-0000-0000-0000-000000000000"; // your SPA app registration

const pca = new PublicClientApplication({
  auth: {
    clientId: CLIENT_ID,
    authority: `https://${TENANT_ID}.ciamlogin.com/${TENANT_ID}`,
    knownAuthorities: [`${TENANT_ID}.ciamlogin.com`],
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: "sessionStorage" },
});

pca.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const account = (event.payload as AuthenticationResult).account;
    if (account) pca.setActiveAccount(account);
  }
});

await pca.initialize();
await pca.handleRedirectPromise();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MsalProvider instance={pca}>
      <App />
    </MsalProvider>
  </React.StrictMode>,
);
```

## `src/App.tsx`

```tsx
import { useEffect, useState } from "react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { createClient } from "@truenorth-it/dataverse-client";

const CONFIG = {
  apiBaseUrl: "https://api.dataverse-contact.tnapps.co.uk",
  apiScope: "api://00000000-0000-0000-0000-000000000000/access_as_user", // your API app registration
};

interface Case {
  incidentid: string;
  ticketnumber: string;
  title: string;
}

export default function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const client = createClient({
      baseUrl: CONFIG.apiBaseUrl,
      getToken: async () => {
        const account = instance.getActiveAccount() ?? accounts[0];
        try {
          const r = await instance.acquireTokenSilent({ scopes: [CONFIG.apiScope], account });
          return r.accessToken;
        } catch (err) {
          if (err instanceof InteractionRequiredAuthError) {
            await instance.acquireTokenRedirect({ scopes: [CONFIG.apiScope], account });
          }
          throw err;
        }
      },
    });
    client.me                  // ← cases owned by the signed-in user
      // client.team           // ← cases owned by anyone on the user's team
      // client.all            // ← every case visible to the user (admin scopes)
      .list<Case>("case", { select: ["incidentid", "ticketnumber", "title"], top: 20 })
      .then((r) => setCases(r.data ?? []));
  }, [isAuthenticated, instance, accounts]);

  if (!isAuthenticated) {
    return (
      <div style={{ fontFamily: "system-ui", padding: 24 }}>
        <button onClick={() => instance.loginRedirect({ scopes: [CONFIG.apiScope] })}>
          Sign in
        </button>
      </div>
    );
  }

  const user = accounts[0];
  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>My Cases ({user?.username})</h1>
      <ul>
        {cases.map((c) => (
          <li key={c.incidentid}>
            <code>{c.ticketnumber}</code> — {c.title}
          </li>
        ))}
      </ul>
      <button onClick={() => instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin })}>
        Sign out
      </button>
    </div>
  );
}
```

## The whole story in one slide

- **`createClient(...)`** — SDK with an MSAL token getter.
- **`client.me.list("case", {...})`** — typed list of any table. Swap `"case"` for `"contact"` and you have a contacts portal.
- **`acquireTokenSilent` + redirect fallback** — MSAL handles refresh; you write zero auth code beyond the getter.

That's it.
