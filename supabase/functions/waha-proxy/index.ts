import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { 
      waha_url, 
      session_name, 
      waha_api_key,
      endpoint, // e.g. "chats" or "chats/123@c.us/messages"
      method = "GET",
      params = {}
    } = body;

    if (!waha_url || !session_name || !endpoint) {
      throw new Error("Missing required proxy parameters (url, session, endpoint)");
    }

    const cleanUrl = waha_url.trim().replace(/\/$/, '');
    
    // Some endpoints are global (e.g. sessions/start), others are session-specific (e.g. chats)
    const isGlobal = endpoint.startsWith('sessions') || 
                     ['sendText', 'sendImage', 'sendFile', 'sendVideo', 'sendVoice', 'sendSeen', 'sendPresence', 'messages'].includes(endpoint.split('?')[0]) || 
                     endpoint.startsWith('contacts');
    
    const urlPath = isGlobal ? `api/${endpoint}` : `api/${session_name}/${endpoint}`;
    const fullUrl = new URL(`${cleanUrl}/${urlPath}`);
    
    // Add query params for GET requests
    if (method === "GET") {
      Object.keys(params).forEach(key => fullUrl.searchParams.append(key, params[key]));
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (waha_api_key) {
      headers["X-Api-Key"] = waha_api_key;
      headers["Authorization"] = `Bearer ${waha_api_key}`;
    }

    console.log(`[waha-proxy] ${method} ${fullUrl.toString()} (Global: ${isGlobal})`);

    const response = await fetch(fullUrl.toString(), {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(params) : undefined
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`WAHA Proxy Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("[waha-proxy] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
