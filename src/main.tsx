import React from "react";
import ReactDOM from "react-dom/client";
import { EventType, PublicClientApplication, type AuthenticationResult } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { config } from "./env";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30_000, // 30s before data is considered stale
    },
  },
});

const pca = new PublicClientApplication({
  auth: {
    clientId: config.entra.clientId,
    authority: `https://${config.entra.tenantId}.ciamlogin.com/${config.entra.tenantId}`,
    knownAuthorities: [`${config.entra.tenantId}.ciamlogin.com`],
    redirectUri: config.entra.redirectUri,
    postLogoutRedirectUri: config.entra.redirectUri,
  },
  cache: { cacheLocation: "sessionStorage" },
});

// MSAL doesn't auto-set an active account on login — without this, acquireTokenSilent fails after redirect.
pca.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const account = (event.payload as AuthenticationResult).account;
    if (account) pca.setActiveAccount(account);
  }
});

async function bootstrap() {
  await pca.initialize();
  await pca.handleRedirectPromise();
  if (!pca.getActiveAccount()) {
    const [first] = pca.getAllAccounts();
    if (first) pca.setActiveAccount(first);
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <MsalProvider instance={pca}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </MsalProvider>
    </React.StrictMode>,
  );
}

void bootstrap();
