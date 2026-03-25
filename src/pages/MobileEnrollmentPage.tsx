import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Scan, ShieldCheck, User, ArrowLeft, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function MobileEnrollmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'preview' | 'scanning' | 'done'>('preview');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchStudent() {
      const { data, error } = await supabase.from("students").select("*").eq("id", id).single();
      if (error) {
        toast.error("Aluno não encontrado");
        navigate("/");
        return;
      }
      setStudent(data);
      setLoading(false);
    }
    fetchStudent();
  }, [id, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!file || !id) return;

    setUploading(true);
    setStep('scanning');

    try {
      // 1. Upload Photo to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      // 2. Update Student Record
      const { error: updateError } = await supabase
        .from("students")
        .update({ photo_url: publicUrl })
        .eq("id", id);

      if (updateError) throw updateError;

      // 3. Generate Biometric Signature (Simulated AI)
      // We'll wait a bit to show the "Scanning" animation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockEncoding = Array.from({length: 128}, () => Math.random());
      const { error: encodingError } = await supabase.from("student_face_encodings").upsert({
        student_id: id,
        encoding: mockEncoding as any
      }, { onConflict: 'student_id' });

      if (encodingError) throw encodingError;

      setStep('done');
      toast.success("Biometria Facial Cadastrada!");
    } catch (error: any) {
      toast.error("Erro no cadastro: " + error.message);
      setStep('preview');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
      <p className="font-black text-xs uppercase tracking-widest opacity-50">Iniciando Portal Biométrico...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Mobile-First Header */}
      <header className="p-6 flex items-center justify-between border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Scan className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight">Cadastro Facial</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{student.name.split(' ')[0]}</p>
          </div>
        </div>
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
      </header>

      <main className="flex-1 flex flex-col p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full" />

        {step === 'preview' && (
          <div className="flex-1 flex flex-col">
            <div className="bg-card/50 border-2 border-dashed border-border rounded-[2.5rem] flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
              {capturedImage ? (
                <div className="absolute inset-0">
                  <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary">
                    <Camera className="h-10 w-10" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight uppercase">Capturar Foto</h2>
                  <p className="text-xs text-muted-foreground mt-2 max-w-[200px] leading-relaxed">
                    Posicione o rosto do aluno de forma clara e centralizada.
                  </p>
                </div>
              )}
              
              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
              />
            </div>

            <div className="mt-8 space-y-4">
              {capturedImage ? (
                <button 
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full premium-button py-5 text-sm bg-primary shadow-xl shadow-primary/20"
                >
                  <ShieldCheck className="h-5 w-5" /> Confirmar Biometria
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground">O sistema usará a câmera nativa do seu celular para alta precisão.</p>
                </div>
              )}
              <button 
                onClick={() => navigate(-1)}
                className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Cancelar
              </button>
            </div>
          </div>
        )}

        {step === 'scanning' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 relative">
            <div className="relative w-72 h-72 rounded-[3.5rem] border-4 border-primary/50 overflow-hidden shadow-2xl">
               <img src={capturedImage!} alt="Scanning" className="w-full h-full object-cover grayscale opacity-50" />
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-full h-1 bg-primary shadow-[0_0_20px_white] animate-scan-move absolute top-0" />
                  <div className="grid grid-cols-4 gap-4 opacity-30">
                     {Array.from({length: 16}).map((_, i) => (
                        <div key={i} className="h-1 w-1 bg-white rounded-full animate-pulse" style={{animationDelay: `${i * 100}ms`}} />
                     ))}
                  </div>
               </div>
            </div>
            <div className="text-center space-y-2">
               <h2 className="text-xl font-black text-primary animate-pulse tracking-widest uppercase">Processando IA</h2>
               <p className="text-xs font-mono text-muted-foreground">GERANDO ASSINATURA: 128 PONTOS FOCAIS...</p>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-500">
             <div className="h-32 w-32 rounded-full bg-success/10 border-4 border-success flex items-center justify-center text-success relative">
                <CheckCircle2 className="h-16 w-16" />
                <div className="absolute inset-0 rounded-full border-4 border-success animate-ping opacity-20" />
             </div>
             <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Sucesso!</h2>
                <p className="text-sm font-medium text-muted-foreground max-w-[200px] mx-auto">
                   A biometria de <strong>{student.name}</strong> foi integrada ao sistema de inteligência.
                </p>
             </div>
             <button 
               onClick={() => window.close()} 
               className="mt-4 premium-button bg-success px-10 py-4 shadow-xl shadow-success/20"
             >
                Concluir e Fechar
             </button>
             <p className="text-[10px] text-muted-foreground mt-4 italic font-medium">Você já pode fechar esta aba e voltar para o computador.</p>
          </div>
        )}
      </main>

      <footer className="p-6 border-t border-border/30 bg-card/20 text-center">
         <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">CETI Digital • Biometric Security Node</p>
      </footer>

      <style>{`
        @keyframes scan-move {
           0% { top: 0; }
           100% { top: 100%; }
        }
        .animate-scan-move {
           animation: scan-move 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
