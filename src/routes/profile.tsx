import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Camera, KeyRound, LifeBuoy, LogOut, Monitor, Package, Save, Wallet } from "lucide-react";
import { AppShell, PageHeader, RequireAuth, useWallet } from "@/components/AppShell";
import { getMyProfile, updateMyProfile, uploadAvatar } from "@/lib/users.functions";
import { myBuilds } from "@/lib/builder.functions";
import { getSiteSettings } from "@/lib/wallet.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Builder" },
      { name: "description", content: "Edit your profile, photo and password, and see your recent builds and logins." },
      { property: "og:title", content: "My Profile — Builder" },
      { property: "og:description", content: "Manage your Builder account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <PageHeader title="Profile" subtitle="Your account, history and settings." />
        <RequireAuth>
          <ProfileBody />
        </RequireAuth>
      </main>
    </AppShell>
  ),
});

const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function device(ua: string) {
  if (!ua) return "Unknown device";
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Device";
  const br = /Edg/i.test(ua) ? "Edge" : /Chrome/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox" : /Safari/i.test(ua) ? "Safari" : "Browser";
  return `${br} on ${os}`;
}

function ProfileBody() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchBuilds = useServerFn(myBuilds);
  const save = useServerFn(updateMyProfile);
  const upload = useServerFn(uploadAvatar);
  const { data: wallet } = useWallet();
  const { data } = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  const { data: builds } = useQuery({ queryKey: ["my-builds"], queryFn: () => fetchBuilds() });
  const { data: settings } = useQuery({ queryKey: ["site-settings"], queryFn: () => getSiteSettings() });

  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data?.profile) {
      setName(data.profile.name);
      setTelegram(data.profile.telegram_id);
    }
  }, [data?.profile]);

  if (!data) return <div className="grid h-64 place-items-center text-sm text-muted-foreground">Loading…</div>;
  const p = data.profile;

  async function onSave() {
    setSaving(true);
    try {
      await save({ data: { name, telegram_id: telegram } });
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image");
    if (file.size > 3 * 1024 * 1024) return toast.error("Image must be under 3 MB");
    setUploading(true);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      await upload({ data: { image: b64 } });
      toast.success("Photo updated");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onPassword() {
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    if (pw !== pw2) return toast.error("Passwords do not match");
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwBusy(false);
    if (error) return toast.error(error.message);
    setPw("");
    setPw2("");
    toast.success("Password changed");
  }

  async function onLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initial = (p?.name || p?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      <section className="surface clay flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative size-24 shrink-0 overflow-hidden rounded-full bg-gradient-primary shadow-glow"
          aria-label="Change profile photo"
        >
          {p?.avatar_url ? (
            <img src={p.avatar_url} alt="Profile" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-3xl font-bold text-primary-foreground">{initial}</span>
          )}
          <span className="absolute inset-0 grid place-items-center bg-foreground/40 text-background opacity-0 transition group-hover:opacity-100">
            <Camera className="size-6" />
          </span>
          {uploading && <span className="absolute inset-0 grid place-items-center bg-foreground/50 text-xs text-background">Uploading…</span>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{p?.name || "No name yet"}</h2>
          <p className="truncate text-sm text-muted-foreground">{p?.email}</p>
          {p?.created_at && <p className="mt-1 text-xs text-muted-foreground">Member since {new Date(p.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/wallet" className="clay-inset rounded-2xl px-4 py-3 text-center">
            <Wallet className="mx-auto size-4 text-primary" />
            <div className="mt-1 font-bold">₹{wallet?.balance ?? data.balance}</div>
            <div className="text-xs text-muted-foreground">Balance</div>
          </Link>
          <Link to="/orders" className="clay-inset rounded-2xl px-4 py-3 text-center">
            <Package className="mx-auto size-4 text-primary" />
            <div className="mt-1 font-bold">{data.builds}</div>
            <div className="text-xs text-muted-foreground">Builds</div>
          </Link>
        </div>
      </section>

      <section className="surface clay space-y-4 p-5">
        <h3 className="font-semibold">Edit profile</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tg">Telegram username</Label>
            <Input id="tg" value={telegram} placeholder="@username" maxLength={64} onChange={(e) => setTelegram(e.target.value)} />
          </div>
        </div>
        <Button variant="hero" onClick={onSave} disabled={saving || !name.trim()}>
          <Save className="size-4" /> {saving ? "Saving…" : "Save changes"}
        </Button>
      </section>

      <section className="surface clay space-y-4 p-5">
        <h3 className="flex items-center gap-2 font-semibold"><KeyRound className="size-4" /> Change password</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <Input type="password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={onPassword} disabled={pwBusy || !pw}>
          {pwBusy ? "Updating…" : "Update password"}
        </Button>
      </section>

      <section className="surface clay space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recent builds</h3>
          <Link to="/orders" className="text-sm font-medium text-primary">View all</Link>
        </div>
        {!builds?.length && <p className="text-sm text-muted-foreground">No builds yet.</p>}
        {builds?.slice(0, 5).map((b) => (
          <div key={b.id} className="clay-inset flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{b.app_name}</div>
              <div className="truncate text-xs text-muted-foreground">{b.template_name} · {fmt(b.created_at)}</div>
            </div>
            <StatusBadge status={b.status} />
          </div>
        ))}
      </section>

      <section className="surface clay space-y-3 p-5">
        <h3 className="font-semibold">Login history</h3>
        {!data.logins.length && <p className="text-sm text-muted-foreground">No logins recorded yet.</p>}
        {data.logins.map((l) => (
          <div key={l.id} className="flex items-center gap-3 border-b border-border/50 pb-2 text-sm last:border-0">
            <Monitor className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{device(l.user_agent)}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{fmt(l.created_at)}</span>
          </div>
        ))}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {settings?.support_link && (
          <Button asChild variant="secondary" className="w-full">
            <a href={settings.support_link} target="_blank" rel="noreferrer"><LifeBuoy className="size-4" /> Help & Support</a>
          </Button>
        )}
        <Button variant="destructive" className="w-full" onClick={onLogout}>
          <LogOut className="size-4" /> Log out
        </Button>
      </div>
    </div>
  );
}
