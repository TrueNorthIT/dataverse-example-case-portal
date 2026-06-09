import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./useApiClient";
import { useDataverseList, type Scope } from "./useDataverseList";
import { CASE_NOTE_TABLE, CASE_NOTE_FIELDS, type CaseNote } from "../tables/casenote";

/**
 * Notes for a single case: query, create-form state, and create mutation.
 *
 * Pass `null` for `incidentId` to keep the hook mounted but skip fetching
 * (useful while no case is selected).
 */
export function useCaseNotes(incidentId: string | null, scope: Scope) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  const query = useDataverseList<CaseNote>(CASE_NOTE_TABLE, scope, {
    select: CASE_NOTE_FIELDS,
    filter: incidentId ? `incidentid eq ${incidentId}` : undefined,
    orderBy: "createdon:desc",
    top: 100,
    enabled: !!incidentId,
  });

  // ── Create-form state ─────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!incidentId) throw new Error("No case selected");
      await client.me.create(CASE_NOTE_TABLE, {
        subject: subject.trim() || null,
        notetext: body.trim() || null,
        incidentid: incidentId,
      });
    },
    onSuccess: () => {
      setShowForm(false);
      setSubject("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: [CASE_NOTE_TABLE, scope] });
    },
  });

  // Reset form when the selected case changes
  useEffect(() => {
    setShowForm(false);
    setSubject("");
    setBody("");
    mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  return {
    notes: query.data,
    isLoading: query.isLoading,
    isRefreshing: query.isRefreshing,
    error: query.errorMessage,
    refresh: query.refetch,

    showForm,
    toggleForm: () => { setShowForm((v) => !v); mutation.reset(); },
    subject, setSubject,
    body, setBody,
    submitting: mutation.isPending,
    submitError: mutation.error instanceof Error ? mutation.error.message : null,
    submit: () => mutation.mutate(),
    cancel: () => {
      setShowForm(false);
      setSubject("");
      setBody("");
      mutation.reset();
    },
  };
}
