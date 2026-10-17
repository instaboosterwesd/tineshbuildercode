import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Image as ImageIcon, PlayCircle, Search, Smartphone, Zap, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { baseApkLabel } from "@/lib/base-apks";
import { matchesProduct, productId } from "@/lib/product-id";
import { listTemplates } from "@/lib/builder.functions";

export const templatesQuery = queryOptions({ queryKey: ["templates"], queryFn: () => listTemplates() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Builder — Templates to Android APK" },
      { name: "description", content: "Browse app templates, preview them and build your own Android APK in minutes." },
      { property: "og:title", content: "Builder — Templates to Android APK" },
      { property: "og:description", content: "Browse app templates, preview them and build your own Android APK in minutes." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(templatesQuery),
  component: Index,
});

function Index() {
  const { data: templates } = useSuspenseQuery(templatesQuery);
  const [q, setQ] = useState("");
  const list = templates.filter((t) => matchesProduct(t, q));
  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:pt-14">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <Zap className="size-3.5" /> Template to Android APK
        </span>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
          Pick a template. <span className="text-gradient">Get your app.</span>
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">Choose a design, add your logo and build your own APK in minutes.</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Smartphone className="size-4 text-primary" /> Native Android APK</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-primary" /> Pay from wallet</span>
        </div>
        <div className="relative mt-6 max-w-xl">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or Product ID" className="h-12 rounded-2xl pl-11 text-base shadow-soft" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-3 text-sm text-muted-foreground">{list.length} template{list.length === 1 ? "" : "s"}</p>
        {list.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border p-10 text-center">
            <ImageIcon className="size-10 text-muted-foreground" />
            <p className="mt-3 font-medium">{templates.length ? "No match found" : "No templates yet"}</p>
            <p className="text-sm text-muted-foreground">{templates.length ? "Try another search." : "New templates are coming soon."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {list.map((t) => (
              <Link key={t.id} to="/templates/$id" params={{ id: t.id }} className="surface group overflow-hidden transition active:scale-[0.99] hover:border-primary/40 hover:shadow-glow">
                <div className="relative aspect-[4/3] bg-muted sm:aspect-video">
                  {t.image ? (
                    <img src={t.image} alt={t.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center"><ImageIcon className="size-8 text-muted-foreground" /></div>
                  )}
                  {t.video && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[11px] backdrop-blur">
                      <PlayCircle className="size-3 text-primary" /> Video
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 rounded-full bg-gradient-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground shadow-glow">
                    {t.price > 0 ? `₹${t.price}` : "Free"}
                  </span>
                </div>
                <div className="p-3 sm:p-4">
                  <span className="font-mono text-[11px] font-medium text-primary">#{productId(t.id)} · {baseApkLabel(t.base_apk)}</span>
                  <h3 className="mt-0.5 truncate font-semibold sm:text-lg">{t.name}</h3>
                  <p className="mt-0.5 line-clamp-2 hidden text-sm text-muted-foreground sm:block">{t.description || "No description"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
