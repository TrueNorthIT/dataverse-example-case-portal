/**
 * UI-only types used by toolbars, tables, and the case detail view.
 *
 * Entity shapes (Case, CaseNote, CaseActivity) live alongside their table
 * configuration under `src/tables/`.
 */

export type Tab = "me" | "team";
export type SortField =
  | "ticketnumber"
  | "title"
  | "statuscode"
  | "prioritycode"
  | "createdon"
  | "modifiedon";
export type SortDir = "asc" | "desc";
export type GroupBy = "none" | "statuscode" | "prioritycode" | "casetypecode";
