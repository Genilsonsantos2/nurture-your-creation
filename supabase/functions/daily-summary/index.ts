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

    const today = new Date().toISOString().split("T")[0];

    const [studentsRes, movementsRes, alertsRes, occurrencesRes, justificationsRes, schedulesRes] = await Promise.all([
      supabase.from("students").select("id, name, series, class, modality").eq("active", true),
      supabase.from("movements").select("student_id, type, registered_at, students(name, series, class)").gte("registered_at", `${today}T00:00:00`).order("registered_at", { ascending: false }),
      supabase.from("alerts").select("student_id, type, status, message, students(name)").eq("status", "pending"),
      supabase.from("occurrences").select("student_id, type, description, students(name)").gte("created_at", `${today}T00:00:00`),
      supabase.from("absence_justifications").select("student_id, reason, status, students(name)").eq("status", "pending"),
      supabase.from("schedules").select("*"),
    ]);

    const totalStudents = studentsRes.data?.length || 0;
    const movements = movementsRes.data || [];
    const entries = movements.filter((m: any) => m.type === "entry");
    const exits = movements.filter((m: any) => m.type === "exit");
    const presentIds = new Set(entries.map((m: any) => m.student_id));
    const absentStudents = (studentsRes.data || []).filter((s: any) => !presentIds.has(s.id));

    const dataContext = `
DADOS DO DIA (${today}):
- Total de alunos ativos: ${totalStudents}
- Presentes (com entrada): ${presentIds.size}
- Ausentes (sem entrada): ${absentStudents.length}
- Total de entradas: ${entries.length}
- Total de saídas: ${exits.length}
- Alertas pendentes: ${(alertsRes.data || []).length}
- Ocorrências hoje: ${(occurrencesRes.data || []).length}
- Justificativas pendentes: ${(justificationsRes.data || []).length}

ALUNOS AUSENTES HOJE (primeiros 30):
${absentStudents.slice(0, 30).map((s: any) => `- ${s.name} (${s.series} ${s.class})`).join("\n")}

OCORRÊNCIAS HOJE:
${(occurrencesRes.data || []).map((o: any) => `- ${o.students?.name}: ${o.type} - ${o.description || "sem descrição"}`).join("\n") || "Nenhuma"}

ALERTAS PENDENTES:
${(alertsRes.data || []).slice(0, 10).map((a: any) => `- ${a.students?.name}: ${a.message}`).join("\n") || "Nenhum"}

HORÁRIOS:
${JSON.stringify(schedulesRes.data || [])}
`;

    const prompt = `Você é o analista educacional do CETI Nova Itarana. Gere um RESUMO DIÁRIO INTELIGENTE com base nos dados abaixo.

${dataContext}

O resumo deve ter:
1. **Visão Geral** - números principais do dia
2. **Destaques** - pontos de atenção (muitas faltas, ocorrências, etc)
3. **Alunos em Risco** - quem precisa de atenção
4. **Recomendações** - ações sugeridas para coordenação
5. **Nota Final** - mensagem motivacional ou observação geral

Use markdown formatado. Seja objetivo e prático. Escreva em português brasileiro.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um analista educacional especializado. Gere resumos claros e acionáveis." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite excedido. Tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro na IA");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "Não foi possível gerar o resumo.";

    return new Response(JSON.stringify({
      summary: content,
      stats: {
        total: totalStudents,
        present: presentIds.size,
        absent: absentStudents.length,
        entries: entries.length,
        exits: exits.length,
        alerts: (alertsRes.data || []).length,
        occurrences: (occurrencesRes.data || []).length,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
