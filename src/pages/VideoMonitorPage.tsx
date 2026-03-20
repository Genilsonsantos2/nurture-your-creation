import React from "react";
import LiveCameraFeed from "@/components/LiveCameraFeed";
import FacialRecognitionFeed from "@/components/FacialRecognitionFeed";
import { Video, ShieldCheck } from "lucide-react";

export default function VideoMonitorPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-4 mb-2">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg glow-sm">
          <Video className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Centro de Comando (Beta)</h1>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
             <ShieldCheck className="h-3 w-3 text-success" /> Monitoramento em Tempo Real • IA Ativa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 h-[500px]">
          <FacialRecognitionFeed />
        </div>
        <div className="xl:col-span-2 h-[500px]">
          <LiveCameraFeed />
        </div>
      </div>

      <div className="glass-panel p-6 border-info/20 bg-info/5">
         <h3 className="text-sm font-bold text-info mb-2">Orientações de Configuração</h3>
         <p className="text-xs text-muted-foreground leading-relaxed">
            Este painel está configurado para receber streams de vídeo via protocolo RTSP (Bridge Go2RTC). 
            Em caso de sinal fraco, verifique o repetidor de sinal posicionado próximo ao DVR. 
            Todas as detecções faciais são salvas automaticamente no log de auditoria do sistema.
         </p>
      </div>
    </div>
  );
}
