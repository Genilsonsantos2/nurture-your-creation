import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ReportsPage() {
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

  // Group by day of week
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
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
      </div>
    </div>
  );
}
