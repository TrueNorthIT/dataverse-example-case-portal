import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./useApiClient";
import { CASE_TABLE, type Case } from "../tables/case";

/**
 * Create-case dialog state + mutation.
 *
 * Optimistically prepends the new case to the cached "me" list, then fires
 * the create + invalidate dance to keep TanStack Query in sync.
 */
export function useCreateCase(onCreated?: (created: Case) => void) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: async () =>
      client.me.create<Case>(CASE_TABLE, {
        title: title.trim(),
        description: description.trim() || null,
      }),
    onSuccess: (result) => {
      setOpen(false);
      setTitle("");
      setDescription("");
      if (result.data) {
        queryClient.setQueriesData<Case[]>(
          { queryKey: [CASE_TABLE, "me"] },
          (old) => (old ? [result.data!, ...old] : [result.data!]),
        );
        onCreated?.(result.data);
      }
      queryClient.invalidateQueries({ queryKey: [CASE_TABLE, "me"] });
      queryClient.invalidateQueries({ queryKey: ["agg", CASE_TABLE, "me"] });
    },
  });

  return {
    open,
    show: () => { setOpen(true); mutation.reset(); },
    cancel: () => {
      setOpen(false);
      setTitle("");
      setDescription("");
      mutation.reset();
    },

    title, setTitle,
    description, setDescription,
    submitting: mutation.isPending,
    submitError: mutation.error instanceof Error ? mutation.error.message : null,
    submit: () => mutation.mutate(),
  };
}
