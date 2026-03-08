import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shuffle, Loader2, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type ClassAnalysis = {
  class_name: string;
  student_count: number;
  health_score: number;
  issues: string[];
  color: string;
};

type Suggestion = {
  title: string;
  description: string;
  impact: string;
  affected_classes: string[];
};

type SuggestData = {
  analysis: ClassAnalysis[];
  suggestions: Suggestion[];
  summary: string;
};

const impactColors: Record<string, string> = {
  alto: "bg-destructive/10 border-destructive/30 text-destructive",
  medio: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600",
  baixo: "bg-blue-500/10 border-blue-500/30 text-blue-600",
};

const healthColors: Record<string, string> = {
  green: "border-green-500/30 bg-green-500/5",
  yellow: "border-yellow-500/30 bg-yellow-500/5",
  red: "border-destructive/30 bg-destructive/5",
};

export default function ClassSuggestionPage() {
  const [data, setData] = useState<SuggestData | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("suggest-classes");
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setData(result);
      toast.success("Análise de turmas concluída!");
    } catch (e: any) {
      toast.error(e.message || "Erro na análise");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Shuffle className="h-8 w-8 text-primary" />
            Sugestão de Turmas IA
          </h1>
          <p className="text-muted-foreground mt-1">IA analisa dados e sugere redistribuição inteligente de alunos</p>
        </div>
        <button onClick={analyze} disabled={loading} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          {loading ? "Analisando..." : data ? "Reanalisar" : "Analisar Turmas"}
        </button>
      </div>

      {!data && !loading && (
        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center">
          <Shuffle className="h-16 w-16 text-primary/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-muted-foreground">Clique em "Analisar Turmas" para a IA avaliar a distribuição</h3>
          <p className="text-sm text-muted-foreground/70 mt-2">Usa dados de frequência, ocorrências e alertas dos últimos 30 dias</p>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="font-bold text-muted-foreground">A IA está analisando as turmas...</p>
        </div>
      )}

      {data && (
        <>
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-bold text-lg mb-2">Resumo</h3>
            <p className="text-muted-foreground">{data.summary}</p>
          </div>

          {/* Class Health Grid */}
          <div>
            <h3 className="font-bold text-lg mb-3">Saúde das Turmas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.analysis.map((c, i) => (
                <div key={i} className={`rounded-xl border-2 p-4 ${healthColors[c.color] || healthColors.green}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">{c.class_name}</h4>
                    <span className="text-2xl font-black">{c.health_score}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{c.student_count} alunos</p>
                  {c.issues.length > 0 && (
                    <ul className="space-y-1">
                      {c.issues.map((issue, j) => (
                        <li key={j} className="text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.issues.length === 0 && (
                    <p className="text-xs flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" /> Turma saudável
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <h3 className="font-bold text-lg mb-3">Sugestões da IA</h3>
            <div className="space-y-3">
              {data.suggestions.length === 0 ? (
                <div className="rounded-2xl border bg-green-500/5 border-green-500/20 p-6 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="font-bold text-green-700">Turmas bem distribuídas! Sem sugestões de mudança.</p>
                </div>
              ) : (
                data.suggestions.map((s, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${impactColors[s.impact] || impactColors.baixo}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold">{s.title}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-background/50 font-bold uppercase">Impacto {s.impact}</span>
                    </div>
                    <p className="text-sm opacity-90 mb-2">{s.description}</p>
                    <p className="text-xs opacity-70">Turmas afetadas: {s.affected_classes.join(", ")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
