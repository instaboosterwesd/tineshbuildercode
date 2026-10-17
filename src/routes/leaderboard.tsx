import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { leaderboard } from "@/lib/builder.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Builder" },
      { name: "description", content: "Top builders ranked by number of apps built." },
      { property: "og:title", content: "Leaderboard — Builder" },
      { property: "og:description", content: "Top builders ranked by number of apps built." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <PageHeader title="Leaderboard" subtitle="Top builders by apps built." />
        <Board />
      </main>
    </AppShell>
  ),
});

const medal = ["bg-warning text-warning-foreground", "bg-muted-foreground/30", "bg-primary/30"];

function Board() {
  const { data } = useQuery({ queryKey: ["leaderboard"], queryFn: () => leaderboard() });
  if (!data) return <div className="grid h-64 place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (!data.length) return <div className="surface clay p-10 text-center text-sm text-muted-foreground">No builds yet. Be the first!</div>;
  return (
    <div className="space-y-2">
      {data.map((r) => (
        <div key={r.rank} className="surface clay flex items-center gap-4 px-4 py-3">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-full font-bold", medal[r.rank - 1] ?? "clay-inset")}>
            {r.rank <= 3 ? <Trophy className="size-4" /> : r.rank}
          </span>
          <span className="flex-1 truncate font-semibold">{r.name}</span>
          <span className="text-sm font-bold text-primary">{r.builds} {r.builds === 1 ? "build" : "builds"}</span>
        </div>
      ))}
    </div>
  );
}
