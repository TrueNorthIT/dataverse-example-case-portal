import type { JSX } from "react";

const EMAIL_ICON = (
  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const PHONE_ICON = (
  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const TASK_ICON = (
  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const APPOINTMENT_ICON = (
  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const DEFAULT_ICON = (
  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
  </svg>
);

export function activityTypeStyle(type: string): { icon: JSX.Element; color: string; label: string } {
  switch (type) {
    case "email":       return { label: "Email",       color: "bg-blue-500",   icon: EMAIL_ICON };
    case "phonecall":   return { label: "Phone Call",  color: "bg-green-500",  icon: PHONE_ICON };
    case "task":        return { label: "Task",        color: "bg-amber-500",  icon: TASK_ICON };
    case "appointment": return { label: "Appointment", color: "bg-purple-500", icon: APPOINTMENT_ICON };
    default:            return { label: type,          color: "bg-gray-400",   icon: DEFAULT_ICON };
  }
}

export function activityStatusStyle(statecode: number): { bg: string; text: string; label: string } {
  switch (statecode) {
    case 0: return { bg: "bg-emerald-50", text: "text-emerald-700", label: "Open" };
    case 1: return { bg: "bg-blue-50",    text: "text-blue-700",    label: "Completed" };
    case 2: return { bg: "bg-gray-100",   text: "text-gray-500",    label: "Canceled" };
    default: return { bg: "bg-gray-50",   text: "text-gray-600",    label: "Unknown" };
  }
}
