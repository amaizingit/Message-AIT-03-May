import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { conversationId, pageId } = await req.json();
    if (!conversationId) throw new Error("conversationId is required");

    const { data: integrations } = await supabase
      .from("social_integrations")
      .select("access_token, page_id")
      .eq("platform", "facebook_direct");

    if (!integrations || integrations.length === 0) {
      throw new Error("No Facebook integrations found.");
    }

    // Find the token for the specific page, fallback to first if not specified (legacy support)
    const targetIntegration = pageId ? integrations.find(i => i.page_id === pageId) : integrations[0];
    
    if (!targetIntegration) {
      throw new Error(`No integration found for page_id: ${pageId}`);
    }

    const token = targetIntegration.access_token;
    
    const url = `https://graph.facebook.com/v21.0/${conversationId}?fields=messages{message,from,created_time,id}&access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const messages = data.messages?.data?.map((m: any) => {
      const isMe = integrations.some(i => i.page_id === m.from?.id);
      return {
        id: m.id,
        text: m.message,
        sender: isMe ? "me" : "them", // Critical for UI alignment
        sender_name: m.from?.name,
        time: m.created_time,
        timestamp: new Date(m.created_time).getTime() / 1000,
        platform: "messenger"
      };
    }) || [];

    return new Response(JSON.stringify({ messages: messages.reverse() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
