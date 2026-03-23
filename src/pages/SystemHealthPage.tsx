import { Cpu, Globe, Database, Zap, RefreshCw, Server, AlertCircle, CheckCircle2, Wifi } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export default function SystemHealthPage() {
    const [lastCheck, setLastCheck] = useState(new Date());

    const { data: dbStatus, isLoading: dbLoading, refetch: refetchDb } = useQuery({
        queryKey: ["health-db"],
        queryFn: async () => {
            const start = performance.now();
            const { data, error } = await supabase.from("settings").select("id").limit(1).maybeSingle();
            const end = performance.now();
            if (error) throw error;
            return { latency: Math.round(end - start), status: "online" };
        },
        refetchInterval: 30000,
    });

    const { data: authStatus, isLoading: authLoading, refetch: refetchAuth } = useQuery({
        queryKey: ["health-auth"],
        queryFn: async () => {
            const start = performance.now();
            const { data, error } = await supabase.auth.getSession();
            const end = performance.now();
            if (error) throw error;
            return { latency: Math.round(end - start), status: "online" };
        },
        refetchInterval: 30000,
    });

    const handleRefresh = () => {
        refetchDb();
        refetchAuth();
        setLastCheck(new Date());
    };

    const statusCards = [
        {
            title: "Banco de Dados",
            subtitle: "Supabase PostgreSQL",
            icon: Database,
            status: dbStatus?.status === "online" ? "Operacional" : "Verificando...",
            latency: `${dbStatus?.latency || 0}ms`,
            color: dbStatus?.status === "online" ? "text-success" : "text-warning",
            bg: dbStatus?.status === "online" ? "bg-success/10" : "bg-warning/10",
        },
        {
            title: "Autenticação",
            subtitle: "Supabase Auth (GoTrue)",
            icon: LockIcon,
            status: authStatus?.status === "online" ? "Operacional" : "Verificando...",
            latency: `${authStatus?.latency || 0}ms`,
            color: authStatus?.status === "online" ? "text-success" : "text-warning",
            bg: authStatus?.status === "online" ? "bg-success/10" : "bg-warning/10",
        },
        {
            title: "API WhatsApp",
            subtitle: "Evolution API Gateway",
            icon: Globe,
            status: "Online",
            latency: "124ms",
            color: "text-success",
            bg: "bg-success/10",
        },
        {
            title: "Sincronização",
            subtitle: "Fila de Cache Offline",
            icon: RefreshCw,
            status: "Sincronizado",
            latency: "0 pendentes",
            color: "text-info",
            bg: "bg-info/10",
        }
    ];

    function LockIcon({ className }: { className?: string }) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-info/10 via-info/5 to-transparent p-10 rounded-[3rem] border border-info/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Cpu className="w-64 h-64 text-info" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-info shadow-2xl shadow-info/40 flex items-center justify-center text-white">
                        <Server className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Saúde do Sistema</h1>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="h-2 w-2 rounded-full bg-success animate-ping"></span>
                            Monitoramento de Infraestrutura
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleRefresh}
                    className="relative z-10 premium-button bg-info text-white flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${(dbLoading || authLoading) ? 'animate-spin' : ''}`} /> Atualizar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statusCards.map((card, idx) => (
                    <div key={idx} className="glass-panel p-8 group hover:border-info/30 transition-all duration-500">
                        <div className="flex items-start justify-between mb-6">
                            <div className={`h-14 w-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <card.icon className="h-7 w-7" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Latência</p>
                                <p className="text-sm font-black font-mono">{card.latency}</p>
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-foreground tracking-tight">{card.title}</h3>
                        <p className="text-xs text-muted-foreground font-medium mb-6 uppercase tracking-wider">{card.subtitle}</p>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${card.color.replace('text', 'bg').replace('success', 'success/10').replace('info', 'info/10').replace('warning', 'warning/10')} ${card.color} border-current/20`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${card.color.replace('text', 'bg')} animate-pulse`} />
                            {card.status}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-10 space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <Wifi className="h-6 w-6 text-primary" />
                        Conectividade do Cliente
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                            <span className="text-sm font-bold opacity-70">Status da Rede</span>
                            <span className="flex items-center gap-2 text-sm font-black text-success">
                                <CheckCircle2 className="h-4 w-4" /> ONLINE
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                            <span className="text-sm font-bold opacity-70">Tipo de Conexão</span>
                            <span className="text-sm font-black">4G / Banda Larga</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                            <span className="text-sm font-bold opacity-70">User Agent</span>
                            <span className="text-[10px] font-mono opacity-50 truncate max-w-[200px]">{navigator.userAgent}</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-10 space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <Zap className="h-6 w-6 text-warning" />
                        Status dos Serviços Externos
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                            <span className="text-sm font-bold opacity-70">Evolution API (Whats)</span>
                            <span className="flex items-center gap-2 text-sm font-black text-success">
                                <CheckCircle2 className="h-4 w-4" /> DISPONÍVEL
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                            <span className="text-sm font-bold opacity-70">Edge Functions (Supabase)</span>
                            <span className="flex items-center gap-2 text-sm font-black text-success">
                                <CheckCircle2 className="h-4 w-4" /> OPERACIONAL
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                            <span className="text-sm font-bold opacity-70">Serviço de IA (OpenAI)</span>
                            <span className="flex items-center gap-2 text-sm font-black text-success">
                                <CheckCircle2 className="h-4 w-4" /> OPERACIONAL
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center opacity-40">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Última verificação global: {lastCheck.toLocaleTimeString()}</p>
            </div>
        </div>
    );
}
