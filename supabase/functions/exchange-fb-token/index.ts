import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { userAccessToken } = await req.json();

    // 1. Check Identity
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${userAccessToken}`);
    const meData = await meRes.json();

    // 2. Check Permissions
    const permRes = await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${userAccessToken}`);
    const permData = await permRes.json();
    const granted = permData.data?.filter((p: any) => p.status === 'granted').map((p: any) => p.permission) || [];

    // 3. Fetch Pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=name,access_token,tasks&access_token=${userAccessToken}`);
    const pagesData = await pagesResponse.json();
    
    const savedChannels = [];
    if (pagesData.data) {
      for (const page of pagesData.data) {
        await supabase.from("social_integrations").upsert({
          platform: "facebook_direct",
          page_id: page.id,
          page_name: page.name,
          access_token: page.access_token
        }, { onConflict: "page_id" });
        savedChannels.push({ id: page.id, name: page.name });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      count: savedChannels.length,
      identity: meData,
      grantedPermissions: granted,
      rawPagesData: pagesData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
