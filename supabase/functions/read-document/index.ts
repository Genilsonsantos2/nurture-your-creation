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

    const { image_base64, file_type } = await req.json();

    if (!image_base64) throw new Error("Nenhuma imagem enviada");

    // Fetch students list for matching
    const { data: students } = await supabase
      .from("students")
      .select("id, name, series, class")
      .eq("active", true);

    const studentList = (students || []).map((s: any) => `${s.name} (${s.series} ${s.class})`).join(", ");

    const prompt = `Você é um assistente especializado em leitura de atestados médicos escolares.

Analise a imagem do documento enviado e extraia as seguintes informações:
1. Nome do paciente/aluno
2. Data do atestado
3. Período de afastamento (datas)
4. Motivo/CID
5. Nome do médico
6. CRM

LISTA DE ALUNOS DA ESCOLA (tente fazer match com o nome encontrado):
${studentList}

IMPORTANTE: Responda APENAS com JSON válido no formato:
{
  "student_name": "nome encontrado no documento",
  "matched_student_id": "id do aluno que mais se aproxima ou null",
  "matched_student_name": "nome do aluno encontrado na lista ou null",
  "date": "YYYY-MM-DD",
  "period_start": "YYYY-MM-DD",
  "period_end": "YYYY-MM-DD",
  "reason": "motivo ou CID descrito",
  "doctor_name": "nome do médico",
  "crm": "número CRM",
  "confidence": "alta|media|baixa",
  "raw_text": "texto extraído do documento"
}

Se não conseguir identificar algum campo, use null.`;

    const aiMessages: any[] = [
      { role: "system", content: "Você extrai dados de documentos médicos. Responda sempre em JSON válido." },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${file_type || "image/jpeg"};base64,${image_base64}`,
            },
          },
        ],
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Erro ao analisar documento");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let extracted;
    try {
      extracted = JSON.parse(content);
    } catch {
      console.error("Failed to parse:", content);
      extracted = { error: "Não foi possível extrair dados do documento", raw_text: content };
    }

    // Try to find best student match if AI didn't
    if (!extracted.matched_student_id && extracted.student_name && students) {
      const normalizedName = extracted.student_name.toUpperCase().trim();
      const match = students.find((s: any) => {
        const sName = s.name.toUpperCase().trim();
        return sName === normalizedName || sName.includes(normalizedName) || normalizedName.includes(sName);
      });
      if (match) {
        extracted.matched_student_id = match.id;
        extracted.matched_student_name = match.name;
      }
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("read-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
