import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // 1. Get all stored Facebook integrations
  const { data: integrations, error: intError } = await supabase
    .from("social_integrations")
    .select("page_id, access_token")
    .eq("platform", "facebook_direct");

  if (intError || !integrations || integrations.length === 0) {
    return new Response("No integrations found", { status: 404 });
  }

  // 2. Iterate through all integrations
  for (const integration of integrations) {
    const response = await fetch(`https://graph.facebook.com/v19.0/${integration.page_id}/conversations?fields=messages{message,from,created_time}&access_token=${integration.access_token}`);
    const data = await response.json();
    console.log(`FETCHED_HISTORY_FOR_${integration.page_id}:`, JSON.stringify(data));

    // Process and upsert messages to facebook_messages...
    if (data.data) {
      for (const conversation of data.data) {
        if (conversation.messages && conversation.messages.data) {
          for (const msg of conversation.messages.data) {
            await supabase
              .from("facebook_messages")
              .upsert({
                sender_id: msg.from.id,
                message_id: msg.id,
                text: msg.message,
                received_at: msg.created_time,
                status: 'replied'
              }, { onConflict: 'message_id' });
          }
        }
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
});
