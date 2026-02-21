import { useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@truenorth-it/dataverse-client";
import { useCases } from "./hooks/useCases";
import { useApiClient } from "./services/caseApi";
import { LoginScreen } from "./components/LoginScreen";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { Toolbar } from "./components/Toolbar";
import { CaseTable } from "./components/CaseTable";
import { CaseDetail } from "./components/CaseDetail";
import { CreateCaseForm } from "./components/CreateCaseForm";

export function App() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    loginWithRedirect,
    logout,
  } = useAuth0();

  const client = useApiClient();
  const queryClient = useQueryClient();
  const negotiate = useCallback(() => client.negotiate(), [client]);

  // Real-time: auto-invalidates React Query caches when data changes on the server
  const realtime = useRealtime({
    negotiate,
    queryClient,
    enabled: isAuthenticated,
  });

  const cases = useCases();

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-tn-navy flex flex-col items-center justify-center font-sans">
        <div className="loading-logo">
          <div className="logo-wrap">
            <div className="logo-box" />
            <div className="logo-shimmer-clip">
              <div className="logo-shimmer" />
            </div>
            <svg viewBox="0 0 300 300" className="logo-svg">
              <rect className="bar bar-left" x="64.3" y="225.5" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "0ms" }} />
              <rect className="bar bar-right" x="160.7" y="225.5" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "110ms" }} />
              <rect className="bar bar-left" x="64.3" y="193.4" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "220ms" }} />
              <rect className="bar bar-right" x="160.7" y="193.4" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "330ms" }} />
              <rect className="bar bar-left" x="64.3" y="161.2" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "440ms" }} />
              <rect className="bar bar-right" x="160.7" y="161.2" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "550ms" }} />
              <rect className="bar bar-left" x="64.3" y="129.1" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "660ms" }} />
              <rect className="bar bar-right" x="160.7" y="129.1" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "770ms" }} />
              <rect className="bar bar-left" x="64.3" y="96.9" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "880ms" }} />
              <rect className="bar bar-right" x="160.7" y="96.9" width="75" height="10.7" fill="currentColor" style={{ animationDelay: "990ms" }} />
              <rect className="bar bar-capstone" x="64.3" y="64.8" width="171.4" height="10.7" fill="currentColor" style={{ animationDelay: "1150ms" }} />
            </svg>
          </div>
        </div>
        <h1
          className="text-white text-2xl font-bold mt-6"
          style={{ opacity: 0, animation: "fade-up .5s ease-out 1950ms forwards" }}
        >
          Case Portal
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "rgba(128,208,222,.55)", opacity: 0, animation: "fade-up .5s ease-out 2100ms forwards" }}
        >
          Loading…
        </p>
      </div>
    );
  }

  // Unauthenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => loginWithRedirect()} />;
  }

  const firstName = user?.given_name ?? user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-tn-bg font-sans text-tn-navy">
      {/* Subtle background-refresh indicator */}
      {cases.isRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-0.5 z-50 overflow-hidden bg-tn-sky/20">
          <div
            className="h-full w-1/3 bg-tn-sky rounded-full"
            style={{ animation: "refresh-slide 1.2s ease-in-out infinite" }}
          />
        </div>
      )}

      <Header
        user={user}
        realtimeConnected={realtime.connected}
        onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      />

      <HeroSection
        firstName={firstName}
        stats={cases.stats}
        loading={cases.activeLoading}
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {!cases.selectedCase && (
          <Toolbar
            activeTab={cases.activeTab}
            onTabChange={(tab) => { cases.setActiveTab(tab); cases.closeCase(); }}
            teamAvailable={cases.teamAvailable}
            myCasesCount={cases.myCases.length}
            teamCasesCount={cases.teamCases.length}
            myLoading={cases.myLoading}
            teamLoading={cases.teamLoading}
            searchQuery={cases.searchQuery}
            onSearchChange={cases.setSearchQuery}
            groupBy={cases.groupBy}
            onGroupByChange={cases.setGroupBy}
            activeLoading={cases.activeLoading}
            activeRefreshing={cases.activeRefreshing}
            onRefresh={() => cases.fetchCases(cases.activeTab)}
            filteredCount={cases.filtered.length}
            totalCount={cases.activeCases.length}
            onNewCase={() => { cases.setShowCreateForm(true); cases.setCreateSubmitError(null); }}
          />
        )}

        {cases.selectedCase ? (
          <CaseDetail
            selectedCase={cases.selectedCase}
            activeTab={cases.activeTab}
            onClose={cases.closeCase}
            caseNotes={cases.caseNotes}
            notesLoading={cases.notesLoading}
            notesRefreshing={cases.notesRefreshing}
            notesError={cases.notesError}
            onRefreshNotes={() => cases.fetchCaseNotes(cases.selectedCase!.incidentid, cases.activeTab)}
            showNoteForm={cases.showNoteForm}
            onToggleNoteForm={() => { cases.setShowNoteForm((v) => !v); cases.setNoteSubmitError(null); }}
            noteSubject={cases.noteSubject}
            onNoteSubjectChange={cases.setNoteSubject}
            noteBody={cases.noteBody}
            onNoteBodyChange={cases.setNoteBody}
            noteSubmitting={cases.noteSubmitting}
            noteSubmitError={cases.noteSubmitError}
            onSubmitNote={() => cases.createCaseNote(cases.selectedCase!.incidentid)}
            onCancelNote={() => {
              cases.setShowNoteForm(false);
              cases.setNoteSubject("");
              cases.setNoteBody("");
              cases.setNoteSubmitError(null);
            }}
            caseActivities={cases.caseActivities}
            activitiesLoading={cases.activitiesLoading}
            activitiesRefreshing={cases.activitiesRefreshing}
            activitiesError={cases.activitiesError}
            activityTypeFilter={cases.activityTypeFilter}
            onActivityTypeFilterChange={cases.setActivityTypeFilter}
            selectedActivity={cases.selectedActivity}
            onSelectActivity={cases.setSelectedActivity}
            onRefreshActivities={() => cases.fetchCaseActivities(cases.selectedCase!.incidentid, cases.activeTab)}
          />
        ) : (
          <CaseTable
            sorted={cases.sorted}
            grouped={cases.grouped}
            groupBy={cases.groupBy}
            expandedGroups={cases.expandedGroups}
            onToggleGroup={cases.toggleGroup}
            sortField={cases.sortField}
            sortDir={cases.sortDir}
            onSort={cases.handleSort}
            onSelectCase={cases.openCase}
            activeLoading={cases.activeLoading}
            activeError={cases.activeError}
            activeCasesCount={cases.activeCases.length}
            filteredCount={cases.filtered.length}
            searchQuery={cases.searchQuery}
            onClearSearch={() => cases.setSearchQuery("")}
            onRetry={() => cases.fetchCases(cases.activeTab)}
          />
        )}
      </div>

      {cases.showCreateForm && (
        <CreateCaseForm
          title={cases.createTitle}
          onTitleChange={cases.setCreateTitle}
          description={cases.createDescription}
          onDescriptionChange={cases.setCreateDescription}
          submitting={cases.createSubmitting}
          submitError={cases.createSubmitError}
          onSubmit={cases.createCase}
          onCancel={() => {
            cases.setShowCreateForm(false);
            cases.setCreateTitle("");
            cases.setCreateDescription("");
            cases.setCreateSubmitError(null);
          }}
        />
      )}
    </div>
  );
}
