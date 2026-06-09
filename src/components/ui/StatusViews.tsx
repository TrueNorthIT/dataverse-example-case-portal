import type { ReactNode } from "react";

export function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-tn-border/50 rounded-full" />
            <div className="h-3 bg-tn-border/50 rounded w-32" />
            <div className="h-3 bg-tn-border/50 rounded w-24 ml-auto" />
          </div>
          <div className="ml-5 h-4 bg-tn-border/50 rounded w-3/4" />
          <div className="ml-5 h-4 bg-tn-border/50 rounded w-1/2 mt-1.5" />
        </div>
      ))}
    </div>
  );
}

export function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-sm font-medium text-red-800 m-0">{title}</p>
        <p className="text-xs text-red-600 mt-0.5 m-0">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="text-center py-8">
      {icon}
      <p className="text-sm text-tn-muted m-0">{message}</p>
    </div>
  );
}
