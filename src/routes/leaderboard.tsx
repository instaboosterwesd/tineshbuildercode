import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, RequireAuth } from "@/components/AppShell";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Builder" }, { name: "description", content: "Leaderboard page" }] }),
  component: () => (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <PageHeader title="Leaderboard" subtitle="Coming soon." />
        <RequireAuth><p className="text-sm text-muted-foreground">This page is not finished yet.</p></RequireAuth>
      </main>
    </AppShell>
  ),
});
