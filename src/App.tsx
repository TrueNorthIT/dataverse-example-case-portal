import { useAuth0 } from "@auth0/auth0-react";
import { useCases } from "./hooks/useCases";
import { LoginScreen } from "./components/LoginScreen";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { Toolbar } from "./components/Toolbar";
import { CaseTable } from "./components/CaseTable";
import { CaseDetail } from "./components/CaseDetail";

export function App() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    loginWithRedirect,
    logout,
  } = useAuth0();

  const cases = useCases();

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-tn-bg flex items-center justify-center">
        <div className="animate-pulse text-tn-muted text-sm">Loading...</div>
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
      <Header
        user={user}
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
            onRefresh={() => cases.fetchCases(cases.activeTab)}
            filteredCount={cases.filtered.length}
            totalCount={cases.activeCases.length}
          />
        )}

        {cases.selectedCase ? (
          <CaseDetail
            selectedCase={cases.selectedCase}
            activeTab={cases.activeTab}
            onClose={cases.closeCase}
            caseNotes={cases.caseNotes}
            notesLoading={cases.notesLoading}
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
    </div>
  );
}
