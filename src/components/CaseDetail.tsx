import type { Case, CaseNote, Tab } from "../types/case";
import { formatDate, formatDateFull, sanitizeHtml } from "../utils/format";
import { statusColor, priorityBadge } from "../utils/style";

interface CaseDetailProps {
  selectedCase: Case;
  activeTab: Tab;
  onClose: () => void;

  // Notes
  caseNotes: CaseNote[];
  notesLoading: boolean;
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
}

export function CaseDetail({
  selectedCase,
  activeTab,
  onClose,
  caseNotes,
  notesLoading,
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
}: CaseDetailProps) {
  const sc = statusColor(selectedCase.statecode);
  const pb = priorityBadge(selectedCase.prioritycode);

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
              { label: "Case Type", value: selectedCase.casetypecode_label ?? "—" },
              { label: "Status", value: selectedCase.statecode_label ?? (selectedCase.statecode === 0 ? "Active" : selectedCase.statecode === 1 ? "Resolved" : "Cancelled") },
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

      {/* Case notes section */}
      <div className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-tn-border/50">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-tn-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <h3 className="text-sm font-bold text-tn-navy m-0">Case Notes</h3>
            {!notesLoading && (
              <span className="text-xs text-tn-muted bg-tn-bg px-2 py-0.5 rounded-full font-medium">
                {caseNotes.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleNoteForm}
              className="px-3 py-1.5 text-xs rounded-lg border border-tn-sky bg-tn-sky/10
                text-tn-navy font-medium hover:bg-tn-sky/20 transition-colors cursor-pointer"
            >
              {showNoteForm ? "Cancel" : "+ Add Note"}
            </button>
            <button
              onClick={onRefreshNotes}
              disabled={notesLoading}
              className="px-3 py-1.5 text-xs rounded-lg border border-tn-border bg-white
                text-tn-slate hover:bg-tn-bg transition-colors cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {notesLoading ? "Loading..." : "Refresh"}
            </button>
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
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

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
  // Loading
  if (loading && notes.length === 0) {
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

  // Error
  if (error) {
    return (
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-red-800 m-0">Failed to load notes</p>
          <p className="text-xs text-red-600 mt-0.5 m-0">{error}</p>
        </div>
      </div>
    );
  }

  // Empty
  if (notes.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-tn-border mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="text-sm text-tn-muted m-0">No notes on this case yet.</p>
      </div>
    );
  }

  // Timeline
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
