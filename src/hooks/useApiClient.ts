import { useMemo } from "react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { createClient } from "@truenorth-it/dataverse-client";
import { config } from "../env";

/**
 * Returns a configured Dataverse SDK client.
 *
 * Wires MSAL into the SDK so every request carries a fresh access token.
 * Falls back to an interactive redirect if the silent acquisition needs UI
 * (e.g. consent prompt, expired refresh token).
 */
export function useApiClient() {
  const { instance, accounts } = useMsal();

  return useMemo(
    () =>
      createClient({
        baseUrl: config.apiBaseUrl,
        getToken: async () => {
          const account = instance.getActiveAccount() ?? accounts[0];
          if (!account) throw new Error("Not signed in");
          try {
            const result = await instance.acquireTokenSilent({
              scopes: [config.entra.apiScope],
              account,
            });
            return result.accessToken;
          } catch (err) {
            if (err instanceof InteractionRequiredAuthError) {
              await instance.acquireTokenRedirect({
                scopes: [config.entra.apiScope],
                account,
              });
            }
            throw err;
          }
        },
        scope: config.apiScope,
      }),
    [instance, accounts],
  );
}
