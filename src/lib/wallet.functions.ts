import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminDb, checkPassword, int, str, uuid, walletChange, type Db } from "@/lib/server-helpers";

async function readSettings(db: Db) {
  const { data } = await db.from("settings").select("*").eq("id", 1).maybeSingle();
  return {
    upi_id: data?.upi_id ?? "",
    min_deposit: data?.min_deposit ?? 100,
    maintenance_mode: data?.maintenance_mode ?? false,
    maintenance_message: data?.maintenance_message ?? "",
    support_link: data?.support_link ?? "",
  };
}

/* ---------- Public ---------- */

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const db = await adminDb();
  const s = await readSettings(db);
  return { maintenance_mode: s.maintenance_mode, maintenance_message: s.maintenance_message, support_link: s.support_link };
});

/* ---------- Signed-in user ---------- */

export const getWalletInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminDb();
    const settings = await readSettings(db);
    const [{ data: w }, { data: deps }, { data: tx }] = await Promise.all([
      db.from("wallets").select("balance").eq("user_id", context.userId).maybeSingle(),
      db.from("deposit_requests").select("id, amount, utr, status, created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(30),
      db.from("wallet_transactions").select("id, amount, kind, note, created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(30),
    ]);
    return {
      balance: w?.balance ?? 0,
      upi_id: settings.upi_id,
      min_deposit: settings.min_deposit,
      support_link: settings.support_link,
      deposits: deps ?? [],
      transactions: tx ?? [],
    };
  });

export const requestDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, unknown>) => {
    const utr = str(d?.["utr"], "UTR", 64);
    if (!/^[A-Za-z0-9]{6,64}$/.test(utr)) throw new Error("Enter a valid UTR / transaction ID");
    return { amount: int(d?.["amount"], "amount", 1, 1_000_000), utr };
  })
  .handler(async ({ data, context }) => {
    const db = await adminDb();
    const settings = await readSettings(db);
    if (data.amount < settings.min_deposit) throw new Error(`Minimum deposit is ₹${settings.min_deposit}`);
    const { data: dup } = await db.from("deposit_requests").select("id").eq("utr", data.utr).maybeSingle();
    if (dup) throw new Error("This UTR was already submitted");
    const email = (context.claims as { email?: string })?.email ?? "";
    const { error } = await db.from("deposit_requests").insert({ user_id: context.userId, user_email: email, amount: data.amount, utr: data.utr });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Admin ---------- */

export const adminGetSettings = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data?.password);
    return readSettings(await adminDb());
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => {
    const link = str(d?.["support_link"], "Support link", 500, false);
    if (link && !/^(https?:\/\/|mailto:|tel:)\S+$/i.test(link)) throw new Error("Support link must start with https://, mailto: or tel:");
    return {
      password: d?.["password"] as string,
      upi_id: str(d?.["upi_id"], "UPI ID", 100, false),
      min_deposit: int(d?.["min_deposit"], "min deposit", 1, 1_000_000),
      maintenance_mode: d?.["maintenance_mode"] === true,
      maintenance_message: str(d?.["maintenance_message"], "Maintenance message", 500, false),
      support_link: link,
    };
  })
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { password: _p, ...fields } = data;
    const db = await adminDb();
    const { error } = await db.from("settings").upsert({ id: 1, ...fields, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListDeposits = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data?.password);
    const db = await adminDb();
    const { data: rows } = await db.from("deposit_requests").select("*").order("created_at", { ascending: false }).limit(200);
    return rows ?? [];
  });

export const adminDecideDeposit = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; decision: "approve" | "reject" }) => ({ ...d, id: uuid(d?.id) }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await adminDb();
    // Claim the pending row first so a double click can't credit twice.
    const { data: dep } = await db
      .from("deposit_requests")
      .update({ status: data.decision === "approve" ? "approved" : "rejected", updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();
    if (!dep) throw new Error("Deposit not found or already handled");
    if (data.decision === "reject") return { status: "rejected" };
    const balance = await walletChange(db, dep.user_id, dep.amount, "deposit", `Deposit (UTR ${dep.utr})`);
    return { status: "approved", balance };
  });
