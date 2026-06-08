import { useState } from "react";
import type { Case } from "../tables/case";
import type { Tab } from "../types/ui";
import { CaseDetailHeader } from "./CaseDetailHeader";
import { CaseNotesPanel } from "./CaseNotesPanel";
import { CaseActivitiesPanel } from "./CaseActivitiesPanel";

type DetailTab = "notes" | "activities";

interface CaseDetailProps {
  selectedCase: Case;
  scope: Tab;
  onClose: () => void;
}

/**
 * Single-case view. Orchestrates the header card and the notes/activities tabs;
 * each tab panel fetches its own data via its own hook, so this file stays small.
 */
export function CaseDetail({ selectedCase, scope, onClose }: CaseDetailProps) {
  const [detailTab, setDetailTab] = useState<DetailTab>("notes");

  return (
    <div className="space-y-4">
      <CaseDetailHeader selectedCase={selectedCase} scope={scope} onBack={onClose} />

      <div className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
        <div className="flex border-b border-tn-border/50">
          <TabButton
            active={detailTab === "notes"}
            onClick={() => setDetailTab("notes")}
            label="Notes"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            }
          />
          <TabButton
            active={detailTab === "activities"}
            onClick={() => setDetailTab("activities")}
            label="Activities"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            }
          />
        </div>

        {detailTab === "notes"
          ? <CaseNotesPanel incidentId={selectedCase.incidentid} scope={scope} />
          : <CaseActivitiesPanel incidentId={selectedCase.incidentid} scope={scope} />}
      </div>
    </div>
  );
}

function TabButton({
  active, onClick, label, icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer border-none
        ${active
          ? "text-tn-navy border-b-2 border-b-tn-sky bg-tn-sky/5"
          : "text-tn-muted hover:text-tn-navy hover:bg-tn-bg/50 bg-transparent"}`}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}
