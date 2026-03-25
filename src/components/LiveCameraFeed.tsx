import { useEffect, useState } from "react";
import { Camera, Maximize2, LayoutGrid, Monitor, Play, Shield, Video, Zap, Scan } from "lucide-react";

const CAM_MOCKUPS = [
  { id: 1, name: "Portaria Principal", status: "online", color: "text-success" },
  { id: 2, name: "Corredor A - Bloco 1", status: "online", color: "text-success" },
  { id: 3, name: "Pátio Central", status: "offline", color: "text-muted-foreground" },
  { id: 4, name: "Entrada Professores", status: "online", color: "text-success" },
];

type CameraMockup = (typeof CAM_MOCKUPS)[number];

function CameraFeedCard({
  cam,
  index,
  viewMode,
  activeCam,
  onSelect,
}: {
  cam: CameraMockup;
  index: number;
  viewMode: "grid" | "single";
  activeCam: number;
  onSelect: (camId: number, shouldOpenSingle: boolean) => void;
}) {
  const isMain = viewMode === "single" || cam.id === activeCam;
  const [occupancy, setOccupancy] = useState(() => Math.floor(Math.random() * 5));
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsDetecting(true);
        setTimeout(() => {
          setIsDetecting(false);
          setOccupancy((prev) => Math.max(0, Math.min(15, prev + (Math.random() > 0.5 ? 1 : -1))));
        }, 2000);
      }
    }, 8000 + index * 1000);

    return () => clearInterval(interval);
  }, [index]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer hover:border-primary/40 transition-all duration-500 shadow-2xl group/cam backdrop-blur-sm ${
        viewMode === "grid"
          ? cam.id === activeCam
            ? "lg:col-span-3 lg:row-span-3 h-full min-h-[250px] lg:min-h-0 order-first"
            : "lg:col-span-1 lg:row-span-1 h-32 lg:h-full order-last"
          : "h-full w-full"
      }`}
      onClick={() => onSelect(cam.id, viewMode === "grid" && isMain)}
    >
      {isMain && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute bottom-16 right-4 flex flex-col items-end gap-2">
            {isDetecting && (
              <div className="flex items-center gap-2 px-3 py-1 bg-accent/80 backdrop-blur-md rounded-lg border border-accent/50 animate-in slide-in-from-right duration-300">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">IA: Processando Frame...</span>
              </div>
            )}
            <div className="flex flex-col items-end bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">Análise de Ocupação</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{occupancy}</span>
                <span className="text-[10px] font-bold text-white/50 lowercase">pessoas</span>
              </div>
            </div>
          </div>

          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/40" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/40" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/40" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/40" />
        </div>
      )}

      <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2 transition-all duration-500 ${isMain ? 'scale-100' : 'scale-90 origin-top-left'}`}>
        <div className={`h-2 w-2 rounded-full ${cam.status === 'online' ? 'bg-success animate-pulse' : 'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
        <span className={`font-bold text-white uppercase tracking-wider ${isMain ? 'text-[11px]' : 'text-[9px]'}`}>{cam.name}</span>
      </div>

      <div className={`absolute top-3 right-3 z-10 font-mono text-white/70 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/5 transition-all duration-500 ${isMain ? 'text-[11px]' : 'text-[9px]'}`}>
        <span className="text-destructive animate-pulse mr-1 font-bold">●</span> INFRA: ON
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {cam.status === 'online' ? (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center overflow-hidden">
              <div className={`absolute transition-all duration-1000 ${isMain ? 'inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/10 to-transparent' : ''}`} />
              <Camera className={`text-white/5 transform -rotate-6 transition-all duration-700 ${isMain ? 'h-32 w-32 opacity-[0.03] scale-110' : 'h-12 w-12 opacity-[0.05] scale-150'}`} />

              {isMain && isDetecting && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Scan className="h-48 w-48 text-primary/10 animate-pulse" />
                </div>
              )}

              {isMain && (
                <div className="absolute bottom-4 left-4 text-[10px] text-white/30 font-mono flex gap-4">
                  <span className="bg-black/40 px-2 py-1 rounded border border-white/5 uppercase">Object: Student_Class_A</span>
                  <span className="bg-black/40 px-2 py-1 rounded border border-white/5">AI_CONF: 98.4%</span>
                </div>
              )}
            </div>
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px,3px_100%] opacity-30" />
          </div>
        ) : (
          <div className="text-center space-y-2 opacity-40">
            <Shield className={`text-muted-foreground mx-auto ${isMain ? 'h-12 w-12' : 'h-6 w-6'}`} />
            <p className={`font-mono text-muted-foreground ${isMain ? 'text-xs' : 'text-[9px]'}`}>SINAL PERDIDO</p>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/cam:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
        <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/50 text-primary flex items-center justify-center scale-75 group-hover/cam:scale-100 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]">
          <Play className="h-5 w-5 fill-current ml-1" />
        </div>
      </div>

      {isMain && viewMode === "grid" && (
        <div className="absolute inset-0 border-2 border-primary/40 rounded-xl pointer-events-none shadow-[inset_0_0_20px_rgba(var(--primary),0.1)]" />
      )}
    </div>
  );
}

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
        {CAM_MOCKUPS.filter((c) => viewMode === "grid" || c.id === activeCam).map((cam, i) => (
          <CameraFeedCard
            key={cam.id}
            cam={cam}
            index={i}
            viewMode={viewMode}
            activeCam={activeCam}
            onSelect={(camId, shouldOpenSingle) => {
              setActiveCam(camId);
              if (shouldOpenSingle) {
                setViewMode("single");
              }
            }}
          />
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
