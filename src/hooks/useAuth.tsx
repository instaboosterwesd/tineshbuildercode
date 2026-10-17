import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { recordLogin } from "@/lib/users.functions";

type AuthState = { user: User | null; session: Session | null; loading: boolean };
const Ctx = createContext<AuthState>({ user: null, session: null, loading: true });

function maybeRecordLogin(session: Session | null) {
  if (!session) return;
  const key = "builder-login-recorded";
  const stamp = `${session.user.id}:${session.user.last_sign_in_at ?? ""}`;
  if (localStorage.getItem(key) === stamp) return;
  localStorage.setItem(key, stamp);
  // Defer so the auth callback doesn't block.
  setTimeout(() => recordLogin({ data: { user_agent: navigator.userAgent.slice(0, 400) } }).catch(() => {}), 0);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true });
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
      maybeRecordLogin(session);
    });
    supabase.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, session: data.session, loading: false });
      maybeRecordLogin(data.session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
