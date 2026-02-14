interface CreateCaseFormProps {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CreateCaseForm({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  submitting,
  submitError,
  onSubmit,
  onCancel,
}: CreateCaseFormProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl border border-tn-border shadow-xl max-w-lg w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-tn-navy m-0 mb-4">New Case</h2>

        <div className="space-y-3">
          <div>
            <label htmlFor="case-title" className="block text-xs font-medium text-tn-slate mb-1">
              Title
            </label>
            <input
              id="case-title"
              type="text"
              placeholder="Briefly describe the issue"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-tn-border bg-white
                focus:outline-none focus:ring-2 focus:ring-tn-sky/50 focus:border-tn-sky
                placeholder:text-tn-muted/60"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="case-description" className="block text-xs font-medium text-tn-slate mb-1">
              Description <span className="text-tn-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="case-description"
              placeholder="Provide more detail about the issue..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-lg border border-tn-border bg-white
                focus:outline-none focus:ring-2 focus:ring-tn-sky/50 focus:border-tn-sky
                placeholder:text-tn-muted/60 resize-y"
            />
          </div>

          {submitError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs rounded-lg border border-tn-border bg-white
                text-tn-slate hover:bg-tn-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting || !title.trim()}
              className="px-4 py-2 text-xs rounded-lg border border-tn-navy bg-tn-navy
                text-white font-medium hover:bg-tn-navy-light transition-colors cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Case"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
