import { useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { createClient } from "@truenorth-it/dataverse-client";
import { config } from "../env";

/** React hook that returns a configured API client */
export function useApiClient() {
  const { getAccessTokenSilently } = useAuth0();

  return useMemo(
    () =>
      createClient({
        baseUrl: config.apiBaseUrl,
        getToken: () => getAccessTokenSilently(),
      }),
    [getAccessTokenSilently],
  );
}
