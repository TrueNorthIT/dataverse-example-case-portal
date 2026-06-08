import { useCaseActivities } from "../hooks/useCaseActivities";
import type { Scope } from "../hooks/useDataverseList";
import type { ActivityTypeFilter, CaseActivity } from "../tables/caseactivity";
import { formatDate } from "../utils/format";
import { activityTypeStyle, activityStatusStyle } from "../utils/activityStyle";
import { RefreshButton } from "./ui/RefreshButton";
import { SkeletonList, ErrorBox, EmptyState } from "./ui/StatusViews";
import { ActivityDetailModal } from "./ActivityDetailModal";

const TYPE_OPTIONS: { value: ActivityTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "email", label: "Emails" },
  { value: "phonecall", label: "Phone Calls" },
  { value: "task", label: "Tasks" },
  { value: "appointment", label: "Appointments" },
];

interface CaseActivitiesPanelProps {
  incidentId: string;
  scope: Scope;
}

export function CaseActivitiesPanel({ incidentId, scope }: CaseActivitiesPanelProps) {
  const activities = useCaseActivities(incidentId, scope);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-tn-border/50 gap-3 flex-wrap">
        <TypeFilterBar value={activities.typeFilter} onChange={activities.setTypeFilter} />
        <RefreshButton
          loading={activities.isLoading}
          refreshing={activities.isRefreshing}
          onRefresh={() => activities.refresh()}
        />
      </div>

      <div className="p-6">
        <ActivitiesContent
          activities={activities.activities}
          loading={activities.isLoading}
          error={activities.error}
          onSelect={activities.setSelected}
        />
      </div>

      {activities.selected && (
        <ActivityDetailModal
          activity={activities.selected}
          onClose={() => activities.setSelected(null)}
        />
      )}
    </>
  );
}

function TypeFilterBar({
  value,
  onChange,
}: {
  value: ActivityTypeFilter;
  onChange: (v: ActivityTypeFilter) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {TYPE_OPTIONS.map((opt) => (
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
  if (loading && activities.length === 0) return <SkeletonList />;
  if (error) return <ErrorBox title="Failed to load activities" message={error} />;
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
        {activities.map((activity, idx) => (
          <ActivityItem key={activity.activityid ?? idx} activity={activity} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function ActivityItem({ activity, onSelect }: { activity: CaseActivity; onSelect: (a: CaseActivity) => void }) {
  const typeStyle = activityTypeStyle(activity.activitytypecode);
  const status = activityStatusStyle(activity.statecode);

  return (
    <div className="relative pl-9">
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
}
