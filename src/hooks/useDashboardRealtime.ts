import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDashboardRealtime() {
    const queryClient = useQueryClient();

    useEffect(() => {
        console.log("Setting up real-time subscriptions for Dashboard...");

        // Canal para ouvir movimentos (entradas/saídas)
        const movementsChannel = supabase
            .channel("dashboard-movements")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "movements" },
                (payload) => {
                    console.log("Novo movimento detectado:", payload);
                    queryClient.invalidateQueries({ queryKey: ["movements-today"] });
                    queryClient.invalidateQueries({ queryKey: ["students-count"] });
                }
            )
            .subscribe();

        // Canal para ouvir alertas (ocorrências/ausências)
        const alertsChannel = supabase
            .channel("dashboard-alerts")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "alerts" },
                (payload) => {
                    console.log("Mudança de alerta detectada:", payload);
                    queryClient.invalidateQueries({ queryKey: ["alerts-pending"] });
                    if (payload.eventType === "INSERT") {
                        toast.warning("Novo alerta gerado! Verifique as ações pendentes.");
                    }
                }
            )
            .subscribe();

        // Canal para ouvir justificativas
        const justificationsChannel = supabase
            .channel("dashboard-justifications")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "absence_justifications" },
                (payload) => {
                    console.log("Mudança de justificativa detectada:", payload);
                    queryClient.invalidateQueries({ queryKey: ["justifications-pending"] });
                }
            )
            .subscribe();

        // Canal para ouvir alunos
        const studentsChannel = supabase
            .channel("dashboard-students")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "students" },
                (payload) => {
                    console.log("Mudança nos alunos detectada:", payload);
                    queryClient.invalidateQueries({ queryKey: ["students-count"] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(movementsChannel);
            supabase.removeChannel(alertsChannel);
            supabase.removeChannel(justificationsChannel);
            supabase.removeChannel(studentsChannel);
        };
    }, [queryClient]);
}
