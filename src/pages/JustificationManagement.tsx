import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    FileCheck, FileX, Clock, Search, Filter,
    CheckCircle2, XCircle, AlertCircle, Info
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function JustificationManagement() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    const { data: justifications = [], isLoading } = useQuery({
        queryKey: ["justifications"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("absence_justifications")
                .select("*, students(name, series, class)")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data as any[]) || [];
        }
    });

    const reviewMutation = useMutation({
        mutationFn: async ({ id, status, notes }: { id: string; status: 'approved' | 'rejected'; notes?: string }) => {
            const { error } = await (supabase as any)
                .from("absence_justifications")
                .update({
                    status,
                    reviewer_notes: notes,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: (await supabase.auth.getUser()).data.user?.id
                } as any)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["justifications"] });
            toast.success("Justificativa revisada com sucesso!");
        },
        onError: () => toast.error("Erro ao revisar justificativa.")
    });

    const filteredJustifications = justifications.filter(j =>
        filter === 'all' ? true : j.status === filter
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-widest border border-success/20">Aprovada</span>;
            case 'rejected': return <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest border border-destructive/20">Recusada</span>;
            default: return <span className="px-3 py-1 rounded-full bg-warning/10 text-warning text-[10px] font-black uppercase tracking-widest border border-warning/20 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Pendente</span>;
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-success/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                    <FileCheck className="w-64 h-64 text-primary" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground">
                        <FileCheck className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Gestão de Justificativas</h1>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
                            Análise de ausências e dispensas
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 px-2">
                {[
                    { id: 'all', label: 'Todas' },
                    { id: 'pending', label: 'Pendentes' },
                    { id: 'approved', label: 'Aprovadas' },
                    { id: 'rejected', label: 'Recusadas' }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setFilter(item.id as any)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === item.id
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-card border border-border/50 text-muted-foreground hover:bg-muted"
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center bg-card rounded-[2.5rem] border border-dashed border-border">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : filteredJustifications.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-card rounded-[2.5rem] border border-dashed border-border text-center p-10">
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
                            <Info className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-black text-foreground tracking-tight">Nenhuma justificativa encontrada</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">Tente ajustar seus filtros ou aguarde novas solicitações dos responsáveis.</p>
                    </div>
                ) : (
                    filteredJustifications.map((item) => (
                        <div key={item.id} className={`glass-panel p-8 relative overflow-hidden transition-all duration-300 ${item.status === 'pending' ? 'ring-2 ring-primary/20 ring-offset-4' : ''}`}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div className="flex items-start gap-6">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary/10 to-info/10 flex items-center justify-center text-primary font-black text-xl">
                                        {(item.students as any)?.name?.[0] || 'A'}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground tracking-tight">{item.students?.name}</h3>
                                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                            {item.students?.series} {item.students?.class}
                                            <span className="h-1 w-1 rounded-full bg-border"></span>
                                            Data: {format(new Date(item.justification_date), "dd/MM/yyyy")}
                                        </p>
                                        <div className="mt-4 p-4 rounded-2xl bg-muted/50 border border-border/50 max-w-2xl">
                                            <p className="text-sm text-foreground font-medium italic">"{item.reason}"</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    {item.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => reviewMutation.mutate({ id: item.id, status: 'approved' })}
                                                disabled={reviewMutation.isPending}
                                                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-success text-white font-black text-[10px] uppercase tracking-widest hover:bg-success/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="h-4 w-4" /> Aprovar
                                            </button>
                                            <button
                                                onClick={() => reviewMutation.mutate({ id: item.id, status: 'rejected' })}
                                                disabled={reviewMutation.isPending}
                                                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-destructive text-white font-black text-[10px] uppercase tracking-widest hover:bg-destructive/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="h-4 w-4" /> Recusar
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-end gap-2">
                                            {getStatusBadge(item.status)}
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Revisado em {item.reviewed_at ? format(new Date(item.reviewed_at), "dd/MM HH:mm") : '--'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
