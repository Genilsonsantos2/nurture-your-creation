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

      <div className={`flex-1 min-h-0 grid gap-3 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${viewMode === "grid" ? 'grid-cols-1 lg:grid-cols-4 lg:grid-rows-3' : 'grid-cols-1'}`}>
        {CAM_MOCKUPS.filter(c => viewMode === "grid" || c.id === activeCam).map((cam) => {
          const isMain = viewMode === "single" || cam.id === activeCam;
          return (
          <div 
            key={cam.id} 
            className={`relative rounded-xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer hover:border-primary/40 transition-all duration-500 shadow-2xl group/cam backdrop-blur-sm ${
               viewMode === "grid" 
                 ? cam.id === activeCam 
                    ? "lg:col-span-3 lg:row-span-3 h-full min-h-[250px] lg:min-h-0 order-first" 
                    : "lg:col-span-1 lg:row-span-1 h-32 lg:h-full order-last"
                 : "h-full w-full"
            }`}
            onClick={() => {
              setActiveCam(cam.id);
              if (viewMode === "grid" && isMain) {
                setViewMode("single");
              }
            }}
          >
            {/* Camera Name Overlay */}
            <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2 transition-all duration-500 ${isMain ? 'scale-100' : 'scale-90 origin-top-left'}`}>
              <div className={`h-2 w-2 rounded-full ${cam.status === 'online' ? 'bg-success animate-pulse' : 'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
              <span className={`font-bold text-white uppercase tracking-wider ${isMain ? 'text-[11px]' : 'text-[9px]'}`}>{cam.name}</span>
            </div>

            {/* Time Overlay */}
            <div className={`absolute top-3 right-3 z-10 font-mono text-white/70 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/5 transition-all duration-500 ${isMain ? 'text-[11px]' : 'text-[9px]'}`}>
               <span className="text-destructive animate-pulse mr-1 font-bold">●</span> REC 20:49:12
            </div>

            {/* Mock Video Feed Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {cam.status === 'online' ? (
                 <div className="relative w-full h-full">
                    {/* Placeholder for camera stream with improved gradient and glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center overflow-hidden">
                       <div className={`absolute transition-all duration-1000 ${isMain ? 'inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/10 to-transparent' : ''}`} />
                       <Camera className={`text-white/5 transform -rotate-6 transition-all duration-700 ${isMain ? 'h-32 w-32 opacity-[0.03] scale-110' : 'h-12 w-12 opacity-[0.05] scale-150'}`} />
                       
                       {isMain && (
                         <div className="absolute bottom-4 left-4 text-[10px] text-white/30 font-mono flex gap-4">
                           <span className="bg-black/40 px-2 py-1 rounded border border-white/5">BITRATE: 4.2 Mbps</span>
                           <span className="bg-black/40 px-2 py-1 rounded border border-white/5">FPS: 30</span>
                         </div>
                       )}
                    </div>
                    {/* Refined Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px,3px_100%] opacity-30" />
                 </div>
              ) : (
                <div className="text-center space-y-2 opacity-40">
                  <Shield className={`text-muted-foreground mx-auto ${isMain ? 'h-12 w-12' : 'h-6 w-6'}`} />
                  <p className={`font-mono text-muted-foreground ${isMain ? 'text-xs' : 'text-[9px]'}`}>SINAL PERDIDO</p>
                </div>
              )}
            </div>

            {/* Hover Play Button */}
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/cam:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
               <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/50 text-primary flex items-center justify-center scale-75 group-hover/cam:scale-100 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                  <Play className="h-5 w-5 fill-current ml-1" />
               </div>
            </div>

            {/* Active Border Glow */}
            {isMain && viewMode === "grid" && (
              <div className="absolute inset-0 border-2 border-primary/40 rounded-xl pointer-events-none shadow-[inset_0_0_20px_rgba(var(--primary),0.1)]" />
            )}
          </div>
        )})}
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
