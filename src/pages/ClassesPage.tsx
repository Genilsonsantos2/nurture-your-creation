import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Plus, Trash2, Users, GraduationCap, ChevronRight, School, Users2 } from "lucide-react";
import { toast } from "sonner";

export default function ClassesPage() {
    const queryClient = useQueryClient();

    const { data: students, isLoading } = useQuery({
        queryKey: ["all-students-classes"],
        queryFn: async () => {
            const { data, error } = await supabase.from("students").select("series, class").eq("active", true);
            if (error) throw error;
            return data;
        },
    });

    // Calculate unique classes from student data
    const classesMap = new Map<string, number>();
    students?.forEach(s => {
        const key = `${s.series}-${s.class}`;
        classesMap.set(key, (classesMap.get(key) || 0) + 1);
    });

    const classList = Array.from(classesMap.entries()).map(([key, count]) => {
        const [series, name] = key.split("-");
        return { series, name, count };
    }).sort((a, b) => a.series.localeCompare(b.series) || a.name.localeCompare(b.name));

    const addClassMutation = useMutation({
        mutationFn: async () => {
            toast.info("Para criar novas turmas, adicione alunos vinculados a elas no menu Alunos.");
        }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <School className="w-64 h-64 text-primary" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground">
                        <GraduationCap className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">Gestão de Turmas</h1>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            Estrutura Escolar & Enturmação
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex bg-card/50 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2.5rem] p-3 shadow-2xl">
                    <div className="px-8 py-3 text-center border-r border-border/50">
                        <p className="text-3xl font-black text-primary tracking-tighter">{classList.length}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ativas</p>
                    </div>
                    <div className="px-8 py-3 text-center">
                        <p className="text-3xl font-black text-foreground tracking-tighter">{students?.length || 0}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Alunos</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="glass-panel p-8 animate-pulse space-y-4">
                            <div className="h-12 w-12 rounded-2xl bg-muted" />
                            <div className="h-6 w-3/4 bg-muted rounded" />
                        </div>
                    ))
                ) : classList.map((cls, idx) => (
                    <div key={idx} className="group glass-panel p-8 hover:translate-y-[-8px] hover:border-primary/30 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full pointer-events-none -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary/10 to-transparent text-primary flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform duration-500">
                                <GraduationCap className="h-7 w-7" />
                            </div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-4 py-2 rounded-2xl shadow-sm">
                                {cls.series}
                            </span>
                        </div>

                        <div className="space-y-1 mb-8 relative z-10">
                            <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">Turma {cls.name}</h3>
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                <Users2 className="h-4 w-4" />
                                <span>{cls.count} Estudantes</span>
                            </div>
                        </div>

                        <button className="w-full py-5 rounded-2xl bg-muted/50 text-foreground text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30 transition-all relative z-10 active:scale-95">
                            Gerenciar Enturmação <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => addClassMutation.mutate()}
                    className="rounded-[3rem] border-2 border-dashed border-border/50 p-10 flex flex-col items-center justify-center gap-5 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all group min-h-[280px] hover:scale-[1.02] active:scale-95"
                >
                    <div className="h-16 w-16 rounded-[2rem] bg-muted/30 flex items-center justify-center group-hover:bg-primary/20 group-hover:rotate-90 transition-all duration-500 shadow-inner">
                        <Plus className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                        <span className="block text-sm font-black uppercase tracking-widest">Criar Turma</span>
                        <span className="text-[10px] font-medium opacity-60">Adicione novos grupos</span>
                    </div>
                </button>
            </div>

            {/* Help / Information Section */}
            <div className="p-10 rounded-[3rem] bg-muted/20 border border-border/40 flex items-start gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none -ml-32 -mt-32" />
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 relative z-10">
                    <BookOpen className="h-6 w-6" />
                </div>
                <div className="relative z-10">
                    <h4 className="font-black text-foreground tracking-tight uppercase text-xs tracking-[0.2em] mb-2">Arquitetura de Dados</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl font-medium">
                        As turmas são estruturadas dinamicamente com base no vínculo acadêmico de cada estudante.
                        Para alocar um estudante em uma turma específica ou alterar sua série, utilize o menu <strong className="text-foreground">Alunos</strong>.
                        Qualquer alteração na enturmação reflete instantaneamente nos relatórios de frequência e disciplina.
                    </p>
                </div>
            </div>
        </div>
    );
}
