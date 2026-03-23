import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, Search, Filter, AlertCircle, CheckCircle2, User, Phone, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export default function WhatsAppLogsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: logs, isLoading } = useQuery({
        queryKey: ["whatsapp-logs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("whatsapp_logs" as any)
                .select("*, students(name)")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as any[];
        },
    });

    const filteredLogs = logs?.filter((log: any) => {
        const matchesSearch = log.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             log.recipient_phone.includes(searchTerm) ||
                             log.students?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || log.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                    <History className="w-64 h-64 text-primary" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground">
                        <MessageSquare className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Logs de Comunicação</h1>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            Rastreamento de WhatsApp
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou aluno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="premium-input w-full pl-12"
                    />
                </div>
                <div className="relative group">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="premium-input pl-12 w-full md:w-[200px] appearance-none"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="sent">Enviado</option>
                        <option value="delivered">Entregue</option>
                        <option value="error">Erro</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="glass-panel p-6 animate-pulse h-24" />
                    ))
                ) : filteredLogs?.length === 0 ? (
                    <div className="glass-panel p-20 text-center space-y-4 opacity-50">
                        <MessageSquare className="h-16 w-16 mx-auto" />
                        <p className="font-black uppercase tracking-widest">Nenhum log encontrado.</p>
                    </div>
                ) : (
                    filteredLogs?.map((log: any) => (
                        <div key={log.id} className="group glass-panel p-6 hover:translate-x-2 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-transparent hover:border-l-primary">
                            <div className="flex items-center gap-6">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                    log.status === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                                }`}>
                                    {log.status === 'error' ? <AlertCircle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-black text-foreground">{log.recipient_name || 'Responsável'}</p>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{log.recipient_phone}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                        <User className="h-3 w-3" /> Aluno: <strong className="text-foreground">{log.students?.name || 'Não identificado'}</strong>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground italic truncate max-w-[300px] md:max-w-[500px]">"{log.message}"</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {format(new Date(log.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                                </span>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                    log.status === 'sent' ? 'bg-info/10 text-info border-info/20' :
                                    log.status === 'delivered' ? 'bg-success/10 text-success border-success/20' :
                                    'bg-destructive/10 text-destructive border-destructive/20'
                                }`}>
                                    {log.status === 'sent' ? 'Enviado' : log.status === 'delivered' ? 'Entregue' : 'Erro'}
                                </div>
                                {log.error_message && (
                                    <p className="text-[9px] text-destructive font-bold">{log.error_message}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
