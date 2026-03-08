import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileUp, Brain, Loader2, CheckCircle2, AlertTriangle, X, Camera } from "lucide-react";
import { toast } from "sonner";

type ExtractedData = {
  student_name?: string;
  matched_student_id?: string;
  matched_student_name?: string;
  date?: string;
  period_start?: string;
  period_end?: string;
  reason?: string;
  doctor_name?: string;
  crm?: string;
  confidence?: string;
  raw_text?: string;
  error?: string;
};

type Props = {
  onDataExtracted: (data: ExtractedData) => void;
  onClose: () => void;
};

export default function DocumentReader({ onDataExtracted, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Convert to base64
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("read-document", {
        body: { image_base64: base64, file_type: file.type },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
      toast.success("Documento analisado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao analisar documento");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const confidenceConfig = {
    alta: { color: "text-success", bg: "bg-success/10", label: "Alta" },
    media: { color: "text-warning", bg: "bg-warning/10", label: "Média" },
    baixa: { color: "text-destructive", bg: "bg-destructive/10", label: "Baixa" },
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-foreground">Leitura Inteligente</h3>
              <p className="text-xs text-muted-foreground">Envie foto ou PDF do atestado</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Upload Area */}
          {!preview && !loading && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-primary/30 rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <FileUp className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="font-bold text-foreground">Arraste o arquivo aqui</p>
              <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-3">JPG, PNG ou PDF (máx 10MB)</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          )}

          {/* Camera button for mobile */}
          {!preview && !loading && (
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.capture = "environment";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFile(file);
                };
                input.click();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-muted/30 text-sm font-bold text-foreground hover:bg-muted/50 transition-all"
            >
              <Camera className="h-4 w-4" />
              Tirar foto com a câmera
            </button>
          )}

          {/* Preview */}
          {preview && (
            <div className="rounded-xl overflow-hidden border border-border">
              <img src={preview} alt="Documento" className="w-full max-h-48 object-contain bg-muted/30" />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-muted-foreground">A IA está lendo o documento...</p>
            </div>
          )}

          {/* Results */}
          {result && !result.error && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground text-sm">Dados Extraídos</h4>
                {result.confidence && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${(confidenceConfig as any)[result.confidence]?.bg} ${(confidenceConfig as any)[result.confidence]?.color}`}>
                    Confiança: {(confidenceConfig as any)[result.confidence]?.label}
                  </span>
                )}
              </div>

              {result.matched_student_name && (
                <div className="rounded-xl bg-success/10 border border-success/20 p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span className="text-sm font-bold text-success">Aluno encontrado: {result.matched_student_name}</span>
                </div>
              )}

              {!result.matched_student_name && result.student_name && (
                <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <span className="text-sm font-medium text-warning">Nome no documento: {result.student_name} (não encontrado no sistema)</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                {result.date && (
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Data</p>
                    <p className="font-bold text-foreground">{result.date}</p>
                  </div>
                )}
                {result.reason && (
                  <div className="rounded-lg bg-muted/30 p-2.5 col-span-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Motivo</p>
                    <p className="font-bold text-foreground">{result.reason}</p>
                  </div>
                )}
                {result.period_start && (
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Início</p>
                    <p className="font-bold text-foreground">{result.period_start}</p>
                  </div>
                )}
                {result.period_end && (
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Fim</p>
                    <p className="font-bold text-foreground">{result.period_end}</p>
                  </div>
                )}
                {result.doctor_name && (
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Médico</p>
                    <p className="font-bold text-foreground">{result.doctor_name}</p>
                  </div>
                )}
                {result.crm && (
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">CRM</p>
                    <p className="font-bold text-foreground">{result.crm}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    onDataExtracted(result);
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all"
                >
                  Usar dados extraídos
                </button>
                <button
                  onClick={() => { setResult(null); setPreview(null); }}
                  className="px-4 py-3 rounded-xl border border-border font-bold text-sm text-muted-foreground hover:bg-muted/50 transition-all"
                >
                  Tentar outro
                </button>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-sm font-bold text-destructive">{result.error}</p>
              <button
                onClick={() => { setResult(null); setPreview(null); }}
                className="mt-3 text-sm font-bold text-primary hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
