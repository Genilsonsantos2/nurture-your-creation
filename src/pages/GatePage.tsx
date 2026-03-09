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
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Pause,
  Play as PlayIcon,
  RotateCcw,
  Shield,
  Calendar,
  AlertCircle,
  FileText
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { saveToSyncQueue } from "@/lib/offlineStorage";

export default function GatePage() {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const [manualInput, setManualInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [kioskMode, setKioskMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraPaused, setCameraPaused] = useState(false);
  const [detectedStudent, setDetectedStudent] = useState<any>(null);
  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [occurrenceType, setOccurrenceType] = useState<any>("other");
  const [occurrenceDescription, setOccurrenceDescription] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimesRef = useRef<Record<string, number>>({});
  const isProcessingRef = useRef(false);
  const detectedStudentRef = useRef<any>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const queryClient = useQueryClient();

  // Keep soundEnabledRef in sync
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Audio Pre-loading with more stable URLs
  const audioRefs = useRef({
    detection: new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"),
    entry: new Audio("https://assets.mixkit.co/active_storage/sfx/1073/1073-preview.mp3"),
    exit: new Audio("https://assets.mixkit.co/active_storage/sfx/1072/1072-preview.mp3")
  });

  // Initialize/Unlock audio on first interaction
  useEffect(() => {
    const unlockAudio = () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => { });
      });
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const playSound = (type: 'detection' | 'entry' | 'exit') => {
    if (!soundEnabledRef.current) return;
    const audio = audioRefs.current[type];
    audio.currentTime = 0;
    audio.play().catch(err => console.error("Audio play error:", err));
  };

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

  // Fetch Active Announcements
  const { data: gateAnnouncements = [] } = useQuery({
    queryKey: ["active-gate-announcements"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("gate_announcements")
        .select("*")
        .eq("active", true)
        .gte("expires_at", new Date().toISOString())
        .order("priority", { ascending: false }) // 'high', 'normal', 'low' etc
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching announcements", error);
        return [];
      }
      return data || [];
    },
    refetchInterval: 30000 // Poll every 30s to stay up-to-date
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

  const registerOccurrence = useMutation({
    mutationFn: async ({ studentId, type, description }: { studentId: string; type: "other" | "behavior" | "unauthorized_exit" | "guardian_pickup" | "student_sick" | "late"; description: string }) => {
      const { data, error } = await supabase
        .from("occurrences")
        .insert([{
          student_id: studentId,
          type,
          description,
          registered_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Ocorrência registrada com sucesso!");
      setShowOccurrenceModal(false);
      setOccurrenceDescription("");
      setDetectedStudent(null);
      detectedStudentRef.current = null;
    },
    onError: (error: any) => {
      toast.error("Erro ao registrar ocorrência: " + error.message);
    },
  });

  const handleDetection = useCallback(async (decodedText: string) => {
    // Check refs to avoid re-detection during processing
    if (isProcessingRef.current || detectedStudentRef.current) return;

    // Cooldown logic
    const nowTime = Date.now();
    const lastTime = lastScanTimesRef.current[decodedText] || 0;
    if (nowTime - lastTime < 3000) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const { data: student, error } = await supabase
        .from("students")
        .select("id, name, series, class, modality, photo_url")
        .or(`id.eq.${decodedText},qr_code.eq.${decodedText},enrollment.eq.${decodedText}`)
        .maybeSingle();

      if (error || !student) throw new Error("Estudante não encontrado");

      detectedStudentRef.current = student;
      setDetectedStudent(student);
      lastScanTimesRef.current[decodedText] = nowTime;

      playSound('detection');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      // We DO NOT set detectedStudentRef to null here because we want to stop 
      // scanning until the user clicks Entry/Exit or Cancel.
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, []); // ZERO dependencies means this function is 100% stable!

  const confirmMovement = async (type: "entry" | "exit") => {
    if (!detectedStudent || isProcessing) return;
    setIsProcessing(true);
    isProcessingRef.current = true;

    try {
      const studentId = detectedStudent.id;

      // Handle Exit authorizations if requested
      let isAuthorizedExit = false;
      let authReason = "";
      if (type === "exit") {
        try {
          const { data: exitAuth } = await (supabase as any)
            .from("exit_authorizations")
            .select("*")
            .eq("student_id", studentId)
            .eq("status", "authorized")
            .gte("expires_at", new Date().toISOString())
            .maybeSingle();

          if (exitAuth) {
            isAuthorizedExit = true;
            authReason = exitAuth.reason;
            await (supabase as any)
              .from("exit_authorizations")
              .update({ status: 'used' } as any)
              .eq("id", exitAuth.id);
          }
        } catch (e) {
          console.log("Could not fetch exit_authorizations, possibly offline");
        }
      }

      let result;
      const isOnline = navigator.onLine;

      if (isOnline) {
        result = await registerMovement.mutateAsync({ studentId, type });
      } else {
        // OFFLINE FALLBACK
        const fallbackData = {
          studentId,
          type,
          studentName: detectedStudent.name,
          series: detectedStudent.series,
          class: detectedStudent.class
        };

        await saveToSyncQueue('movement', fallbackData);

        result = {
          id: 'offline-' + Date.now(),
          created_at: new Date().toISOString(),
          type: type,
          students: { name: detectedStudent.name, series: detectedStudent.series, class: detectedStudent.class }
        };
        toast.warning("Modo Offline: Registro salvo localmente. Sincronização automática pendente.");
      }

      playSound(type);

      // Only set last scan here if mutation success handler didn't handle it
      // Actually, mutation success handler is redundant now for some properties, 
      // but let's keep it consistent.
      setLastScan({
        ...result,
        success: true,
        isAuthorizedExit,
        authReason
      });

      detectedStudentRef.current = null;
      setDetectedStudent(null);
    } catch (err: any) {
      toast.error("Erro ao registrar: " + err.message);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (scanning && !cameraPaused) {
      // Small delay to ensure the container is in the DOM
      const timer = setTimeout(async () => {
        try {
          const container = document.getElementById("reader");
          if (!container) return;

          html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 5, // Lower FPS for battery saving
              qrbox: { width: 280, height: 280 }, // Slightly larger box for easier scanning
              aspectRatio: 1.0
            },
            (text) => handleDetection(text),
            () => { } // Ignore frame errors
          );
        } catch (err) {
          console.error("Scanner error:", err);
          toast.error("Erro ao acessar a câmera.");
          setScanning(false);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (html5QrCode) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch(console.error);
          }
        }
      };
    }
  }, [scanning, cameraPaused, handleDetection]);

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
    <div className={`min-h-screen bg-[#0f172a] text-white transition-all duration-700 ${kioskMode ? "p-0" : "p-4 lg:p-6"}`}>
      <div className={`mx-auto max-w-7xl space-y-6 animate-in fade-in duration-1000 ${kioskMode ? "max-w-none h-screen flex flex-col p-6" : ""}`}>

        {/* Improved Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1e293b] p-6 rounded-[2rem] border border-blue-500/20 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">Terminal Portaria</h1>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">CETI NOVA ITARANA • 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-4 rounded-xl transition-all ${soundEnabled ? "bg-blue-600/20 text-blue-400 border border-blue-500/40" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
              title={soundEnabled ? "Silenciar" : "Ativar Som"}
            >
              {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </button>
            <button
              onClick={() => {
                playSound('detection');
                toast.info("Testando som de bip...");
              }}
              className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all hidden md:block"
            >
              Testar Som
            </button>
            <button
              onClick={() => setCameraPaused(!cameraPaused)}
              className={`p-4 rounded-xl transition-all ${!cameraPaused ? "bg-blue-600/20 text-blue-400 border border-blue-500/40" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}
              title={cameraPaused ? "Retomar Câmera" : "Pausar Câmera (Economia)"}
            >
              {cameraPaused ? <PlayIcon className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
            </button>
            <button onClick={toggleKiosk} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              {kioskMode ? <X className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${kioskMode ? "lg:grid-cols-2 flex-1" : "lg:grid-cols-3"} gap-6`}>

          {/* Scanning and Actions Area */}
          <div className={`${kioskMode ? "lg:col-span-1" : "lg:col-span-2"} space-y-6`}>

            {/* Detection Card (Primary Action) */}
            {detectedStudent ? (
              <div className="bg-[#1e293b] rounded-[3rem] border-4 border-blue-500 p-8 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">

                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="relative">
                    <div className="h-40 w-40 rounded-[2.5rem] bg-blue-600/20 flex items-center justify-center border-4 border-blue-500/50 overflow-hidden shadow-2xl">
                      {detectedStudent.photo_url ? (
                        <img src={detectedStudent.photo_url} alt="Aluno" className="h-full w-full object-cover" />
                      ) : (
                        <LogIn className="h-20 w-20 text-blue-400" />
                      )}
                    </div>
                    {detectedStudent.blood_type && (
                      <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white h-12 w-12 rounded-2xl flex items-center justify-center border-4 border-[#1e293b] font-black text-sm">
                        {detectedStudent.blood_type}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">ALUNO IDENTIFICADO</p>
                    <h2 className="text-4xl font-black tracking-tight uppercase leading-tight">{detectedStudent.name}</h2>
                    <p className="text-xl font-bold opacity-60">{detectedStudent.series} • Turma {detectedStudent.class}</p>

                    {detectedStudent.allergies && (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">RESTRIÇÕES / ALERGIAS</p>
                        <p className="text-sm font-bold text-red-200">{detectedStudent.allergies}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6 w-full pt-4">
                    <button
                      onClick={() => confirmMovement("entry")}
                      disabled={isProcessing}
                      className="group flex flex-col items-center justify-center gap-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:grayscale p-8 rounded-[2.5rem] shadow-xl shadow-emerald-900/40 transition-all active:scale-95"
                    >
                      <LogIn className="h-12 w-12" />
                      <span className="text-2xl font-black uppercase tracking-tighter">ENTRADA</span>
                    </button>
                    <button
                      onClick={() => confirmMovement("exit")}
                      disabled={isProcessing}
                      className="group flex flex-col items-center justify-center gap-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:grayscale p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/40 transition-all active:scale-95"
                    >
                      <LogOut className="h-12 w-12" />
                      <span className="text-2xl font-black uppercase tracking-tighter">SAÍDA</span>
                    </button>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-4 items-center pt-4">
                    <button
                      onClick={() => setShowOccurrenceModal(true)}
                      className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-tighter text-sm"
                    >
                      <FileText className="h-5 w-5" /> Relatar Ocorrência
                    </button>
                    <button
                      onClick={() => {
                        setDetectedStudent(null);
                        detectedStudentRef.current = null;
                      }}
                      className="flex items-center justify-center gap-2 text-sm font-bold text-red-400 uppercase tracking-widest hover:underline"
                    >
                      <RotateCcw className="h-4 w-4" /> Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#1e293b] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl relative">
                {scanning && !cameraPaused ? (
                  <div className="relative">
                    <div id="reader" className="w-full aspect-square md:aspect-video bg-black overflow-hidden" />
                    <div className="absolute inset-0 border-[1.5rem] border-[#1e293b] pointer-events-none" />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                      <div className="w-64 h-64 border-2 border-blue-500/50 rounded-3xl animate-pulse" />
                      <p className="mt-4 text-xs font-black text-blue-400 uppercase tracking-[0.3em] bg-black/60 px-4 py-2 rounded-full">Enquadre o QR Code</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                    <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/10 opacity-40">
                      {cameraPaused ? <Pause className="h-12 w-12" /> : <Camera className="h-12 w-12" />}
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight">{cameraPaused ? "Câmera Pausada" : "Câmera Desativada"}</h2>
                      <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">
                        {cameraPaused ? "Clique em retomar para continuar o controle de acesso." : "Ative para registrar entradas e saídas."}
                      </p>
                    </div>
                    <button
                      onClick={() => { setScanning(true); setCameraPaused(false); }}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-blue-900/40 transition-all text-lg uppercase tracking-widest"
                    >
                      {cameraPaused ? "Retomar Scanner" : "Ligar Câmera"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Manual Entry Bar */}
            <div className="bg-[#1e293b] p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Matrícula ou Código Manual..."
                  className="w-full bg-black/40 border-2 border-white/5 focus:border-blue-500/50 rounded-xl px-6 py-4 text-lg font-bold placeholder:text-gray-600 outline-none transition-all"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDetection(manualInput)}
                />
              </div>
              <button
                onClick={() => handleDetection(manualInput)}
                disabled={!manualInput || isProcessing}
                className="bg-blue-600 hover:bg-blue-500 p-5 rounded-xl text-white shadow-lg active:scale-95 disabled:opacity-30 transition-all"
              >
                <Send className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Porter Sidebar: History and Stats */}
          <div className="space-y-6">

            {/* Dynamic Announcements Board */}
            {gateAnnouncements.length > 0 && (
              <div className="bg-[#1e293b] rounded-[2.5rem] border border-blue-500/30 p-8 space-y-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <AlertCircle className="w-24 h-24" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-warning flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" /> Quadro de Avisos
                </h3>
                <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {gateAnnouncements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className={`p-4 rounded-2xl border ${announcement.priority === 'critical' ? 'bg-destructive/20 border-destructive/50 animate-pulse text-white' :
                        announcement.priority === 'high' ? 'bg-warning/20 border-warning/50 text-white' :
                          'bg-white/5 border-white/10 text-gray-200'
                        }`}
                    >
                      <p className="text-sm font-bold leading-relaxed">{announcement.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#1e293b] rounded-[2.5rem] border border-white/5 p-8 space-y-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                <RotateCcw className="h-5 w-5" /> Recentes
              </h3>

              <div className="space-y-3">
                {lastScan && lastScan.success && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${lastScan.type === 'entry' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {lastScan.type === 'entry' ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate uppercase">{lastScan.students.name}</p>
                        <p className="text-[10px] font-bold opacity-40">{new Date(lastScan.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 text-center">
                  <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">Aguardando novo scan</p>
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 rounded-[2.5rem] border border-red-500/20 p-8 space-y-4">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h3 className="font-black uppercase tracking-tighter">Dica do Porteiro</h3>
              </div>
              <p className="text-xs font-medium text-red-200/60 leading-relaxed">
                Use a função **Pausar Câmera** entre a chegada dos ônibus para economizar bateria.
                Mantenha o celular na sombra para evitar superaquecimento.
              </p>
            </div>

            <Link to="/" className="w-full block py-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-center text-sm font-black uppercase tracking-widest transition-all">
              Sair do Terminal
            </Link>
          </div>
        </div>
      </div>

      {/* Occurrence Modal */}
      {showOccurrenceModal && detectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-[2.5rem] border border-blue-500/30 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight">Registrar Ocorrência</h2>
              <button onClick={() => setShowOccurrenceModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">ALUNO</p>
                <p className="text-lg font-bold">{detectedStudent.name}</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Tipo de Incidente</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'late', label: '🕒 Atraso' },
                    { id: 'behavior', label: '⚠️ Comportamento' },
                    { id: 'student_sick', label: '🏥 Mal Estar' },
                    { id: 'other', label: '👤 Sem Farda' },
                  ].map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setOccurrenceType(tag.id as any)}
                      className={`p-4 rounded-xl font-bold transition-all border-2 ${occurrenceType === tag.id ? "bg-amber-600/20 border-amber-500 text-amber-500" : "bg-white/5 border-transparent text-gray-400"}`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Observações (Opcional)</p>
                <textarea
                  className="w-full bg-black/40 border-2 border-white/5 focus:border-blue-500/50 rounded-xl px-4 py-3 min-h-[100px] font-medium outline-none transition-all"
                  placeholder="Descreva o que aconteceu..."
                  value={occurrenceDescription}
                  onChange={(e) => setOccurrenceDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => registerOccurrence.mutate({
                    studentId: detectedStudent.id,
                    type: occurrenceType,
                    description: occurrenceDescription
                  })}
                  disabled={registerOccurrence.isPending}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest"
                >
                  {registerOccurrence.isPending ? "Salvando..." : "Salvar Ocorrência"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
