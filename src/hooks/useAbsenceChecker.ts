import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAbsenceChecker() {
    const { user, isAdmin, role } = useAuth();
    const isCoordinatorOrAdmin = isAdmin || role === 'coordinator';

    useEffect(() => {
        // FLOW CHANGE: General attendance is no longer tracked at the gate.
        // Therefore, we cannot automatically flag someone as 'Absent' just because they didn't scan.
        // This checker is disabled to prevent false alerts to parents.
        return;

        if (!user || !isCoordinatorOrAdmin) return;

        const checkAbsences = async () => {
            try {
                // Prevent running multiple times a day on the same device
                const lastCheckStr = localStorage.getItem("last_absence_check");
                if (lastCheckStr) {
                    const lastCheck = new Date(lastCheckStr);
                    const today = new Date();
                    // if checked today, skip
                    if (lastCheck.toDateString() === today.toDateString()) {
                        return;
                    }
                }

                // Calculate 3 days ago
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                const isoLimitDate = threeDaysAgo.toISOString().split('T')[0] + 'T00:00:00.000Z';

                // 1. Get all active students
                const { data: students, error: stdErr } = await supabase
                    .from("students")
                    .select("id")
                    .eq("active", true);

                if (stdErr || !students) throw stdErr;

                // 2. Get students who had a movement in the last 3 days
                const { data: recentMovements, error: movErr } = await supabase
                    .from("movements")
                    .select("student_id")
                    .gte("registered_at", isoLimitDate)
                    .eq("type", "entry");

                if (movErr) throw movErr;

                const studentsWithRecentMovements = new Set(recentMovements?.map(m => m.student_id));

                // Find students without recent entries
                const absentStudents = students.filter(s => !studentsWithRecentMovements.has(s.id));

                if (absentStudents.length > 0) {
                    // We need to check if there is ALREADY an unresolved alert for them to avoid duplicates
                    const { data: currentAlerts } = await supabase
                        .from("alerts")
                        .select("student_id")
                        .eq("status", "pending")
                        .eq("type", "absent");

                    const studentsWithAlert = new Set(currentAlerts?.map(a => a.student_id));
                    const studentsNeedsAlert = absentStudents.filter(s => !studentsWithAlert.has(s.id));

                    if (studentsNeedsAlert.length > 0) {
                        const { whatsappService } = await import("@/services/whatsappService");

                        for (const s of studentsNeedsAlert) {
                            try {
                                // 1. Create database alert
                                await supabase.from("alerts").insert([{
                                    student_id: s.id,
                                    type: "absent" as any,
                                    message: "Aluno não registra entrada há 3 dias (ou mais). Contate o responsável.",
                                    status: "pending" as any
                                }]);

                                // 2. Fetch student details for phone number
                                const { data: fullStudent } = await (supabase as any)
                                    .from("students")
                                    .select("responsible_phone, name")
                                    .eq("id", s.id)
                                    .single();

                                if (fullStudent && (fullStudent as any).responsible_phone) {
                                    const msg = `*📢 ALERTA DE AUSÊNCIA - CETI DIGITAL*\n\nOlá, notamos que o aluno(a) *${(fullStudent as any).name}* não registra entrada no colégio há 3 dias. Por favor, entre em contato com a coordenação para justificar a ausência. 🛡️`;
                                    await whatsappService.sendMessage((fullStudent as any).responsible_phone, msg);
                                }
                            } catch (alertErr) {
                                console.error("Error processing alert for student:", s.id, alertErr);
                            }
                        }
                    }
                }

                localStorage.setItem("last_absence_check", new Date().toISOString());

            } catch (err) {
                console.error("Error checking absences:", err);
            }
        };

        // Use a small timeout to not delay the immediate dashboard render
        const timeout = setTimeout(checkAbsences, 3000);
        return () => clearTimeout(timeout);
    }, [user, isCoordinatorOrAdmin]);
}
