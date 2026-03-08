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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active students
    const { data: students } = await supabase
      .from("students")
      .select("id, name, series, class, modality, created_at")
      .eq("active", true);

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ predictions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch movements from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: movements } = await supabase
      .from("movements")
      .select("student_id, type, registered_at")
      .gte("registered_at", thirtyDaysAgo);

    // Fetch occurrences from last 30 days
    const { data: occurrences } = await supabase
      .from("occurrences")
      .select("student_id, type, created_at")
      .gte("created_at", thirtyDaysAgo);

    // Fetch alerts from last 30 days
    const { data: alerts } = await supabase
      .from("alerts")
      .select("student_id, type, status, created_at")
      .gte("created_at", thirtyDaysAgo);

    // Build per-student stats
    const studentStats = students.map((s: any) => {
      const myMovements = (movements || []).filter((m: any) => m.student_id === s.id);
      const myEntries = myMovements.filter((m: any) => m.type === "entry");
      const myExits = myMovements.filter((m: any) => m.type === "exit");
      const myOccurrences = (occurrences || []).filter((o: any) => o.student_id === s.id);
      const myAlerts = (alerts || []).filter((a: any) => a.student_id === s.id);
      const absentAlerts = myAlerts.filter((a: any) => a.type === "absent");

      return {
        name: s.name,
        series: s.series,
        class: s.class,
        entries_30d: myEntries.length,
        exits_30d: myExits.length,
        occurrences_30d: myOccurrences.length,
        absent_alerts_30d: absentAlerts.length,
        total_alerts_30d: myAlerts.length,
      };
    });

    // Send to AI for analysis
    const prompt = `Você é um especialista em educação e análise de dados escolares. Analise os dados abaixo de alunos nos últimos 30 dias e identifique os alunos com MAIOR RISCO de evasão escolar.

Dados dos alunos (últimos 30 dias):
${JSON.stringify(studentStats, null, 2)}

Considere dias úteis = ~22 por mês. Critérios de risco:
- Poucas entradas (frequência baixa)
- Muitas saídas antecipadas
- Ocorrências disciplinares
- Alertas de ausência

IMPORTANTE: Responda APENAS com um JSON válido no formato abaixo, sem texto extra:
{
  "predictions": [
    {
      "name": "Nome do Aluno",
      "series": "série",
      "class": "turma",
      "risk_level": "alto|medio|baixo",
      "risk_score": 85,
      "reasons": ["motivo 1", "motivo 2"],
      "recommendation": "recomendação para a escola"
    }
  ]
}

Retorne SOMENTE alunos com risco médio ou alto (score >= 40). Ordene do maior para o menor risco. Máximo 20 alunos.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um analista educacional especializado em predição de evasão escolar. Responda sempre em JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Erro na análise de IA");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "{}";
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let predictions;
    try {
      predictions = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      predictions = { predictions: [] };
    }

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict-dropout error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
