import { Camera, Maximize, ScanLine, X, CheckCircle, XCircle, LogIn, LogOut, AlertTriangle, Send } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

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

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 1.1; // Slightly faster for gate flow
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
    await identifyStudent.mutateAsync(decodedText);
    setTimeout(() => { processingRef.current = false; }, 2000);
  }, [identifyStudent, activeStudent]);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScan(decodedText),
        () => { }
      );
      setScanning(true);
    } catch (err: any) {
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
    <div className={`space-y-6 ${kioskMode ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portaria Inteligente 🛡️</h1>
          <p className="text-sm text-muted-foreground font-medium">Controle de acesso e registros em tempo real</p>
        </div>
        <button onClick={toggleKiosk} className="p-3 rounded-2xl border bg-card text-foreground hover:bg-secondary transition-all shadow-sm">
          {kioskMode ? <X className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Scanner & Identity Card */}
        <div className="space-y-6">
          <div className="relative group">
            <div id="qr-reader" className={`w-full rounded-[2.5rem] overflow-hidden border-4 border-primary/20 shadow-2xl ${!scanning ? "hidden" : ""}`} />
            {!scanning && (
              <div className="aspect-video rounded-[2.5rem] bg-muted/30 border-4 border-dashed border-border flex flex-col items-center justify-center gap-6 group-hover:border-primary/40 transition-all">
                <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
                  <Camera className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">Scanner de QR Code</p>
                  <p className="text-sm text-muted-foreground font-medium">Aponte a câmera para a carteirinha do aluno</p>
                </div>
                <button
                  onClick={startScanning}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-primary-foreground hover:scale-105 transition-all shadow-xl shadow-primary/20"
                >
                  <ScanLine className="h-5 w-5" /> Ativar Câmera
                </button>
              </div>
            )}
            {scanning && (
              <button onClick={stopScanning} className="absolute top-4 right-4 p-2 rounded-full bg-destructive text-white shadow-lg hover:scale-110 transition-all z-10">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Identity Card (Manual Confirmation) */}
          {activeStudent && (
            <div className="bg-card border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-6 mb-8">
                <div className="h-20 w-20 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center text-3xl font-black shadow-lg">
                  {initials(activeStudent.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black text-foreground truncate">{activeStudent.name}</h2>
                  <p className="text-lg font-bold text-primary">{activeStudent.series} {activeStudent.class}</p>
                  <p className="text-sm font-semibold text-muted-foreground mt-1">Matrícula: {activeStudent.enrollment}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => confirmMovement.mutate("entry")}
                  disabled={confirmMovement.isPending}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-success/10 border-2 border-success/20 text-success hover:bg-success hover:text-white transition-all group"
                >
                  <LogIn className="h-8 w-8 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-widest">Entrada</span>
                </button>
                <button
                  onClick={() => confirmMovement.mutate("exit")}
                  disabled={confirmMovement.isPending}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-warning/10 border-2 border-warning/20 text-warning hover:bg-warning hover:text-white transition-all group"
                >
                  <LogOut className="h-8 w-8 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-widest">Saída</span>
                </button>
              </div>

              <button
                onClick={() => setShowOccurrence(!showOccurrence)}
                className="w-full mt-4 p-4 rounded-2xl border-2 border-dashed border-destructive/20 text-destructive font-bold text-sm flex items-center justify-center gap-2 hover:bg-destructive/10 transition-all"
              >
                <AlertTriangle className="h-5 w-5" /> Registrar Ocorrência Rápida
              </button>

              {showOccurrence && (
                <div className="mt-4 p-6 bg-destructive/[0.03] rounded-3xl border border-destructive/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <textarea
                    placeholder="Descreva a ocorrência (ex: sem uniforme, atraso...)"
                    value={occurrenceText}
                    onChange={(e) => setOccurrenceText(e.target.value)}
                    className="w-full bg-white dark:bg-black rounded-2xl border border-destructive/20 p-4 text-sm font-medium focus:ring-2 focus:ring-destructive outline-none min-h-[100px] resize-none shadow-inner"
                  />
                  <button
                    onClick={() => registerOccurrence.mutate()}
                    disabled={registerOccurrence.isPending || !occurrenceText}
                    className="w-full bg-destructive text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-destructive/20"
                  >
                    <Send className="h-4 w-4" /> Enviar Ocorrência
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Registro Recente
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {recentScans.length === 0 ? (
              <div className="bg-card rounded-[2rem] border-2 border-dashed border-border p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground font-bold">Nenhum registro agora.</p>
              </div>
            ) : (
              recentScans.map((scan, i) => (
                <div key={i} className={`bg-card rounded-3xl border border-border/50 p-5 flex items-center gap-4 hover:shadow-lg transition-all ${i === 0 ? "scale-105 border-primary/20 shadow-xl" : ""}`}>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${scan.type === "entry" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                    {initials(scan.student?.name || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate">{scan.student?.name}</p>
                    <p className="text-xs font-bold text-muted-foreground">{scan.student?.series} • {scan.student?.class}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg inline-block shadow-sm ${scan.type === "entry" ? "bg-success text-white" : "bg-warning text-white"
                      }`}>
                      {scan.type === "entry" ? "Entrada" : "Saída"}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2">{scan.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
