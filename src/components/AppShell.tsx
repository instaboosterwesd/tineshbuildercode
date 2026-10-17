import { Link, useNavigate, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Hammer, Home, Trophy, User, Wallet, Moon, Sun, LogIn, Package } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme";
import { getWalletInfo } from "@/lib/wallet.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Logo({ to = "/" }: { to?: "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-glow">
        <Hammer className="size-4 text-primary-foreground" />
      </span>
      Builder
    </Link>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn("rounded-full", className)}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export const walletQuery = { queryKey: ["wallet"], queryFn: () => getWalletInfo() };

export function useWallet() {
  const { user } = useAuth();
  return useQuery({ ...walletQuery, enabled: !!user });
}

const NAV = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/wallet", label: "Wallet", Icon: Wallet },
  { to: "/orders", label: "Orders", Icon: Package },
  { to: "/leaderboard", label: "Leaders", Icon: Trophy },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

function DockLink({ to, label, Icon }: (typeof NAV)[number]) {
  const matchRoute = useMatchRoute();
  const active = matchRoute({ to, exact: to === "/" });
  return (
    <Link
      to={to}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex shrink-0 items-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition-all duration-300 ease-out",
        "hover:-translate-y-1 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground clay-btn shadow-glow"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0 transition-transform duration-300 group-hover:scale-115",
          active && "scale-110",
        )}
      />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-all duration-300 max-sm:hidden",
          active ? "max-w-24 opacity-100" : "max-w-0 opacity-0 group-hover:max-w-24 group-hover:opacity-100",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

function CapsuleDock() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-safe"
    >
      <div className="capsule-dock dock-in flex max-w-[calc(100vw-1.5rem)] items-center gap-1 border border-border/60 p-1.5">
        {NAV.map((item) => (
          <DockLink key={item.to} {...item} />
        ))}
        <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />
        <ThemeToggle className="size-9 shrink-0 hover:-translate-y-1" />
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:h-16">
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Link
                to="/wallet"
                className="flex items-center gap-1.5 rounded-full bg-card clay px-3.5 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
              >
                <Wallet className="size-4 text-primary" /> ₹{wallet?.balance ?? 0}
              </Link>
            ) : (
              <Button asChild size="sm" variant="hero" className="rounded-full">
                <Link to="/auth">
                  <LogIn className="size-4" /> Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      {children}
      <CapsuleDock />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  if (loading) return <div className="grid h-64 place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) {
    return (
      <div className="surface mx-auto mt-6 max-w-sm p-8 text-center">
        <LogIn className="mx-auto size-8 text-primary" />
        <h2 className="mt-3 text-lg font-semibold">Login required</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to continue.</p>
        <Button variant="hero" className="mt-5 w-full" onClick={() => navigate({ to: "/auth" })}>Login / Sign up</Button>
      </div>
    );
  }
  return <>{children}</>;
}

export function SupportLink({ className, children }: { className?: string; children: ReactNode }) {
  const { data } = useQuery({ queryKey: ["site-settings"], enabled: false }) as { data?: { support_link?: string } };
  const link = data?.support_link;
  if (!link) return null;
  return (
    <a href={link} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}
