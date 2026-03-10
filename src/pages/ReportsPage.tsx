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

  // NOTE: Logic for absent students based purely on gate entries has been removed 
  // as the school has transitioned to tracking exceptions (Lates/Exits) only.

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

  // Class Attendance Stats
  const uniqueSchoolDays = new Set(movements.map(m => m.registered_at.split("T")[0])).size || 1;
  const classStats: Record<string, { totalStudents: number; totalEntries: number }> = {};

  // Aggregate students by class
  students.forEach(s => {
    const className = `${s.series || "?"} ${s.class || "?"}`.trim();
    if (!classStats[className]) classStats[className] = { totalStudents: 0, totalEntries: 0 };
    classStats[className].totalStudents++;
  });

  // Aggregate entries by class
  movements.filter(m => m.type === "entry").forEach((m: any) => {
    const className = `${m.students?.series || "?"} ${m.students?.class || "?"}`.trim();
    if (classStats[className]) {
      classStats[className].totalEntries++;
    }
  });

  const classAttendance = Object.entries(classStats)
    .map(([className, stats]) => {
      const expectedEntries = stats.totalStudents * uniqueSchoolDays;
      const unoptimizedRate = expectedEntries > 0 ? (stats.totalEntries / expectedEntries) * 100 : 0;
      // Cap at 100% in case of multiple entries per student per day
      const rate = Math.min(unoptimizedRate, 100);
      return { className, rate, ...stats };
    })
    .sort((a, b) => b.rate - a.rate);

  const getExportRows = () => movements.map((m: any) => ({
    aluno: m.students?.name || "",
    serie: `${m.students?.series || ""} ${m.students?.class || ""}`,
    tipo: m.type === "entry" ? "Atraso/Entrada" : "Saída",
    data: new Date(m.registered_at).toLocaleDateString("pt-BR"),
    horario: new Date(m.registered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  }));

  const handleExportCSV = () => {
    const rows = getExportRows();
    const csv = ["Aluno,Série,Tipo,Data,Horário", ...rows.map(r => `"${r.aluno}","${r.serie}",${r.tipo},${r.data},${r.horario}`)];
    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `relatorio-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = getExportRows();
    const ws = XLSX.utils.json_to_sheet(rows.map(r => ({ Aluno: r.aluno, Série: r.serie, Tipo: r.tipo, Data: r.data, Horário: r.horario })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `relatorio-${period}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório de Movimentações", 14, 20);
    doc.setFontSize(10);
    doc.text(`Período: ${period === "week" ? "Última Semana" : "Último Mês"} | Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);
    doc.text(`Total: ${movements.length} movimentações | ${totalEntries} atrasos/entradas | ${totalExits} saídas`, 14, 34);

    const rows = getExportRows();
    autoTable(doc, {
      startY: 42,
      head: [["Aluno", "Série", "Tipo", "Data", "Horário"]],
      body: rows.map(r => [r.aluno, r.serie, r.tipo, r.data, r.horario]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    doc.save(`relatorio-${period}.pdf`);
  };

  const handleExportWord = async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, HeadingLevel } = await import("docx");
    const { saveAs } = await import("file-saver");
    const rows = getExportRows();

    const headerCells = ["Aluno", "Série", "Tipo", "Data", "Horário"].map(text =>
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })], width: { size: 20, type: WidthType.PERCENTAGE } })
    );

    const dataRows = rows.map(r =>
      new TableRow({
        children: [r.aluno, r.serie, r.tipo, r.data, r.horario].map(text =>
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })], width: { size: 20, type: WidthType.PERCENTAGE } })
        ),
      })
    );

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Relatório de Movimentações", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: `Período: ${period === "week" ? "Última Semana" : "Último Mês"} | ${movements.length} movimentações`, size: 20 })] }),
          new Paragraph({ text: "" }),
          new Table({ rows: [new TableRow({ children: headerCells }), ...dataRows] }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `relatorio-${period}.docx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Estatísticas e análises de presença</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value as any)}
            className="rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>
          <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            <FileDown className="h-4 w-4" /> CSV
          </button>
          <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 rounded-lg border bg-success/10 text-success px-3 py-2 text-sm font-medium hover:bg-success/20 transition-colors">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={handleExportPDF} className="inline-flex items-center gap-1.5 rounded-lg border bg-destructive/10 text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive/20 transition-colors">
            <FileText className="h-4 w-4" /> PDF
          </button>
          <button onClick={handleExportWord} className="inline-flex items-center gap-1.5 rounded-lg border bg-primary/10 text-primary px-3 py-2 text-sm font-medium hover:bg-primary/20 transition-colors">
            <FileText className="h-4 w-4" /> Word
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
          <p className="text-xs text-muted-foreground">Atrasos / Entradas</p>
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
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Atrasos/Entradas</span>
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

        {/* Class Attendance */}
        <div className="bg-card rounded-lg border p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Frequência por Turma</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border/50">
              Baseado em {uniqueSchoolDays} dias letivos
            </span>
          </div>
          {classAttendance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem dados no período</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classAttendance.map((c, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border border-border/40 bg-background/50">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-bold text-foreground">{c.className}</span>
                    <span className={`text-xs font-black
                      ${c.rate >= 80 ? "text-success" : c.rate >= 50 ? "text-warning" : "text-destructive"}`}
                    >
                      {c.rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${c.rate >= 80 ? "bg-success" : c.rate >= 50 ? "bg-warning" : "bg-destructive"}`}
                      style={{ width: `${c.rate}%` }}
                    />
                  </div>
                  <div className="flex justify-between px-1 text-[10px] text-muted-foreground font-medium">
                    <span>{c.totalStudents} Alunos Matriculados</span>
                    <span>{c.totalEntries} Ocorrências (Atrasos)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
