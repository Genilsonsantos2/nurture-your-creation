import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, BellRing, UserX, FileSpreadsheet, FileText, FileDown } from "lucide-react";
import { toast } from "sonner";
import { getLastNSchoolDays } from "@/lib/calendar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<"week" | "month">("week");

  const { data: movements = [] } = useQuery({
    queryKey: ["report-movements", period],
    queryFn: async () => {
      const now = new Date();
      const start = new Date();
      if (period === "week") start.setDate(now.getDate() - 7);
      else start.setMonth(now.getMonth() - 1);

      const { data, error } = await supabase
        .from("movements")
        .select("*, students(name, series, class)")
        .gte("registered_at", start.toISOString())
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["reports-students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, name, series, class").eq("active", true).order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate absence based on the last 3 school days
  const lastThreeSchoolDays = getLastNSchoolDays(3);
  const oldestSchoolDay = lastThreeSchoolDays[lastThreeSchoolDays.length - 1];

  const recentEntries = movements.filter(m => m.type === "entry" && new Date(m.registered_at) >= oldestSchoolDay);
  const studentsWithRecentEntry = new Set(recentEntries.map(m => m.student_id));
  const absentStudents = students.filter(s => !studentsWithRecentEntry.has(s.id));

  // Calculate today's absences
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaysEntries = movements.filter(m => m.type === "entry" && new Date(m.registered_at) >= todayStart);
  const studentsWithEntryToday = new Set(todaysEntries.map(m => m.student_id));
  const absentToday = students.filter(s => !studentsWithEntryToday.has(s.id));

  // Check which absent students already have an alert today
  const { data: todaysAlerts = [] } = useQuery({
    queryKey: ["todays-absent-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("student_id")
        .eq("type", "absent")
        .gte("created_at", todayStart.toISOString());

      if (error) throw error;
      return data || [];
    }
  });

  const todaysAlertedStudentIds = new Set(todaysAlerts.map(a => a.student_id));

  const notifyAbsentees = useMutation({
    mutationFn: async () => {
      const alertsToInsert = absentToday
        .filter(s => !todaysAlertedStudentIds.has(s.id))
        .map(s => ({
          student_id: s.id,
          type: "absent" as any,
          message: `Aluno(a) ${s.name} não registrou entrada na escola hoje.`,
          status: "pending" as any
        }));

      if (alertsToInsert.length === 0) return 0;

      const { error } = await supabase.from("alerts").insert(alertsToInsert);
      if (error) throw error;
      return alertsToInsert.length;
    },
    onSuccess: (count) => {
      if (count > 0) {
        toast.success(`${count} alertas de falta gerados para a coordenação.`);
        queryClient.invalidateQueries({ queryKey: ["todays-absent-alerts"] });
      } else {
        toast.info("Todos os alunos ausentes hoje já foram notificados.");
      }
    },
    onError: () => {
      toast.error("Erro ao gerar alertas.");
    }
  });

  // Group by day of week
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sexta", "Sáb"];
  const dailyStats = dayNames.map((day, i) => {
    const dayMovs = movements.filter((m) => new Date(m.registered_at).getDay() === i);
    return {
      day,
      entries: dayMovs.filter((m) => m.type === "entry").length,
      exits: dayMovs.filter((m) => m.type === "exit").length,
    };
  }).filter((d) => d.entries > 0 || d.exits > 0);

  // Top exits
  const exitCounts: Record<string, { name: string; series: string; exits: number }> = {};
  movements.filter((m) => m.type === "exit").forEach((m: any) => {
    const id = m.student_id;
    if (!exitCounts[id]) exitCounts[id] = { name: m.students?.name || "?", series: `${m.students?.series || ""} ${m.students?.class || ""}`, exits: 0 };
    exitCounts[id].exits++;
  });
  const topExits = Object.values(exitCounts).sort((a, b) => b.exits - a.exits).slice(0, 10);

  const totalEntries = movements.filter((m) => m.type === "entry").length;
  const totalExits = movements.filter((m) => m.type === "exit").length;
  const maxVal = Math.max(...dailyStats.map((d) => d.entries + d.exits), 1);

  const handleExport = () => {
    const csv = ["Aluno,Série,Tipo,Data,Horário"];
    movements.forEach((m: any) => {
      csv.push(`"${m.students?.name || ""}","${m.students?.series || ""} ${m.students?.class || ""}",${m.type === "entry" ? "Entrada" : "Saída"},${new Date(m.registered_at).toLocaleDateString("pt-BR")},${new Date(m.registered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Estatísticas e análises de presença</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value as any)}
            className="rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>
          <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{movements.length}</p>
          <p className="text-xs text-muted-foreground">Total Movimentações</p>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-success">{totalEntries}</p>
          <p className="text-xs text-muted-foreground">Entradas</p>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-warning">{totalExits}</p>
          <p className="text-xs text-muted-foreground">Saídas</p>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{topExits.length}</p>
          <p className="text-xs text-muted-foreground">Alunos com Saídas</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly chart */}
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Movimentações por Dia</h2>
          {dailyStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem dados no período</p>
          ) : (
            <div className="space-y-3">
              {dailyStats.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-medium text-muted-foreground">{d.day}</span>
                  <div className="flex-1 flex gap-1">
                    <div className="h-6 rounded-l bg-primary/80 flex items-center justify-end pr-2"
                      style={{ width: `${(d.entries / maxVal) * 100}%`, minWidth: d.entries > 0 ? "2rem" : 0 }}>
                      {d.entries > 0 && <span className="text-[10px] text-primary-foreground font-medium">{d.entries}</span>}
                    </div>
                    <div className="h-6 rounded-r bg-warning/60 flex items-center pl-1"
                      style={{ width: `${(d.exits / maxVal) * 100}%`, minWidth: d.exits > 0 ? "2rem" : 0 }}>
                      {d.exits > 0 && <span className="text-[10px] text-foreground font-medium">{d.exits}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Entradas</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Saídas</span>
          </div>
        </div>

        {/* Top exits */}
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Alunos com Mais Saídas</h2>
          {topExits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem dados no período</p>
          ) : (
            <div className="space-y-3">
              {topExits.map((student, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.series}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">{student.exits}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Absent Today Section */}
        <div className="bg-warning/5 border border-warning/20 rounded-2xl p-6 lg:col-span-2 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 text-warning">
              <UserX className="h-6 w-6" />
              <div>
                <h2 className="text-lg font-bold">Ausentes Hoje</h2>
                <p className="text-sm font-medium text-warning/80">Alunos que ainda não registraram entrada na data de hoje</p>
              </div>
            </div>
            {absentToday.length > 0 && (
              <button
                onClick={() => notifyAbsentees.mutate()}
                disabled={notifyAbsentees.isPending}
                className="premium-button bg-warning text-warning-foreground shadow-warning/20 text-sm py-2 px-4 md:w-auto w-full"
              >
                <BellRing className="h-4 w-4 mr-2" />
                {notifyAbsentees.isPending ? "Notificando..." : "Notificar Coordenação"}
              </button>
            )}
          </div>

          {absentToday.length === 0 ? (
            <div className="text-center p-6 bg-background/50 rounded-xl border border-warning/10">
              <p className="text-sm font-semibold text-success">Excelente! 100% de presença registrada hoje.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {absentToday.map(student => {
                const isNotified = todaysAlertedStudentIds.has(student.id);
                return (
                  <div key={student.id} className="bg-background rounded-xl p-4 border border-warning/20 shadow-sm flex flex-col relative overflow-hidden group">
                    <span className="font-bold text-sm text-foreground mb-1 truncate pr-6" title={student.name}>{student.name}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{student.series} • {student.class}</span>
                    {isNotified && (
                      <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" title="Coordenação Notificada" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Absence Alerts Section */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 lg:col-span-2 shadow-sm">
          <div className="flex items-center gap-3 text-destructive mb-6">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-bold">Atenção Especial: Risco de Evasão</h2>
              <p className="text-sm font-medium text-destructive/80">Alunos sem registro de entrada nos últimos 3 dias</p>
            </div>
          </div>

          {absentStudents.length === 0 ? (
            <div className="text-center p-6 bg-background/50 rounded-xl border border-destructive/10">
              <p className="text-sm font-semibold text-success">Ótimo! Nenhum aluno com faltas consecutivas críticas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {absentStudents.map(student => (
                <div key={student.id} className="bg-background rounded-xl p-4 border border-destructive/20 shadow-sm flex flex-col">
                  <span className="font-bold text-sm text-foreground mb-1 truncate" title={student.name}>{student.name}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{student.series} • {student.class}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
