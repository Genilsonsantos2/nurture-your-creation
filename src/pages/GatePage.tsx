import { Camera, Maximize, ScanLine } from "lucide-react";

export default function GatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portaria</h1>
          <p className="text-sm text-muted-foreground">Escaneie o QR Code do aluno</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          <Maximize className="h-4 w-4" /> Modo Quiosque
        </button>
      </div>

      {/* Scanner area */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-full max-w-md aspect-square rounded-2xl bg-foreground/5 border-2 border-dashed border-border flex flex-col items-center justify-center gap-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="h-10 w-10 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center px-4">
            Clique para ativar a câmera e escaneie o QR Code da carteirinha
          </p>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <ScanLine className="h-5 w-5" /> Ativar Câmera
          </button>
        </div>

        {/* Last scan result (mock) */}
        <div className="w-full max-w-md bg-success/10 border border-success/30 rounded-lg p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center text-success font-bold text-sm">
            JS
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">João Silva</p>
            <p className="text-xs text-muted-foreground">7º Ano A — Mat. 2024001</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-success/20 text-success">Entrada</span>
            <p className="text-xs text-muted-foreground mt-1">07:12</p>
          </div>
        </div>
      </div>
    </div>
  );
}
