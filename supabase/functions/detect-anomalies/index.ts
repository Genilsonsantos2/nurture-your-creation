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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [movementsRes, schedulesRes, studentsRes, alertsRes] = await Promise.all([
      supabase.from("movements").select("student_id, type, registered_at, students(name, series, class)").gte("registered_at", sevenDaysAgo).order("registered_at", { ascending: false }),
      supabase.from("schedules").select("*"),
      supabase.from("students").select("id, name, series, class").eq("active", true),
      supabase.from("alerts").select("student_id, type, status, created_at").gte("created_at", sevenDaysAgo),
    ]);

    const movements = movementsRes.data || [];
    const schedules = schedulesRes.data || [];
    const students = studentsRes.data || [];

    // Build per-student movement summary
    const studentMap: Record<string, any> = {};
    for (const m of movements) {
      if (!studentMap[m.student_id]) {
        studentMap[m.student_id] = { name: (m as any).students?.name, series: (m as any).students?.series, class: (m as any).students?.class, movements: [] };
      }
      studentMap[m.student_id].movements.push({ type: m.type, time: m.registered_at });
    }

    const dataContext = JSON.stringify({
      period: "últimos 7 dias",
      total_students: students.length,
      total_movements: movements.length,
      schedules: schedules.map((s: any) => ({ name: s.name, type: s.type, start: s.start_time, end: s.end_time })),
      student_movements: Object.values(studentMap).slice(0, 50),
      alerts_count: (alertsRes.data || []).length,
    });

    const prompt = `Você é um especialista em segurança escolar. Analise os dados de movimentação dos últimos 7 dias e DETECTE ANOMALIAS.

DADOS:
${dataContext}

Procure por:
1. Movimentações em horários muito incomuns (madrugada, noite)
2. Alunos com padrão irregular (muitas saídas seguidas sem entrada)
3. Entradas/saídas duplicadas no mesmo minuto
4. Alunos que saem e não retornam repetidamente
5. Picos incomuns de movimentação
6. Qualquer padrão suspeito

RESPONDA APENAS com JSON válido:
{
  "anomalies": [
    {
      "type": "horario_incomum|padrao_irregular|duplicata|nao_retorno|pico_incomum|outro",
      "severity": "alta|media|baixa",
      "title": "título curto",
      "description": "descrição detalhada",
      "affected_students": ["nome1"],
      "recommendation": "ação sugerida"
    }
  ],
  "risk_score": 0-100,
  "summary": "resumo geral da análise"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um analista de segurança escolar. Responda sempre em JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Limite excedido. Tente novamente." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("Erro na IA");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let result;
    try { result = JSON.parse(content); } catch { result = { anomalies: [], risk_score: 0, summary: "Não foi possível analisar." }; }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("detect-anomalies error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
