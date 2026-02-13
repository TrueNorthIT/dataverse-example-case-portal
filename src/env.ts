/** Case-portal environment configuration */

function requireEnvVar(name: string): string {
  const value = import.meta.env[name] as string | undefined;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  auth0: {
    domain: requireEnvVar("VITE_AUTH0_DOMAIN"),
    clientId: requireEnvVar("VITE_AUTH0_CLIENT_ID"),
    audience: requireEnvVar("VITE_AUTH0_AUDIENCE"),
    redirectUri: window.location.origin,
  },
  /** Base URL of the dataverse-contact-api deployment, e.g. "https://my-api.vercel.app" */
  apiBaseUrl: requireEnvVar("VITE_API_BASE_URL"),
};

/** API version path — must match the API server */
export const API_BASE = "/api/v2";
