import { useState } from "react";
import type { Case, CaseNote, CaseActivity, ActivityTypeFilter, Tab } from "../types/case";
import { formatDate, formatDateFull, sanitizeHtml } from "../utils/format";
import { statusColor, priorityBadge } from "../utils/style";

type DetailTab = "notes" | "activities";

interface CaseDetailProps {
  selectedCase: Case;
  activeTab: Tab;
  onClose: () => void;

  // Notes
  caseNotes: CaseNote[];
  notesLoading: boolean;
  notesRefreshing: boolean;
  notesError: string | null;
  onRefreshNotes: () => void;

  // Note form
  showNoteForm: boolean;
  onToggleNoteForm: () => void;
  noteSubject: string;
  onNoteSubjectChange: (value: string) => void;
  noteBody: string;
  onNoteBodyChange: (value: string) => void;
  noteSubmitting: boolean;
  noteSubmitError: string | null;
  onSubmitNote: () => void;
  onCancelNote: () => void;

  // Activities
  caseActivities: CaseActivity[];
  activitiesLoading: boolean;
  activitiesRefreshing: boolean;
  activitiesError: string | null;
  activityTypeFilter: ActivityTypeFilter;
  onActivityTypeFilterChange: (filter: ActivityTypeFilter) => void;
  selectedActivity: CaseActivity | null;
  onSelectActivity: (activity: CaseActivity | null) => void;
  onRefreshActivities: () => void;
}

