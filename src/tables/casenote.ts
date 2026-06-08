/**
 * Dataverse `casenotes` table configuration — annotations linked to a case.
 */

export const CASE_NOTE_TABLE = "casenotes";

export const CASE_NOTE_FIELDS = [
  "annotationid",
  "subject",
  "notetext",
  "isdocument",
  "filename",
  "filesize",
  "createdon",
  "modifiedon",
];

export interface CaseNote {
  annotationid: string;
  subject: string | null;
  notetext: string | null;
  isdocument: boolean;
  filename: string | null;
  filesize: number | null;
  createdon: string;
  modifiedon: string;
  [key: string]: unknown;
}
