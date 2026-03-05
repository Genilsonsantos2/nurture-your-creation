import { SCHOOL_CALENDAR_2026 } from "@/lib/calendar";
import { Calendar as CalendarIcon, Flag, Coffee, BookOpen, AlertTriangle, Plus, Trash2, CalendarDays, X, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CalendarPage() {
    const { isAdmin, role } = useAuth();
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        type: "event",
        description: ""
    });

    const isCoordinator = isAdmin || role === "coordinator";

    const { data: dbEvents = [] } = useQuery({
        queryKey: ["school-events"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("school_events")
                .select("*")
                .order("event_date");
            if (error) throw error;
            return (data as any[]) || [];
        }
    });

    const createEventMutation = useMutation({
        mutationFn: async (event: any) => {
            const { error } = await (supabase as any).from("school_events").insert({
                title: event.title,
                event_date: event.date,
                event_type: event.type,
                description: event.description
            } as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["school-events"] });
            setIsAddModalOpen(false);
            setNewEvent({ title: "", date: format(new Date(), "yyyy-MM-dd"), type: "event", description: "" });
            toast.success("Evento adicionado com sucesso!");
        },
        onError: () => toast.error("Erro ao adicionar evento.")
    });

    const deleteEventMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any).from("school_events").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["school-events"] });
            toast.success("Evento removido.");
        }
    });

    // Merge static and dynamic events
    const allEvents = [...SCHOOL_CALENDAR_2026, ...dbEvents.map(e => ({
        date: e.event_date,
        description: e.title,
        type: e.event_type,
        dbId: e.id
    }))];

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const getDayEvents = (monthIndex: number, day: number) => {
        const year = 2026;
        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return allEvents.filter((e) => e.date === dateStr);
    };

    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                    <CalendarDays className="w-64 h-64 text-primary" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground">
                        <CalendarIcon className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Calendário Letivo</h1>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            Programação Oficial 2026
                        </p>
                    </div>
                </div>
                {isCoordinator && (
                    <div className="relative z-10">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="premium-button shadow-primary/20"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Novo Evento
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {months.map((monthName, mIdx) => {
                    const daysInMonth = getDaysInMonth(mIdx, 2026);
                    const firstDay = getFirstDayOfMonth(mIdx, 2026);

                    return (
                        <div key={monthName} className="glass-panel p-8 group hover:border-primary/20 transition-all">
                            <h2 className="text-xl font-black mb-6 text-foreground tracking-tight border-b border-border/50 pb-4 flex items-center justify-between">
                                {monthName}
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-muted h-6 px-3 flex items-center rounded-full">2026</span>
                            </h2>
                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-muted-foreground/40 mb-3 tracking-tighter">
                                <span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square" />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const events = getDayEvents(mIdx, day);
                                    const isSaturday = (firstDay + i) % 7 === 6;
                                    const isSunday = (firstDay + i) % 7 === 0;

                                    let bgColor = "hover:bg-primary/5 transition-all";
                                    let textColor = "text-foreground font-bold";
                                    let indicator = null;

                                    if (events.length > 0) {
                                        const type = events[0].type;
                                        if (type === "holiday") {
                                            bgColor = "bg-red-500/10 hover:bg-red-500/20";
                                            textColor = "text-red-600";
                                            indicator = <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-500 m-1" />;
                                        } else if (type === "recess") {
                                            bgColor = "bg-blue-500/10 hover:bg-blue-500/20";
                                            textColor = "text-blue-600";
                                            indicator = <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-blue-500 m-1" />;
                                        } else if (type === "school_saturday") {
                                            bgColor = "bg-success/10 hover:bg-success/20";
                                            textColor = "text-success";
                                            indicator = <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-success m-1" />;
                                        } else if (type === "event") {
                                            bgColor = "bg-primary/10 hover:bg-primary/20";
                                            textColor = "text-primary";
                                            indicator = <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-primary m-1" />;
                                        }
                                    } else if (isSunday || isSaturday) {
                                        textColor = "text-muted-foreground/30";
                                    }

                                    return (
                                        <div key={day}
                                            className={`relative aspect-square flex items-center justify-center rounded-xl text-xs sm:text-sm cursor-pointer group/day ${bgColor} ${textColor}`}
                                            title={events.map(e => e.description).join(", ")}
                                        >
                                            {day}
                                            {indicator}
                                            {events.some(e => (e as any).dbId) && isCoordinator && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const eventId = (events.find(e => (e as any).dbId) as any).dbId;
                                                        if (confirm("Deseja remover este evento?")) deleteEventMutation.mutate(eventId);
                                                    }}
                                                    className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover/day:opacity-100 transition-all scale-75 group-hover/day:scale-100 z-10"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="glass-panel p-10">
                <h2 className="text-xl font-black mb-8 tracking-tight uppercase text-xs tracking-[0.2em] text-muted-foreground">Legenda do Calendário</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-6 rounded-lg bg-red-500/10 border border-red-500/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Feriado Nacional</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Recesso Escolar</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-6 rounded-lg bg-success/10 border border-success/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sábado Letivo</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Atividade Extra</span>
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-md rounded-[2.5rem] border border-border shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-tight">Novo Registro</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1">Título do Evento</label>
                                <input
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="Ex: Reunião de Pais..."
                                    className="premium-input w-full"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1">Data</label>
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                        className="premium-input w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1">Tipo</label>
                                    <select
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                                        className="premium-input w-full"
                                    >
                                        <option value="event">Atividade</option>
                                        <option value="holiday">Feriado</option>
                                        <option value="recess">Recesso</option>
                                        <option value="school_saturday">Sábado Letivo</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => createEventMutation.mutate(newEvent)}
                            disabled={createEventMutation.isPending || !newEvent.title}
                            className="premium-button w-full shadow-primary/20"
                        >
                            <Save className="h-4 w-4 mr-2" /> {createEventMutation.isPending ? "Salvando..." : "Salvar no Calendário"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
