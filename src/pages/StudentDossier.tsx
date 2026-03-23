import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Calendar, Clock, LogIn, LogOut, User, BookOpen,
    AlertTriangle, FileCheck, ArrowLeft, Filter,
    Download, ExternalLink, ChevronRight, Info
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type TimelineEvent = {
    id: string;
    type: 'movement' | 'occurrence' | 'justification';
    date: Date;
    title: string;
    description?: string;
    status?: string;
    metadata?: any;
};

export default function StudentDossier() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: student, isLoading: loadingStudent } = useQuery({
        queryKey: ["student-details", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("students")
                .select("*")
                .eq("id", id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    const { data: timelineEvents = [], isLoading: loadingTimeline } = useQuery({
        queryKey: ["student-timeline", id],
        queryFn: async () => {
            // Fetch Movements
            const { data: movements } = await supabase
                .from("movements")
                .select("*")
                .eq("student_id", id);

            // Fetch Occurrences
            const { data: occurrences } = await supabase
                .from("occurrences")
                .select("*")
                .eq("student_id", id);

            // Fetch Justifications
            const { data: justifications } = await supabase
                .from("absence_justifications")
                .select("*")
                .eq("student_id", id);

            const events: TimelineEvent[] = [];

            (movements || []).forEach(m => {
                events.push({
                    id: m.id,
                    type: 'movement',
                    date: new Date(m.registered_at),
                    title: m.type === 'entry' ? 'Entrada na Escola' : 'Saída da Escola',
                    metadata: { type: m.type }
                });
            });

            (occurrences || []).forEach(o => {
                events.push({
                    id: o.id,
                    type: 'occurrence',
                    date: new Date(o.created_at),
                    title: `Ocorrência: ${o.type}`,
                    description: o.description
                });
            });

            (justifications || []).forEach(j => {
                events.push({
                    id: j.id,
                    type: 'justification',
                    date: new Date(j.justification_date),
                    title: 'Justificativa de Falta',
                    description: j.reason,
                    status: j.status,
                    metadata: { document_url: (j as any).document_url }
                });
            });

            return events.sort((a, b) => b.date.getTime() - a.date.getTime());
        },
        enabled: !!id,
    });

    if (loadingStudent || loadingTimeline) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!student) return <div>Aluno não encontrado.</div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header com Informações do Aluno */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-gradient-to-br from-primary/10 via-info/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
                <div className="relative z-10 flex items-center gap-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-14 w-14 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-primary hover:scale-110 transition-all active:scale-95"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-tr from-primary to-info shadow-2xl flex items-center justify-center text-white font-black text-3xl">
                        {student.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">{student.name}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">{student.series} {student.class}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-border" />
                            <span className="text-xs text-muted-foreground font-black uppercase tracking-widest">Matrícula: {student.enrollment}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <button className="px-6 py-4 rounded-2xl bg-white border border-border shadow-sm flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all">
                        <Download className="h-4 w-4" /> Exportar Dossiê
                    </button>
                </div>
            </div>

            {/* Linha do Tempo */}
            <div className="max-w-4xl mx-auto px-4">
                <div className="relative">
                    {/* Linha vertical centralizada em telas grandes, lateral em pequenas */}
                    <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-1 bg-border/40 -translate-x-1/2" />

                    <div className="space-y-12">
                        {timelineEvents.map((event, index) => (
                            <div key={event.id} className={`relative flex items-center gap-8 lg:gap-0 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                                {/* Ícone na linha */}
                                <div className="absolute left-8 lg:left-1/2 h-12 w-12 rounded-2xl bg-white border-4 border-background shadow-xl flex items-center justify-center z-10 -translate-x-1/2 transition-transform hover:scale-110">
                                    {event.type === 'movement' && (
                                        event.metadata?.type === 'entry' ? <LogIn className="h-5 w-5 text-success" /> : <LogOut className="h-5 w-5 text-warning" />
                                    )}
                                    {event.type === 'occurrence' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                                    {event.type === 'justification' && <FileCheck className="h-5 w-5 text-info" />}
                                </div>

                                {/* Conteúdo - Card */}
                                <div className={`w-full lg:w-[45%] ml-16 lg:ml-0 ${index % 2 === 0 ? 'lg:pr-12' : 'lg:pl-12'}`}>
                                    <div className={`glass-panel p-6 hover:border-primary/30 transition-all group ${event.type === 'occurrence' ? 'border-l-4 border-l-destructive' :
                                            event.type === 'justification' ? 'border-l-4 border-l-info' : ''
                                        }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                {format(event.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </span>
                                            {event.status && (
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${event.status === 'approved' ? 'bg-success/10 text-success' :
                                                        event.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                                                    }`}>
                                                    {event.status === 'approved' ? 'Aprovado' : event.status === 'rejected' ? 'Recusado' : 'Pendente'}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{event.title}</h3>
                                        {event.description && (
                                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed italic">"{event.description}"</p>
                                        )}

                                        {event.metadata?.document_url && (
                                            <a
                                                href={event.metadata.document_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                            >
                                                <ExternalLink className="h-3 w-3" /> Ver Anexo
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {timelineEvents.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[3rem] border border-dashed border-border/50 text-center px-10">
                                <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground mb-6">
                                    <Info className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-black text-foreground tracking-tight">Sem registros históricos</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-xs">Este aluno ainda não possui movimentações, ocorrências ou justificativas registradas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
