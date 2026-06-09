import type { Case } from "../tables/case";
import type { Tab } from "../types/ui";
import { formatDateFull } from "../utils/format";
import { statusColor, priorityBadge } from "../utils/style";

interface CaseDetailHeaderProps {
  selectedCase: Case;
  scope: Tab;
  onBack: () => void;
}

export function CaseDetailHeader({ selectedCase, scope, onBack }: CaseDetailHeaderProps) {
  const sc = statusColor(selectedCase.statecode);
  const pb = priorityBadge(selectedCase.prioritycode);

  const metadata = [
    { label: "Case Type", value: selectedCase.casetypecode_label ?? "\u2014" },
    { label: "Status Reason", value: selectedCase.statuscode_label ?? `Status ${selectedCase.statuscode}` },
    { label: "Created", value: formatDateFull(selectedCase.createdon) },
    { label: "Last Modified", value: formatDateFull(selectedCase.modifiedon) },
  ];

  return (
    <>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-tn-slate hover:text-tn-navy
          transition-colors cursor-pointer bg-transparent border-none p-0 group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7 7m-7-7l7-7" />
        </svg>
        Back to {scope === "me" ? "My" : "Team"} Cases
      </button>

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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-tn-border/50">
            {metadata.map((item) => (
              <div key={item.label}>
                <dt className="text-[11px] text-tn-muted uppercase tracking-wider font-medium mb-0.5">{item.label}</dt>
                <dd className="text-sm text-tn-navy font-medium m-0">{item.value}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
