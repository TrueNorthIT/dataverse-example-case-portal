/** Case-portal environment configuration */

import type { AccountInfo } from "@azure/msal-browser";

function requireEnvVar(name: string): string {
  const value = import.meta.env[name] as string | undefined;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  entra: {
    tenantId: requireEnvVar("VITE_ENTRA_TENANT_ID"),
    clientId: requireEnvVar("VITE_ENTRA_CLIENT_ID"),
    /** API scope, e.g. "api://<api-app-id>/access_as_user" */
    apiScope: requireEnvVar("VITE_ENTRA_API_SCOPE"),
    redirectUri: window.location.origin,
  },
  /** Base URL of the dataverse-contact-api deployment, e.g. "https://my-api.vercel.app" */
  apiBaseUrl: requireEnvVar("VITE_API_BASE_URL"),
  /** API scope partition (defaults to "default" via SDK if not set) */
  apiScope: (import.meta.env.VITE_API_SCOPE as string) || undefined,
};

/** Normalised user shape the UI components consume — keeps them MSAL-agnostic. */
export interface AppUser {
  email?: string;
  name?: string;
  given_name?: string;
}

export function accountToUser(account: AccountInfo | null | undefined): AppUser | undefined {
  if (!account) return undefined;
  const claims = (account.idTokenClaims ?? {}) as Record<string, unknown>;
  const claim = (key: string) => (typeof claims[key] === "string" ? (claims[key] as string) : undefined);

  const preferred = claim("preferred_username");
  const email =
    claim("email") ??
    (preferred && preferred.includes("@") ? preferred : undefined) ??
    (account.username && account.username.includes("@") ? account.username : undefined);

  return {
    email,
    name: claim("name") ?? account.name,
    given_name: claim("given_name"),
  };
}
