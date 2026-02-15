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

export interface CaseActivity {
  activityid: string;
  subject: string | null;
  description: string | null;
  activitytypecode: string;
  activitytypecode_label?: string;
  prioritycode: number;
  prioritycode_label?: string;
  statecode: number;
  statecode_label?: string;
  statuscode: number;
  statuscode_label?: string;
  scheduledstart: string | null;
  scheduledend: string | null;
  actualstart: string | null;
  actualend: string | null;
  createdon: string;
  modifiedon: string;
  [key: string]: unknown;
}

export type ActivityTypeFilter = "all" | "email" | "phonecall" | "task" | "appointment";

export type SortField = "ticketnumber" | "title" | "statuscode" | "prioritycode" | "createdon" | "modifiedon";
export type SortDir = "asc" | "desc";
export type GroupBy = "none" | "statuscode" | "prioritycode" | "casetypecode";
export type Tab = "me" | "team";
