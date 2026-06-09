import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./useApiClient";
import type { Scope } from "./useDataverseList";

export interface DataverseAggregateOptions {
  aggregate: "count" | "sum" | "avg" | "min" | "max";
  groupBy?: string[];
  filter?: string;
  enabled?: boolean;
}

/**
 * Generic aggregate hook — server-side counts / sums grouped by any fields.
 *
 * Push the maths down to the database instead of paging through rows. Used
 * here for dashboard stats; equally useful for charts, KPIs, rollups, etc.
 */
export function useDataverseAggregate<T>(
  table: string,
  scope: Scope,
  options: DataverseAggregateOptions,
) {
  const client = useApiClient();

  const query = useQuery({
    queryKey: ["agg", table, scope, options.aggregate, options.groupBy?.join(",") ?? null, options.filter ?? null] as const,
    queryFn: async () => {
      const result = await client[scope].aggregate<T>(table, {
        aggregate: options.aggregate,
        groupBy: options.groupBy,
        filter: options.filter,
      });
      return result.data ?? [];
    },
    enabled: options.enabled ?? true,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.error,
  };
}
