import { QrCode, Printer } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function QRCodesPage() {
  const [filterSeries, setFilterSeries] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["students-qr"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = filterSeries ? students.filter((s) => s.series === filterSeries) : students;
  const seriesOptions = [...new Set(students.map((s) => s.series))].sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">QR Codes</h1>
          <p className="text-sm text-muted-foreground">Gere e imprima QR Codes para as carteirinhas</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Printer className="h-4 w-4" /> Imprimir Todos
        </button>
      </div>

      <div className="flex gap-3">
        <select value={filterSeries} onChange={(e) => setFilterSeries(e.target.value)}
          className="rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todas as Séries</option>
          {seriesOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground text-sm">Nenhum aluno encontrado</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((student) => (
            <div key={student.id} className="bg-card rounded-lg border p-4 text-center space-y-3 hover:shadow-md transition-shadow cursor-pointer">
              <div className="mx-auto h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
                <QrCode className="h-16 w-16 text-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.series} - {student.class}</p>
                <p className="text-xs text-muted-foreground">{student.enrollment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
