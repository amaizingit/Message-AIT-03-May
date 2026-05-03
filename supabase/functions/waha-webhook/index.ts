import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    console.log("[waha-webhook] Received event:", body.event);

    const { event, payload } = body;

    // WAHA v2 uses "message", v1 might use "message.received"
    if (event === "message" || event === "message.received") {
      const fromMe = payload.fromMe || false;
      const remote_number = fromMe ? payload.to : payload.from;
      const message_text = payload.body || payload.content || "";
      const message_id = typeof payload.id === 'object' ? payload.id.id : payload.id;
      const pushname = payload.pushname || payload.verifiedName || `WA User ${remote_number.split('@')[0].slice(-4)}`;

      if (!remote_number) {
        console.warn("[waha-webhook] Missing remote number in payload");
        return new Response(JSON.stringify({ success: false, error: "Missing remote number" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // 1. Find or create chat
      let { data: chat, error: chatError } = await supabase
        .from("chats")
        .select("id, unread")
        .eq("platform", "whatsapp")
        .eq("external_uid", remote_number)
        .maybeSingle();

      if (!chat) {
        const { data: newChat, error: createError } = await supabase
          .from("chats")
          .insert({
            name: pushname,
            platform: "whatsapp",
            external_uid: remote_number,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${remote_number}`,
            platform_color: "bg-emerald-500",
          })
          .select()
          .single();
        if (createError) throw createError;
        chat = newChat;
      }

      if (chat) {
        // 2. Upsert message
        const { error: msgError } = await supabase.from("messages").upsert({
          chat_id: chat.id,
          text: message_text,
          sender: fromMe ? "me" : "them",
          external_id: message_id,
          time: payload.timestamp ? new Date(payload.timestamp * 1000).toISOString() : new Date().toISOString(),
        }, { onConflict: 'external_id' });

        if (msgError) console.error("[waha-webhook] Message upsert error:", msgError);

        // 3. Update last message in chat
        // Only increment unread if it's from "them"
        const updateData: any = {
          last_msg: message_text,
          last_time: new Date().toISOString(),
          is_done: false,
          is_bin: false,
        };
        
        if (!fromMe) {
          updateData.unread = (chat.unread || 0) + 1;
        }

        await supabase.from("chats").update(updateData).eq("id", chat.id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("[waha-webhook] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 to avoid webhook retries if we've already logged the error
    });
  }
});
