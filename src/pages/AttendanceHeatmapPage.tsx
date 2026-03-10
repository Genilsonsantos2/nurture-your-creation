import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Loader2 } from "lucide-react";
import { useState } from "react";
import { subDays, format, eachDayOfInterval, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, ResponsiveContainer, Cell } from "recharts";

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const hourLabels = Array.from({ length: 15 }, (_, i) => `${(i + 6).toString().padStart(2, "0")}:00`); // 06:00 to 20:00

function getIntensityColor(value: number, max: number) {
  if (max === 0) return "bg-muted";
  const ratio = value / max;
  if (ratio === 0) return "bg-muted";
  if (ratio < 0.2) return "bg-green-200 dark:bg-green-900";
  if (ratio < 0.4) return "bg-green-400 dark:bg-green-700";
  if (ratio < 0.6) return "bg-yellow-400 dark:bg-yellow-700";
  if (ratio < 0.8) return "bg-orange-400 dark:bg-orange-700";
  return "bg-destructive";
}

export default function AttendanceHeatmapPage() {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(14);

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["heatmap-movements", timeRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), timeRange);
      const { data, error } = await supabase
        .from("movements")
        .select("type, registered_at")
        .gte("registered_at", startDate.toISOString());
      if (error) throw error;
      return data || [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["heatmap-students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id").eq("active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Build heatmap: day-of-week x hour-of-day for entries
  const entryHeatmap: number[][] = Array.from({ length: 7 }, () => Array(15).fill(0));
  const exitHeatmap: number[][] = Array.from({ length: 7 }, () => Array(15).fill(0));

  let maxEntry = 0;
  let maxExit = 0;

  for (const m of movements) {
    const date = new Date(m.registered_at);
    const dayOfWeek = getDay(date); // 0=Sun, 6=Sat
    const hour = date.getHours();
    if (hour < 6 || hour > 20) continue;
    const hourIdx = hour - 6;

    if (m.type === "entry") {
      entryHeatmap[dayOfWeek][hourIdx]++;
      if (entryHeatmap[dayOfWeek][hourIdx] > maxEntry) maxEntry = entryHeatmap[dayOfWeek][hourIdx];
    } else {
      exitHeatmap[dayOfWeek][hourIdx]++;
      if (exitHeatmap[dayOfWeek][hourIdx] > maxExit) maxExit = exitHeatmap[dayOfWeek][hourIdx];
    }
  }

  // Build daily absence data
  const days = eachDayOfInterval({ start: subDays(new Date(), timeRange - 1), end: new Date() });
  const dailyStats = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayEntries = movements.filter(
      (m) => m.type === "entry" && m.registered_at.startsWith(dayStr)
    );
    const uniquePresent = new Set(dayEntries.map((m: any) => m.registered_at)).size; // approximate
    return {
      date: format(day, "dd/MM", { locale: ptBR }),
      dayName: format(day, "EEE", { locale: ptBR }),
      entries: dayEntries.length,
    };
  });

  const [view, setView] = useState<"entries" | "exits">("entries");
  const heatmap = view === "entries" ? entryHeatmap : exitHeatmap;
  const maxVal = view === "entries" ? maxEntry : maxExit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Flame className="h-8 w-8 text-primary" />
            Mapa de Calor de Movimentação
          </h1>
          <p className="text-muted-foreground mt-1">Visualize horários de picos de atrasos e saídas</p>
        </div>
        <div className="flex gap-2">
          {([7, 14, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
          <p className="font-bold text-muted-foreground">Carregando dados...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">Atrasos Totais</p>
              <p className="text-3xl font-black text-foreground">{movements.filter((m) => m.type === "entry").length}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">Total Saídas</p>
              <p className="text-3xl font-black text-foreground">{movements.filter((m) => m.type === "exit").length}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">Alunos Ativos</p>
              <p className="text-3xl font-black text-foreground">{students.length}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">Período</p>
              <p className="text-3xl font-black text-foreground">{timeRange}d</p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setView("entries")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === "entries" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              🟢 Atrasos
            </button>
            <button
              onClick={() => setView("exits")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === "exits" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              🔴 Saídas
            </button>
          </div>

          {/* Heatmap Grid */}
          <div className="rounded-2xl border bg-card p-6 overflow-x-auto">
            <h3 className="font-bold text-lg mb-4">
              {view === "entries" ? "Mapa de Calor — Entradas" : "Mapa de Calor — Saídas"}
            </h3>
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="grid grid-cols-[60px_repeat(15,1fr)] gap-1 mb-1">
                <div />
                {hourLabels.map((h) => (
                  <div key={h} className="text-[10px] font-bold text-muted-foreground text-center">{h}</div>
                ))}
              </div>
              {/* Rows */}
              {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => (
                <div key={dayIdx} className="grid grid-cols-[60px_repeat(15,1fr)] gap-1 mb-1">
                  <div className="text-xs font-bold text-muted-foreground flex items-center">{dayNames[dayIdx]}</div>
                  {heatmap[dayIdx].map((val, hourIdx) => (
                    <div
                      key={hourIdx}
                      className={`aspect-square rounded-sm ${getIntensityColor(val, maxVal)} transition-all hover:ring-2 hover:ring-primary cursor-default flex items-center justify-center`}
                      title={`${dayNames[dayIdx]} ${hourLabels[hourIdx]}: ${val} ${view === "entries" ? "atrasos" : "saídas"}`}
                    >
                      {val > 0 && <span className="text-[9px] font-bold text-foreground/70">{val}</span>}
                    </div>
                  ))}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <span>Menos</span>
                <div className="h-4 w-4 rounded-sm bg-muted" />
                <div className="h-4 w-4 rounded-sm bg-green-200 dark:bg-green-900" />
                <div className="h-4 w-4 rounded-sm bg-green-400 dark:bg-green-700" />
                <div className="h-4 w-4 rounded-sm bg-yellow-400 dark:bg-yellow-700" />
                <div className="h-4 w-4 rounded-sm bg-orange-400 dark:bg-orange-700" />
                <div className="h-4 w-4 rounded-sm bg-destructive" />
                <span>Mais</span>
              </div>
            </div>
          </div>

          {/* Daily Bar */}
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-bold text-lg mb-4">Entradas por Dia</h3>
            <div className="flex items-end gap-1 h-40">
              {dailyStats.map((d, i) => {
                const maxD = Math.max(...dailyStats.map((x) => x.entries), 1);
                const height = (d.entries / maxD) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground">{d.entries}</span>
                    <div
                      className="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-all"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${d.date}: ${d.entries} entradas`}
                    />
                    <span className="text-[9px] text-muted-foreground">{d.dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
