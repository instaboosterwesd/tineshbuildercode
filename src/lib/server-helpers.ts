// Shared validation helpers for server functions. No server-only imports at
// module top level: this file is pulled into the client graph by *.functions.ts.

export async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type Db = Awaited<ReturnType<typeof adminDb>>;

export function checkPassword(password: unknown) {
  const expected = process.env["ADMIN_PASSWORD"] || "devdev";
  if (typeof password !== "string" || password !== expected) {
    throw new Error("Unauthorized: wrong admin password");
  }
}

export function str(v: unknown, field: string, max = 500, required = true): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (required && !s) throw new Error(`${field} is required`);
  if (s.length > max) throw new Error(`${field} is too long`);
  return s;
}

export function int(v: unknown, field: string, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Invalid ${field}`);
  return n;
}

export function uuid(v: unknown, field = "id"): string {
  const s = typeof v === "string" ? v : "";
  if (!/^[0-9a-f-]{36}$/i.test(s)) throw new Error(`Invalid ${field}`);
  return s;
}

export const PACKAGE_RE = /^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/;
export const APP_ID_RE = /^[A-Za-z0-9_-]+$/;
export const LOGO_RE = /^logos\/[0-9a-f-]{36}\.[a-z0-9]{1,8}$/i;
export const BUCKET = "media";

export async function signPath(db: Db, path: string | null | undefined, download?: string) {
  if (!path) return null;
  const { data } = await db.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24, download ? { download } : undefined);
  return data?.signedUrl ?? null;
}

export function apkName(app: string) {
  return (app.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_") || "app") + ".apk";
}

/** Atomically add (positive) or remove (negative) wallet balance. Throws INSUFFICIENT_BALANCE. */
export async function walletChange(db: Db, userId: string, amount: number, kind: string, note: string) {
  const { data, error } = await db.rpc("wallet_change", { _user: userId, _amount: amount, _kind: kind, _note: note });
  if (error) {
    if (error.message.includes("INSUFFICIENT_BALANCE")) throw new Error("INSUFFICIENT_BALANCE");
    throw new Error(error.message);
  }
  return data as number;
}
