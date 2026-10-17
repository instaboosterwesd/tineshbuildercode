import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Hammer, Home, Trophy, User, Wallet, Moon, Sun, LogIn, Package } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme";
import { getWalletInfo } from "@/lib/wallet.functions";
import { Button } from "@/components/ui/button";

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

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-full">
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

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:h-16">
          <Logo />
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
              >
                <Icon className="size-4" /> {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {user ? (
              <Link to="/wallet" className="flex items-center gap-1.5 rounded-full bg-card clay px-3 py-1.5 text-sm font-semibold">
                <Wallet className="size-4 text-primary" /> ₹{wallet?.balance ?? 0}
              </Link>
            ) : (
              <Button asChild size="sm" variant="hero" className="rounded-full">
                <Link to="/auth"><LogIn className="size-4" /> Login</Link>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-lg pb-safe md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-0.5 pt-2 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
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
