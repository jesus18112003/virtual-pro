import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DISCORD_API = "https://discord.com/api/v10";
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!DISCORD_BOT_TOKEN) {
      throw new Error("DISCORD_BOT_TOKEN is not configured");
    }

    const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID");
    if (!DISCORD_CHANNEL_ID) {
      throw new Error("DISCORD_CHANNEL_ID is not configured");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get last processed message ID
    const { data: syncState } = await supabase
      .from("discord_sync_state")
      .select("last_message_id")
      .eq("channel_id", DISCORD_CHANNEL_ID)
      .single();

    // Fetch messages from Discord
    let url = `${DISCORD_API}/channels/${DISCORD_CHANNEL_ID}/messages?limit=50`;
    if (syncState?.last_message_id) {
      url += `&after=${syncState.last_message_id}`;
    }

    const discordRes = await fetch(url, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    });

    if (!discordRes.ok) {
      const err = await discordRes.text();
      throw new Error(`Discord API error [${discordRes.status}]: ${err}`);
    }

    const messages = await discordRes.json();

    if (!messages.length) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No new messages" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sort oldest first
    messages.sort((a: any, b: any) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let processed = 0;
    let lastId = syncState?.last_message_id;

    for (const msg of messages) {
      // Skip bot messages
      if (msg.author?.bot) {
        lastId = msg.id;
        continue;
      }

      const content = msg.content?.trim();
      if (!content || !content.startsWith("$")) {
        lastId = msg.id;
        continue;
      }

      // Parse message using AI
      const parsed = await parseMessageWithAI(content, LOVABLE_API_KEY);

      if (parsed) {
        const { error } = await supabase.from("polizas").insert({
          monto: parsed.monto,
          agente: parsed.agente,
          empresa: parsed.empresa || null,
          tipo_poliza: parsed.tipo_poliza || null,
          forma_pago: parsed.forma_pago || null,
          cliente: parsed.cliente || null,
        });

        if (error) {
          console.error("Insert error:", error);
        } else {
          processed++;
        }
      }

      lastId = msg.id;
    }

    // Update sync state
    if (lastId) {
      await supabase.from("discord_sync_state").upsert(
        {
          channel_id: DISCORD_CHANNEL_ID,
          last_message_id: lastId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "channel_id" }
      );
    }

    return new Response(
      JSON.stringify({ processed, total_messages: messages.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function parseMessageWithAI(
  message: string,
  apiKey: string
): Promise<{
  monto: number;
  agente: string;
  empresa: string;
  tipo_poliza: string;
  forma_pago: string;
  cliente: string;
} | null> {
  try {
    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You extract insurance policy data from messages. Return ONLY valid JSON with these fields:
- monto (number, the dollar amount without the $ sign)
- empresa (string, the insurance company name)
- tipo_poliza (string, the policy type like IUL, FEX, Term, etc.)
- forma_pago (string, payment method like "upon issue", "monthly", etc.)
- cliente (string, the client's full name, usually in parentheses)
- agente (string, the agent's name, usually the last word/name)

Example input: "$1440 americo fex upon issue tx (alejandra gallegos) Alexander"
Example output: {"monto":1440,"empresa":"Americo","tipo_poliza":"FEX","forma_pago":"Upon Issue","cliente":"Alejandra Gallegos","agente":"Alexander"}

If you cannot parse the message, return {"error": true}.`,
          },
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error(`AI Gateway error [${res.status}]`);
      return null;
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    if (parsed.error) return null;
    if (!parsed.monto || !parsed.agente) return null;

    return parsed;
  } catch (e) {
    console.error("AI parse error:", e);
    return null;
  }
}
