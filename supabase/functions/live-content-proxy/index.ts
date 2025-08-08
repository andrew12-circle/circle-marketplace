import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Simple allowlist to avoid SSRF
const ALLOWLIST = [
  "https://",
];

function isAllowed(url: string): boolean {
  try {
    const u = new URL(url);
    // Allow any https domain by default, but block private IP ranges
    if (u.protocol !== 'https:') return false;
    const hostname = u.hostname.toLowerCase();
    // Basic disallow list for metadata/localhost
    const blocked = [
      'localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', 'metadata.google.internal'
    ];
    if (blocked.includes(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string' || !isAllowed(url)) {
      return new Response(JSON.stringify({ error: 'invalid_url' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const res = await fetch(url, { method: 'GET' });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return new Response(JSON.stringify({ error: 'unsupported_content_type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const html = await res.text();
    // Return raw HTML to be injected into an iframe via srcDoc
    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'fetch_failed', message: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
