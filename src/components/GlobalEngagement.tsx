import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, TrendingUp, Users } from "lucide-react";

export default function GlobalEngagement() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["global-engagement"],
        queryFn: async () => {
            const today = new Date().toISOString().split("T")[0];

            const [studentsRes, movementsRes] = await Promise.all([
                supabase.from("students").select("id", { count: "exact", head: true }).eq("active", true),
                supabase.from("movements")
                    .select("student_id")
                    .eq("type", "entry")
                    .gte("registered_at", `${today}T00:00:00`)
                    .lte("registered_at", `${today}T23:59:59`)
            ]);

            const totalStudents = studentsRes.count || 0;
            const uniqueDelayedStudents = new Set((movementsRes.data || []).map(m => m.student_id)).size;

            const engagement = totalStudents > 0
                ? Math.max(0, Math.min(100, ((totalStudents - uniqueDelayedStudents) / totalStudents) * 100))
                : 100;

            return {
                percentage: Math.round(engagement),
                total: totalStudents,
                onTime: totalStudents - uniqueDelayedStudents
            };
        },
        refetchInterval: 30000 // Refresh every 30s
    });

    if (isLoading) return <div className="animate-pulse h-32 bg-muted/20 rounded-2xl" />;

    const percentage = stats?.percentage || 0;
    const strokeDasharray = (percentage / 100) * 251.2; // 2 * PI * r (r=40)

    return (
        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="h-24 w-24 text-primary" />
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Engajamento Global</span>
                </div>
                <h3 className="text-2xl font-black text-foreground">{percentage}%</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-1">
                    <span className="text-success">{stats?.onTime}</span> de {stats?.total} alunos pontuais hoje
                </p>
            </div>

            <div className="relative h-20 w-20 shrink-0">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                        className="stroke-muted"
                        strokeWidth="10"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                    />
                    <circle
                        className={`${percentage > 80 ? 'stroke-success' : percentage > 50 ? 'stroke-warning' : 'stroke-destructive'} transition-all duration-1000 ease-out`}
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - strokeDasharray}
                        strokeLinecap="round"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground/50" />
                </div>
            </div>
        </div>
    );
}
