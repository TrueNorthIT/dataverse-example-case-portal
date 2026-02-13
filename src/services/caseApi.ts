import { config, API_BASE } from "../env";
import type { CaseResponse, NotesResponse } from "../types/case";

const FIELDS = [
  "incidentid", "ticketnumber", "title", "statuscode", "statecode",
  "prioritycode", "casetypecode", "createdon", "modifiedon",
].join(",");

const NOTES_FIELDS = [
  "annotationid", "subject", "notetext", "isdocument",
  "filename", "filesize", "createdon", "modifiedon",
].join(",");

function baseUrl(): string {
  return config.apiBaseUrl.replace(/\/+$/, "");
}

async function authFetch(token: string, url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

export async function fetchCases(token: string, scope: "me" | "team"): Promise<CaseResponse> {
  const url = `${baseUrl()}${API_BASE}/${scope}/incident?select=${FIELDS}&top=200&orderBy=modifiedon:desc`;
  const res = await authFetch(token, url);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 403 && scope === "team") {
      throw Object.assign(new Error("team_forbidden"), { status: 403 });
    }
    throw new Error((data as { message?: string }).message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchCaseNotes(
  token: string,
  incidentId: string,
  scope: "me" | "team",
): Promise<NotesResponse> {
  const filterParam = encodeURIComponent(`objectid eq ${incidentId}`);
  const url = `${baseUrl()}${API_BASE}/${scope}/casenotes?select=${NOTES_FIELDS}&filter=${filterParam}&orderBy=createdon:desc&top=100`;
  const res = await authFetch(token, url);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export async function createCaseNote(
  token: string,
  incidentId: string,
  subject: string | null,
  notetext: string | null,
): Promise<void> {
  const url = `${baseUrl()}${API_BASE}/me/casenotes`;
  const res = await authFetch(token, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject,
      notetext,
      objectid_incident: incidentId,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? `HTTP ${res.status}`);
  }
}
