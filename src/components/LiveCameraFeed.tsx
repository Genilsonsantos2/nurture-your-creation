import React, { useState } from "react";
import { Camera, Maximize2, LayoutGrid, Monitor, Play, Shield, Video, Zap } from "lucide-react";

const CAM_MOCKUPS = [
  { id: 1, name: "Portaria Principal", status: "online", color: "text-success" },
  { id: 2, name: "Corredor A - Bloco 1", status: "online", color: "text-success" },
  { id: 3, name: "Pátio Central", status: "offline", color: "text-muted-foreground" },
  { id: 4, name: "Entrada Professores", status: "online", color: "text-success" },
];

export default function LiveCameraFeed() {
  const [viewMode, setViewMode] = useState<"grid" | "single">("grid");
  const [activeCam, setActiveCam] = useState(1);

  return (
    <div className="glass-panel p-5 border-primary/20 bg-primary/5 flex flex-col h-full overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/30">
            <Video className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-none">Câmeras (DVR)</h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-tighter">Status: 3 Online / 1 Offline</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode(viewMode === "grid" ? "single" : "grid")}
            className="p-1.5 rounded-md hover:bg-secondary border border-transparent hover:border-border transition-all"
          >
            {viewMode === "grid" ? <Monitor className="h-4 w-4 text-muted-foreground" /> : <LayoutGrid className="h-4 w-4 text-muted-foreground" />}
          </button>
          <button className="p-1.5 rounded-md hover:bg-secondary border border-transparent hover:border-border transition-all text-primary">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={`flex-1 min-h-0 grid gap-2 transition-all duration-500 ${viewMode === "grid" ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {CAM_MOCKUPS.filter(c => viewMode === "grid" || c.id === activeCam).map((cam) => (
          <div 
            key={cam.id} 
            className="relative rounded-lg overflow-hidden bg-black border border-white/5 aspect-video cursor-pointer hover:border-primary/50 transition-colors group/cam"
            onClick={() => {
              setActiveCam(cam.id);
              setViewMode("single");
            }}
          >
            {/* Camera Name Overlay */}
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${cam.status === 'online' ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">{cam.name}</span>
            </div>

            {/* Time Overlay */}
            <div className="absolute top-2 right-2 z-10 text-[9px] font-mono text-white/50 bg-black/20 px-1 rounded">
               REC ● 20:49:12
            </div>

            {/* Mock Video Feed Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {cam.status === 'online' ? (
                 <div className="relative w-full h-full">
                    {/* Placeholder for camera stream */}
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center overflow-hidden">
                       <Camera className="h-12 w-12 text-white/5 opacity-20 transform -rotate-12 scale-150" />
                       <div className="absolute bottom-4 left-4 text-[10px] text-white/20 font-mono">
                          BITRATE: 4.2 Mbps <br />
                          FPS: 30
                       </div>
                    </div>
                    {/* Subtle Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] opacity-30" />
                 </div>
              ) : (
                <div className="text-center space-y-2 opacity-50">
                  <Shield className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-[10px] font-mono">SINAL PERDIDO</p>
                </div>
              )}
            </div>

            {/* Hover Play Button */}
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/cam:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
               <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Play className="h-5 w-5 text-white fill-white ml-0.5" />
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <div className="flex items-center gap-4">
           <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> Latência: 45ms</span>
           <span className="hidden sm:inline">Repetidor: 100% Sinal</span>
        </div>
        <button className="text-primary hover:underline font-bold">HISTÓRICO</button>
      </div>
    </div>
  );
}
