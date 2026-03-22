import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ShieldCheck, History, User, Activity, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuditLogsPage() {
    const { isAdmin } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: logs, isLoading } = useQuery({
        queryKey: ["audit_logs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("audit_logs" as any)
                .select(`
          id, action_type, entity_name, entity_id, created_at, details,
          user_id,
          profiles:user_id ( full_name, email )
        `)
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) throw error;
            return (data as any[]) || [];
        },
        enabled: isAdmin,
    });

    const getActionColor = (action: string) => {
        switch (action) {
            case "CREATE": return "text-success bg-success/10 border-success/20";
            case "UPDATE": return "text-info bg-info/10 border-info/20";
            case "DELETE": return "text-destructive bg-destructive/10 border-destructive/20";
            case "LOGIN": return "text-primary bg-primary/10 border-primary/20";
            case "EXPORT": return "text-warning bg-warning/10 border-warning/20";
            default: return "text-muted-foreground bg-muted border-border/50";
        }
    };

    const filteredLogs = logs?.filter(log => {
        const searchLow = searchTerm.toLowerCase();
        const userProfile = (log.profiles as any);
        const userName = userProfile?.full_name || userProfile?.email || "Sistema";

        return log.action_type.toLowerCase().includes(searchLow) ||
            log.entity_name.toLowerCase().includes(searchLow) ||
            userName.toLowerCase().includes(searchLow);
    });

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <ShieldCheck className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
                <h2 className="text-xl font-bold">Acesso Restrito</h2>
                <p className="text-muted-foreground">Apenas administradores podem acessar o log de auditoria.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <History className="w-64 h-64 text-primary" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground">
                        <Activity className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">Registros de Auditoria</h1>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            Rastreamento de Atividades
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por usuário, ação ou entidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="premium-input pl-12 w-full"
                        />
                    </div>
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                        {filteredLogs?.length || 0} Registros
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/20">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data/Hora</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usuário</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ação</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entidade</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-medium animate-pulse">
                                        Carregando registros...
                                    </td>
                                </tr>
                            ) : filteredLogs?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-medium">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs?.map((log) => {
                                    const userProfile = (log.profiles as any);
                                    return (
                                        <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                                                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground opacity-70" />
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {userProfile?.full_name || userProfile?.email || "Sistema"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getActionColor(log.action_type)}`}>
                                                    {log.action_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-semibold text-muted-foreground capitalize">
                                                    {log.entity_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate" title={JSON.stringify(log.details)}>
                                                {log.details ? JSON.stringify(log.details).substring(0, 50) + "..." : "-"}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
