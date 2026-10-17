import { createFileRoute } from "@tanstack/react-router";

// Temporary diagnostics: shows which backend host the server talks to (no secrets).
export const Route = createFileRoute("/api/public/diag")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env["SUPABASE_URL"] ?? "";
        const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
        let status = 0;
        let body = "";
        try {
          const r = await fetch(`${url}/rest/v1/templates?select=id&limit=1`, { headers: { apikey: key } });
          status = r.status;
          body = (await r.text()).slice(0, 300);
        } catch (e) {
          body = String(e);
        }
        return Response.json({ host: url.replace(/^https?:\/\//, "").slice(0, 40), urlLen: url.length, keyPrefix: key.slice(0, 10), keyLen: key.length, status, body });
      },
    },
  },
});
