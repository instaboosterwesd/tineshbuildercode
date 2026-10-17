import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  adminDb, apkName, APP_ID_RE, BUCKET, checkPassword, int, LOGO_RE, PACKAGE_RE, signPath, str, uuid, walletChange, type Db,
} from "@/lib/server-helpers";
import { BASE_APKS } from "@/lib/base-apks";

type TemplateRow = {
  id: string; name: string; description: string; category: string; base_apk: string; html: string;
  image_url: string | null; video_url: string | null; price: number; show_preview: boolean; created_at: string;
};

async function signTemplates(db: Db, rows: TemplateRow[], includeHtml: boolean) {
  const paths = rows.flatMap((r) => [r.image_url, r.video_url]).filter((p): p is string => !!p);
  const map = new Map<string, string>();
  if (paths.length) {
    const { data } = await db.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 24 * 7);
    data?.forEach((d) => d.path && d.signedUrl && map.set(d.path, d.signedUrl));
  }
  return rows.map((r) => ({
    ...r,
    // Hide HTML from visitors when the admin switched the live preview off.
    html: includeHtml || r.show_preview ? r.html : "",
    image: r.image_url ? map.get(r.image_url) ?? null : null,
    video: r.video_url ? map.get(r.video_url) ?? null : null,
  }));
}

export type Template = Awaited<ReturnType<typeof signTemplates>>[number];

/* ---------- Public ---------- */

export const listTemplates = createServerFn({ method: "GET" }).handler(async () => {
  const db = await adminDb();
  const { data, error } = await db
    .from("templates")
    .select("id, name, description, category, base_apk, image_url, video_url, price, show_preview, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return signTemplates(db, (data ?? []).map((r) => ({ ...r, html: "" })), false);
});

export const getTemplate = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => ({ id: str(d?.id, "id", 64) }))
  .handler(async ({ data }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) return null;
    const db = await adminDb();
    const { data: row, error } = await db.from("templates").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return (await signTemplates(db, [row], false))[0];
  });

/* ---------- Signed-in user ---------- */

export const createLogoUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { filename: string }) => ({ filename: str(d?.filename, "File", 200) }))
  .handler(async ({ data }) => {
    const ext = (data.filename.split(".").pop() || "png").replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
    if (!["png", "jpg", "jpeg", "webp"].includes(ext)) throw new Error("Logo must be PNG, JPG or WEBP");
    const path = `logos/${crypto.randomUUID()}.${ext}`;
    const db = await adminDb();
    const { data: signed, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token };
  });

export const userBuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, unknown>) => {
    const pkg = str(d?.["package_name"], "Package name", 120);
    if (!PACKAGE_RE.test(pkg)) throw new Error("Package name must look like com.company.app");
    const appId = str(d?.["app_id"], "App ID", 64, false);
    if (appId && !APP_ID_RE.test(appId)) throw new Error("App ID: letters, digits, _ or - only");
    const reg = str(d?.["register_link"], "Register link", 1000, false);
    if (reg && !/^https?:\/\/\S+$/i.test(reg)) throw new Error("Link must start with http(s)://");
    const logo = str(d?.["logo_path"], "Logo", 200);
    if (!LOGO_RE.test(logo)) throw new Error("Invalid logo");
    return { template_id: uuid(d?.["template_id"], "template"), app_name: str(d?.["app_name"], "App name", 60), package_name: pkg, app_id: appId || null, register_link: reg, logo_path: logo };
  })
  .handler(async ({ data, context }) => {
    const db = await adminDb();
    const userId = context.userId;
    const { data: t } = await db.from("templates").select("name, base_apk, price").eq("id", data.template_id).maybeSingle();
    if (!t) throw new Error("Template not found");
    if (t.base_apk === "teacher" && !data.app_id) throw new Error("App ID is required for this template");
    if (t.base_apk !== "teacher" && !data.register_link) throw new Error("Register link is required");
    const { data: profile } = await db.from("profiles").select("name, email").eq("id", userId).maybeSingle();

    if (t.price > 0) await walletChange(db, userId, -t.price, "build", `Build: ${data.app_name} (${t.name})`);

    const { data: row, error } = await db
      .from("build_requests")
      .insert({
        ...data, user_id: userId, template_name: t.name, charged: t.price,
        requester_name: profile?.name || "User", requester_email: profile?.email || "",
      })
      .select("id, app_name, package_name, app_id")
      .single();
    if (error) {
      if (t.price > 0) await walletChange(db, userId, t.price, "refund", `Refund: ${data.app_name}`);
      throw new Error(error.message);
    }
    const { dispatchBuild } = await import("@/lib/dispatch.server");
    const res = await dispatchBuild(db, row);
    return { id: row.id, charged: t.price, ...res };
  });

