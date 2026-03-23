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

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [studentsRes, movementsRes, occurrencesRes, alertsRes] = await Promise.all([
      supabase.from("students").select("id, name, series, class, modality").eq("active", true),
      supabase.from("movements").select("student_id, type, registered_at").gte("registered_at", thirtyDaysAgo),
      supabase.from("occurrences").select("student_id, type").gte("created_at", thirtyDaysAgo),
      supabase.from("alerts").select("student_id, type").gte("created_at", thirtyDaysAgo),
    ]);

    const students = studentsRes.data || [];
    const movements = movementsRes.data || [];
    const occurrences = occurrencesRes.data || [];
    const alerts = alertsRes.data || [];

    // Build class stats
    const classMap: Record<string, any> = {};
    for (const s of students) {
      const key = `${s.series} - ${s.class}`;
      if (!classMap[key]) classMap[key] = { series: s.series, class: s.class, count: 0, students: [], modality: s.modality };
      classMap[key].count++;
      const myMov = movements.filter((m: any) => m.student_id === s.id);
      const myOcc = occurrences.filter((o: any) => o.student_id === s.id);
      const myAlerts = alerts.filter((a: any) => a.student_id === s.id);
      classMap[key].students.push({ name: s.name, entries: myMov.filter((m: any) => m.type === "entry").length, exits: myMov.filter((m: any) => m.type === "exit").length, occurrences: myOcc.length, alerts: myAlerts.length });
    }

    const prompt = `Você é um especialista em gestão educacional. Analise a distribuição de turmas e sugira melhorias.

DADOS DAS TURMAS (últimos 30 dias):
${JSON.stringify(Object.values(classMap), null, 2)}

Analise:
1. Turmas superlotadas vs turmas com poucos alunos
2. Concentração de alunos problemáticos em uma turma
3. Desequilíbrio de frequência entre turmas da mesma série
4. Sugestões de redistribuição para melhorar o desempenho

RESPONDA APENAS com JSON válido:
{
  "analysis": [
    {
      "class_name": "série - turma",
      "student_count": 30,
      "health_score": 85,
      "issues": ["problema1"],
      "color": "green|yellow|red"
    }
  ],
  "suggestions": [
    {
      "title": "título da sugestão",
      "description": "descrição detalhada",
      "impact": "alto|medio|baixo",
      "affected_classes": ["turma1", "turma2"]
    }
  ],
  "summary": "resumo geral"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um gestor educacional. Responda sempre em JSON válido." },
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
    let content = aiData.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let result;
    try { result = JSON.parse(content); } catch { result = { analysis: [], suggestions: [], summary: "Não foi possível analisar." }; }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("suggest-classes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
