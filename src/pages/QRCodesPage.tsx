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
      <div style="display:inline-block; width:220px; height:340px; margin:8px; border-radius:12px; overflow:hidden; border:2px solid #0f3e7a; font-family: 'Inter', system-ui, sans-serif; position:relative; page-break-inside:avoid; box-shadow: 0 4px 8px rgba(0,0,0,0.1); background-color: #fff; vertical-align:top;">
        <div style="background: linear-gradient(135deg, #0f3e7a 0%, #1e40af 100%); color: white; padding: 12px 8px; text-align: center; border-bottom: 4px solid #f59e0b; position: relative; height: 85px; box-sizing: border-box;">
          <img src="${logoUrl}" alt="Logo" style="height: 40px; margin-bottom: 4px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" onerror="this.style.display='none'" />
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.5px; line-height: 1.1; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">CETI NOVA ITARANA</div>
          <div style="font-size: 9px; font-weight: 600; opacity: 0.9; letter-spacing: 1px; margin-top: 2px;">ACESSO ESTUDANTIL</div>
        </div>
        <div style="padding: 15px 10px; height: 215px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="text-align:center; margin-bottom:12px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(s.qr_code)}&margin=1" width="120" height="120" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" />
          </div>
          <div style="text-align: center; width: 100%;">
            <div style="font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 4px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 5px;">${s.name.toUpperCase()}</div>
            <div style="font-size: 11px; font-weight: 700; color: #1d4ed8; margin-bottom: 4px;">${s.series} • Turma ${s.class}</div>
            <div style="font-size: 10px; font-weight: 600; color: #475569; background: #f1f5f9; display: inline-block; padding: 2px 6px; border-radius: 4px;">Matrícula: ${s.enrollment}</div>
          </div>
        </div>
        <div style="background: #f8fafc; text-align: center; padding: 6px; font-size: 8px; font-weight: 500; color: #64748b; border-top: 1px dashed #cbd5e1; position: absolute; bottom: 0; width: 100%; box-sizing: border-box; height: 40px; display: flex; align-items: center; justify-content: center;">
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
              @page { margin: 10mm; size: A4; }
              body { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                margin: 0;
              }
              .page-container {
                display: block;
              }
            }
            body { 
              font-family: 'Inter', sans-serif; 
              background: #fff; 
              margin: 0; 
              padding: 0;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              justify-content: center;
              padding: 10px;
              max-width: 800px; /* A4 width roughly */
              margin: 0 auto;
            }
            /* Reset inline-block wrapper styles for grid */
            .grid-container > div {
              margin: 0 !important;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${cards}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 1500); // Give ample time for all images/fonts to load
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
            <div key={student.id} className="group glass-panel p-1 border-none bg-transparent hover:translate-y-[-8px] transition-all duration-500">
              <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden flex flex-col h-full relative">

                {/* Header of the card preview */}
                <div className="bg-gradient-to-br from-primary to-primary-600 p-6 text-center border-b-[6px] border-warning/80 relative">
                  <div className="absolute inset-0 bg-white/5 opacity-10 mix-blend-overlay" />
                  <img src="/logo.png" alt="Logo" className="h-16 w-auto mx-auto mb-4 object-contain drop-shadow-xl relative z-10 group-hover:scale-110 transition-transform" />
                  <h3 className="text-primary-foreground font-black text-[10px] tracking-[0.2em] relative z-10 drop-shadow-sm uppercase">CETI NOVA ITARANA</h3>
                  <div className="h-px w-12 bg-white/20 mx-auto my-2" />
                  <p className="text-primary-foreground/90 font-black text-[9px] tracking-[0.3em] relative z-10 uppercase">Identity Card</p>
                </div>

                <div className="p-8 flex flex-col items-center flex-1 bg-gradient-to-b from-card to-background relative">
                  <div className="bg-white p-4 rounded-[2rem] mb-8 shadow-xl ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all duration-500 group-hover:rotate-1">
                    <QRCodeSVG value={student.qr_code} size={140} level="M" />
                  </div>

                  <div className="text-center w-full relative z-10">
                    <p className="text-xl font-black text-foreground tracking-tight leading-tight mb-2 uppercase" title={student.name}>{student.name.split(" ")[0]} {student.name.split(" ").slice(-1)}</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10 text-[10px] font-black text-primary uppercase tracking-widest mb-4">
                      {student.series} • {student.class}
                    </div>
                    <div className="block pt-4 border-t border-border/50">
                      <code className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">ID: {student.enrollment}</code>
                    </div>
                  </div>

                  {/* Glowing background behind QR */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 blur-[60px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
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
