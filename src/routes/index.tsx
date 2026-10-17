import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Image as ImageIcon, PlayCircle, Search, Smartphone, ShieldCheck, SearchX, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { BASE_APKS, baseApkLabel } from "@/lib/base-apks";
import { matchesProduct, productId } from "@/lib/product-id";
import { listTemplates } from "@/lib/builder.functions";
import { cn } from "@/lib/utils";

export const templatesQuery = queryOptions({ queryKey: ["templates"], queryFn: () => listTemplates() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AppForge — Templates to Android APK" },
      { name: "description", content: "Browse app templates, preview them and build your own Android APK in minutes." },
      { property: "og:title", content: "AppForge — Templates to Android APK" },
      { property: "og:description", content: "Browse app templates, preview them and build your own Android APK in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(templatesQuery),
  component: Index,
});

type PriceFilter = "all" | "free" | "paid";

function Index() {
  const { data: templates } = useSuspenseQuery(templatesQuery);
  const [q, setQ] = useState("");
  const [apk, setApk] = useState<string>("all");
  const [price, setPrice] = useState<PriceFilter>("all");

  const list = useMemo(
    () =>
      templates.filter(
        (t) =>
          matchesProduct(t, q) &&
          (apk === "all" || t.base_apk === apk) &&
          (price === "all" || (price === "free" ? t.price <= 0 : t.price > 0)),
      ),
    [templates, q, apk, price],
  );

  const filtering = q.trim() !== "" || apk !== "all" || price !== "all";

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 pt-8 text-center sm:pt-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Pick a template. <span className="text-gradient">Get your app.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a design, pay from your wallet, and download your Android app.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground"><Smartphone className="size-4 text-primary" /> Native Android APK</span>
            <span className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Pay from wallet</span>
            <span className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground"><Sparkles className="size-4 text-primary" /> Ready in minutes</span>
          </div>
        </div>
      </section>

      <section className="sticky top-14 z-30 mx-auto max-w-6xl px-4 py-3 sm:top-16">
        <div className="surface flex flex-col gap-2.5 p-3 backdrop-blur-xl sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or Product ID"
              className="h-11 rounded-xl border-0 bg-muted/60 pl-11 shadow-none focus-visible:ring-1"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[{ id: "all", label: "All" }, ...BASE_APKS].map((b) => (
              <button
                key={b.id}
                onClick={() => setApk(b.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  apk === b.id ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {b.label}
              </button>
            ))}
            <span aria-hidden className="mx-0.5 h-4 w-px bg-border" />
            {(["free", "paid"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPrice(price === p ? "all" : p)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
                  price === p ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-2">
        <p className="mb-3 text-sm text-muted-foreground">{list.length} template{list.length === 1 ? "" : "s"}</p>
        {list.length === 0 ? (
          <div className="surface grid place-items-center p-10 text-center sm:p-14">
            <span className="grid size-16 place-items-center rounded-3xl bg-accent text-accent-foreground shadow-soft">
              {templates.length ? <SearchX className="size-8" /> : <Sparkles className="size-8" />}
            </span>
            <p className="mt-4 text-lg font-semibold">{templates.length ? "No templates match" : "No templates yet"}</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {templates.length ? "Try a different search or clear the filters." : "New templates are added soon — check back later."}
            </p>
            {filtering && (
              <button
                onClick={() => { setQ(""); setApk("all"); setPrice("all"); }}
                className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:-translate-y-0.5"
              >
                Clear filters
              </button>
            )}
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
