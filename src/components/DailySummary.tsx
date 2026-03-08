import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2, RefreshCw, Users, LogIn, LogOut, AlertTriangle, FileWarning } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type SummaryData = {
  summary: string;
  stats: {
    total: number;
    present: number;
    absent: number;
    entries: number;
    exits: number;
    alerts: number;
    occurrences: number;
  };
};

export default function DailySummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("daily-summary");
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setData(result);
      toast.success("Resumo gerado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar resumo");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <button
        onClick={generate}
        disabled={loading}
        className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-dashed border-primary/30 p-8 text-center hover:border-primary/50 hover:from-primary/10 hover:to-primary/15 transition-all duration-300"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-bold text-muted-foreground">A IA está analisando o dia...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Brain className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-base font-black text-foreground">Gerar Resumo do Dia com IA</p>
              <p className="text-xs text-muted-foreground mt-1">Análise inteligente das movimentações de hoje</p>
            </div>
          </div>
        )}
      </button>
    );
  }

  const stats = [
    { label: "Presentes", value: data.stats.present, icon: LogIn, color: "text-success" },
    { label: "Ausentes", value: data.stats.absent, icon: LogOut, color: "text-warning" },
    { label: "Alertas", value: data.stats.alerts, icon: AlertTriangle, color: "text-destructive" },
    { label: "Ocorrências", value: data.stats.occurrences, icon: FileWarning, color: "text-primary" },
  ];

  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-black text-foreground">Resumo do Dia (IA)</h3>
        </div>
        <button onClick={generate} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 p-4 border-b border-border/30">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="p-5">
        <div className="prose prose-sm dark:prose-invert max-w-none [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm [&>p]:text-sm [&>ul]:text-sm [&>ol]:text-sm">
          <ReactMarkdown>{data.summary}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
