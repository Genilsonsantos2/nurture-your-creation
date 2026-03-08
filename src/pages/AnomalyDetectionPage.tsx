import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, AlertTriangle, CheckCircle, Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Anomaly = {
  type: string;
  severity: string;
  title: string;
  description: string;
  affected_students: string[];
  recommendation: string;
};

type AnomalyData = {
  anomalies: Anomaly[];
  risk_score: number;
  summary: string;
};

const severityConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  alta: { color: "bg-destructive/10 border-destructive/30 text-destructive", icon: <AlertTriangle className="h-5 w-5" />, label: "Alta" },
  media: { color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600", icon: <Info className="h-5 w-5" />, label: "Média" },
  baixa: { color: "bg-blue-500/10 border-blue-500/30 text-blue-600", icon: <CheckCircle className="h-5 w-5" />, label: "Baixa" },
};

export default function AnomalyDetectionPage() {
  const [data, setData] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("detect-anomalies");
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setData(result);
      toast.success("Análise de anomalias concluída!");
    } catch (e: any) {
      toast.error(e.message || "Erro na análise");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-destructive";
    if (score >= 40) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Detecção de Anomalias
          </h1>
          <p className="text-muted-foreground mt-1">IA analisa movimentações dos últimos 7 dias e detecta padrões suspeitos</p>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          {loading ? "Analisando..." : data ? "Reanalisar" : "Iniciar Análise"}
        </button>
      </div>

      {!data && !loading && (
        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center">
          <Shield className="h-16 w-16 text-primary/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-muted-foreground">Clique em "Iniciar Análise" para a IA verificar anomalias</h3>
          <p className="text-sm text-muted-foreground/70 mt-2">A IA analisará entradas, saídas e padrões dos últimos 7 dias</p>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="font-bold text-muted-foreground">A IA está analisando movimentações...</p>
        </div>
      )}

      {data && (
        <>
          {/* Risk Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-card p-6 text-center">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Score de Risco</p>
              <p className={`text-5xl font-black mt-2 ${getRiskColor(data.risk_score)}`}>{data.risk_score}</p>
              <p className="text-xs text-muted-foreground mt-1">de 100</p>
            </div>
            <div className="rounded-2xl border bg-card p-6 text-center">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Anomalias</p>
              <p className="text-5xl font-black mt-2 text-foreground">{data.anomalies.length}</p>
              <p className="text-xs text-muted-foreground mt-1">detectadas</p>
            </div>
            <div className="rounded-2xl border bg-card p-6 text-center">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Severidade Alta</p>
              <p className="text-5xl font-black mt-2 text-destructive">{data.anomalies.filter(a => a.severity === "alta").length}</p>
              <p className="text-xs text-muted-foreground mt-1">críticas</p>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-bold text-lg mb-2">Resumo da Análise</h3>
            <p className="text-muted-foreground">{data.summary}</p>
          </div>

          {/* Anomalies List */}
          <div className="space-y-3">
            {data.anomalies.length === 0 ? (
              <div className="rounded-2xl border bg-green-500/5 border-green-500/20 p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-bold text-green-700">Nenhuma anomalia detectada!</h3>
                <p className="text-sm text-muted-foreground mt-1">Todas as movimentações estão dentro do padrão normal.</p>
              </div>
            ) : (
              data.anomalies.map((anomaly, i) => {
                const config = severityConfig[anomaly.severity] || severityConfig.baixa;
                return (
                  <div key={i} className={`rounded-2xl border p-5 ${config.color}`}>
                    <div className="flex items-start gap-3">
                      {config.icon}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold">{anomaly.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-background/50 font-bold uppercase">{config.label}</span>
                        </div>
                        <p className="text-sm opacity-90 mb-2">{anomaly.description}</p>
                        {anomaly.affected_students.length > 0 && (
                          <p className="text-xs opacity-70 mb-2">
                            <strong>Alunos:</strong> {anomaly.affected_students.join(", ")}
                          </p>
                        )}
                        <p className="text-sm font-medium">💡 {anomaly.recommendation}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
