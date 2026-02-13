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

export interface CaseResponse {
  data: Case[];
  page: { top: number; skip: number; next: string | null };
}

export interface NotesResponse {
  data: CaseNote[];
  page: { top: number; skip: number; next: string | null };
}

export type SortField = "ticketnumber" | "title" | "statuscode" | "prioritycode" | "createdon" | "modifiedon";
export type SortDir = "asc" | "desc";
export type GroupBy = "none" | "statuscode" | "prioritycode" | "casetypecode";
export type Tab = "me" | "team";
