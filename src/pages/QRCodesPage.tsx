import { Printer, Download } from "lucide-react";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

export default function QRCodesPage() {
  const [filterSeries, setFilterSeries] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const cards = filtered.map((s) => `
      <div style="display:inline-block;width:200px;padding:16px;margin:8px;border:1px solid #ddd;border-radius:8px;text-align:center;page-break-inside:avoid;">
        <div style="margin-bottom:8px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(s.qr_code)}" width="150" height="150" />
        </div>
        <div style="font-weight:bold;font-size:12px;">${s.name}</div>
        <div style="font-size:11px;color:#666;">${s.series} - ${s.class}</div>
        <div style="font-size:11px;color:#666;">${s.enrollment}</div>
      </div>
    `).join("");
    printWindow.document.write(`<html><head><title>QR Codes</title></head><body style="font-family:sans-serif;">${cards}<script>setTimeout(()=>window.print(),500)</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">QR Codes</h1>
          <p className="text-sm text-muted-foreground">Gere e imprima QR Codes para as carteirinhas</p>
        </div>
        <button onClick={handlePrintAll} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
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
        <div ref={printRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((student) => (
            <div key={student.id} className="bg-card rounded-lg border p-4 text-center space-y-3 hover:shadow-md transition-shadow">
              <div className="mx-auto flex items-center justify-center">
                <QRCodeSVG value={student.qr_code} size={96} level="M" />
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
