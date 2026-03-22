import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    ShieldCheck, Clock, Search, Filter,
    CheckCircle2, XCircle, AlertCircle, Info,
    UserPlus, History, Trash2, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export default function ExitAuthorizations() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [reason, setReason] = useState("");

    // Fetch active exit authorizations
    const { data: authorizations = [], isLoading: loadingAuths } = useQuery({
        queryKey: ["exit-authorizations"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("exit_authorizations")
                .select("*, students(id, name, series, class)")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data as any[]) || [];
        }
    });

    // Search students for new authorization
    const { data: students = [], isLoading: searchingStudents } = useQuery({
        queryKey: ["students-search", searchTerm],
        queryFn: async () => {
            if (searchTerm.length < 3) return [];
            const { data, error } = await supabase
                .from("students")
                .select("id, name, series, class")
                .ilike("name", `%${searchTerm}%`)
                .limit(5);
            if (error) throw error;
            return data || [];
        },
        enabled: searchTerm.length >= 3
    });

    const createAuthMutation = useMutation({
        mutationFn: async () => {
            if (!selectedStudent || !reason) return;
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await (supabase as any)
                .from("exit_authorizations")
                .insert({
                    student_id: selectedStudent.id,
                    reason,
                    authorized_by: user?.id,
                    status: 'authorized'
                } as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exit-authorizations"] });
            toast.success("Saída autorizada com sucesso!");
            setSelectedStudent(null);
            setReason("");
            setSearchTerm("");
        },
        onError: (err: any) => toast.error("Erro ao autorizar: " + err.message)
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await (supabase as any)
                .from("exit_authorizations")
                .update({ status } as any)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exit-authorizations"] });
            toast.success("Status atualizado com sucesso!");
        }
    });

    const activeAuths = authorizations.filter(a => a.status === 'authorized');
    const historyAuths = authorizations.filter(a => a.status !== 'authorized');

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                    <ShieldCheck className="w-64 h-64 text-primary" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground">
                        <ShieldCheck className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Autorizações de Saída</h1>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            Controle de saídas antecipadas
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: New Authorization */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-8 space-y-6">
                        <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" /> Nova Autorização
                        </h2>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Buscar Aluno (mín. 3 letras)</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Nome do aluno..."
                                    className="w-full bg-muted/50 border-none h-12 pl-12 pr-4 rounded-xl font-bold text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
                                />
                            </div>

                            {searchTerm.length >= 3 && students.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {students.map((s: any) => (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setSelectedStudent(s);
                                                setSearchTerm("");
                                            }}
                                            className="w-full p-3 rounded-xl border border-border bg-card hover:bg-muted transition-all text-left flex items-center justify-between group"
                                        >
                                            <div>
                                                <p className="text-xs font-black text-foreground">{s.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold">{s.series} • {s.class}</p>
                                            </div>
                                            <ShieldCheck className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedStudent && (
                                <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-4 animate-in slide-in-from-top-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs">
                                                {selectedStudent.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-foreground">{selectedStudent.name}</p>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{selectedStudent.series} {selectedStudent.class}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedStudent(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Motivo da Saída</label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Ex: Consulta médica, liberado pelos pais..."
                                            rows={3}
                                            className="w-full bg-background border-none p-4 rounded-xl font-bold text-xs focus:ring-2 ring-primary/20 transition-all outline-none resize-none"
                                        />
                                    </div>

                                    <button
                                        onClick={() => createAuthMutation.mutate()}
                                        disabled={createAuthMutation.isPending || !reason}
                                        className="w-full py-4 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        Autorizar Saída Agora
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Authorizations & History */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Active Authorizations */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" /> Saídas Ativas (Hoje)
                        </h2>

                        {loadingAuths ? (
                            <div className="h-32 flex items-center justify-center bg-card rounded-[2rem] border border-dashed border-border">
                                <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : activeAuths.length === 0 ? (
                            <div className="p-10 text-center glass-panel border-dashed border-2">
                                <Info className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold text-muted-foreground">Nenhuma saída autorizada no momento</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {activeAuths.map((auth: any) => (
                                    <div key={auth.id} className="glass-panel p-6 group hover:ring-2 ring-primary/20 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                                                    {auth.students?.name[0]}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-foreground">{auth.students?.name}</h3>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                                        {auth.students?.series} {auth.students?.class} • Solicitação: {format(new Date(auth.authorized_at), "HH:mm")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateStatusMutation.mutate({ id: auth.id, status: 'revoked' })}
                                                    className="p-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm"
                                                    title="Revogar Autorização"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-border/50">
                                            <p className="text-[11px] text-foreground font-semibold italic">"{auth.reason}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* History */}
                    {historyAuths.length > 0 && (
                        <section className="space-y-6">
                            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2 opacity-50">
                                <History className="h-5 w-5" /> Histórico Recente
                            </h2>
                            <div className="grid gap-3">
                                {historyAuths.slice(0, 5).map((auth: any) => (
                                    <div key={auth.id} className="glass-panel p-4 flex items-center justify-between opacity-60">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white ${auth.status === 'used' ? 'bg-success' : 'bg-muted-foreground'}`}>
                                                {auth.status === 'used' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-foreground">{auth.students?.name}</p>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                                                    {auth.status === 'used' ? 'Saída Confirmada' : 'Revogada'} • {format(new Date(auth.authorized_at), "dd/MM")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${auth.status === 'used' ? 'border-success/30 text-success' : 'border-border text-muted-foreground'}`}>
                                                {auth.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
