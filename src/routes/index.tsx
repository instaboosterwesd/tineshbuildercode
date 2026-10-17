import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { LottieIcon, preloadLottie } from "@/components/effects/LottieIcon";
import { STICKERS } from "@/lib/stickers";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { baseApkLabel } from "@/lib/base-apks";
import { matchesProduct, productId } from "@/lib/product-id";
import { listTemplates } from "@/lib/builder.functions";

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

function Index() {
  const { data: templates } = useSuspenseQuery(templatesQuery);
  const [q, setQ] = useState("");

  useEffect(() => { preloadLottie([STICKERS.search, STICKERS.leaders, STICKERS.video]); }, []);


  const list = useMemo(() => templates.filter((t) => matchesProduct(t, q)), [templates, q]);

  const searching = q.trim() !== "";

  return (
    <AppShell>


      <section className="sticky top-14 z-30 mx-auto max-w-6xl px-4 py-3 sm:top-16">
        <div className="surface flex flex-col gap-2.5 p-3 backdrop-blur-xl sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <LottieIcon src={STICKERS.search} className="pointer-events-none absolute left-3 top-1/2 size-6 -translate-y-1/2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or Product ID"
              className="h-11 rounded-2xl border-0 bg-muted/60 pl-11 shadow-none focus-visible:ring-1"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-2">
        <p className="mb-3 text-sm text-muted-foreground">{list.length} template{list.length === 1 ? "" : "s"}</p>
        {list.length === 0 ? (
          <div className="surface grid place-items-center p-10 text-center sm:p-14">
            <span className="grid size-16 place-items-center rounded-3xl bg-accent text-accent-foreground shadow-soft">
              <LottieIcon src={templates.length ? STICKERS.search : STICKERS.leaders} className="size-10" />
            </span>
            <p className="mt-4 text-lg font-semibold">{templates.length ? "No templates match" : "No templates yet"}</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {templates.length ? "Try a different search." : "New templates are added soon — check back later."}
            </p>
            {searching && (
              <button
                onClick={() => setQ("")}
                className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:-translate-y-0.5"
              >
                Clear search
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
                      <LottieIcon src={STICKERS.video} className="size-4" /> Video
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
