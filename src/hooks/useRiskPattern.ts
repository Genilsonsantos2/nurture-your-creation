import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to identify students with a "Late Pattern" 
 * (3 or more delays in the last 7 days).
 */
export const useRiskPattern = () => {
    return useQuery({
        queryKey: ["risk-pattern"],
        queryFn: async () => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: movements } = await supabase
                .from("movements")
                .select("student_id, type, registered_at, students(name, series, class)")
                .gte("registered_at", sevenDaysAgo.toISOString())
                .eq("type", "entry")
                .order("registered_at", { ascending: false });

            if (!movements) return [];

            const studentStats: Record<string, { count: number, student: any }> = {};

            movements.forEach((m: any) => {
                if (!studentStats[m.student_id]) {
                    studentStats[m.student_id] = { count: 0, student: m.students };
                }
                studentStats[m.student_id].count += 1;
            });

            // Filter students with 3 or more delays
            return Object.values(studentStats)
                .filter(s => s.count >= 3)
                .sort((a, b) => b.count - a.count);
        },
        refetchInterval: 1000 * 60 * 15, // Refetch every 15 minutes
    });
};
