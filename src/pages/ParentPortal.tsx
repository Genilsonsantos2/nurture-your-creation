import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, LogIn, LogOut, User, BookOpen, AlertTriangle, ShieldCheck, Soup, Award, Star } from "lucide-react";
import { isSchoolDay } from "@/lib/calendar";

export default function ParentPortal() {
    const { token } = useParams<{ token: string }>();

    const { data: student, isLoading: loadingStudent } = useQuery({
        queryKey: ["parent-student", token],
        queryFn: async () => {
            // For this implementation, we'll use student_id as the token for now
            // In a production app, we'd use a dedicated secure/hashed token
            const { data, error } = await supabase
                .from("students")
                .select("*, movements(*), alerts(*)")
                .eq("id", token)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!token,
    });
    
    const { data: achievements } = useQuery({
        queryKey: ["parent-achievements", token],
        queryFn: async () => {
            const { data, error } = await (supabase
                .from("student_achievements")
                .select("*")
                .eq("student_id", student?.id) as any);
            if (error) return [];
            return data;
        },
        enabled: !!student?.id,
    });

    if (loadingStudent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
                <div className="h-20 w-20 rounded-3xl bg-destructive/10 flex items-center justify-center mb-6">
                    <User className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
                <p className="text-muted-foreground max-w-xs">Este link de acompanhamento é inválido ou expirou. Por favor, solicite um novo link à secretaria da escola.</p>
            </div>
        );
    }

    const movements = (student.movements || []).sort((a: any, b: any) =>
        new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
    );

    const alerts = (student.alerts || []).sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-8 rounded-b-[3rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <BookOpen className="w-48 h-48" />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black">
                            {student.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">{student.name}</h1>
                            <p className="text-primary-foreground/80 font-medium">Portal do Responsável • {student.series} {student.class}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Matrícula</p>
                            <p className="text-lg font-bold">{student.enrollment}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Status</p>
                            <p className="text-lg font-bold">{student.active ? "Ativo" : "Inativo"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-6 gap-8 grid grid-cols-1 lg:grid-cols-3">
                {/* Movements Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" /> Movimentações Recentes
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {movements.length === 0 ? (
                            <div className="bg-card border rounded-[2rem] p-12 text-center">
                                <p className="text-muted-foreground font-medium">Nenhuma movimentação registrada.</p>
                            </div>
                        ) : (
                            movements.slice(0, 10).map((mov: any) => (
                                <div key={mov.id} className="bg-card border rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${mov.type === "entry" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                                            }`}>
                                            {mov.type === "entry" ? <LogIn className="h-6 w-6" /> : <LogOut className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">
                                                {mov.observation || (mov.type === "entry" ? "Entrada (Atraso)" : "Saída Institucional / Antecipada")}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {new Date(mov.registered_at).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-foreground">
                                            {new Date(mov.registered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Alerts Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" /> Ocorrências
                    </h2>

                    <div className="space-y-3">
                        {alerts.length === 0 ? (
                            <div className="bg-card border rounded-[2rem] p-8 text-center">
                                <p className="text-xs text-muted-foreground font-medium">Nenhuma ocorrência registrada.</p>
                            </div>
                        ) : (
                            alerts.map((alert: any) => (
                                <div key={alert.id} className="bg-card border rounded-2xl p-4 border-l-4 border-l-destructive/50 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                                            {alert.type}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground">
                                            {new Date(alert.created_at).toLocaleDateString("pt-BR")}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-foreground leading-relaxed">{alert.description}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* School Day Info */}
                    <div className="bg-gradient-to-br from-secondary/50 to-secondary p-6 rounded-[2rem] border border-border/50 text-center">
                        <Calendar className="h-8 w-8 text-primary mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-foreground">Acompanhamento Diário</h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Veja as presenças do seu filho em tempo real.</p>
                        <div className={`inline-block px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isSchoolDay(new Date()) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                            }`}>
                            {isSchoolDay(new Date()) ? "Hoje é Dia Letivo" : "Hoje Não é Dia Letivo"}
                        </div>
                    </div>

                    {/* Achievements Section */}
                    <div className="space-y-4 pt-4">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                          <Award className="h-5 w-5 text-amber-500" /> Conquistas
                      </h2>
                      <div className="grid grid-cols-2 gap-3">
                        {(achievements && achievements.length > 0) ? achievements.map((ach: any) => (
                           <div key={ach.id} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 text-center">
                             <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                               <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                             </div>
                             <p className="text-[10px] font-black text-amber-500 uppercase leading-tight">{ach.title}</p>
                           </div>
                        )) : (
                          <div className="col-span-2 bg-card border border-dashed rounded-2xl p-6 text-center opacity-50">
                            <p className="text-[10px] font-bold text-muted-foreground italic">Nenhuma conquista ainda</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meal Summary */}
                    <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/20">
                      <div className="flex items-center gap-3 mb-4">
                        <Soup className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">Registro de Merenda</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-muted-foreground uppercase">Hoje</span>
                          <span className="text-success uppercase">Confirmado • Almoço</span>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full">
                          <div className="h-full bg-success w-full rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Digital Sign-off Placeholder */}
                    <div className="pt-4">
                      <button className="w-full bg-foreground text-background py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl">
                        <ShieldCheck className="h-4 w-4" /> Validar Justificativas
                      </button>
                      <p className="text-[10px] text-center text-muted-foreground mt-2 font-medium">Assinatura digital requerida para validação mensal.</p>
                    </div>
                </div>
            </div>

            {/* Footer Decoration */}
            <div className="mt-12 text-center opacity-30 select-none">
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">CETI NOVA ITARANA • 2026</p>
            </div>
        </div>
    );
}
