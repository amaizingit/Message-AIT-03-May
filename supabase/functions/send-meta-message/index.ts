import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const { recipientId, message, pageId } = await req.json();
    if (!recipientId || !message) {
      return new Response(JSON.stringify({ error: `Missing params: recipientId=${recipientId}, msg=${message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 1. Get the token for this specific page
    const { data: integration } = await supabase
      .from("social_integrations")
      .select("access_token")
      .eq("page_id", pageId)
      .single();

    if (!integration) {
      return new Response(JSON.stringify({ error: `No token found for page_id: ${pageId}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Send the message via Meta Send API
    // Standard endpoint: /me/messages
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${integration.access_token}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        recipient: { id: recipientId },
        message: { text: message } 
      })
    });
    
    const result = await response.json();

    if (result.error) {
      return new Response(JSON.stringify({ 
        error: result.error.message, 
        raw: result 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, message_id: result.message_id || result.id }), {
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
