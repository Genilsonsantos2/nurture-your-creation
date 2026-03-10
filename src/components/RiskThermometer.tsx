import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, TrendingDown, Clock, MessageCircle } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RiskStudent {
    id: string;
    name: string;
    series: string;
    class: string;
    riskLevel: 'high' | 'medium' | 'low';
    reason: string;
    lastPresence: Date | null;
}

export default function RiskThermometer() {
    const { data: riskStudents = [], isLoading } = useQuery({
        queryKey: ["risk-students"],
        queryFn: async () => {
            const today = new Date();
            const thirtyDaysAgo = subDays(today, 30);

            // 1. Fetch Students
            const { data: students } = await supabase
                .from("students")
                .select("id, name, series, class, active")
                .eq("active", true);

            if (!students) return [];

            // 2. Fetch Movements (last 30 days)
            const { data: movements } = await supabase
                .from("movements")
                .select("student_id, registered_at, type")
                .gte("registered_at", thirtyDaysAgo.toISOString())
                .order("registered_at", { ascending: false });

            // 3. Logic to calculate risk
            const results: RiskStudent[] = [];

            students.forEach(student => {
                const studentMovements = (movements || []).filter(m => m.student_id === student.id);

                // New logic: 
                // 1. Critical if currently "Out" (Waiting Return)
                // 2. Medium if > 3 lates in 30 days

                const lastMovement = studentMovements[0]; // ordered by desc registered_at
                const isWaitingReturn = lastMovement?.type === 'exit';
                const lastPresence = lastMovement ? new Date(lastMovement.registered_at) : null;

                const latesCount = studentMovements.filter(m => m.type === 'entry').length;

                let riskLevel: 'high' | 'medium' | 'low' = 'low';
                let reason = "";

                if (isWaitingReturn) {
                    riskLevel = 'high';
                    reason = "Saída s/ Retorno (Pendente)";
                } else if (latesCount >= 5) {
                    riskLevel = 'medium';
                    reason = `${latesCount} atrasos no mês`;
                } else if (latesCount >= 3) {
                    riskLevel = 'low'; // Or keep as low for now
                }

                if (riskLevel !== 'low') {
                    results.push({
                        id: student.id,
                        name: student.name,
                        series: student.series,
                        class: student.class,
                        riskLevel,
                        reason,
                        lastPresence
                    });
                }
            });

            return results.sort((a, b) => {
                const levels = { high: 0, medium: 1, low: 2 };
                return levels[a.riskLevel] - levels[b.riskLevel];
            });
        }
    });

    if (isLoading) return <div className="animate-pulse h-48 bg-muted/20 rounded-3xl" />;

    if (riskStudents.length === 0) {
        return (
            <div className="bg-success/5 border border-success/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-success/20 text-success flex items-center justify-center mb-4">
                    <TrendingDown className="h-8 w-8 rotate-180" />
                </div>
                <h3 className="text-lg font-black text-foreground">Frequência Excelente</h3>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Nenhum aluno em risco crítico detectado.</p>
            </div>
        );
    }

    const openWhatsApp = (student: RiskStudent) => {
        const message = `Olá! Sou da coordenação do CETI. Notamos a ausência frequente do aluno ${student.name}. Gostaríamos de entender o motivo e como podemos ajudar a garantir o retorno dele às aulas.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" /> Atenção Necessária
                </h3>
                <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest">
                    {riskStudents.length} em Risco
                </span>
            </div>

            <div className="grid gap-3">
                {riskStudents.slice(0, 5).map(student => (
                    <div key={student.id} className="bg-card border border-border/50 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${student.riskLevel === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                                }`}>
                                <TrendingDown className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-foreground truncate max-w-[150px]">{student.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{student.reason}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openWhatsApp(student)}
                                className="h-8 w-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-all shadow-sm"
                                title="Notificar via WhatsApp"
                            >
                                <MessageCircle className="h-4 w-4" />
                            </button>
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm cursor-pointer">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