export const myBuilds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminDb();
    const { data } = await db
      .from("build_requests")
      .select("id, app_name, package_name, template_name, status, charged, apk_path, logo_path, created_at, updated_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return Promise.all(
      (data ?? []).map(async ({ apk_path, logo_path, ...r }) => ({
        ...r,
        download: r.status === "success" ? await signPath(db, apk_path, apkName(r.app_name)) : null,
        logo: await signPath(db, logo_path),
      })),
    );
  });

export const leaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const db = await adminDb();
  const { data } = await db.from("build_requests").select("user_id").not("user_id", "is", null).neq("status", "rejected").limit(10000);
  const counts = new Map<string, number>();
  (data ?? []).forEach((r) => r.user_id && counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
  if (!top.length) return [];
  const { data: profiles } = await db.from("profiles").select("id, name").in("id", top.map(([id]) => id));
  const names = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  // Only the display name is returned — never email, username or IDs.
  return top.map(([id, builds], i) => ({ rank: i + 1, name: names.get(id) || "Anonymous", builds }));
});

/* ---------- Admin ---------- */

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data?.password);
    return { ok: true };
  });

export const adminOverview = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data?.password);
    const db = await adminDb();
    const [{ data: reqs }, { count: templateCount }, { count: userCount }, { count: pendingDeposits }] = await Promise.all([
      db.from("build_requests").select("*").order("created_at", { ascending: false }).limit(300),
      db.from("templates").select("id", { count: "exact", head: true }),
      db.from("profiles").select("id", { count: "exact", head: true }),
      db.from("deposit_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    const requests = await Promise.all(
      (reqs ?? []).map(async (r) => ({
        ...r,
        download: r.apk_path ? await signPath(db, r.apk_path, apkName(r.app_name)) : null,
        encrypted_download: r.encrypted_apk_path ? await signPath(db, r.encrypted_apk_path, "encrypted_" + apkName(r.app_name)) : null,
        logo: await signPath(db, r.logo_path),
      })),
    );
    const revenue = requests.reduce((s, r) => s + (r.charged ?? 0), 0);
    return { requests, templateCount: templateCount ?? 0, userCount: userCount ?? 0, pendingDeposits: pendingDeposits ?? 0, revenue };
  });

export const adminListTemplates = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    checkPassword(data?.password);
    const db = await adminDb();
    const { data: rows } = await db.from("templates").select("*").order("created_at", { ascending: false });
    return signTemplates(db, rows ?? [], true);
  });

export const adminUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; filename: string; kind: "image" | "video" }) => d)
  .handler(async ({ data }) => {
    checkPassword(data?.password);
    const ext = (data.filename.split(".").pop() || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 8);
    const path = `${data.kind === "video" ? "videos" : "images"}/${crypto.randomUUID()}.${ext}`;
    const db = await adminDb();
    const { data: signed, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token };
  });

function templateFields(d: Record<string, unknown>) {
  const b = str(d?.["base_apk"], "APK", 20);
  if (!BASE_APKS.some((x) => x.id === b)) throw new Error("Pick an APK");
  return {
    name: str(d?.["name"], "Name", 100),
    description: str(d?.["description"], "Description", 1000, false),
    base_apk: b,
    html: str(d?.["html"], "HTML", 500_000),
    price: int(d?.["price"], "price", 0, 1_000_000),
    show_preview: d?.["show_preview"] !== false,
  };
}

export const adminSaveTemplate = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => ({
    password: d?.["password"] as string,
    id: d?.["id"] ? uuid(d["id"]) : null,
    fields: templateFields(d),
    image_url: str(d?.["image_url"], "Image", 300, false) || null,
    video_url: str(d?.["video_url"], "Video", 300, false) || null,
  }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await adminDb();
    const media = {
      ...(data.image_url ? { image_url: data.image_url } : {}),
      ...(data.video_url ? { video_url: data.video_url } : {}),
    };
    if (data.id) {
      const { error } = await db.from("templates").update({ ...data.fields, ...media }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: t, error } = await db.from("templates").insert({ ...data.fields, ...media }).select("id").single();
    if (error) throw new Error(error.message);
    return t;
  });

