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

    const { data: integrations, error: intError } = await supabase
      .from("social_integrations")
      .select("page_id, page_name, access_token")
      .eq("platform", "facebook_direct");

    if (intError) throw intError;
    
    const allConversations = [];
    const metaErrors = [];
    let diagnostics: any = {};

    if (!integrations || integrations.length === 0) {
      return new Response(JSON.stringify({ conversations: [], integrationCount: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    for (const integration of integrations) {
      try {
        const cleanToken = integration.access_token.replace(/\s/g, '');
        const activePageId = integration.page_id;
        const activePageName = integration.page_name || "Facebook Page";
        
        diagnostics = {
          storedPageName: activePageName,
          storedPageId: activePageId,
          inputPageId: integration.page_id
        };

        const url = `https://graph.facebook.com/v21.0/${activePageId}/conversations?fields=id,participants,updated_time,unread_count,snippet&access_token=${cleanToken}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.data) {
          for (const conv of data.data) {
            const participant = conv.participants?.data?.find((p: any) => p.id !== activePageId) || conv.participants?.data?.[0];
            allConversations.push({
              id: conv.id,
              recipient_id: participant?.id, // PSID for sending
              name: participant?.name || "Facebook User",
              platform: "messenger",
              lastMsg: conv.snippet || "New Message",
              time: conv.updated_time,
              page_id: activePageId
            });
          }
        }
        
        if (data.error) {
          metaErrors.push({ error: data.error.message, page_id: activePageId });
          diagnostics.lastError = data.error.message;
        }
        
      } catch (e) {
        metaErrors.push({ error: e.message, page_id: integration.page_id });
      }
    }

    return new Response(JSON.stringify({ 
      conversations: allConversations,
      integrationCount: integrations.length,
      metaErrors: metaErrors,
      diagnostics: diagnostics
    }), {
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
