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

    // Get absolute URL for the logo so the print window can load it globally
    const baseUrl = window.location.origin;
    const logoUrl = `${baseUrl}/logo.png`;

    const cards = filtered.map((s) => `
      <div style="display:inline-block; width:230px; min-height:360px; margin:15px; border-radius:12px; overflow:hidden; border:2px solid #0f3e7a; font-family: 'Inter', system-ui, sans-serif; position:relative; page-break-inside:avoid; box-shadow: 0 8px 16px rgba(0,0,0,0.1); background-color: #fff;">
        <div style="background: linear-gradient(135deg, #0f3e7a 0%, #1e40af 100%); color: white; padding: 18px 10px; text-align: center; border-bottom: 4px solid #f59e0b; position: relative;">
          <img src="${logoUrl}" alt="Logo" style="height: 50px; margin-bottom: 6px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />
          <div style="font-size: 14px; font-weight: 800; letter-spacing: 0.5px; line-height: 1.2; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">CETI NOVA ITARANA</div>
          <div style="font-size: 10px; font-weight: 600; opacity: 0.9; letter-spacing: 1px; margin-top: 2px;">ACESSO ESTUDANTIL</div>
        </div>
        <div style="padding: 20px 15px;">
          <div style="text-align:center; margin-bottom:15px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(s.qr_code)}&margin=1" width="140" height="140" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);" />
          </div>
          <div style="text-align: center;">
            <div style="font-weight: 800; font-size: 15px; color: #0f172a; margin-bottom: 6px; line-height: 1.15;">${s.name.toUpperCase()}</div>
            <div style="font-size: 12px; font-weight: 700; color: #1d4ed8; margin-bottom: 4px;">${s.series} • ${s.class}</div>
            <div style="font-size: 11px; font-weight: 600; color: #475569; background: #f1f5f9; display: inline-block; padding: 3px 8px; border-radius: 6px; margin-top: 2px;">Matrícula: ${s.enrollment}</div>
          </div>
        </div>
        <div style="background: #f8fafc; text-align: center; padding: 10px 8px; font-size: 9px; font-weight: 500; color: #64748b; border-top: 1px dashed #cbd5e1; position: absolute; bottom: 0; width: 100%; box-sizing: border-box;">
          Válido para o ano letivo vigente.<br/>Uso pessoal e intransferível.
        </div>
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão de Carteirinhas - CETI NOVA ITARANA</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page { margin: 10mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { 
              font-family: 'Inter', sans-serif; 
              background: #fff; 
              margin: 0; 
              padding: 10px;
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 15px;
            }
          </style>
        </head>
        <body>
          ${cards}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 1000); // Give ample time for all images/fonts to load
            };
          </script>
        </body>
      </html>
    `);
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
        <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground text-sm font-medium">Nenhum aluno encontrado para os filtros selecionados.</div>
      ) : (
        <div ref={printRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((student) => (
            <div key={student.id} className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col mx-auto w-full max-w-[280px]">

              <div className="bg-gradient-to-br from-primary to-primary/80 p-5 text-center border-b-[4px] border-warning relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
                <img src="/logo.png" alt="Logo" className="h-14 w-auto mx-auto mb-3 object-contain drop-shadow-md relative z-10" />
                <h3 className="text-primary-foreground font-extrabold text-sm tracking-wide relative z-10 drop-shadow-sm">CETI NOVA ITARANA</h3>
                <p className="text-primary-foreground/90 font-bold text-[10px] tracking-[0.15em] mt-1 relative z-10">ACESSO ESTUDANTIL</p>
              </div>

              <div className="p-6 flex flex-col items-center flex-1 bg-gradient-to-b from-card to-muted/10 relative">
                <div className="bg-white p-3 rounded-2xl mb-5 shadow-sm ring-1 ring-border group-hover:scale-105 transition-transform duration-300">
                  <QRCodeSVG value={student.qr_code} size={130} level="M" />
                </div>

                <div className="text-center w-full z-10">
                  <p className="text-lg font-bold text-foreground leading-tight mb-1 truncate px-2" title={student.name}>{student.name}</p>
                  <p className="text-sm font-bold text-primary mb-3">{student.series} • {student.class}</p>
                  <p className="text-xs font-semibold text-muted-foreground bg-secondary/50 py-1.5 px-3 rounded-lg inline-block border border-border/50">Matrícula: {student.enrollment}</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
