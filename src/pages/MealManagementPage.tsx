import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Soup, Search, CheckCircle, Clock, Utensils, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MealManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Fetch meal logs for today
  const { data: mealLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ["meal-logs-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await ((supabase
        .from("meal_logs")
        .select("*, students(name, series, class)")
        .gte("registered_at", today)
        .order("registered_at", { ascending: false })) as any);
      
      if (error) throw error;
      return data;
    },
  });

  const registerMeal = useMutation({
    mutationFn: async ({ studentId, mealType }: { studentId: string; mealType: string }) => {
      const { data, error } = await ((supabase
        .from("meal_logs")
        .insert([{ student_id: studentId, meal_type: mealType }])
        .select()) as any);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-logs-today"] });
      toast.success("Refeição registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar refeição: " + error.message);
    },
  });

  // Filter students for the quick search
  const { data: searchResults } = useQuery({
    queryKey: ["student-search-meal", searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 3) return [];
      const { data, error } = await supabase
        .from("students")
        .select("id, name, series, class")
        .ilike("name", `%${searchTerm}%`)
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length >= 3,
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Soup className="h-8 w-8 text-primary" /> Gestão de Merenda
          </h1>
          <p className="text-muted-foreground font-medium">Controle de consumo diário e registro de refeições.</p>
        </div>
        <div className="flex items-center gap-3 bg-card border px-4 py-2 rounded-2xl shadow-sm">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Status da Copa</p>
            <p className="text-sm font-black text-foreground">Distribuição Ativa</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 border-primary/20 bg-primary/5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" /> Registrar Refeição
            </h2>
            
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar aluno por nome..."
                className="w-full bg-background/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {searchResults?.map((student) => (
                <div key={student.id} className="bg-card border rounded-xl p-3 flex items-center justify-between group hover:border-primary/50 transition-all">
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground uppercase">{student.name}</p>
                    <p className="text-[10px] text-muted-foreground">{student.series} • {student.class}</p>
                  </div>
                  <button
                    onClick={() => {
                      registerMeal.mutate({ studentId: student.id, mealType: "lunch" });
                      setSearchTerm("");
                    }}
                    className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {searchTerm.length >= 3 && searchResults?.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4 italic">Nenhum aluno encontrado.</p>
              )}
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 text-center">
             <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
             <h3 className="text-sm font-bold">Aviso de Estoque</h3>
             <p className="text-xs text-muted-foreground mt-1">Lembre-se de conferir as sobras ao final do turno para o relatório mensal.</p>
          </div>
        </div>

        {/* Logs Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <Clock className="h-5 w-5 text-primary" /> Logs de Hoje • {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
             </h2>
             <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
               {mealLogs?.length || 0} REFEIÇÕES
             </span>
          </div>

          <div className="space-y-2">
            {loadingLogs ? (
               <div className="animate-pulse space-y-3">
                 {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl" />)}
               </div>
            ) : mealLogs?.length === 0 ? (
               <div className="bg-card border border-dashed rounded-[2rem] p-12 text-center">
                 <p className="text-muted-foreground">Nenhuma refeição registrada hoje.</p>
               </div>
            ) : (
              mealLogs.map((log: any) => (
                <div key={log.id} className="bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                       <Soup className="h-5 w-5" />
                     </div>
                     <div>
                       <p className="text-sm font-black text-foreground uppercase">{log.students?.name}</p>
                       <p className="text-[10px] font-bold text-muted-foreground">
                         {log.students?.series} • {log.students?.class} • <span className="text-primary">{log.meal_type.toUpperCase()}</span>
                       </p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-muted-foreground">
                      {format(new Date(log.registered_at), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
