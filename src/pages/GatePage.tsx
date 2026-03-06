import {
  Camera,
  Maximize,
  ScanLine,
  X,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  AlertTriangle,
  Send,
  Play,
  Search,
  Settings,
  Shield,
  Trash2,
  Undo2,
  Calendar,
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function GatePage() {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const [manualInput, setManualInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [kioskMode, setKioskMode] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const queryClient = useQueryClient();

  // Fetch upcoming events for the sidebar
  const { data: upcomingEvents } = useQuery({
    queryKey: ["upcoming-events-gate"],
    queryFn: async () => {
      // @ts-ignore
      const { data } = await (supabase.from("school_events") as any)
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  const registerMovement = useMutation({
    mutationFn: async ({ studentId, type }: { studentId: string; type: "entry" | "exit" }) => {
      const { data, error } = await supabase
        .from("movements")
        .insert([{ student_id: studentId, type }])
        .select("*, students(name, series, class)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setLastScan({ ...data, success: true });
      queryClient.invalidateQueries({ queryKey: ["movements-today"] });
      toast.success(`Movimentação registrada: ${data.students.name}`);

      // Auto-clear last scan after 5 seconds
      setTimeout(() => setLastScan(null), 5000);
    },
    onError: (error: any) => {
      setLastScan({ error: error.message, success: false });
      toast.error("Erro ao registrar: " + error.message);
    },
  });

  const handleScan = useCallback(async (decodedText: string, forcedType?: "entry" | "exit") => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const { data: student, error } = await supabase
        .from("students")
        .select("id, name, series, class, modality")
        .eq("id", decodedText)
        .single();

      if (error || !student) {
        throw new Error("Estudante não encontrado");
      }

      // 1. Check for active Exit Authorizations
      const { data: exitAuth, error: authErr } = await (supabase as any)
        .from("exit_authorizations")
        .select("*")
        .eq("student_id", student.id)
        .eq("status", "authorized")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      // Fetch active schedules to determine context
      const { data: schedules } = await supabase.from("schedules").select("*");
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      let type: "entry" | "exit" = forcedType || "entry";
      let isAuthorizedExit = false;

      if (exitAuth) {
        type = "exit";
        isAuthorizedExit = true;
      } else if (!forcedType) {
        // Simple logic: if there's an active exit schedule and we are in it, suggest exit
        const exitSchedules = schedules?.filter(s => s.type === 'exit') || [];
        const isExitTime = exitSchedules.some(s => {
          const [h, m] = s.start_time.split(':').map(Number);
          const [eh, em] = s.end_time.split(':').map(Number);
          const start = h * 60 + m - (s.tolerance_minutes || 0);
          const end = eh * 60 + em + (s.tolerance_minutes || 0);
          return currentTime >= start && currentTime <= end;
        });

        if (isExitTime) {
          // Check if it's the right exit for this student's modality
          const modality = student.modality || 'technical';
          const myExit = schedules?.find(s =>
            s.type === 'exit' &&
            s.name.toLowerCase().includes(modality === 'integral' ? 'integral' : 'técnico')
          );

          if (myExit) {
            const [h, m] = myExit.start_time.split(':').map(Number);
            const [eh, em] = myExit.end_time.split(':').map(Number);
            const start = h * 60 + m - (myExit.tolerance_minutes || 0);
            const end = eh * 60 + em + (myExit.tolerance_minutes || 0);

            if (currentTime >= start && currentTime <= end) {
              type = "exit";
            } else {
              toast.warning(`Horário de saída irregular para aluno ${modality === 'integral' ? 'Integral' : 'Técnico'}.`);
            }
          }
        }
      }

      const result = await registerMovement.mutateAsync({ studentId: student.id, type });

      // If it was an authorized exit, mark the authorization as used
      if (isAuthorizedExit && exitAuth) {
        await (supabase as any)
          .from("exit_authorizations")
          .update({ status: 'used' } as any)
          .eq("id", exitAuth.id);

        setLastScan({
          ...result,
          success: true,
          isAuthorizedExit: true,
          authReason: exitAuth.reason
        });
        toast.info("Saída autorizada pela coordenação!");
      }

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, registerMovement]);

  useEffect(() => {
    if (scanning) {
      // Small delay to ensure the container is in the DOM
      const timer = setTimeout(() => {
        const container = document.getElementById("reader");
        if (container && !scannerRef.current) {
          scannerRef.current = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
          );
          scannerRef.current.render((text) => handleScan(text), () => { });
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().then(() => {
            scannerRef.current = null;
            // Clean up any leftover DOM nodes the scanner injected
            const container = document.getElementById("reader");
            if (container) {
              container.innerHTML = "";
            }
          }).catch(() => {
            scannerRef.current = null;
            const container = document.getElementById("reader");
            if (container) {
              container.innerHTML = "";
            }
          });
        }
      };
    }
  }, [scanning, handleScan]);

  const toggleKiosk = () => {
    if (!kioskMode) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    }
    setKioskMode(!kioskMode);
  };

  return (
    <div className={`min-h-screen bg-background transition-all duration-700 ${kioskMode ? "p-0" : "p-6 lg:p-10"}`}>
      <div className={`mx-auto max-w-7xl space-y-8 animate-in fade-in duration-1000 ${kioskMode ? "max-w-none h-screen flex flex-col p-10" : ""}`}>

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 animate-float">
              <ScanLine className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-foreground">Controle de Portaria</h1>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-1">Terminal de Acesso em Tempo Real</p>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <button onClick={toggleKiosk} className="p-4 rounded-2xl bg-card border border-border/50 shadow-xl hover:scale-110 transition-all">
              {kioskMode ? <X className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:underline bg-card p-4 rounded-2xl shadow-xl border border-border/50">
              Sair
            </Link>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${kioskMode ? "lg:grid-cols-2 flex-1 pt-10" : "lg:grid-cols-3"} gap-8`}>

          {/* Main Scanning Area */}
          <div className={`${kioskMode ? "lg:col-span-1" : "lg:col-span-2"} space-y-8`}>
            <div className={`relative overflow-hidden rounded-[3rem] bg-card border border-border/40 shadow-2xl ${scanning ? "ring-4 ring-primary/20" : ""}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

              <div className="p-10 relative z-10">
                {!scanning ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse-slow" />
                      <div className="relative h-32 w-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        <ScanLine className="h-16 w-16 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-black tracking-tight">Leitor de QR Code Desativado</h2>
                      <p className="text-muted-foreground font-medium max-w-sm mx-auto">Ative a câmera para iniciar o monitoramento de acesso automático dos alunos.</p>
                    </div>
                    <button
                      onClick={() => setScanning(true)}
                      className="premium-button text-lg px-12 py-6 bg-primary hover:scale-[1.05]"
                    >
                      <Camera className="h-6 w-6 mr-3" /> Iniciar Scanner
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                        <span className="text-sm font-black uppercase tracking-widest text-success">Scanner Ativo</span>
                      </div>
                      <button
                        onClick={() => setScanning(false)}
                        className="text-xs font-black text-destructive uppercase tracking-widest hover:underline p-2"
                      >
                        Desativar Câmera
                      </button>
                    </div>

                    <div id="reader" className="overflow-hidden rounded-3xl border-4 border-dashed border-border group-hover:border-primary/50 transition-all bg-black aspect-square max-w-[500px] mx-auto relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-primary/20 animate-pulse pointer-events-none z-10" />
                    </div>

                    <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-muted/30 border border-border/40">
                      <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-inner">
                        <ScanLine className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Digite o ID do aluno manualmente..."
                          className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-muted-foreground/60"
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleScan(manualInput)}
                        />
                      </div>
                      <button
                        onClick={() => handleScan(manualInput)}
                        disabled={!manualInput || isProcessing}
                        className="p-3 rounded-xl bg-primary text-white hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Last Scan Result */}
            {lastScan && (
              <div className={`animate-in slide-in-from-bottom-6 duration-700 p-8 rounded-[2.5rem] border-2 shadow-2xl ${lastScan.success ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}`}>
                <div className="flex items-center gap-8 text-white">
                  <div className={`h-20 w-20 rounded-[2rem] flex items-center justify-center shadow-2xl ${lastScan.success ? "bg-success text-white shadow-success/40" : "bg-destructive text-white shadow-destructive/40"}`}>
                    {lastScan.success ? <CheckCircle className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status do Registro</p>
                    <h3 className="text-2xl font-black tracking-tight text-foreground">
                      {lastScan.success ? `Acesso Liberado: ${lastScan.students.name}` : "Erro na Identificação"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        {lastScan.success ? `${lastScan.students.series} • ${lastScan.students.class} • ${new Date().toLocaleTimeString()}` : lastScan.error}
                      </p>
                      {lastScan.isAuthorizedExit && (
                        <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/30 flex items-center gap-2">
                          <Shield className="h-3 w-3" /> Saída Autorizada: {lastScan.authReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Instructions */}
          <div className="space-y-8">
            <div className="glass-panel p-8 space-y-8">
              <h3 className="text-lg font-black tracking-tight">Instruções de Uso</h3>
              <div className="space-y-6">
                {[
                  { step: 1, title: "Posicionamento", desc: "Aponte o QR Code da carteirinha para o centro da câmera.", icon: Camera, color: "bg-blue-500" },
                  { step: 2, title: "Identificação", desc: "Aguarde a moldura ficar verde para confirmação do aluno.", icon: ScanLine, color: "bg-purple-500" },
                  { step: 3, title: "Confirmação", desc: "O registro será automático e exibido no rodapé.", icon: CheckCircle, color: "bg-emerald-500" }
                ].map((s) => (
                  <div key={s.step} className="flex gap-5 group">
                    <div className={`h-12 w-12 rounded-2xl ${s.color} text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 shrink-0`}>
                      <s.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-foreground">{s.title}</h4>
                      <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events Mini-Panel */}
            <div className="glass-panel p-8 space-y-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Próximos Eventos
                </h3>
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="space-y-4">
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-card border border-border shadow-sm group cursor-pointer hover:bg-muted/50 transition-all flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-black">{new Date(event.date).getDate()}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter">
                          {new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-foreground truncate">{event.description}</h4>
                        <p className="text-[9px] text-muted-foreground/60 uppercase font-black tracking-widest">{event.type}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-primary/20 group-hover:text-primary transition-colors" />
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-border/60 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground">Nenhum evento agendado</p>
                  </div>
                )}
              </div>
              <Link to="/calendario" className="w-full py-3 px-4 rounded-xl border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest text-center block hover:bg-primary/5 transition-all">
                Ver Calendário Completo
              </Link>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-4 mb-4">
                <AlertCircle className="h-6 w-6 text-warning" />
                <h3 className="font-black text-warning">Atenção Portaria</h3>
              </div>
              <p className="text-xs font-medium text-warning-foreground opacity-80 leading-relaxed">
                Em caso de falha no scanner, utilize a entrada manual para garantir o registro do aluno no sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
