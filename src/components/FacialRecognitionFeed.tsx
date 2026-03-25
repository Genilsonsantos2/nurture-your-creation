import React, { useState, useEffect } from "react";
import { User, ShieldCheck, AlertCircle, Scan, History, UserCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { videoAiService } from "@/services/videoAiService";

interface RecognizedPerson {
  id: string;
  name: string;
  similarity: number;
  timestamp: string;
  photo_url?: string;
  type: 'entry' | 'exit';
}

export default function FacialRecognitionFeed() {
  const [activeDetection, setActiveDetection] = useState<RecognizedPerson | null>(null);

  const { data: lastIdentified = [], refetch } = useQuery({
    queryKey: ["face-recognition-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("face_recognition_logs")
        .select("*, students(name, photo_url)")
        .order("timestamp", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data.map(log => ({
        id: log.id,
        name: log.students?.name || "Desconhecido",
        similarity: log.similarity_score || 0,
        timestamp: log.timestamp,
        photo_url: log.students?.photo_url || undefined,
        type: 'entry' // Simplificado para o mockup
      })) as RecognizedPerson[];
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel("face-logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "face_recognition_logs" },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Simulação de detecção apenas para o visual dinâmico (bounding box)
  useEffect(() => {
    const mockInterval = setInterval(() => {
      if (Math.random() > 0.8 && lastIdentified.length > 0) {
        const person = lastIdentified[Math.floor(Math.random() * lastIdentified.length)];
        setActiveDetection({ ...person, similarity: 0.95 });
        setTimeout(() => setActiveDetection(null), 3000);
      }
    }, 5000);
    return () => clearInterval(mockInterval);
  }, [lastIdentified]);

  return (
    <div className="glass-panel p-5 border-accent/20 bg-accent/5 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/20 border border-accent/30">
            <Scan className="h-4 w-4 text-accent animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-none">IA: Reconhecimento Facial</h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-tighter">Comparando com 842 faces cadastradas</p>
          </div>
        </div>
        <History className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-accent transition-colors" />
        <button 
          onClick={async () => {
            const { data: students } = await supabase.from("students").select("id, name").eq('active', true).limit(5);
            if (!students || students.length === 0) return;
            const randomStudent = students[Math.floor(Math.random() * students.length)];
            
            // USE THE INTELLIGENT SERVICE
            await videoAiService.handleFaceDetection(randomStudent.id, {
               confidence: 0.94 + Math.random() * 0.05,
               cameraName: "Portaria Principal",
               zone: "Gate 1"
            });
            
            toast.success(`Simulando IA: ${randomStudent.name} identificado.`);
            refetch();
          }}
          className="text-[8px] font-black bg-accent/20 text-accent px-2 py-1 rounded hover:bg-accent hover:text-white transition-all ml-2"
        >
          SIMULAR DETECÇÃO IA
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
        {/* Main Camera View with Overlays */}
        <div className="flex-1 relative rounded-xl bg-black border border-white/10 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800" />
          
          {/* AI Bounding Box Mockup */}
          {activeDetection && (
            <div 
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-accent transition-all duration-300 animate-pulse scale-110"
               style={{ boxShadow: '0 0 20px rgba(var(--accent),0.3)' }}
            >
               {/* Corners */}
               <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-accent" />
               <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-accent" />
               <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-accent" />
               <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-accent" />

               {/* Name Tag */}
               <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-accent text-white font-bold text-[10px] whitespace-nowrap shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3 w-3" />
                    {activeDetection.name} ({(activeDetection.similarity * 100).toFixed(0)}%)
                  </div>
                  <div className="text-[8px] opacity-80 uppercase tracking-widest text-center mt-0.5">
                    {activeDetection.type === 'entry' ? 'ENTRADA' : 'SAÍDA'} DETECTADA
                  </div>
               </div>
            </div>
          )}

          {/* Camera Scanning Animation when no ID */}
          {!activeDetection && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 border border-white/10 rounded-full opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="absolute inset-0 border-t-2 border-accent rounded-full animate-spin" />
             </div>
          )}

          {/* HUD Info */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-10">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/10">
                <div className="h-1 w-1 rounded-full bg-success animate-pulse" />
                <span className="text-[8px] font-mono text-white/70">SYNC: DVR-712 (10Gbps)</span>
             </div>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/10">
                <span className="text-[8px] font-mono text-white/70 uppercase">Repetidor: OK</span>
             </div>
          </div>
        </div>

        {/* Recent History Sidebar */}
        <div className="w-full lg:w-48 space-y-2 max-h-[150px] lg:max-h-none overflow-y-auto pr-1 custom-scrollbar">
           <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Histórico Recente</h4>
           {lastIdentified.length === 0 ? (
              <div className="text-center py-8 opacity-20 grayscale scale-75">
                 <User className="h-8 w-8 mx-auto mb-2" />
                 <p className="text-[8px]">AGUARDANDO...</p>
              </div>
           ) : (
             lastIdentified.map((person) => (
                <div 
                  key={person.id} 
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/40 border border-border/50 hover:border-accent/30 transition-all cursor-pointer group"
                >
                  <div className="h-8 w-8 rounded bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                     <UserCheck className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-foreground truncate">{person.name.split(' ')[0]}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] text-muted-foreground font-mono">
                          {new Date(person.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </span>
                       <span className={`text-[7px] font-bold uppercase ${person.type === 'entry' ? 'text-success' : 'text-warning'}`}>
                          {person.type === 'entry' ? 'IN' : 'OUT'}
                       </span>
                    </div>
                  </div>
                </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
