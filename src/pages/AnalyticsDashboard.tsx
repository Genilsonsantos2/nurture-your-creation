import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, Legend, Cell
} from "recharts";
import {
    TrendingUp, Users, Clock, ArrowUpDown, AlertCircle,
    ChevronRight, CalendarDays, Filter
} from "lucide-react";
import { useState } from "react";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import RiskThermometer from "@/components/RiskThermometer";

export default function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState<7 | 30>(7);

    // Fetch Movements
    const { data: movements = [] } = useQuery({
        queryKey: ["analytics-movements", timeRange],
        queryFn: async () => {
            const startDate = subDays(new Date(), timeRange);
            const { data, error } = await supabase
                .from("movements")
                .select("*, students(name, series, class)")
                .gte("registered_at", startDate.toISOString());
            if (error) throw error;
            return data || [];
        }
    });

    // Fetch Occurrences
    const { data: occurrences = [] } = useQuery({
        queryKey: ["analytics-occurrences", timeRange],
        queryFn: async () => {
            const startDate = subDays(new Date(), timeRange);
            const { data, error } = await supabase
                .from("occurrences")
                .select("*, students(name, series, class)")
                .gte("created_at", startDate.toISOString());
            if (error) throw error;
            return data || [];
        }
    });

    // 1. Process Trend Data (Daily)
    const days = eachDayOfInterval({
        start: subDays(new Date(), timeRange - 1),
        end: new Date()
    });

    const trendData = days.map(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayMovements = movements.filter(m => format(new Date(m.registered_at), "yyyy-MM-dd") === dateStr);
        const dayOccurrences = occurrences.filter(o => format(new Date(o.created_at), "yyyy-MM-dd") === dateStr);

        return {
            name: format(day, "EEE", { locale: ptBR }),
            date: dateStr,
            entradas: dayMovements.filter(m => m.type === "entry").length,
            saidas: dayMovements.filter(m => m.type === "exit").length,
            ocorrências: dayOccurrences.length,
        };
    });

    // 2. Class Ranking (Top 5 Classes with most movements)
    const classStats: Record<string, number> = {};
    movements.forEach(m => {
        const className = `${(m.students as any)?.series || ""} ${(m.students as any)?.class || ""}`.trim() || "N/A";
        classStats[className] = (classStats[className] || 0) + 1;
    });

    const classRanking = Object.entries(classStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

    // 3. Hourly Mobility (Peak Hours)
    const hourlyStats = Array.from({ length: 24 }).map((_, hour) => {
        const count = movements.filter(m => new Date(m.registered_at).getHours() === hour).length;
        return { hour: `${hour}h`, count };
    }).filter(h => h.count > 0 || (parseInt(h.hour) >= 7 && parseInt(h.hour) <= 18));

    const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                    <TrendingUp className="w-64 h-64 text-primary" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground">
                        <TrendingUp className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Análise Inteligente</h1>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            Monitoramento de Atrasos e Saídas
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-2 bg-background/50 backdrop-blur-md p-2 rounded-2xl border border-border/50">
                    <button
                        onClick={() => setTimeRange(7)}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${timeRange === 7 ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-accent"}`}
                    >
                        7 DIAS
                    </button>
                    <button
                        onClick={() => setTimeRange(30)}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${timeRange === 30 ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-accent"}`}
                    >
                        30 DIAS
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-8 group hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Atrasos / Saídas Totais</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-foreground">{movements.length}</span>
                        <span className="text-xs font-bold text-success">+{Math.floor(movements.length * 0.1)}%</span>
                    </div>
                </div>

                <div className="glass-panel p-8 group hover:border-info/40 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-info/10 text-info flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Clock className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Permanência Média</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-foreground">8.2h</span>
                        <span className="text-xs font-bold text-muted-foreground">Estável</span>
                    </div>
                </div>

                <div className="glass-panel p-8 group hover:border-warning/40 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ocorrências</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-foreground">{occurrences.length}</span>
                        <span className="text-xs font-bold text-destructive">+{occurrences.length ? "5" : "0"}%</span>
                    </div>
                </div>

                <div className="glass-panel p-8 group hover:border-success/40 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowUpDown className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Eficiência de Fluxo</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-foreground">94%</span>
                        <span className="text-xs font-bold text-success">Excelente</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trend Line Chart */}
                <div className="glass-panel p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-foreground tracking-tight">Tendência de Exceções</h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Comparativo de atrasos e saídas antecipadas</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-primary" /> ATRASOS</div>
                            <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-warning" /> SAÍDAS</div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '1.5rem' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                />
                                <Area type="monotone" dataKey="entradas" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorEntradas)" />
                                <Area type="monotone" dataKey="saidas" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorSaidas)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Peak Hours Flow */}
                <div className="glass-panel p-10 space-y-8">
                    <div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">Mapa de Calor (Horários)</h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Picos de movimentação por hora</p>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="hour"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '1rem' }}
                                />
                                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                                    {hourlyStats.map((entry, index) => {
                                        const count = entry.count;
                                        let color = "#3b82f6";
                                        if (count > 20) color = "#ef4444";
                                        else if (count > 10) color = "#f59e0b";
                                        return <Cell key={`cell-${index}`} fill={color} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Class Ranking */}
                <div className="glass-panel p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-foreground tracking-tight">Engajamento por Turma</h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Ranking de movimentação escolar</p>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={classRanking} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#1e293b' }}
                                    width={80}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={30}>
                                    {classRanking.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts & Critical Insights - Substituted by Risk Thermometer */}
                <RiskThermometer />
            </div>
        </div>
    );
}
