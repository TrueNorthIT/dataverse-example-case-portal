/**
 * Dataverse case activity table configuration.
 *
 * The API exposes a unified `caseactivities` route plus per-type routes
 * (`caseemails`, `casephonecalls`, ...). The filter UI lets the user pick
 * which slice to query.
 */

export type ActivityTypeFilter = "all" | "email" | "phonecall" | "task" | "appointment";

export const CASE_ACTIVITY_TABLE = "caseactivities";

export const CASE_ACTIVITY_TABLES: Record<Exclude<ActivityTypeFilter, "all">, string> = {
  email: "caseemails",
  phonecall: "casephonecalls",
  task: "casetasks",
  appointment: "caseappointments",
};

export const CASE_ACTIVITY_FIELDS = [
  "activityid",
  "subject",
  "description",
  "activitytypecode",
  "prioritycode",
  "statecode",
  "statuscode",
  "scheduledstart",
  "scheduledend",
  "actualstart",
  "actualend",
  "createdon",
  "modifiedon",
];

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

export function tableForActivityFilter(filter: ActivityTypeFilter): string {
  return filter === "all" ? CASE_ACTIVITY_TABLE : CASE_ACTIVITY_TABLES[filter];
}
