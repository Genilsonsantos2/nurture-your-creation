import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Plus, Trash2, Users, GraduationCap, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function ClassesPage() {
    const queryClient = useQueryClient();
    const [newClassName, setNewClassName] = useState("");
    const [newSeries, setNewSeries] = useState("");

    const { data: students } = useQuery({
        queryKey: ["all-students-classes"],
        queryFn: async () => {
            const { data, error } = await supabase.from("students").select("series, class").eq("active", true);
            if (error) throw error;
            return data;
        },
    });

    // Calculate unique classes from student data (for now, as we don't have a dedicated table yet)
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
        <div className="space-y-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent p-8 rounded-[2.5rem] border border-primary/10 relative overflow-hidden">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Gestão de Turmas 🏫</h1>
                    <p className="text-muted-foreground font-medium">Organize os estudantes em salas e séries para melhor controle.</p>
                </div>
                <div className="flex bg-white dark:bg-card border border-primary/10 rounded-2xl p-2 shadow-sm">
                    <div className="px-6 py-2 text-center border-r border-border/50">
                        <p className="text-2xl font-black text-primary">{classList.length}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Turmas Ativas</p>
                    </div>
                    <div className="px-6 py-2 text-center">
                        <p className="text-2xl font-black text-foreground">{students?.length || 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Alunos</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {classList.map((cls, idx) => (
                    <div key={idx} className="glass-panel p-6 group hover:border-primary/30 transition-all duration-500">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                                {cls.series}
                            </span>
                        </div>

                        <h3 className="text-xl font-black text-foreground mb-1 group-hover:text-primary transition-colors">Turma {cls.name}</h3>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-6">
                            <Users className="h-4 w-4" />
                            <span>{cls.count} Alunos matriculados</span>
                        </div>

                        <button className="w-full py-3 rounded-xl bg-muted/50 text-foreground text-xs font-bold flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            Ver Integrantes <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => addClassMutation.mutate()}
                    className="rounded-[2rem] border-2 border-dashed border-border/50 p-8 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all group min-h-[220px]"
                >
                    <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center group-hover:bg-primary/10">
                        <Plus className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold">Criar Nova Turma</span>
                </button>
            </div>

            <div className="glass-panel p-8 bg-info/[0.02] border-info/20">
                <div className="flex items-start gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-info/10 text-info flex items-center justify-center shrink-0">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Ajuda: Como gerenciar turmas?</h3>
                        <p className="text-sm text-muted-foreground font-medium mt-1 leading-relaxed">
                            As turmas são geradas automaticamente com base nos dados dos alunos. Para alocar um estudante em uma turma específica, acesse o menu **Alunos** e edite o perfil do estudante ou utilize a **Importação em Massa** via CSV.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
