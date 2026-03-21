import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Bell, ScanLine, ArrowRight, UserCheck, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LiveActivityFeed() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [activities, setActivities] = useState<any[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        audioRef.current = new Audio("/notification.mp3"); // Assuming you'll add a sound file here or use a base64 string later if needed. For now, it will silently fail if not present.
    }, []);

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play prevented by browser policy", e));
        }
    };

    const fetchInitialData = async () => {
        const { data: movements } = await supabase
            .from("movements")
            .select("*, students(name, series, class)")
            .gte("registered_at", today + "T00:00:00")
            .order("registered_at", { ascending: false })
            .limit(10);

        if (movements) {
            const formattedMovements = movements.map(m => ({
                id: m.id,
                type: 'movement',
                action: m.type === 'entry' ? 'IN' : 'OUT',
                studentName: m.students?.name || 'Desconhecido',
                details: `${m.students?.series || ''} • ${m.students?.class || ''}`,
                timestamp: m.registered_at,
                source: m.source_type || 'badge',
                isNew: false
            }));
            setActivities(formattedMovements);
        }
    };

    useEffect(() => {
        fetchInitialData();

        const movementsChannel = supabase
            .channel("live-feed-movements")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "movements" },
                async (payload) => {
                    const { data: studentData } = await supabase
                        .from("students")
                        .select("name, series, class")
                        .eq("id", payload.new.student_id)
                        .single();

                    const newActivity = {
                        id: payload.new.id,
                        type: 'movement',
                        action: payload.new.type === 'entry' ? 'IN' : 'OUT',
                        studentName: studentData?.name || 'Desconhecido',
                        details: `${studentData?.series || ''} • ${studentData?.class || ''}`,
                        timestamp: payload.new.registered_at,
                        source: payload.new.source_type || 'badge',
                        isNew: true
                    };

                    setActivities(prev => [newActivity, ...prev].slice(0, 15));
                }
            )
            .subscribe();

        const alertsChannel = supabase
            .channel("live-feed-alerts")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "alerts" },
                async (payload) => {
                    const { data: studentData } = await supabase
                        .from("students")
                        .select("name, series, class")
                        .eq("id", payload.new.student_id)
                        .single();

                    const newActivity = {
                        id: payload.new.id,
                        type: 'alert',
                        action: 'ALERTA',
                        studentName: studentData?.name || 'Desconhecido',
                        details: payload.new.type,
                        timestamp: payload.new.created_at,
                        isNew: true
                    };

                    playNotificationSound();
                    setActivities(prev => [newActivity, ...prev].slice(0, 15));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(movementsChannel);
            supabase.removeChannel(alertsChannel);
        };
    }, []);

    // Remove the 'isNew' highlight after a few seconds
    useEffect(() => {
        if (activities.some(a => a.isNew)) {
            const timer = setTimeout(() => {
                setActivities(prev => prev.map(a => ({ ...a, isNew: false })));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [activities]);

    const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="space-y-3 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary animate-pulse" />
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        Feed Ao Vivo
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                    </h3>
                </div>
                <Link to="/movimentacoes" className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1">
                    VER TUDO <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="glass-panel flex-1 overflow-hidden flex flex-col relative">
                <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 scrollbar-hide">
                    {activities.length === 0 ? (
                        <div className="p-8 h-full flex items-center justify-center text-center flex-col gap-2 opacity-50">
                            <ScanLine className="h-8 w-8 text-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground">Nenhuma movimentação hoje</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {activities.map((act) => (
                                <div
                                    key={act.id}
                                    className={`
                    flex items-center gap-3 p-3 border-b border-border/30 transition-all duration-500
                    ${act.isNew ? 'bg-primary/10 pl-4 border-l-2 border-l-primary shadow-[inset_0_0_20px_rgba(var(--primary),0.1)]' : 'hover:bg-secondary/30'}
                    ${act.type === 'alert' && act.isNew ? 'bg-destructive/10 border-l-destructive shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]' : ''}
                  `}
                                >
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 border
                    ${act.type === 'alert' ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-secondary text-muted-foreground border-border'}
                  `}>
                                        {act.type === 'alert' ? <Bell className="h-4 w-4" /> : 
                                         act.source === 'face' ? <UserCheck className="h-4 w-4 text-accent" /> :
                                         initials(act.studentName)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-medium truncate ${act.type === 'alert' ? 'text-destructive' : 'text-foreground'}`}>
                                            {act.studentName}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-mono truncate">{act.details}</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className={`
                      text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border
                      ${act.action === "IN" ? "bg-success/10 text-success border-success/20" :
                                                act.action === "OUT" ? "bg-warning/10 text-warning border-warning/20" :
                                                    "bg-destructive/10 text-destructive border-destructive/20 animate-pulse"}
                    `}>
                                            {act.action}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
                                            {new Date(act.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            </div>
        </div>
    );
}
