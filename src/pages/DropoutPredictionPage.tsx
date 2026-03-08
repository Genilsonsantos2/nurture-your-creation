import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Brain, AlertTriangle, TrendingDown, Users, RefreshCw, ShieldAlert, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

type Prediction = {
  name: string;
  series: string;
  class: string;
  risk_level: "alto" | "medio" | "baixo";
  risk_score: number;
  reasons: string[];
  recommendation: string;
};

const riskConfig = {
  alto: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "ALTO" },
  medio: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", label: "MÉDIO" },
  baixo: { color: "text-success", bg: "bg-success/10", border: "border-success/30", label: "BAIXO" },
};

export default function DropoutPredictionPage() {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["dropout-predictions"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("predict-dropout");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.predictions || []) as Prediction[];
    },
    staleTime: 1000 * 60 * 10, // 10 min cache
    retry: 1,
  });

  const predictions = data || [];
  const highRisk = predictions.filter((p) => p.risk_level === "alto");
  const mediumRisk = predictions.filter((p) => p.risk_level === "medio");

  const handleRefresh = () => {
    refetch();
    toast.info("Reanalisando dados com IA...");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Predição de Evasão
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Análise inteligente de padrões para identificar alunos em risco
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Analisando..." : "Reanalisar com IA"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <span className="text-sm font-bold text-destructive uppercase tracking-wider">Risco Alto</span>
          </div>
          <p className="text-4xl font-black text-destructive">{highRisk.length}</p>
          <p className="text-xs text-muted-foreground mt-1">alunos precisam de atenção urgente</p>
        </div>
        <div className="rounded-2xl bg-warning/10 border border-warning/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span className="text-sm font-bold text-warning uppercase tracking-wider">Risco Médio</span>
          </div>
          <p className="text-4xl font-black text-warning">{mediumRisk.length}</p>
          <p className="text-xs text-muted-foreground mt-1">alunos em monitoramento</p>
        </div>
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-wider">Total Analisados</span>
          </div>
          <p className="text-4xl font-black text-primary">{predictions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">alunos com risco identificado</p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-bold text-muted-foreground">A IA está analisando os dados...</p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="font-bold text-destructive">{(error as Error).message}</p>
          <button onClick={handleRefresh} className="mt-4 text-sm font-bold text-primary hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && predictions.length === 0 && (
        <div className="rounded-2xl bg-success/10 border border-success/20 p-12 text-center">
          <TrendingDown className="h-12 w-12 text-success mx-auto mb-4" />
          <h3 className="text-xl font-black text-foreground mb-2">Nenhum aluno em risco!</h3>
          <p className="text-muted-foreground">Todos os alunos apresentam frequência saudável nos últimos 30 dias.</p>
        </div>
      )}

      {/* Predictions List */}
      {!isLoading && predictions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-foreground">Alunos Identificados</h2>
          {predictions.map((p, i) => {
            const config = riskConfig[p.risk_level] || riskConfig.baixo;
            const isExpanded = expandedStudent === p.name;
            return (
              <div
                key={i}
                className={`rounded-2xl border ${config.border} ${config.bg} overflow-hidden transition-all duration-300`}
              >
                <button
                  onClick={() => setExpandedStudent(isExpanded ? null : p.name)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  <div className="flex-shrink-0">
                    <div className={`h-12 w-12 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center`}>
                      <span className={`text-lg font-black ${config.color}`}>{p.risk_score}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground truncate">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.color} border ${config.border}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.series} - {p.class}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">Motivos Identificados</h4>
                      <ul className="space-y-1">
                        {p.reasons.map((r, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                            <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.color}`} />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-card/80 border border-border/50 p-4">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-1">Recomendação</h4>
                          <p className="text-sm text-foreground">{p.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
