import { useState, useEffect } from "react";
import { useDataverseList, type Scope } from "./useDataverseList";
import {
  CASE_ACTIVITY_FIELDS,
  tableForActivityFilter,
  type ActivityTypeFilter,
  type CaseActivity,
} from "../tables/caseactivity";

/**
 * Activities (emails, phone calls, tasks, appointments) for a single case.
 *
 * The type filter switches which Dataverse table the query reads from —
 * the SDK's per-type routes return the slice already filtered server-side.
 */
export function useCaseActivities(incidentId: string | null, scope: Scope) {
  const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter>("all");
  const [selected, setSelected] = useState<CaseActivity | null>(null);

  const query = useDataverseList<CaseActivity>(tableForActivityFilter(typeFilter), scope, {
    select: CASE_ACTIVITY_FIELDS,
    filter: incidentId ? `incidentid eq ${incidentId}` : undefined,
    orderBy: "createdon:desc",
    top: 100,
    enabled: !!incidentId,
  });

  // Reset filter + selection when the selected case changes
  useEffect(() => {
    setTypeFilter("all");
    setSelected(null);
  }, [incidentId]);

  return {
    activities: query.data,
    isLoading: query.isLoading,
    isRefreshing: query.isRefreshing,
    error: query.errorMessage,
    refresh: query.refetch,

    typeFilter,
    setTypeFilter,
    selected,
    setSelected,
  };
}
