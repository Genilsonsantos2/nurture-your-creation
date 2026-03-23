import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Users,
    ArrowRightLeft,
    ChevronRight,
    Search,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    ArrowLeft,
    Loader2,
    Check
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function AllocationPortal() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [sourceSeries, setSourceSeries] = useState(searchParams.get("series") || "");
    const [sourceClass, setSourceClass] = useState(searchParams.get("class") || "");
    const [targetSeries, setTargetSeries] = useState("");
    const [targetClass, setTargetClass] = useState("");
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const { data: allStudents, isLoading: loadingStudents } = useQuery({
        queryKey: ["students-allocation"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("students")
                .select("*")
                .eq("active", true)
                .order("name");
            if (error) throw error;
            return data;
        },
    });

    // Extract unique series and classes for selectors
    const seriesList = Array.from(new Set(allStudents?.map((s) => s.series))).sort();
    const classList = Array.from(new Set(allStudents?.map((s) => s.class))).sort();

    const filteredStudents = allStudents?.filter((s) => {
        const matchesSource = s.series === sourceSeries && s.class === sourceClass;
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSource && matchesSearch;
    });

    const toggleStudent = (id: string) => {
        setSelectedStudents((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedStudents.length === filteredStudents?.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents?.map((s) => s.id) || []);
        }
    };

    const allocationMutation = useMutation({
        mutationFn: async () => {
            if (!targetSeries || !targetClass) {
                throw new Error("Selecione a turma de destino.");
            }
            if (selectedStudents.length === 0) {
                throw new Error("Selecione pelo menos um aluno.");
            }

            const { error } = await supabase
                .from("students")
                .update({ series: targetSeries, class: targetClass })
                .in("id", selectedStudents);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students-allocation"] });
            queryClient.invalidateQueries({ queryKey: ["all-students-classes"] });
            toast.success(`${selectedStudents.length} alunos alocados com sucesso!`);
            setSelectedStudents([]);
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-10 rounded-[3rem] border border-white/10 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                    <ArrowRightLeft className="w-64 h-64 text-white" />
                </div>

                <div className="relative z-10 flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Portal de Alocação</h1>
                        <p className="text-sm text-gray-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
                            Movimentação em Massa de Alunos
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Source Selection Column */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="glass-panel p-8 space-y-6">
                        <h2 className="text-lg font-black tracking-tight flex items-center gap-3">
                            <Users className="h-5 w-5 text-primary" /> 1. Turma de Origem
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Série</label>
                                <select
                                    value={sourceSeries}
                                    onChange={(e) => {
                                        setSourceSeries(e.target.value);
                                        setSelectedStudents([]);
                                    }}
                                    className="w-full bg-muted/50 border-2 border-border/50 rounded-2xl px-4 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
                                >
                                    <option value="">Selecionar...</option>
                                    {seriesList.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Turma</label>
                                <select
                                    value={sourceClass}
                                    onChange={(e) => {
                                        setSourceClass(e.target.value);
                                        setSelectedStudents([]);
                                    }}
                                    className="w-full bg-muted/50 border-2 border-border/50 rounded-2xl px-4 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
                                >
                                    <option value="">Selecionar...</option>
                                    {classList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {sourceSeries && sourceClass && (
                            <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Filtrar alunos..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-muted/30 border border-border/50 rounded-xl pl-12 pr-4 py-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>

                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        {filteredStudents?.length || 0} alunos encontrados
                                    </span>
                                    <button
                                        onClick={selectAll}
                                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                    >
                                        {selectedStudents.length === filteredStudents?.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                    </button>
                                </div>

                                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {filteredStudents?.map((student) => (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleStudent(student.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedStudents.includes(student.id)
                                                ? 'border-primary bg-primary/5 shadow-lg'
                                                : 'border-border/50 bg-background hover:border-primary/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black ${selectedStudents.includes(student.id) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold truncate max-w-[180px]">{student.name}</span>
                                            </div>
                                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedStudents.includes(student.id) ? 'bg-primary border-primary' : 'border-border'
                                                }`}>
                                                {selectedStudents.includes(student.id) && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredStudents?.length === 0 && (
                                        <div className="py-10 text-center text-muted-foreground italic text-xs">Nenhum aluno nesta turma</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Column */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center py-10">
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                        <ArrowRightLeft className="h-8 w-8" />
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Destino</p>
                        <div className="h-20 w-[2px] bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20 mx-auto my-4" />
                    </div>
                </div>

                {/* Target Selection Column */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="glass-panel p-8 space-y-8 bg-gradient-to-br from-background via-background to-primary/[0.03]">
                        <h2 className="text-lg font-black tracking-tight flex items-center gap-3">
                            <GraduationCap className="h-5 w-5 text-success" /> 2. Turma de Destino
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Série Destino</label>
                                <select
                                    value={targetSeries}
                                    onChange={(e) => setTargetSeries(e.target.value)}
                                    className="w-full bg-muted/50 border-2 border-border/50 rounded-2xl px-4 py-4 text-sm font-bold focus:border-success outline-none transition-all"
                                >
                                    <option value="">Selecionar...</option>
                                    {seriesList.map(s => <option key={s} value={s}>{s}</option>)}
                                    <optgroup label="Nova Série">
                                        <option value="NOVA">Outra...</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Turma Destino</label>
                                <select
                                    value={targetClass}
                                    onChange={(e) => setTargetClass(e.target.value)}
                                    className="w-full bg-muted/50 border-2 border-border/50 rounded-2xl px-4 py-4 text-sm font-bold focus:border-success outline-none transition-all"
                                >
                                    <option value="">Selecionar...</option>
                                    {classList.map(c => <option key={c} value={c}>{c}</option>)}
                                    <optgroup label="Nova Turma">
                                        <option value="NOVA">Outra...</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Resumo da Operação</p>
                                <span className={`px-4 py-1.5 rounded-xl text-xs font-black ${selectedStudents.length > 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground opacity-50'}`}>
                                    {selectedStudents.length} Alunos
                                </span>
                            </div>

                            <div className="space-y-4">
                                {selectedStudents.length > 0 ? (
                                    <div className="flex items-center gap-4 text-sm font-bold">
                                        <div className="flex-1 p-3 rounded-xl bg-background border border-border/50 text-center">
                                            {sourceSeries} - {sourceClass}
                                        </div>
                                        <ArrowRightLeft className="h-4 w-4 text-primary" />
                                        <div className="flex-1 p-3 rounded-xl bg-success/10 border border-success/20 text-success text-center">
                                            {targetSeries || '...'} - {targetClass || '...'}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-xs text-muted-foreground py-4 italic">Selecione alunos e destino para continuar</p>
                                )}
                            </div>

                            <button
                                onClick={() => allocationMutation.mutate()}
                                disabled={selectedStudents.length === 0 || !targetSeries || !targetClass || allocationMutation.isPending}
                                className="w-full premium-button py-6 bg-primary hover:bg-primary/90 shadow-primary/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-xs font-black flex items-center justify-center gap-3"
                            >
                                {allocationMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" /> Processando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" /> Confirmar Alocação em Massa
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                            <p className="text-[10px] font-medium text-amber-600 leading-relaxed">
                                Esta ação alterará o vínculo acadêmico de todos os alunos selecionados permanentemente. Isso afeta relatórios de frequência e documentos gerados.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
