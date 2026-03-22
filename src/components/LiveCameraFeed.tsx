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
            className={`relative rounded-2xl overflow-hidden bg-[#050510] border border-white/10 cursor-pointer hover:border-primary/50 transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.5)] group/cam backdrop-blur-xl ${
               viewMode === "grid" 
                 ? cam.id === activeCam 
                    ? "lg:col-span-3 lg:row-span-3 h-full min-h-[250px] lg:min-h-0 order-first ring-1 ring-primary/30" 
                    : "lg:col-span-1 lg:row-span-1 h-32 lg:h-full order-last opacity-75 hover:opacity-100 grayscale-[30%] hover:grayscale-0"
                 : "h-full w-full ring-1 ring-primary/30"
            }`}
            onClick={() => {
              setActiveCam(cam.id);
              if (viewMode === "grid" && isMain) {
                setViewMode("single");
              }
            }}
          >
            {/* Camera Name Overlay */}
            <div className={`absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center gap-2.5 transition-all duration-500 shadow-lg ${isMain ? 'scale-100' : 'scale-90 origin-top-left'}`}>
              <div className={`relative flex items-center justify-center h-2.5 w-2.5`}>
                <div className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${cam.status === 'online' ? 'bg-success' : 'bg-destructive'}`}></div>
                <div className={`relative inline-flex rounded-full h-2 w-2 ${cam.status === 'online' ? 'bg-success' : 'bg-destructive'}`}></div>
              </div>
              <span className={`font-bold text-white/90 uppercase tracking-widest ${isMain ? 'text-[10px]' : 'text-[8px]'}`}>{cam.name}</span>
            </div>

            {/* Time Overlay */}
            <div className={`absolute top-4 right-4 z-20 font-mono text-white/90 bg-black/50 backdrop-blur-xl px-2 py-1 rounded border border-white/10 shadow-lg flex items-center gap-2 transition-all duration-500 ${isMain ? 'text-xs' : 'text-[9px]'}`}>
               {cam.status === 'online' && <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
               REC 20:49:12
            </div>

            {/* Mock Video Feed Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {cam.status === 'online' ? (
                 <div className="relative w-full h-full">
                    {/* Placeholder for camera stream with improved gradient and glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center overflow-hidden">
                       <div className={`absolute transition-all duration-1000 ${isMain ? 'inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-primary/15 to-transparent' : ''}`} />
                       
                       {/* Abstract grid pattern */}
                       <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
                       
                       <Camera className={`text-white/10 transform transition-all duration-1000 ${isMain ? 'h-40 w-40 drop-shadow-[0_0_30px_rgba(var(--primary),0.2)]' : 'h-16 w-16 opacity-30'}`} />
                       
                       {isMain && (
                         <div className="absolute bottom-6 left-6 flex gap-3 z-20">
                           <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 shadow-xl flex flex-col">
                             <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Bitrate</span>
                             <span className="text-xs text-info font-mono font-medium">4.2 Mbps</span>
                           </div>
                           <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 shadow-xl flex flex-col">
                             <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Framerate</span>
                             <span className="text-xs text-primary font-mono font-medium">30 FPS</span>
                           </div>
                           <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 shadow-xl flex flex-col">
                             <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Resolução</span>
                             <span className="text-xs text-white/80 font-mono font-medium">4K UHD</span>
                           </div>
                         </div>
                       )}
                    </div>
                    {/* Refined Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-40 mix-blend-overlay" />
                 </div>
              ) : (
                <div className="text-center space-y-2 opacity-40">
                  <Shield className={`text-muted-foreground mx-auto ${isMain ? 'h-12 w-12' : 'h-6 w-6'}`} />
                  <p className={`font-mono text-muted-foreground ${isMain ? 'text-xs' : 'text-[9px]'}`}>SINAL PERDIDO</p>
                </div>
              )}
            </div>

            {/* Hover Play Button */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/cam:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[1px]">
               <div className="h-14 w-14 rounded-full bg-primary/20 border border-primary/50 text-white flex items-center justify-center scale-75 group-hover/cam:scale-100 transition-all duration-500 shadow-[0_0_30px_rgba(var(--primary),0.4)] backdrop-blur-md">
                  <Play className="h-6 w-6 fill-current ml-1" />
               </div>
            </div>

            {/* Active Border Glow */}
            {isMain && viewMode === "grid" && (
              <div className="absolute inset-0 border-[1.5px] border-primary/40 rounded-2xl pointer-events-none shadow-[inset_0_0_30px_rgba(var(--primary),0.1)] transition-all duration-1000" />
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
