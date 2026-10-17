import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminDb, checkPassword, int, str, uuid, walletChange } from "@/lib/server-helpers";

/* ---------- Signed-in user ---------- */

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminDb();
    const [{ data: p }, { data: logins }, { data: w }, { count: builds }] = await Promise.all([
      db.from("profiles").select("name, email, telegram_id, created_at").eq("id", context.userId).maybeSingle(),
      db.from("login_history").select("id, user_agent, created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20),
      db.from("wallets").select("balance").eq("user_id", context.userId).maybeSingle(),
      db.from("build_requests").select("id", { count: "exact", head: true }).eq("user_id", context.userId),
    ]);
    return { profile: p, logins: logins ?? [], balance: w?.balance ?? 0, builds: builds ?? 0 };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, unknown>) => ({
    name: str(d?.["name"], "Name", 80),
    telegram_id: str(d?.["telegram_id"], "Telegram", 64, false).replace(/^@/, ""),
  }))
  .handler(async ({ data, context }) => {
    const db = await adminDb();
    const { error } = await db.from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recordLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_agent?: string }) => ({ user_agent: str(d?.user_agent, "UA", 400, false) }))
  .handler(async ({ data, context }) => {
    const db = await adminDb();
    await db.from("login_history").insert({ user_id: context.userId, user_agent: data.user_agent });
    return { ok: true };
  });

/* ---------- Admin ---------- */

export const adminListUsers = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data?.password);
    const db = await adminDb();
    const [{ data: users, error }, { data: wallets }, { data: builds }] = await Promise.all([
      db.from("profiles").select("id, email, name, telegram_id, created_at").order("created_at", { ascending: false }).limit(1000),
      db.from("wallets").select("user_id, balance"),
      db.from("build_requests").select("user_id").not("user_id", "is", null).limit(10000),
    ]);
    if (error) throw new Error(error.message);
    const bal = new Map((wallets ?? []).map((w) => [w.user_id, w.balance]));
    const cnt = new Map<string, number>();
    (builds ?? []).forEach((b) => b.user_id && cnt.set(b.user_id, (cnt.get(b.user_id) ?? 0) + 1));
    return (users ?? []).map((u) => ({ ...u, balance: bal.get(u.id) ?? 0, builds: cnt.get(u.id) ?? 0 }));
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => ({
    password: d?.["password"] as string,
    id: uuid(d?.["id"], "user"),
    name: str(d?.["name"], "Name", 80),
    telegram_id: str(d?.["telegram_id"], "Telegram", 64, false).replace(/^@/, ""),
  }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await adminDb();
    const { error } = await db.from("profiles").update({ name: data.name, telegram_id: data.telegram_id }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAdjustBalance = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => ({
    password: d?.["password"] as string,
    id: uuid(d?.["id"], "user"),
    amount: int(d?.["amount"], "amount", -1_000_000, 1_000_000),
    note: str(d?.["note"], "Note", 200, false),
  }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    if (data.amount === 0) throw new Error("Amount can't be 0");
    const db = await adminDb();
    try {
      const balance = await walletChange(db, data.id, data.amount, "admin", data.note || (data.amount > 0 ? "Added by admin" : "Deducted by admin"));
      return { balance };
    } catch (e) {
      if ((e as Error).message === "INSUFFICIENT_BALANCE") throw new Error("User doesn't have that much balance");
      throw e;
    }
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) => ({ password: d?.password, id: uuid(d?.id, "user") }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await adminDb();
    await Promise.all([
      db.from("wallets").delete().eq("user_id", data.id),
      db.from("wallet_transactions").delete().eq("user_id", data.id),
      db.from("login_history").delete().eq("user_id", data.id),
      db.from("deposit_requests").delete().eq("user_id", data.id),
    ]);
    const { error } = await db.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUserDetail = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) => ({ password: d?.password, id: uuid(d?.id, "user") }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await adminDb();
    const [{ data: tx }, { data: logins }, { data: builds }] = await Promise.all([
      db.from("wallet_transactions").select("id, amount, kind, note, created_at").eq("user_id", data.id).order("created_at", { ascending: false }).limit(50),
      db.from("login_history").select("id, user_agent, created_at").eq("user_id", data.id).order("created_at", { ascending: false }).limit(20),
      db.from("build_requests").select("id, app_name, template_name, status, charged, created_at").eq("user_id", data.id).order("created_at", { ascending: false }).limit(50),
    ]);
    return { transactions: tx ?? [], logins: logins ?? [], builds: builds ?? [] };
  });
