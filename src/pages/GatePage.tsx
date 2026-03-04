import { Camera, Maximize, ScanLine, X, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

interface ScanResult {
  student: { id: string; name: string; series: string; class: string; enrollment: string } | null;
  type: "entry" | "exit";
  time: string;
  error?: string;
}

export default function GatePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [kioskMode, setKioskMode] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const registerMovement = useMutation({
    mutationFn: async (qrCode: string) => {
      // Find student by qr_code
      const { data: student, error: studentErr } = await supabase
        .from("students")
        .select("id, name, series, class, enrollment")
        .eq("qr_code", qrCode)
        .eq("active", true)
        .single();

      if (studentErr || !student) throw new Error("Aluno não encontrado");

      // Check last movement to determine entry/exit
      const { data: lastMov } = await supabase
        .from("movements")
        .select("type")
        .eq("student_id", student.id)
        .order("registered_at", { ascending: false })
        .limit(1)
        .single();

      const type: "entry" | "exit" = !lastMov || lastMov.type === "exit" ? "entry" : "exit";

      const { error: movErr } = await supabase.from("movements").insert({
        student_id: student.id,
        type,
        registered_by: user?.id || null,
      });

      if (movErr) throw movErr;

      return { student, type };
    },
    onSuccess: ({ student, type }) => {
      const result: ScanResult = {
        student,
        type,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setLastScan(result);
      setRecentScans((prev) => [result, ...prev].slice(0, 20));
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["movements-today"] });
      toast.success(`${type === "entry" ? "Entrada" : "Saída"} registrada: ${student.name}`);
    },
    onError: (error: any) => {
      const result: ScanResult = { student: null, type: "entry", time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), error: error.message };
      setLastScan(result);
      toast.error(error.message || "Erro ao registrar movimentação");
    },
  });

  const handleScan = useCallback(async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    await registerMovement.mutateAsync(decodedText);
    // Cooldown to avoid duplicate scans
    setTimeout(() => { processingRef.current = false; }, 2000);
  }, [registerMovement]);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScan(decodedText),
        () => {}
      );
      setScanning(true);
    } catch (err: any) {
      toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
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
          <h1 className="text-2xl font-bold text-foreground">Portaria</h1>
          <p className="text-sm text-muted-foreground">Escaneie o QR Code do aluno</p>
        </div>
        <button onClick={toggleKiosk} className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          {kioskMode ? <><X className="h-4 w-4" /> Sair Quiosque</> : <><Maximize className="h-4 w-4" /> Modo Quiosque</>}
        </button>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative w-full max-w-md">
          <div id="qr-reader" className={`w-full rounded-2xl overflow-hidden ${!scanning ? "hidden" : ""}`} />
          {!scanning && (
            <div className="aspect-square rounded-2xl bg-foreground/5 border-2 border-dashed border-border flex flex-col items-center justify-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center px-4">
                Clique para ativar a câmera e escaneie o QR Code da carteirinha
              </p>
            </div>
          )}
          <div className="mt-4 flex justify-center">
            {scanning ? (
              <button onClick={stopScanning} className="inline-flex items-center gap-2 rounded-lg bg-destructive px-6 py-3 text-sm font-medium text-destructive-foreground hover:opacity-90 transition-opacity">
                <X className="h-5 w-5" /> Parar Câmera
              </button>
            ) : (
              <button onClick={startScanning} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                <ScanLine className="h-5 w-5" /> Ativar Câmera
              </button>
            )}
          </div>
        </div>

        {/* Last scan result */}
        {lastScan && (
          <div className={`w-full max-w-md rounded-lg p-4 flex items-center gap-4 border ${
            lastScan.error
              ? "bg-destructive/10 border-destructive/30"
              : lastScan.type === "entry"
              ? "bg-success/10 border-success/30"
              : "bg-warning/10 border-warning/30"
          }`}>
            {lastScan.error ? (
              <>
                <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Erro</p>
                  <p className="text-xs text-muted-foreground">{lastScan.error}</p>
                </div>
              </>
            ) : lastScan.student && (
              <>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm ${
                  lastScan.type === "entry" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                }`}>
                  {initials(lastScan.student.name)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{lastScan.student.name}</p>
                  <p className="text-xs text-muted-foreground">{lastScan.student.series} {lastScan.student.class} — Mat. {lastScan.student.enrollment}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    lastScan.type === "entry" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                  }`}>
                    {lastScan.type === "entry" ? "Entrada" : "Saída"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{lastScan.time}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Recent scans */}
        {recentScans.length > 1 && (
          <div className="w-full max-w-md">
            <h3 className="text-sm font-semibold text-foreground mb-2">Últimos registros</h3>
            <div className="space-y-2">
              {recentScans.slice(1, 6).map((scan, i) => scan.student && (
                <div key={i} className="bg-card rounded-lg border p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                    {initials(scan.student.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{scan.student.name}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    scan.type === "entry" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  }`}>
                    {scan.type === "entry" ? "Entrada" : "Saída"}
                  </span>
                  <span className="text-xs text-muted-foreground">{scan.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
