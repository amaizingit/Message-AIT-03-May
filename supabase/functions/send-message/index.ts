import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json().catch(() => ({}));
    const { 
      chat_id, // Primary (snake_case from frontend)
      chatId,  // Fallback (camelCase)
      text, 
      waha_url, 
      session_name, 
      waha_api_key, 
      waha_username, 
      waha_password 
    } = body;

    const finalChatId = chat_id || chatId;
    if (!finalChatId) throw new Error("Missing chat_id");

    // 1. Get Chat and Channel Info
    // If it's a numeric ID, it's a database ID. If it's a string like '@c.us', we need to find it.
    let chat;
    if (!isNaN(Number(finalChatId))) {
      const { data, error } = await supabase
        .from("chats")
        .select("*, channel:channels(*)")
        .eq("id", Number(finalChatId))
        .maybeSingle();
      chat = data;
    } else {
      const { data, error } = await supabase
        .from("chats")
        .select("*, channel:channels(*)")
        .eq("external_uid", finalChatId)
        .maybeSingle();
      chat = data;
    }

    // If chat is not found, we might still be able to send if we have enough info in the body
    const platform = chat?.platform || "whatsapp";
    const external_uid = chat?.external_uid || finalChatId;
    const channel = chat?.channel;

    if (platform === "messenger" || platform === "facebook_direct") {
      const accessToken = Deno.env.get("FB_PAGE_ACCESS_TOKEN") || channel?.access_token;
      if (!accessToken) throw new Error("No access token for FB");

      const fbResponse = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: external_uid },
          message: { text: text },
        }),
      });

      const fbResult = await fbResponse.json();
      if (fbResult.error) throw new Error(`FB API Error: ${fbResult.error.message}`);

    } else if (platform === "whatsapp") {
      // Prioritize body params (serverless mode), fallback to DB channel, fallback to ENV
      let finalWahaUrl = waha_url || channel?.metadata?.waha_url || Deno.env.get("WAHA_URL");
      if (!finalWahaUrl) throw new Error("WAHA URL not configured");
      
      finalWahaUrl = finalWahaUrl.trim().replace(/\/$/, '');
      
      // Check for localhost
      if (finalWahaUrl.includes('localhost') || finalWahaUrl.includes('127.0.0.1')) {
         throw new Error("WAHA URL cannot be localhost for Cloud Edge Functions.");
      }

      const wahaHeaders: Record<string, string> = { "Content-Type": "application/json" };
      const finalApiKey = waha_api_key || channel?.metadata?.waha_api_key || Deno.env.get("WAHA_API_KEY");
      const finalUser = waha_username || channel?.metadata?.waha_username || Deno.env.get("WAHA_USERNAME");
      const finalPass = waha_password || channel?.metadata?.waha_password || Deno.env.get("WAHA_PASSWORD");

      if (finalApiKey) {
        wahaHeaders['X-Api-Key'] = finalApiKey;
      } else if (finalUser && finalPass) {
        wahaHeaders['Authorization'] = `Basic ${btoa(`${finalUser}:${finalPass}`)}`;
      }

      const wahaResponse = await fetch(`${finalWahaUrl}/api/sendText`, {
        method: "POST",
        headers: wahaHeaders,
        body: JSON.stringify({
          chatId: external_uid,
          text: text,
          session: session_name || channel?.external_id || "default",
        }),
      });

      if (!wahaResponse.ok) {
        const errText = await wahaResponse.text().catch(() => "Unknown");
        throw new Error(`WAHA API Error (${wahaResponse.status}): ${errText}`);
      }
    }

    // 3. Log outgoing message (if chat exists)
    let newMessage = { chat_id: chat?.id, text, sender: "me", time: new Date().toISOString() };
    if (chat?.id) {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chat.id,
          text: text,
          sender: "me",
        })
        .select()
        .single();
      if (data) newMessage = data;

      // 4. Update Chat last message
      await supabase.from("chats").update({
        last_msg: text,
        last_time: new Date().toISOString(),
      }).eq("id", chat.id);
    }

    return new Response(JSON.stringify(newMessage), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error in send-message:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
