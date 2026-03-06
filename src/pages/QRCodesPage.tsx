import { Printer, Download, QrCode, Search, Filter } from "lucide-react";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

export default function QRCodesPage() {
  const [filterSeries, setFilterSeries] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students-qr"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = students.filter((s) => {
    if (filterSeries && s.series !== filterSeries) return false;
    if (filterClass && s.class !== filterClass) return false;
    return true;
  });

  const seriesOptions = [...new Set(students.map((s) => s.series))].sort();
  const classOptions = [...new Set(students.filter(s => !filterSeries || s.series === filterSeries).map((s) => s.class))].sort();

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Get absolute URL for the logo so the print window can load it globally
    const baseUrl = window.location.origin;
    const logoUrl = `${baseUrl}/logo.png`;

    const cards = filtered.map((s) => `
      <div style="width:340px; height:210px; border-radius:12px; overflow:hidden; border:1px solid #166534; font-family: 'Inter', system-ui, sans-serif; position:relative; page-break-inside:avoid; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background-color: #fff; box-sizing: border-box; display: flex; flex-direction: row; margin: 10px auto;">
        <!-- Left Side: Header & Student Data -->
        <div style="flex: 1; display: flex; flex-direction: column;">
          <div style="background: linear-gradient(135deg, #166534 0%, #15803d 100%); color: white; padding: 10px; text-align: left; position: relative; height: 65px; box-sizing: border-box; display: flex; align-items: center; gap: 8px;">
            <img src="${logoUrl}" alt="Logo" style="height: 32px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />
            <div>
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.2px; line-height: 1.1;">CETI NOVA ITARANA</div>
              <div style="font-size: 8px; font-weight: 600; opacity: 0.9; letter-spacing: 0.5px; margin-top: 1px; color: #facc15;">ACESSO ESTUDANTIL</div>
            </div>
          </div>
          <div style="padding: 12px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-weight: 800; font-size: 14px; color: #064e3b; margin-bottom: 2px; line-height: 1.2; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${s.name.toUpperCase()}</div>
            <div style="font-size: 10px; font-weight: 700; color: #166534; margin-bottom: 6px;">${s.series} • Turma ${s.class}</div>
            <div style="font-size: 9px; font-weight: 700; color: #374151; background: #f0fdf4; display: inline-block; padding: 3px 6px; border-radius: 4px; border: 1px solid #dcfce7;">MATRÍCULA: ${s.enrollment || '---'}</div>
          </div>
          <div style="background: #f8fafc; text-align: center; padding: 4px; font-size: 7px; font-weight: 600; color: #64748b; border-top: 1px dashed #dcfce7; height: 25px; display: flex; align-items: center; justify-content: center;">
            Uso pessoal e intransferível. Válido p/ 2026.
          </div>
        </div>
        <!-- Right Side: QR Code -->
        <div style="width: 120px; background: #f0fdf4; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 4px solid #facc15; padding: 10px; box-sizing: border-box;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(s.qr_code)}&margin=1" width="85" height="85" style="border: 2px solid #fff; border-radius: 6px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);" />
          <div style="font-size: 7px; font-weight: 800; color: #166534; margin-top: 8px; tracking: 1px;">QR ACCESS</div>
        </div>
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Identidades - CETI</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page { margin: 10mm; size: A4 portrait; }
              body { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                margin: 0;
              }
              .grid-container {
                display: grid;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 15px !important;
                padding: 0 !important;
              }
            }
            body { font-family: 'Inter', sans-serif; background: #fff; margin: 0; padding: 20px; }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(2, 360px);
              justify-content: center;
              gap: 20px;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${cards}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => { window.print(); }, 1500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <QrCode className="w-64 h-64 text-primary" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground">
            <QrCode className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">Geração de Acessos</h1>
            <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              Impressão de Identidade Digital
            </p>
          </div>
        </div>
        <div className="relative z-10">
          <button
            onClick={handlePrintAll}
            disabled={filtered.length === 0}
            className="premium-button shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir Selecionados
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="relative group flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <select
            value={filterSeries}
            onChange={(e) => { setFilterSeries(e.target.value); setFilterClass(""); }}
            className="premium-input w-full pl-12 pr-10 appearance-none cursor-pointer bg-background"
          >
            <option value="">Filtrar por Série (Todas)</option>
            {seriesOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="relative group flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            disabled={!filterSeries}
            className="premium-input w-full pl-12 pr-10 appearance-none cursor-pointer bg-background disabled:opacity-50"
          >
            <option value="">Filtrar por Turma (Todas)</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>Turma {c}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-right">
          <p className="text-sm font-black text-foreground uppercase tracking-wider bg-primary/10 text-primary px-4 py-2 rounded-xl">
            {filtered.length} Registros
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-40 flex flex-col items-center gap-4 opacity-40">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest">Compilando identidades...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-20 text-center space-y-6 opacity-50 border-dashed border-2">
          <Search className="h-16 w-16 mx-auto text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-lg font-black text-foreground tracking-tight">Nenhum registro encontrado</p>
            <p className="text-sm font-medium">Verifique os filtros ou se existem alunos ativos na série selecionada.</p>
          </div>
        </div>
      ) : (
        <div ref={printRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
          {filtered.map((student) => (
            <div key={student.id} className="group relative">
              <div className="bg-card rounded-[1.5rem] border border-success/20 shadow-xl overflow-hidden flex flex-row h-52 transition-all duration-500 hover:shadow-success/10 hover:-translate-y-1">
                {/* Left Side: Photo/Header equivalent */}
                <div className="w-1/3 bg-gradient-to-br from-success to-green-700 flex flex-col items-center justify-center p-4 border-r-4 border-yellow-400">
                  <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain drop-shadow-lg mb-3" />
                  <div className="text-center">
                    <p className="text-[7px] font-black text-white/90 uppercase tracking-[0.2em] leading-tight">CETI NOVA ITARANA</p>
                  </div>
                </div>

                {/* Right Side: Data and QR */}
                <div className="flex-1 p-5 flex flex-col justify-between relative bg-gradient-to-b from-card to-background">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-foreground truncate uppercase">{student.name}</p>
                    <p className="text-[10px] font-bold text-success uppercase">{student.series} • {student.class}</p>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <div className="space-y-2">
                      <div className="px-2 py-1 rounded-md bg-success/5 border border-success/10">
                        <code className="text-[8px] font-bold text-muted-foreground uppercase">ID: {student.enrollment || '---'}</code>
                      </div>
                      <p className="text-[7px] font-medium text-muted-foreground italic">Válido para 2026</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl shadow-lg border border-success/10">
                      <QRCodeSVG value={student.qr_code} size={60} level="M" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="p-10 rounded-[3rem] bg-muted/20 border border-border/40 flex items-start gap-6">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Printer className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-black text-foreground tracking-tight uppercase text-xs tracking-[0.2em] mb-2">Instruções de Impressão</h4>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl font-medium">
            O layout de impressão foi otimizado para papel A4 fotográfico ou Couché.
            Recomendamos desativar "Margens" nas configurações da impressora e habilitar "Cores de Fundo" para garantir a fidelidade do design institucional.
          </p>
        </div>
      </div>
    </div>
  );
}
