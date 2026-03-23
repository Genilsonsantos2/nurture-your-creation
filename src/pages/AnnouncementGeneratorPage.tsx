import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, Copy, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const toneOptions = [
  { value: "formal", label: "Formal" },
  { value: "amigavel", label: "Amigável" },
  { value: "urgente", label: "Urgente" },
  { value: "informativo", label: "Informativo" },
];

const audienceOptions = [
  { value: "pais e responsáveis", label: "Pais e Responsáveis" },
  { value: "alunos", label: "Alunos" },
  { value: "professores", label: "Professores" },
  { value: "comunidade escolar", label: "Comunidade Escolar" },
];

export default function AnnouncementGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("formal");
  const [audience, setAudience] = useState("pais e responsáveis");
  const [extraContext, setExtraContext] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) { toast.error("Informe o tema do comunicado"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-announcement", {
        body: { topic, tone, audience, extra_context: extraContext },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.announcement);
      toast.success("Comunicado gerado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success("Copiado!");
    }
  };

  const downloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comunicado-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          Gerador de Comunicados IA
        </h1>
        <p className="text-muted-foreground mt-1">IA escreve comunicados escolares profissionais a partir de um tema</p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-bold text-foreground block mb-1">Tema do Comunicado *</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Reunião de pais, Mudança de horário, Festa junina..."
            className="w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-foreground block mb-1">Tom</label>
            <div className="flex flex-wrap gap-2">
              {toneOptions.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tone === t.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-foreground block mb-1">Público-alvo</label>
            <div className="flex flex-wrap gap-2">
              {audienceOptions.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setAudience(a.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${audience === a.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-foreground block mb-1">Contexto adicional (opcional)</label>
          <textarea
            value={extraContext}
            onChange={(e) => setExtraContext(e.target.value)}
            placeholder="Detalhes extras, datas, locais..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <button onClick={generate} disabled={loading} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
          {loading ? "Gerando..." : "Gerar Comunicado"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Comunicado Gerado</h3>
            <div className="flex gap-2">
              <button onClick={copyToClipboard} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-bold transition-all">
                <Copy className="h-4 w-4" /> Copiar
              </button>
              <button onClick={downloadTxt} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-bold transition-all">
                <Download className="h-4 w-4" /> Baixar
              </button>
              <button onClick={generate} disabled={loading} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm font-bold transition-all">
                <RefreshCw className="h-4 w-4" /> Regenerar
              </button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert bg-background rounded-xl p-6 border">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
