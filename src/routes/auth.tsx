import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Login — Builder" }, { name: "description", content: "Sign in or create your account." }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    setLoading(true);
    const { error } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { name: String(f.get("name") ?? "") } } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "signup") toast.success("Check your email to confirm your account");
    else navigate({ to: "/" });
  }
  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
  }
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
        <form onSubmit={submit} className="surface w-full max-w-sm space-y-3 p-6">
          <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
          {mode === "signup" && <Input name="name" placeholder="Your name" required />}
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Password" required minLength={6} />
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>{mode === "login" ? "Login" : "Sign up"}</Button>
          <Button type="button" variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
          <button type="button" className="w-full text-sm text-muted-foreground" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "New here? Create an account" : "Already have an account? Login"}
          </button>
        </form>
    </main>
  );
}
