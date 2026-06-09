import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./useApiClient";

export type Scope = "me" | "team";

export interface DataverseListOptions {
  select: string[];
  filter?: string;
  orderBy?: string;
  top?: number;
  enabled?: boolean;
}

/**
 * Generic list hook — the foundation for every list view in this portal.
 *
 * Combines the Dataverse SDK (authenticated `/me/<table>` and `/team/<table>` calls)
 * with TanStack Query (caching, deduping, background refresh, real-time invalidation).
 *
 * To build a list for a new table, the entire wiring is:
 *
 *   const { data, isLoading } = useDataverseList<Contact>(
 *     CONTACT_TABLE,
 *     "me",
 *     { select: CONTACT_FIELDS },
 *   );
 */
export function useDataverseList<T>(
  table: string,
  scope: Scope,
  options: DataverseListOptions,
) {
  const client = useApiClient();

  const query = useQuery({
    queryKey: [table, scope, options.filter ?? null, options.orderBy ?? null] as const,
    queryFn: async () => {
      const result = await client[scope].list<T>(table, {
        select: options.select,
        filter: options.filter,
        orderBy: options.orderBy,
        top: options.top,
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
    errorMessage: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
