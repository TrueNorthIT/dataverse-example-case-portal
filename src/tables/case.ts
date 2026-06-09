/**
 * Dataverse `case` (incident) table configuration.
 *
 * One file per Dataverse table — colocate the API route name, the default
 * field list, and the TypeScript shape so onboarding a new entity is a copy-
 * and-rename of this file.
 */

export const CASE_TABLE = "case";

export const CASE_FIELDS = [
  "incidentid",
  "ticketnumber",
  "title",
  "statuscode",
  "statecode",
  "prioritycode",
  "casetypecode",
  "createdon",
  "modifiedon",
];

export interface Case {
  incidentid: string;
  ticketnumber: string;
  title: string;
  statuscode: number;
  statuscode_label?: string;
  statecode: number;
  statecode_label?: string;
  prioritycode: number;
  prioritycode_label?: string;
  casetypecode: number | null;
  casetypecode_label?: string;
  createdon: string;
  modifiedon: string;
  [key: string]: unknown;
}
