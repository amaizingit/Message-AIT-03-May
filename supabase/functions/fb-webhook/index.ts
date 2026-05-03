import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const { method } = req;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // 1. Handle Meta Verification (GET)
  if (method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("FB_VERIFY_TOKEN");

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        return new Response(challenge, { status: 200 });
      } else {
        return new Response("Forbidden", { status: 403 });
      }
    }
  }

  // 2. Handle Incoming Messages (POST)
  if (method === "POST") {
    try {
      const body = await req.json();
      console.log("RAW_WEBHOOK_BODY:", JSON.stringify(body));

      if (body.object === "page") {
        for (const entry of body.entry) {
          const webhook_event = entry.messaging[0];
          console.log("Webhook event:", webhook_event);

          const sender_psid = webhook_event.sender.id;
          const recipient_id = webhook_event.recipient.id; // Page ID
          const message = webhook_event.message;

          if (message && message.text) {
            // Log to facebook_messages table
            await supabase.from("facebook_messages").insert({
              sender_id: sender_psid,
              message_id: message.mid,
              text: message.text,
              status: 'unreplied'
            });

            // Existing logic for chats...
            let { data: chat, error: chatError } = await supabase
              .from("chats")
              .select("id")
              .eq("platform", "messenger")
              .eq("external_uid", sender_psid)
              .single();

            if (!chat) {
              // Get sender info from FB (optional, but good for name/avatar)
              // For now, create with placeholder
              const { data: newChat, error: createError } = await supabase
                .from("chats")
                .insert({
                  name: `FB User ${sender_psid.slice(-4)}`,
                  platform: "messenger",
                  external_uid: sender_psid,
                  avatar: `https://i.pravatar.cc/150?u=${sender_psid}`,
                  platform_color: "bg-blue-500",
                })
                .select()
                .single();
              
              chat = newChat;
            }

            if (chat) {
              // Insert message
              await supabase.from("messages").insert({
                chat_id: chat.id,
                text: message.text,
                sender: "them",
                external_id: message.mid,
              });

              // Update last message in chat
              await supabase.from("chats").update({
                last_msg: message.text,
                last_time: new Date().toISOString(),
                unread: 1, // Logic could be more complex
              }).eq("id", chat.id);
            }
          }
        }
        return new Response("EVENT_RECEIVED", { status: 200 });
      } else {
        return new Response("Not Found", { status: 404 });
      }
    } catch (err) {
      console.error("Error processing FB webhook:", err);
      return new Response("Error", { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});
