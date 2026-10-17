import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, RequireAuth } from "@/components/AppShell";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Builder" }, { name: "description", content: "Profile page" }] }),
  component: () => (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <PageHeader title="Profile" subtitle="Coming soon." />
        <RequireAuth><p className="text-sm text-muted-foreground">This page is not finished yet.</p></RequireAuth>
      </main>
    </AppShell>
  ),
});
