import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Plain, lightweight busy state (the animated "LOADING" text effect was removed on request).
export function HackerLoader({ label = "Loading", className }: { compact?: boolean; label?: string; className?: string }) {
  return <span role="status" aria-label={label} className={cn("text-sm opacity-80", className)}>{label}…</span>;
}

export function LoadingPanel() {
  return <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-10" aria-busy="true" aria-label="Loading">
    <Skeleton className="h-6 w-2/5" />
    {[0, 1, 2].map((i) => <div key={i} className="flex items-center gap-4 border-b border-border py-4"><Skeleton className="size-12 shrink-0" /><div className="flex-1 space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}
  </div>;
}
