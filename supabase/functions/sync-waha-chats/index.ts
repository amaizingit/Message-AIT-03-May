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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json().catch(() => ({}));
    const { 
      waha_url, 
      session_name, 
      waha_api_key 
    } = body;

    if (!waha_url || !session_name) {
      throw new Error("Missing WAHA configuration");
    }

    const cleanUrl = waha_url.trim().replace(/\/$/, '');
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (waha_api_key) headers["X-Api-Key"] = waha_api_key;

    console.log(`[sync-waha-chats] Fetching chats from ${cleanUrl}/api/${session_name}/chats`);

    const response = await fetch(`${cleanUrl}/api/${session_name}/chats`, { headers });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`WAHA Error (${response.status}): ${err}`);
    }

    const wahaChats = await response.json();
    console.log(`[sync-waha-chats] Found ${wahaChats.length} chats`);

    const results = [];
    // Sync top 20 chats
    for (const wc of wahaChats.slice(0, 20)) {
      const external_uid = wc.id;
      const name = wc.name || wc.pushname || `User ${external_uid.split('@')[0]}`;

      // Upsert chat
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .upsert({
          external_uid,
          name,
          platform: "whatsapp",
          platform_color: "bg-emerald-500",
          last_msg: wc.lastMessage?.body || "",
          last_time: wc.lastMessage?.timestamp ? new Date(wc.lastMessage.timestamp * 1000).toISOString() : new Date().toISOString(),
          unread: wc.unreadCount || 0,
        }, { onConflict: 'platform,external_uid' })
        .select()
        .single();

      if (chatError) {
        console.error(`Error upserting chat ${external_uid}:`, chatError.message);
        continue;
      }

      // Fetch last 5 messages for this chat
      const msgRes = await fetch(`${cleanUrl}/api/${session_name}/chats/${encodeURIComponent(external_uid)}/messages?limit=5`, { headers });
      if (msgRes.ok) {
        const wahaMsgs = await msgRes.json();
        for (const wm of wahaMsgs) {
          await supabase.from("messages").upsert({
            chat_id: chat.id,
            external_id: wm.id,
            text: wm.body || "",
            sender: wm.fromMe ? "me" : "them",
            created_at: new Date(wm.timestamp * 1000).toISOString(),
          }, { onConflict: 'external_id' });
        }
      }
      results.push(chat);
    }

    return new Response(JSON.stringify({ success: true, synced: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("[sync-waha-chats] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
