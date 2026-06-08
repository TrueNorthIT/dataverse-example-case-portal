import { useCallback } from "react";
import { InteractionStatus } from "@azure/msal-browser";
import { useAccount, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@truenorth-it/dataverse-client";

import { accountToUser, config, type AppUser } from "./env";
import { useApiClient } from "./hooks/useApiClient";
import { useCaseList } from "./hooks/useCaseList";
import { useSelectedCase } from "./hooks/useSelectedCase";
import { useCreateCase } from "./hooks/useCreateCase";

import { LoginScreen } from "./components/LoginScreen";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { Toolbar } from "./components/Toolbar";
import { CaseTable } from "./components/CaseTable";
import { CaseDetail } from "./components/CaseDetail";
import { CreateCaseForm } from "./components/CreateCaseForm";
import { LoadingSplash } from "./components/LoadingSplash";
import { PlayPage } from "./components/PlayPage";

export function App() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount(accounts[0] ?? null);

  const authLoading = inProgress !== InteractionStatus.None;
  const user = accountToUser(account);

  const login = useCallback(() => {
    void instance.loginRedirect({ scopes: [config.entra.apiScope] });
  }, [instance]);

  const logout = useCallback(() => {
    void instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
  }, [instance]);

  if (authLoading) return <LoadingSplash />;
  if (!isAuthenticated) return <LoginScreen onLogin={login} />;

  if (window.location.pathname === "/play") return <PlayPage />;

  return <AuthedApp user={user} onLogout={logout} />;
}

/**
 * Main application — only mounted after MSAL has authenticated the user.
 *
 * Composes the focused hooks that drive each feature: list/toolbar
 * (`useCaseList`), detail navigation (`useSelectedCase`), and the create
 * dialog (`useCreateCase`). The real-time hook from the SDK auto-invalidates
 * TanStack Query caches when the server pushes updates over SignalR.
 */
function AuthedApp({ user, onLogout }: { user: AppUser | undefined; onLogout: () => void }) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  const negotiate = useCallback(() => client.negotiate(), [client]);

  const realtime = useRealtime({ negotiate, queryClient, enabled: true });

  const list = useCaseList();
  const selected = useSelectedCase();
  const createCase = useCreateCase((created) => selected.open(created, "me"));

  const firstName = user?.given_name ?? user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-tn-bg font-sans text-tn-navy">
      {list.isRefreshing && <RefreshIndicator />}

      <Header user={user} realtimeConnected={realtime.connected} onLogout={onLogout} />

      <HeroSection firstName={firstName} stats={list.stats} loading={list.activeLoading} />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {selected.selected ? (
          <CaseDetail
            selectedCase={selected.selected}
            scope={selected.scope}
            onClose={selected.close}
          />
        ) : (
          <>
            <Toolbar
              activeTab={list.activeTab}
              onTabChange={list.setActiveTab}
              teamAvailable={list.teamAvailable}
              myCasesCount={list.my.data.length}
              teamCasesCount={list.team.data.length}
              myLoading={list.my.isLoading}
              teamLoading={list.team.isLoading}
              searchQuery={list.searchQuery}
              onSearchChange={list.setSearchQuery}
              groupBy={list.groupBy}
              onGroupByChange={list.setGroupBy}
              activeLoading={list.activeLoading}
              activeRefreshing={list.activeRefreshing}
              onRefresh={list.refreshActive}
              filteredCount={list.filtered.length}
              totalCount={list.activeCases.length}
              onNewCase={createCase.show}
            />
            <CaseTable
              sorted={list.sorted}
              grouped={list.grouped}
              groupBy={list.groupBy}
              expandedGroups={list.expandedGroups}
              onToggleGroup={list.toggleGroup}
              sortField={list.sortField}
              sortDir={list.sortDir}
              onSort={list.handleSort}
              onSelectCase={(c) => selected.open(c, list.activeTab)}
              activeLoading={list.activeLoading}
              activeError={list.activeError}
              activeCasesCount={list.activeCases.length}
              filteredCount={list.filtered.length}
              searchQuery={list.searchQuery}
              onClearSearch={() => list.setSearchQuery("")}
              onRetry={list.refreshActive}
            />
          </>
        )}
      </div>

      {createCase.open && (
        <CreateCaseForm
          title={createCase.title}
          onTitleChange={createCase.setTitle}
          description={createCase.description}
          onDescriptionChange={createCase.setDescription}
          submitting={createCase.submitting}
          submitError={createCase.submitError}
          onSubmit={createCase.submit}
          onCancel={createCase.cancel}
        />
      )}
    </div>
  );
}

function RefreshIndicator() {
  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-50 overflow-hidden bg-tn-sky/20">
      <div
        className="h-full w-1/3 bg-tn-sky rounded-full"
        style={{ animation: "refresh-slide 1.2s ease-in-out infinite" }}
      />
    </div>
  );
}
