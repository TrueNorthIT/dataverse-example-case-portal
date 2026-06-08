import { useCaseNotes } from "../hooks/useCaseNotes";
import type { Scope } from "../hooks/useDataverseList";
import type { CaseNote } from "../tables/casenote";
import { formatDate } from "../utils/format";
import { sanitizeHtml } from "../utils/format";
import { RefreshButton } from "./ui/RefreshButton";
import { SkeletonList, ErrorBox, EmptyState } from "./ui/StatusViews";

interface CaseNotesPanelProps {
  incidentId: string;
  scope: Scope;
}

export function CaseNotesPanel({ incidentId, scope }: CaseNotesPanelProps) {
  const notes = useCaseNotes(incidentId, scope);

  return (
    <>
      <div className="flex items-center justify-end px-6 py-3 border-b border-tn-border/50">
        <div className="flex items-center gap-2">
          <button
            onClick={notes.toggleForm}
            className="px-3 py-1.5 text-xs rounded-lg border border-tn-sky bg-tn-sky/10
              text-tn-navy font-medium hover:bg-tn-sky/20 transition-colors cursor-pointer"
          >
            {notes.showForm ? "Cancel" : "+ Add Note"}
          </button>
          <RefreshButton
            loading={notes.isLoading}
            refreshing={notes.isRefreshing}
            onRefresh={() => notes.refresh()}
          />
        </div>
      </div>

      {notes.showForm && (
        <NoteForm
          subject={notes.subject}
          onSubjectChange={notes.setSubject}
          body={notes.body}
          onBodyChange={notes.setBody}
          submitting={notes.submitting}
          submitError={notes.submitError}
          onSubmit={notes.submit}
          onCancel={notes.cancel}
        />
      )}

      <div className="p-6">
        <NotesContent
          notes={notes.notes}
          loading={notes.isLoading}
          error={notes.error}
        />
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function NoteForm({
  subject, onSubjectChange,
  body, onBodyChange,
  submitting, submitError,
  onSubmit, onCancel,
}: {
  subject: string;
  onSubjectChange: (v: string) => void;
  body: string;
  onBodyChange: (v: string) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const canSubmit = !submitting && (subject.trim() || body.trim());
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
            disabled={!canSubmit}
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

function NotesContent({ notes, loading, error }: { notes: CaseNote[]; loading: boolean; error: string | null }) {
  if (loading && notes.length === 0) return <SkeletonList />;
  if (error) return <ErrorBox title="Failed to load notes" message={error} />;
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-12 h-12 text-tn-border mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        }
        message="No notes on this case yet."
      />
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-tn-border/60" />
      <div className="space-y-5">
        {notes.map((note, idx) => (
          <NoteItem key={note.annotationid ?? idx} note={note} isFirst={idx === 0} />
        ))}
      </div>
    </div>
  );
}

function NoteItem({ note, isFirst }: { note: CaseNote; isFirst: boolean }) {
  return (
    <div className="relative pl-7">
      <div className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-white shadow-sm
        ${isFirst ? "bg-tn-sky" : "bg-tn-border"}`}
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
  );
}
