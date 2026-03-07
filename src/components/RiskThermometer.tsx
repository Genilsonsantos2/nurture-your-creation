import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function RiskThermometer() {
    // Busca dados para o cálculo de risco
    const { data: students = [], isLoading: isLoadingStudents } = useQuery({
        queryKey: ["risk-students"],
        queryFn: async () => {
            const { data } = await supabase.from("students").select("id, name, series, class").eq("active", true);
            return data || [];
        }
    });

    const { data: recentAlerts = [], isLoading: isLoadingAlerts } = useQuery({
        queryKey: ["risk-alerts"],
        queryFn: async () => {
            // Faltas (Absent alerts) em aberto
            const { data } = await supabase.from("alerts")
                .select("student_id")
                .eq("type", "absent")
                .eq("status", "pending");
            return data || [];
        }
    });

    const { data: recentOccurrences = [], isLoading: isLoadingOccurrences } = useQuery({
        queryKey: ["risk-occurrences"],
        queryFn: async () => {
            // Ocorrencias criadas nos ultimos 15 dias letivos
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

            const { data } = await supabase.from("occurrences")
                .select("student_id")
                .gte("created_at", fifteenDaysAgo.toISOString());
            return data || [];
        }
    });

    if (isLoadingStudents || isLoadingAlerts || isLoadingOccurrences) {
        return (
            <div className="flex flex-col justify-center items-center h-48 opacity-50">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase mt-4">Calculando IA...</p>
            </div>
        );
    }

    // Calcular o score de cada aluno
    const riskScores = students.map(student => {
        let score = 0;

        // Faltas não resolvidas pesam muito (Risco de abandono)
        const absencesCount = recentAlerts.filter(a => a.student_id === student.id).length;
        score += (absencesCount * 40);

        // Ocorrências recentes pesam (Risco disciplinar)
        const occurrencesCount = recentOccurrences.filter(o => o.student_id === student.id).length;
        score += (occurrencesCount * 25);

        let riskLevel: "Baixo" | "Médio" | "Alto" = "Baixo";
        if (score >= 70) riskLevel = "Alto";
        else if (score >= 40) riskLevel = "Médio";

        return {
            ...student,
            score,
            riskLevel,
            absencesCount,
            occurrencesCount
        };
    });

    // Pega os piores casos primeiro e remove quem não tem risco
    const highRiskStudents = riskScores
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

    return (
        <div className="glass-panel p-8 md:p-10 space-y-6 bg-gradient-to-br from-destructive/[0.03] to-transparent border-destructive/10 h-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                        <AlertCircle className="h-7 w-7" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground tracking-tight whitespace-nowrap">Termômetro de Risco</h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1 text-destructive/70">Alerta de Evasão Escolar</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-foreground">{highRiskStudents.filter(s => s.riskLevel === 'Alto').length}</p>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Casos Críticos</p>
                </div>
            </div>

            <div className="space-y-3 mt-6">
                {highRiskStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 bg-success/5 border border-success/20 rounded-3xl">
                        <CheckCircle2 className="h-10 w-10 text-success mb-2" />
                        <p className="font-black text-success">Excelente!</p>
                        <p className="text-xs text-success/80">Nenhum aluno em zona crítica.</p>
                    </div>
                ) : (
                    highRiskStudents.map((student) => (
                        <div key={student.id} className="p-4 md:p-5 rounded-[2rem] bg-card border border-border shadow-sm flex items-center justify-between group hover:scale-[1.02] transition-transform">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border-4 
                                    ${student.riskLevel === 'Alto' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                        student.riskLevel === 'Médio' ? 'bg-warning/10 text-warning border-warning/20' :
                                            'bg-info/10 text-info border-info/20'}`}>
                                    {student.score}%
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-black text-foreground truncate">{student.name}</h4>
                                    <p className="text-[10px] text-muted-foreground tracking-wider font-bold mt-0.5">
                                        {student.series} • {student.class}
                                    </p>
                                </div>
                            </div>

                            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full 
                                    ${student.riskLevel === 'Alto' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                                    Risco {student.riskLevel}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                    {student.absencesCount > 0 && <span className="text-destructive whitespace-nowrap">{student.absencesCount} falta(s)</span>}
                                    {student.absencesCount > 0 && student.occurrencesCount > 0 && <span>•</span>}
                                    {student.occurrencesCount > 0 && <span className="text-warning whitespace-nowrap">{student.occurrencesCount} ocorrência(s)</span>}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <p className="text-[10px] text-muted-foreground/60 font-medium italic mt-4 text-center">
                *O score avalia alunos com faltas não justificadas e ocorrências dos últimos 15 dias.
            </p>
        </div>
    );
}
