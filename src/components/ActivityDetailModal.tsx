import type { CaseActivity } from "../tables/caseactivity";
import { formatDateFull, sanitizeHtml } from "../utils/format";
import { priorityBadge } from "../utils/style";
import { activityTypeStyle, activityStatusStyle } from "../utils/activityStyle";

interface ActivityDetailModalProps {
  activity: CaseActivity;
  onClose: () => void;
}

export function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  const typeStyle = activityTypeStyle(activity.activitytypecode);
  const status = activityStatusStyle(activity.statecode);

  const dates: { label: string; value: string | null }[] = [
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

        <div className="p-6 space-y-5">
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

          <div>
            <h4 className="text-xs text-tn-muted uppercase tracking-wider font-medium mb-2">Dates</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dates.map((field) => (
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
