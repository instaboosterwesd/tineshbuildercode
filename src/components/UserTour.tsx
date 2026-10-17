import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Home, Wallet, Package, Trophy, User, X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { siteName, visibleAnnouncement } from "@/lib/site-settings";

const KEY = "appforge-tour-done";

const STEPS = [
  {
    Icon: Home,
    title: "Welcome to AppForge",
    body: "This is your home. Browse app templates, search by name or Product ID, and preview any design before you build.",
  },
  {
    Icon: Wallet,
    title: "Wallet",
    body: "Your balance lives here. Add money with UPI: pick an amount, scan the QR, pay, then submit your UTR. Admin approves and your wallet is credited.",
  },
  {
    Icon: Package,
    title: "Orders",
    body: "Every build you request shows up here with its status. When a build finishes, download your APK from this page.",
  },
  {
    Icon: Trophy,
    title: "Leaderboard",
    body: "See the top builders ranked by how many apps they have built. Build more to climb the board.",
  },
  {
    Icon: User,
    title: "Profile",
    body: "Edit your name and Telegram username, change your password, and review your recent activity and login history.",
  },
] as const;

export function UserTour() {
  const { pathname } = useLocation();
  const { data: settings } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
    function onDismiss() {
      try {
        localStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
      setOpen(false);
    }
    window.addEventListener("appforge-dismiss-tour", onDismiss);
    return () => window.removeEventListener("appforge-dismiss-tour", onDismiss);
  }, []);

  if (!open || pathname === "/auth" || pathname.startsWith("/admin") || visibleAnnouncement(settings)) return null;

  function finish() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  const current = STEPS[step]!;
  const last = step === STEPS.length - 1;

  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    // First tap anywhere outside the card closes the tour; if that tap landed
    // on a control underneath (e.g. the theme toggle), let it act too.
    const overlay = e.currentTarget;
    overlay.style.pointerEvents = "none";
    finish();
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = "";
    const btn = hit?.closest("button");
    if (btn && btn !== e.target) btn.click();
  }

  return createPortal(
    <div onClick={onBackdropClick} className="fixed inset-0 z-[100] flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="App tour">
      <div onClick={(e) => e.stopPropagation()} className="glass-dialog rounded-lg border w-full max-w-sm p-6">
        <div className="flex items-start justify-between">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <current.Icon className="size-6" />
          </span>
          <button onClick={finish} aria-label="Skip tour" className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground">
            <X className="size-4" />
          </button>
        </div>
        <h2 className="mt-4 text-lg font-bold">{step === 0 ? `Welcome to ${siteName(settings)}` : current.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{current.body}</p>
        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30")} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
            )}
            <Button variant="hero" size="sm" onClick={() => (last ? finish() : setStep(step + 1))}>
              {last ? (
                <>
                  <Sparkles className="size-4" /> Get started
                </>
              ) : (
                <>
                  Next <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