export function CaseDetail({
  selectedCase,
  activeTab,
  onClose,
  caseNotes,
  notesLoading,
  notesRefreshing,
  notesError,
  onRefreshNotes,
  showNoteForm,
  onToggleNoteForm,
  noteSubject,
  onNoteSubjectChange,
  noteBody,
  onNoteBodyChange,
  noteSubmitting,
  noteSubmitError,
  onSubmitNote,
  onCancelNote,
  caseActivities,
  activitiesLoading,
  activitiesRefreshing,
  activitiesError,
  activityTypeFilter,
  onActivityTypeFilterChange,
  selectedActivity,
  onSelectActivity,
  onRefreshActivities,
}: CaseDetailProps) {
  const sc = statusColor(selectedCase.statecode);
  const pb = priorityBadge(selectedCase.prioritycode);
  const [detailTab, setDetailTab] = useState<DetailTab>("notes");

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <button
        onClick={onClose}
        className="inline-flex items-center gap-1.5 text-sm text-tn-slate hover:text-tn-navy
          transition-colors cursor-pointer bg-transparent border-none p-0 group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7 7m-7-7l7-7" />
        </svg>
        Back to {activeTab === "me" ? "My" : "Team"} Cases
      </button>

      {/* Case header card */}
      <div className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
        <div className={`h-1 ${sc.dot}`} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs font-semibold text-tn-muted bg-tn-bg px-2 py-0.5 rounded">
                  {selectedCase.ticketnumber}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {selectedCase.statuscode_label ?? `Status ${selectedCase.statuscode}`}
                </span>
              </div>
              <h2 className="text-xl font-bold text-tn-navy mt-2 mb-0 leading-snug">
                {selectedCase.title}
              </h2>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold border ${pb.color} shrink-0`}>
              {selectedCase.prioritycode_label ?? pb.label} Priority
            </span>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-tn-border/50">
            {[
              { label: "Case Type", value: selectedCase.casetypecode_label ?? "\u2014" },
              { label: "Status Reason", value: selectedCase.statuscode_label ?? `Status ${selectedCase.statuscode}` },
              { label: "Created", value: formatDateFull(selectedCase.createdon) },
              { label: "Last Modified", value: formatDateFull(selectedCase.modifiedon) },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-[11px] text-tn-muted uppercase tracking-wider font-medium mb-0.5">{item.label}</dt>
                <dd className="text-sm text-tn-navy font-medium m-0">{item.value}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail tab switcher */}
      <div className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
        <div className="flex border-b border-tn-border/50">
          <button
            onClick={() => setDetailTab("notes")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer border-none
              ${detailTab === "notes"
                ? "text-tn-navy border-b-2 border-b-tn-sky bg-tn-sky/5"
                : "text-tn-muted hover:text-tn-navy hover:bg-tn-bg/50 bg-transparent"}`}
          >
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Notes
              {!notesLoading && (
                <span className="text-xs text-tn-muted bg-tn-bg px-1.5 py-0.5 rounded-full font-medium">
                  {caseNotes.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setDetailTab("activities")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer border-none
              ${detailTab === "activities"
                ? "text-tn-navy border-b-2 border-b-tn-sky bg-tn-sky/5"
                : "text-tn-muted hover:text-tn-navy hover:bg-tn-bg/50 bg-transparent"}`}
          >
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
              Activities
              {!activitiesLoading && (
                <span className="text-xs text-tn-muted bg-tn-bg px-1.5 py-0.5 rounded-full font-medium">
                  {caseActivities.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {detailTab === "notes" ? (
          <>
            {/* Notes header actions */}
            <div className="flex items-center justify-end px-6 py-3 border-b border-tn-border/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleNoteForm}
                  className="px-3 py-1.5 text-xs rounded-lg border border-tn-sky bg-tn-sky/10
                    text-tn-navy font-medium hover:bg-tn-sky/20 transition-colors cursor-pointer"
                >
                  {showNoteForm ? "Cancel" : "+ Add Note"}
                </button>
                <RefreshButton
                  loading={notesLoading}
                  refreshing={notesRefreshing}
                  onRefresh={onRefreshNotes}
                />
              </div>
            </div>

            {/* Add note form */}
            {showNoteForm && (
              <NoteForm
                subject={noteSubject}
                onSubjectChange={onNoteSubjectChange}
                body={noteBody}
                onBodyChange={onNoteBodyChange}
                submitting={noteSubmitting}
                submitError={noteSubmitError}
                onSubmit={onSubmitNote}
                onCancel={onCancelNote}
              />
            )}

            <div className="p-6">
              <NotesContent
                notes={caseNotes}
                loading={notesLoading}
                error={notesError}
              />
            </div>
          </>
        ) : (
          <>
            {/* Activities header: type filter + refresh */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-tn-border/50 gap-3 flex-wrap">
              <ActivityTypeFilterBar
                value={activityTypeFilter}
                onChange={onActivityTypeFilterChange}
              />
              <RefreshButton
                loading={activitiesLoading}
                refreshing={activitiesRefreshing}
                onRefresh={onRefreshActivities}
              />
            </div>

            <div className="p-6">
              <ActivitiesContent
                activities={caseActivities}
                loading={activitiesLoading}
                error={activitiesError}
                onSelect={onSelectActivity}
              />
            </div>
          </>
        )}
      </div>

      {/* Activity detail modal */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => onSelectActivity(null)}
        />
      )}
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────

function RefreshButton({
  loading,
  refreshing,
  onRefresh,
}: {
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className="px-3 py-1.5 text-xs rounded-lg border border-tn-border bg-white
        text-tn-slate hover:bg-tn-bg transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
    >
      <svg
        className={`w-3.5 h-3.5 ${refreshing ? "text-tn-sky" : ""}`}
        style={refreshing ? { animation: "spin 1s linear infinite" } : undefined}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {loading ? "Loading..." : "Refresh"}
    </button>
  );
}

// ── Notes sub-components ────────────────────────────────────────────────

function NoteForm({
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  submitting,
  submitError,
  onSubmit,
  onCancel,
}: {
  subject: string;
  onSubjectChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="px-6 pb-4 border-b border-tn-border/50">
      <div className="bg-tn-bg/50 border border-tn-border/60 rounded-lg p-4 space-y-3">
        <input
          type="text"
          placeholder="Subject (optional)"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-tn-border bg-white
            focus:outline-none focus:ring-2 focus:ring-tn-sky/50 focus:border-tn-sky
            placeholder:text-tn-muted/60"
        />
        <textarea
          placeholder="Write your note..."
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm rounded-lg border border-tn-border bg-white
            focus:outline-none focus:ring-2 focus:ring-tn-sky/50 focus:border-tn-sky
            placeholder:text-tn-muted/60 resize-y"
        />
        {submitError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {submitError}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs rounded-lg border border-tn-border bg-white
              text-tn-slate hover:bg-tn-bg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || (!subject.trim() && !body.trim())}
            className="px-4 py-2 text-xs rounded-lg border border-tn-navy bg-tn-navy
              text-white font-medium hover:bg-tn-navy-light transition-colors cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotesContent({
  notes,
  loading,
  error,
}: {
  notes: CaseNote[];
  loading: boolean;
  error: string | null;
}) {
  if (loading && notes.length === 0) {
    return <SkeletonList />;
  }

  if (error) {
    return <ErrorBox title="Failed to load notes" message={error} />;
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={<svg className="w-12 h-12 text-tn-border mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
        message="No notes on this case yet."
      />
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-tn-border/60" />
      <div className="space-y-5">
        {notes.map((note, idx) => (
          <div key={note.annotationid ?? idx} className="relative pl-7">
            <div className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-white shadow-sm
              ${idx === 0 ? "bg-tn-sky" : "bg-tn-border"}`}
            />
            <div className="bg-tn-bg/50 border border-tn-border/60 rounded-lg px-4 py-3 hover:border-tn-border transition-colors">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold text-tn-navy m-0 leading-snug">
                  {note.subject || <span className="text-tn-muted italic font-normal">No subject</span>}
                </h4>
                <time className="text-[11px] text-tn-muted whitespace-nowrap shrink-0 mt-0.5" title={new Date(note.createdon).toLocaleString()}>
                  {formatDate(note.createdon)}
                </time>
              </div>

              {note.notetext && (
                <div
                  className="mt-2 text-sm text-tn-slate leading-relaxed
                    [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                    [&_a]:text-tn-teal [&_a]:underline [&_h1]:text-base [&_h1]:font-bold [&_h1]:my-2
                    [&_h2]:text-sm [&_h2]:font-bold [&_h2]:my-1.5 [&_h3]:text-sm [&_h3]:font-semibold
                    [&_table]:border-collapse [&_td]:border [&_td]:border-tn-border [&_td]:px-2 [&_td]:py-1
                    [&_th]:border [&_th]:border-tn-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-tn-bg/50"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.notetext) }}
                />
              )}

              {note.isdocument && note.filename && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-tn-border/60 rounded-md">
                  <svg className="w-3.5 h-3.5 text-tn-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                  <span className="text-xs text-tn-slate font-medium">{note.filename}</span>
                  {note.filesize != null && (
                    <span className="text-[10px] text-tn-muted">
                      ({(note.filesize / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Activities sub-components ───────────────────────────────────────────

const ACTIVITY_TYPE_OPTIONS: { value: ActivityTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "email", label: "Emails" },
  { value: "phonecall", label: "Phone Calls" },
  { value: "task", label: "Tasks" },
  { value: "appointment", label: "Appointments" },
];

function ActivityTypeFilterBar({
  value,
  onChange,
}: {
  value: ActivityTypeFilter;
  onChange: (v: ActivityTypeFilter) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {ACTIVITY_TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer
            ${value === opt.value
              ? "border-tn-sky bg-tn-sky/10 text-tn-navy font-medium"
              : "border-tn-border bg-white text-tn-muted hover:text-tn-slate hover:bg-tn-bg"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function activityTypeStyle(type: string): { icon: JSX.Element; color: string; label: string } {
  switch (type) {
    case "email":
      return {
        label: "Email",
        color: "bg-blue-500",
        icon: (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        ),
      };
    case "phonecall":
      return {
        label: "Phone Call",
        color: "bg-green-500",
        icon: (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        ),
      };
    case "task":
      return {
        label: "Task",
        color: "bg-amber-500",
        icon: (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    case "appointment":
      return {
        label: "Appointment",
        color: "bg-purple-500",
        icon: (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        ),
      };
    default:
      return {
        label: type,
        color: "bg-gray-400",
        icon: (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
        ),
      };
  }
}

function activityStatusStyle(statecode: number): { bg: string; text: string; label: string } {
  switch (statecode) {
    case 0: return { bg: "bg-emerald-50", text: "text-emerald-700", label: "Open" };
    case 1: return { bg: "bg-blue-50", text: "text-blue-700", label: "Completed" };
    case 2: return { bg: "bg-gray-100", text: "text-gray-500", label: "Canceled" };
    default: return { bg: "bg-gray-50", text: "text-gray-600", label: "Unknown" };
  }
}

function ActivitiesContent({
  activities,
  loading,
  error,
  onSelect,
}: {
  activities: CaseActivity[];
  loading: boolean;
  error: string | null;
  onSelect: (activity: CaseActivity) => void;
}) {
  if (loading && activities.length === 0) {
    return <SkeletonList />;
  }

  if (error) {
    return <ErrorBox title="Failed to load activities" message={error} />;
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-12 h-12 text-tn-border mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
        }
        message="No activities on this case yet."
      />
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[13px] top-2 bottom-2 w-px bg-tn-border/60" />
      <div className="space-y-4">
        {activities.map((activity, idx) => {
          const typeStyle = activityTypeStyle(activity.activitytypecode);
          const status = activityStatusStyle(activity.statecode);

          return (
            <div key={activity.activityid ?? idx} className="relative pl-9">
              {/* Type icon dot */}
              <div className={`absolute left-[2px] top-2.5 w-[23px] h-[23px] rounded-full flex items-center justify-center ${typeStyle.color} shadow-sm`}>
                {typeStyle.icon}
              </div>

              <button
                onClick={() => onSelect(activity)}
                className="w-full text-left bg-tn-bg/50 border border-tn-border/60 rounded-lg px-4 py-3
                  hover:border-tn-sky/50 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${typeStyle.color} text-white`}>
                        {typeStyle.label}
                      </span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.text}`}>
                        {activity.statuscode_label ?? status.label}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-tn-navy m-0 leading-snug group-hover:text-tn-sky transition-colors">
                      {activity.subject || <span className="text-tn-muted italic font-normal">No subject</span>}
                    </h4>
                    {activity.description && (
                      <p className="text-xs text-tn-slate mt-1 m-0 line-clamp-2 leading-relaxed">
                        {activity.description.replace(/<[^>]*>/g, "").slice(0, 150)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <time className="text-[11px] text-tn-muted whitespace-nowrap" title={new Date(activity.createdon).toLocaleString()}>
                      {formatDate(activity.createdon)}
                    </time>
                    <svg className="w-4 h-4 text-tn-border group-hover:text-tn-sky transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityDetailModal({
  activity,
  onClose,
}: {
  activity: CaseActivity;
  onClose: () => void;
}) {
  const typeStyle = activityTypeStyle(activity.activitytypecode);
  const status = activityStatusStyle(activity.statecode);

  const dateFields: { label: string; value: string | null }[] = [
    { label: "Scheduled Start", value: activity.scheduledstart },
    { label: "Scheduled End", value: activity.scheduledend },
    { label: "Actual Start", value: activity.actualstart },
    { label: "Actual End", value: activity.actualend },
    { label: "Created", value: activity.createdon },
    { label: "Last Modified", value: activity.modifiedon },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl border border-tn-border shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-tn-border/50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${typeStyle.color} text-white`}>
                <span className="[&>svg]:w-3 [&>svg]:h-3">{typeStyle.icon}</span>
                {typeStyle.label}
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                {activity.statuscode_label ?? status.label}
              </span>
              {activity.prioritycode_label && (
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${priorityBadge(activity.prioritycode).color}`}>
                  {activity.prioritycode_label}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-tn-navy m-0 leading-snug">
              {activity.subject || <span className="text-tn-muted italic font-normal">No subject</span>}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-tn-bg transition-colors cursor-pointer bg-transparent border-none text-tn-muted hover:text-tn-navy shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-5">
          {/* Description */}
          {activity.description && (
            <div>
              <h4 className="text-xs text-tn-muted uppercase tracking-wider font-medium mb-2">Description</h4>
              <div
                className="text-sm text-tn-slate leading-relaxed bg-tn-bg/50 border border-tn-border/60 rounded-lg px-4 py-3
                  [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                  [&_a]:text-tn-teal [&_a]:underline [&_h1]:text-base [&_h1]:font-bold [&_h1]:my-2
                  [&_h2]:text-sm [&_h2]:font-bold [&_h2]:my-1.5 [&_h3]:text-sm [&_h3]:font-semibold
                  [&_table]:border-collapse [&_td]:border [&_td]:border-tn-border [&_td]:px-2 [&_td]:py-1
                  [&_th]:border [&_th]:border-tn-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-tn-bg/50"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.description) }}
              />
            </div>
          )}

          {/* Date fields grid */}
          <div>
            <h4 className="text-xs text-tn-muted uppercase tracking-wider font-medium mb-2">Dates</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dateFields.map((field) => (
                <div key={field.label} className="bg-tn-bg/50 border border-tn-border/60 rounded-lg px-3 py-2">
                  <dt className="text-[10px] text-tn-muted uppercase tracking-wider font-medium mb-0.5">{field.label}</dt>
                  <dd className="text-xs text-tn-navy font-medium m-0">
                    {field.value ? formatDateFull(field.value) : "\u2014"}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared primitive components ─────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-tn-border/50 rounded-full" />
            <div className="h-3 bg-tn-border/50 rounded w-32" />
            <div className="h-3 bg-tn-border/50 rounded w-24 ml-auto" />
          </div>
          <div className="ml-5 h-4 bg-tn-border/50 rounded w-3/4" />
          <div className="ml-5 h-4 bg-tn-border/50 rounded w-1/2 mt-1.5" />
        </div>
      ))}
    </div>
  );
}

function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-sm font-medium text-red-800 m-0">{title}</p>
        <p className="text-xs text-red-600 mt-0.5 m-0">{message}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: JSX.Element; message: string }) {
  return (
    <div className="text-center py-8">
      {icon}
      <p className="text-sm text-tn-muted m-0">{message}</p>
    </div>
  );
}
