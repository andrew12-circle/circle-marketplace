import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isAllowed(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:") return false;
    const hostname = u.hostname.toLowerCase();
    const blocked = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "169.254.169.254",
      "metadata.google.internal",
    ];
    if (blocked.includes(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

function appendParams(dest: URL, params: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(params)) {
    if (!v) continue;
    if (!dest.searchParams.has(k)) dest.searchParams.set(k, v);
  }
}

function parseCookie(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(";").forEach((pair) => {
    const [k, ...rest] = pair.trim().split("=");
    const v = rest.join("=");
    if (k) out[k] = v;
  });
  return out;
}

function randomToken(bytes = 8): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const s = url.searchParams.get("s"); // service_id (optional)
    const v = url.searchParams.get("v"); // vendor_id (optional)
    const d = url.searchParams.get("d"); // destination (required)
    const rt = url.searchParams.get("rt"); // referral token (optional)

    if (!d || !isAllowed(d)) {
      return new Response(JSON.stringify({ error: "invalid_destination" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const destUrl = new URL(d);

    // Build final URL with attribution params
    appendParams(destUrl, {
      utm_source: "circle-marketplace",
      utm_medium: "referral",
      utm_campaign: s || undefined,
      utm_content: v || undefined,
      utm_term: rt || undefined,
    });

    // Prepare cookie
    const cookies = parseCookie(req.headers.get("cookie"));
    let agentCookie = cookies["circle_ref"];
    if (!agentCookie) agentCookie = randomToken(12);
    const setCookie = `circle_ref=${agentCookie}; Path=/; Max-Age=${60 * 60 * 24 * 90}; SameSite=None; Secure`;

    // Init Supabase client (anon is enough due to permissive RLS for inserts)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon);

    // Capture request context
    const referer = req.headers.get("referer");
    const userAgent = req.headers.get("user-agent");
    const xff = req.headers.get("x-forwarded-for");
    const ip = xff ? xff.split(",")[0].trim() : null;

    // Log click (best effort)
    await supabase.from("outbound_clicks").insert({
      service_id: s || null,
      vendor_id: v || null,
      user_id: null,
      referral_token: rt || null,
      agent_cookie: agentCookie,
      destination_url: d,
      final_url: destUrl.toString(),
      referrer: referer,
      user_agent: userAgent,
      ip_address: ip,
      metadata: {},
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: destUrl.toString(),
        "Set-Cookie": setCookie,
        ...corsHeaders,
      },
    });
  } catch (e) {
    console.error("click-tracker error:", e);
    return new Response(JSON.stringify({ error: "server_error", message: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
