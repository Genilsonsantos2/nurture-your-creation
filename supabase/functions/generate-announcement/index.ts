import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { topic, tone, audience, extra_context } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: "Informe o tema do comunicado." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: settings } = await supabase.from("settings").select("school_name").single();
    const schoolName = settings?.school_name || "CETINI";

    const prompt = `Você é o redator oficial da escola "${schoolName}". Gere um comunicado escolar profissional.

TEMA: ${topic}
TOM: ${tone || "formal"}
PÚBLICO-ALVO: ${audience || "pais e responsáveis"}
${extra_context ? `CONTEXTO ADICIONAL: ${extra_context}` : ""}

O comunicado deve ter:
- Cabeçalho com nome da escola
- Saudação adequada ao público
- Corpo do texto claro e objetivo
- Despedida formal
- Espaço para assinatura (Coordenação/Direção)

Escreva em português brasileiro formal. Use markdown para formatação.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um redator escolar profissional. Gere comunicados formais e bem estruturados em português brasileiro." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Limite excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("Erro na IA");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "Não foi possível gerar o comunicado.";

    return new Response(JSON.stringify({ announcement: content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-announcement error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
