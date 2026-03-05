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
  AlertCircle
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { Link } from "react-router-dom";

interface Student {
  id: string;
  name: string;
  series: string;
  class: string;
  enrollment: string;
}

interface ScanResult {
  student: Student | null;
  type?: "entry" | "exit";
  time: string;
  error?: string;
  confirmed?: boolean;
}

const occurrenceTags = [
  "Sem fardamento",
  "Atraso",
  "Sem documento",
  "Saída antecipada",
  "Indisciplina",
  "Uso de celular",
];

export default function GatePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [kioskMode, setKioskMode] = useState(false);
  const [showOccurrence, setShowOccurrence] = useState(false);
  const [occurrenceText, setOccurrenceText] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  const playSound = (frequency: number) => {
    const vocalEnabled = (settings as any)?.vocal_feedback_enabled ?? true;
    if (!vocalEnabled) return;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error("Error playing sound", e);
    }
  };

  const speak = (text: string) => {
    const vocalEnabled = (settings as any)?.vocal_feedback_enabled ?? true;
    if (!vocalEnabled) return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const identifyStudent = useMutation({
    mutationFn: async (qrCode: string) => {
      const { data: student, error: studentErr } = await supabase
        .from("students")
        .select("id, name, series, class, enrollment")
        .eq("qr_code", qrCode)
        .eq("active", true)
        .single();

      if (studentErr || !student) throw new Error("Aluno não encontrado");
      return student;
    },
    onSuccess: (student) => {
      setActiveStudent(student);
      setOccurrenceText("");
      setShowOccurrence(false);
      speak(`Aluno identificado: ${student.name.split(" ")[0]}`);
      toast.info(`Aluno identificado: ${student.name}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao identificar aluno");
    },
  });

  const confirmMovement = useMutation({
    mutationFn: async (type: "entry" | "exit") => {
      if (!activeStudent) return;

      const { error: movErr } = await supabase.from("movements").insert({
        student_id: activeStudent.id,
        type,
        registered_by: user?.id || null,
      });

      if (movErr) throw movErr;

      return { student: activeStudent, type };
    },
    onSuccess: (data) => {
      if (!data) return;
      const { student, type } = data;
      const result: ScanResult = {
        student,
        type,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        confirmed: true,
      };
      setLastScan(result);
      setRecentScans((prev) => [result, ...prev].slice(0, 20));
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["movements-today"] });

      if (type === "entry") playSound(880);
      else playSound(440);

      const action = type === "entry" ? "Entrada liberada" : "Saída registrada";
      speak(`${action} para, ${student.name}`);
      toast.success(`${type === "entry" ? "Entrada" : "Saída"} registrada: ${student.name}`);

      // Auto-clear student after a short delay
      setTimeout(() => setActiveStudent(null), 3000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar movimentação");
    },
  });

  const registerOccurrence = useMutation({
    mutationFn: async () => {
      if (!activeStudent || !occurrenceText) return;
      const { error } = await supabase.from("occurrences").insert({
        student_id: activeStudent.id,
        description: occurrenceText,
        type: "late", // Default to late for gate incidents
        registered_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ocorrência registrada com sucesso!");
      setShowOccurrence(false);
      setOccurrenceText("");
    }
  });

  const handleScan = useCallback(async (decodedText: string) => {
    if (processingRef.current || activeStudent) return;
    processingRef.current = true;
    try {
      await identifyStudent.mutateAsync(decodedText);
    } catch { }
    setTimeout(() => { processingRef.current = false; }, 3000);
  }, [identifyStudent, activeStudent]);

  const startScanning = async () => {
    setScanning(true);
    // Wait for the div to render before starting the scanner
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScan(decodedText),
        () => { }
      );
    } catch (err: any) {
      setScanning(false);
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanning(); };
  }, []);

  const toggleKiosk = () => {
    if (!kioskMode) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setKioskMode(!kioskMode);
  };

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className={`max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 ${kioskMode ? "fixed inset-0 z-50 bg-background p-10 overflow-auto" : ""}`}>
      {/* Scanner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <ScanLine className="w-64 h-64 text-primary" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground animate-pulse-slow">
            <ScanLine className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">Portaria Inteligente</h1>
            <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
              {scanning ? "Scanner Ativo" : "Aguardando Câmera"}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <button onClick={toggleKiosk} className="p-4 rounded-2xl bg-white dark:bg-black shadow-xl hover:scale-110 transition-all border border-border/50">
            {kioskMode ? <X className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:underline bg-white dark:bg-black p-4 rounded-2xl shadow-xl border border-border/50">
            Sair
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Scanner Container */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black tracking-tight text-foreground">Leitor de Acesso</h2>
            <div className={`p-2 rounded-xl border border-border/50 text-xs font-black uppercase tracking-widest flex items-center gap-2 ${scanning ? "text-success bg-success/5 border-success/20" : "text-destructive bg-destructive/5 border-destructive/20"}`}>
              {scanning ? "Online" : "Pausado"}
            </div>
          </div>
          <div className="relative glass-panel group p-4 lg:p-6 overflow-hidden">
            <div id="qr-reader" className={`overflow-hidden rounded-[2rem] border-4 border-dashed border-primary/10 bg-black/5 aspect-square ${!scanning && "hidden"}`} />

            {scanning && (
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-primary/40 shadow-[0_0_20px_var(--primary)] -translate-y-1/2 animate-bounce opacity-20 pointer-events-none" />
            )}

            {!scanning && (
              <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6 p-10 text-center rounded-[2rem]">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-float">
                  <Play className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground tracking-tight">Câmera Pausada</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-2">Clique no botão abaixo para reiniciar o scanner automático.</p>
                </div>
                <button
                  onClick={startScanning}
                  className="premium-button shadow-primary/40"
                >
                  Ativar Câmera <Play className="ml-2 h-4 w-4" />
                </button>
              </div>
            )}
            {scanning && (
              <button onClick={stopScanning} className="absolute top-8 right-8 p-3 rounded-full bg-destructive text-white shadow-lg hover:scale-110 transition-all z-20">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="p-6 rounded-[2rem] bg-muted/20 border border-border/40 flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-foreground uppercase tracking-wider">Atenção Porteiro</p>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1">
                Posicione o QR Code centralizado na câmera. O registro é instantâneo e emitirá um sinal sonoro de confirmação.
              </p>
            </div>
          </div>

          {/* Upcoming Events Mini-Panel */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Próximos Eventos
              </h3>
              <Link to="/calendario" className="text-[10px] font-bold text-primary hover:underline">VER TUDO</Link>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 group cursor-pointer hover:bg-primary/10 transition-colors">
                <p className="text-[10px] font-black text-primary uppercase tracking-tighter">15 Março</p>
                <h4 className="text-xs font-bold text-foreground truncate">Conselho de Classe</h4>
              </div>
              <div className="p-3 rounded-2xl bg-warning/5 border border-warning/10 group cursor-pointer hover:bg-warning/10 transition-colors">
                <p className="text-[10px] font-black text-warning uppercase tracking-tighter">28 Março</p>
                <h4 className="text-xs font-bold text-foreground truncate">Dia da Família na Escola</h4>
              </div>
              <div className="p-3 rounded-2xl bg-info/5 border border-info/10 group cursor-pointer hover:bg-info/10 transition-colors">
                <p className="text-[10px] font-black text-info uppercase tracking-tighter">02 Abril</p>
                <h4 className="text-xs font-bold text-foreground truncate">Feriado de Páscoa</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Student Information */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black tracking-tight text-foreground">Identificação</h2>
            {activeStudent && (
              <button
                onClick={() => {
                  setActiveStudent(null);
                  setOccurrenceText("");
                  setShowOccurrence(false);
                }}
                className="text-xs font-black text-muted-foreground uppercase tracking-widest hover:text-foreground hover:bg-muted p-2 rounded-xl transition-all"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="glass-panel min-h-[460px] flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden group">
            {activeStudent ? (
              <div className="w-full space-y-8 animate-in zoom-in-95 duration-500 relative z-10">
                <div className="flex flex-col items-center gap-6">
                  <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-tr from-primary to-info flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-primary/30 ring-8 ring-background animate-float group-hover:scale-105 transition-transform">
                    {initials(activeStudent.name)}
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-foreground tracking-tight drop-shadow-sm">{activeStudent.name}</h3>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-muted/50 text-xs font-black uppercase tracking-widest text-muted-foreground border border-border/50">
                      {activeStudent.series} • {activeStudent.class}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={() => confirmMovement.mutate("entry")}
                    disabled={confirmMovement.isPending}
                    className="group flex flex-col items-center justify-center gap-3 p-8 rounded-[2rem] bg-success text-white shadow-2xl shadow-success/20 hover:scale-[1.05] active:scale-95 transition-all min-h-[140px]"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:bg-white transition-all group-hover:text-success duration-500">
                      <LogIn className="h-6 w-6" />
                    </div>
                    <span translate="no" className="text-xs font-black uppercase tracking-widest">Registrar Entrada</span>
                  </button>
                  <button
                    onClick={() => confirmMovement.mutate("exit")}
                    disabled={confirmMovement.isPending}
                    className="group flex flex-col items-center justify-center gap-3 p-8 rounded-[2rem] bg-warning text-white shadow-2xl shadow-warning/20 hover:scale-[1.05] active:scale-95 transition-all min-h-[140px]"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:bg-white transition-all group-hover:text-warning duration-500">
                      <LogOut className="h-6 w-6" />
                    </div>
                    <span translate="no" className="text-xs font-black uppercase tracking-widest">Registrar Saída</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowOccurrence(!showOccurrence)}
                  className={`w-full p-5 rounded-2xl border-2 border-dashed font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${showOccurrence ? "bg-destructive text-white border-destructive shadow-xl" : "border-destructive/20 text-destructive hover:bg-destructive/5"}`}
                >
                  <AlertTriangle className={`h-5 w-5 ${showOccurrence ? "" : "animate-pulse"}`} /> {showOccurrence ? "Fechar Ocorrência" : "Abrir Ocorrência Rápida"}
                </button>

                {showOccurrence && (
                  <div className="space-y-5 animate-in slide-in-from-top-4 duration-500 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {occurrenceTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setOccurrenceText((prev) => prev ? `${prev}, ${tag}` : tag)}
                          className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all border border-destructive/20"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Descreva detalhes específicos aqui..."
                      value={occurrenceText}
                      onChange={(e) => setOccurrenceText(e.target.value)}
                      className="premium-input min-h-[120px] shadow-sm resize-none"
                    />
                    <button
                      onClick={() => registerOccurrence.mutate()}
                      disabled={registerOccurrence.isPending || !occurrenceText}
                      className="w-full premium-button bg-destructive shadow-destructive/20 mt-2"
                    >
                      <Send className="h-4 w-4 mr-2" /> Salvar Ocorrência
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-6 opacity-40 animate-in fade-in duration-1000">
                <div className="h-32 w-32 rounded-[2.5rem] bg-muted/20 border-4 border-dashed border-muted-foreground/30 flex items-center justify-center mx-auto">
                  <ScanLine className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground tracking-tight">Nenhum Aluno</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-2">Aguardando a detecção de um QR Code...</p>
                </div>
              </div>
            )}

            {/* Background pattern for identification panel */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary),0.02),transparent_70%)] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* History */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Registro Recente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentScans.length === 0 ? (
            <div className="col-span-full bg-card rounded-[2rem] border-2 border-dashed border-border p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-bold">Nenhum registro agora.</p>
            </div>
          ) : (
            recentScans.map((scan, i) => (
              <div key={i} className={`bg-card rounded-3xl border border-border/50 p-5 flex items-center gap-4 hover:shadow-lg transition-all ${i === 0 ? "scale-105 border-primary/20 shadow-xl" : ""}`}>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${scan.type === "entry" ? "bg-success text-white" : "bg-warning text-white"
                  }`}>
                  {initials(scan.student?.name || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-foreground truncate">{scan.student?.name}</p>
                  <p className="text-xs font-bold text-muted-foreground">{scan.student?.series} • {scan.student?.class}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{scan.type === "entry" ? "Entrada" : "Saída"}</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1">{scan.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
