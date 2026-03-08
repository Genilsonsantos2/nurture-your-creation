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

    const { messages } = await req.json();

    // Fetch context data for the AI
    const today = new Date().toISOString().split("T")[0];

    const [studentsRes, movementsRes, alertsRes, schedulesRes, settingsRes] = await Promise.all([
      supabase.from("students").select("id, name, series, class, modality, active").eq("active", true),
      supabase.from("movements").select("student_id, type, registered_at, students(name, series, class)").gte("registered_at", `${today}T00:00:00`).order("registered_at", { ascending: false }).limit(50),
      supabase.from("alerts").select("student_id, type, status, message, students(name)").eq("status", "pending").limit(20),
      supabase.from("schedules").select("*"),
      supabase.from("settings").select("*").limit(1).maybeSingle(),
    ]);

    const totalStudents = studentsRes.data?.length || 0;
    const todayEntries = (movementsRes.data || []).filter((m: any) => m.type === "entry").length;
    const todayExits = (movementsRes.data || []).filter((m: any) => m.type === "exit").length;
    const pendingAlerts = alertsRes.data?.length || 0;

    const systemContext = `
Você é o assistente inteligente do sistema CETI Digital, usado no CETI Nova Itarana (escola pública de ensino integral e técnico na Bahia).

DADOS ATUAIS DO SISTEMA (hoje ${today}):
- Total de alunos ativos: ${totalStudents}
- Entradas hoje: ${todayEntries}
- Saídas hoje: ${todayExits}
- Alertas pendentes: ${pendingAlerts}

HORÁRIOS CONFIGURADOS:
${JSON.stringify(schedulesRes.data || [], null, 2)}

CONFIGURAÇÕES:
- Nome da escola: ${settingsRes.data?.school_name || "CETI Nova Itarana"}
- Sistema ativo: ${settingsRes.data?.system_active ? "Sim" : "Não"}

ÚLTIMAS MOVIMENTAÇÕES DE HOJE:
${JSON.stringify((movementsRes.data || []).slice(0, 15).map((m: any) => ({
  aluno: m.students?.name,
  tipo: m.type === "entry" ? "entrada" : "saída",
  hora: new Date(m.registered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
})), null, 2)}

ALERTAS PENDENTES:
${JSON.stringify((alertsRes.data || []).slice(0, 10).map((a: any) => ({
  aluno: a.students?.name,
  tipo: a.type,
  mensagem: a.message
})), null, 2)}

REGRAS:
- Responda sempre em português brasileiro
- Seja objetivo e útil
- Se perguntarem sobre um aluno específico, use os dados disponíveis
- Para procedimentos da portaria: explique sobre leitura de QR Code, fluxo entrada/saída automático, cooldown de 3 segundos
- Para coordenação: ajude com análise de dados, procedimentos e orientações
- Use markdown para formatar quando necessário
- Se não souber algo, diga que não tem essa informação no momento
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("Erro na IA");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