export const adminDeleteTemplate = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) => ({ password: d?.password, id: uuid(d?.id) }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await adminDb();
    const { data: t } = await db.from("templates").select("image_url, video_url").eq("id", data.id).maybeSingle();
    const files = [t?.image_url, t?.video_url].filter((x): x is string => !!x);
    if (files.length) await db.storage.from(BUCKET).remove(files);
    const { error } = await db.from("templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDecide = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string; decision: "approve" | "reject" }) => ({ ...d, id: uuid(d?.id) }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await adminDb();
    const { data: req } = await db.from("build_requests").select("*").eq("id", data.id).maybeSingle();
    if (!req) throw new Error("Request not found");
    if (!["pending", "approved", "failed"].includes(req.status)) throw new Error(`Request is already ${req.status}`);
    if (data.decision === "reject") {
      await db.from("build_requests").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", data.id);
      if (req.user_id && req.charged > 0) await walletChange(db, req.user_id, req.charged, "refund", `Refund: ${req.app_name}`);
      return { status: "rejected", github: false, log: "" };
    }
    const { dispatchBuild } = await import("@/lib/dispatch.server");
    return dispatchBuild(db, req);
  });

export const adminBuild = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => {
    const pkg = str(d?.["package_name"], "Package name", 120);
    if (!PACKAGE_RE.test(pkg)) throw new Error("Package name like com.company.app");
    const reg = str(d?.["register_link"], "Register link", 1000, false);
    if (reg && !/^https?:\/\/\S+$/i.test(reg)) throw new Error("Register link must start with http(s)://");
    const logo = str(d?.["logo_path"], "Logo", 200, false);
    if (logo && !LOGO_RE.test(logo)) throw new Error("Invalid logo");
    const appId = str(d?.["app_id"], "App ID", 64, false);
    if (appId && !APP_ID_RE.test(appId)) throw new Error("App ID: letters, digits, _ or - only");
    return {
      password: d?.["password"] as string,
      template_id: uuid(d?.["template_id"], "template"),
      app_name: str(d?.["app_name"], "App name", 60),
      package_name: pkg, register_link: reg, logo_path: logo || null, app_id: appId || null,
    };
  })
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { password: _p, ...fields } = data;
    const db = await adminDb();
    const { data: t } = await db.from("templates").select("name, base_apk").eq("id", fields.template_id).maybeSingle();
    if (!t) throw new Error("Template not found");
    if (t.base_apk === "teacher" && !fields.app_id) throw new Error("App ID is required for Teacher");
    const { data: row, error } = await db
      .from("build_requests")
      .insert({ ...fields, template_name: t.name, requester_name: "Admin", requester_email: "admin@builder.local" })
      .select("id, app_name, package_name, app_id")
      .single();
    if (error) throw new Error(error.message);
    const { dispatchBuild } = await import("@/lib/dispatch.server");
    return { id: row.id, ...(await dispatchBuild(db, row)) };
  });

export const adminBuildStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) => ({ password: d?.password, id: uuid(d?.id) }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await adminDb();
    const { data: row } = await db
      .from("build_requests")
      .select("id, app_name, status, build_log, apk_path, encrypted_apk_path, encrypt_status, encrypt_log, created_at, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Build not found");
    const { apk_path, encrypted_apk_path, ...rest } = row;
    return {
      ...rest,
      download: row.status === "success" ? await signPath(db, apk_path, apkName(row.app_name)) : null,
      encrypted_download: encrypted_apk_path ? await signPath(db, encrypted_apk_path, "encrypted_" + apkName(row.app_name)) : null,
    };
  });

export const adminDeleteRequest = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) => ({ password: d?.password, id: uuid(d?.id) }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await adminDb();
    const { data: r } = await db.from("build_requests").select("apk_path, logo_path, encrypted_apk_path").eq("id", data.id).maybeSingle();
    const files = [r?.apk_path, r?.logo_path, r?.encrypted_apk_path].filter((x): x is string => !!x);
    if (files.length) await db.storage.from(BUCKET).remove(files);
    const { error } = await db.from("build_requests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminEncrypt = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) => ({ password: d?.password, id: uuid(d?.id) }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await adminDb();
    const { data: row } = await db.from("build_requests").select("id, app_name, status, apk_path, encrypt_status").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("Build not found");
    if (row.status !== "success" || !row.apk_path) throw new Error("APK not ready");
    if (row.encrypt_status === "encrypting") throw new Error("Already encrypting");
    const { dispatchEncrypt } = await import("@/lib/dispatch.server");
    return dispatchEncrypt(db, { id: row.id, app_name: row.app_name, apk_path: row.apk_path });
  });
