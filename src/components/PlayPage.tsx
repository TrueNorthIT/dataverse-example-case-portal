import { useEffect, useState } from "react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useAccount, useMsal } from "@azure/msal-react";
import { createClient } from "@truenorth-it/dataverse-client";
import { accountToUser, config } from "../env";

interface Case {
  incidentid: string;
  ticketnumber: string;
  title: string;
}

/**
 * Live, paste-friendly demo page — the simplest possible portal against the
 * Dataverse Contact API. No TanStack Query, no helper hooks, just
 * `useState` + `useEffect` + the SDK. Mirrors DEMO.md.
 *
 * Reached via http://localhost:5173/play
 */
export function PlayPage() {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] ?? null);
  const user = accountToUser(account);
  const [cases, setCases] = useState<Case[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = createClient({
      baseUrl: config.apiBaseUrl,
      getToken: async () => {
        const acc = instance.getActiveAccount() ?? accounts[0];
        if (!acc) throw new Error("Not signed in");
        try {
          const result = await instance.acquireTokenSilent({
            scopes: [config.entra.apiScope],
            account: acc,
          });
          return result.accessToken;
        } catch (err) {
          if (err instanceof InteractionRequiredAuthError) {
            await instance.acquireTokenRedirect({
              scopes: [config.entra.apiScope],
              account: acc,
            });
          }
          throw err;
        }
      },
    });

    client.all                  // ← cases owned by the signed-in user
      // client.team           // ← cases owned by anyone on the user's team
      // client.all            // ← every case visible to the user (admin scopes)
      .list<Case>("case", {
        select: ["incidentid", "ticketnumber", "title"],
        top: 20,
      })
      .then((r) => setCases(r.data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [instance, accounts]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 720, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>My Cases</h1>
        <small style={{ color: "#666" }}>
          {user?.email}{" "}
          <button
            onClick={() => void instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin })}
            style={{ marginLeft: 8, cursor: "pointer" }}
          >
            Sign out
          </button>
        </small>
      </header>

      <p style={{ color: "#666", fontSize: 14 }}>
        <a href="/">← back to the full portal</a>
      </p>

      {error && (
        <pre style={{ background: "#fee", color: "#a00", padding: 12, borderRadius: 6 }}>{error}</pre>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {cases.map((c) => (
          <li key={c.incidentid} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <code style={{ color: "#888", marginRight: 8 }}>{c.ticketnumber}</code>
            {c.title}
          </li>
        ))}
      </ul>

      {cases.length === 0 && !error && <p style={{ color: "#888" }}>Loading…</p>}
    </div>
  );
}
