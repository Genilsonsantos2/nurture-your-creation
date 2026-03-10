import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
    FileCheck, Send, ShieldCheck, AlertCircle,
    Calendar, User, BookOpen, CheckCircle, Camera, Image as ImageIcon, X, Paperclip
} from "lucide-react";
import { toast } from "sonner";

export default function JustificationPortal() {
    const { token } = useParams();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        reason: ""
    });
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchStudent = async () => {
            if (!token) return;

            try {
                // Step 1: Find guardian by token
                const { data: guardian, error: gError } = await supabase
                    .from("guardians")
                    .select("student_id")
                    .eq("parent_access_token", token)
                    .maybeSingle();

                if (gError || !guardian) {
                    setLoading(false);
                    return;
                }

                // Step 2: Get student details
                const { data: studentData, error: sError } = await supabase
                    .from("students")
                    .select("*")
                    .eq("id", guardian.student_id)
                    .maybeSingle();

                if (studentData) {
                    setStudent(studentData);
                }
            } catch (err) {
                console.error("Portal error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [token]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error("O arquivo é muito grande. Máximo 5MB.");
                return;
            }
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreviewUrl(reader.result as string);
                reader.readAsDataURL(selectedFile);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student || !form.reason) return;

        setSubmitting(true);
        try {
            let documentUrl = null;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${student.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('justifications')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('justifications')
                    .getPublicUrl(fileName);

                documentUrl = publicUrl;
            }

            const { error } = await (supabase as any)
                .from("absence_justifications")
                .insert({
                    student_id: student.id,
                    justification_date: form.date,
                    reason: form.reason,
                    document_url: documentUrl,
                    status: 'pending'
                } as any);

            if (error) throw error;
            setSuccess(true);
            toast.success("Justificativa enviada com sucesso!");
        } catch (err) {
            toast.error("Erro ao enviar justificativa.");
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
            <p className="text-muted-foreground font-medium">Buscando informações do aluno...</p>
        </div>
    );

    if (!student) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="h-20 w-20 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
                <AlertCircle className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">Acesso Expirado ou Inválido</h1>
            <p className="text-muted-foreground max-w-xs font-medium">O link utilizado para justificar a ocorrência não é mais válido ou está incorreto.</p>
        </div>
    );

    if (success) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
            <div className="h-24 w-24 rounded-[2rem] bg-success text-white flex items-center justify-center mb-8 shadow-2xl shadow-success/20">
                <CheckCircle className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-black text-foreground mb-4 tracking-tight">Enviado com Sucesso!</h1>
            <p className="text-muted-foreground max-w-sm font-medium leading-relaxed">
                A justificativa para <strong>{student.name}</strong> foi enviada à coordenação do <strong>CETINI</strong> e será analisada em breve.
            </p>
            <button onClick={() => window.close()} className="mt-10 px-10 py-4 rounded-2xl bg-muted text-muted-foreground font-black text-xs uppercase tracking-widest hover:bg-muted/80">Fechar Janela</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background lg:flex">
            {/* Left side info */}
            <div className="lg:w-1/3 bg-primary p-10 lg:p-16 text-primary-foreground flex flex-col justify-between relative overflow-hidden">
                <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[80%] rounded-full bg-white/5 blur-[100px]" />

                <div className="relative z-10">
                    <div className="h-16 w-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-10 border border-white/20">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight leading-none mb-4">Portal do Responsável</h1>
                    <p className="text-primary-foreground/70 font-medium text-lg max-w-xs">Justificativa escolar para ocorrências (Atrasos e Saídas).</p>
                </div>

                <div className="relative z-10 space-y-8 mt-16 lg:mt-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center"><User className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Estudante</p>
                            <p className="font-bold text-lg leading-tight">{student.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center"><BookOpen className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Série / Turma</p>
                            <p className="font-bold text-lg leading-tight">{student.series} {student.class}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side form */}
            <div className="flex-1 p-6 lg:p-20 flex flex-col justify-center">
                <div className="max-w-xl mx-auto w-full space-y-10">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-foreground tracking-tight">Nova Justificativa</h2>
                        <p className="text-muted-foreground font-semibold">Preencha os detalhes da ocorrência (atraso ou saída antecipada) para análise da escola.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Data da Ocorrência</label>
                            <div className="relative group">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary transition-transform group-focus-within:scale-110" />
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full bg-muted/50 border-2 border-transparent focus:border-primary/20 focus:bg-background h-16 pl-14 pr-6 rounded-2xl font-bold text-foreground transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Motivo / Descrição</label>
                            <textarea
                                required
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                placeholder="Ex: Aluno saiu para consulta médica ou chegou atrasado devido transporte..."
                                rows={4}
                                className="w-full bg-muted/50 border-2 border-transparent focus:border-primary/20 focus:bg-background p-6 rounded-3xl font-bold text-foreground transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Anexar Documento / Foto (Opcional)</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="file-upload"
                                    onChange={handleFileChange}
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`flex flex-col items-center justify-center w-full min-h-[120px] rounded-3xl border-2 border-dashed transition-all cursor-pointer hover:bg-muted/30 ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 bg-muted/20'}`}
                                >
                                    {previewUrl ? (
                                        <div className="relative w-full h-full p-4 flex flex-col items-center">
                                            <img src={previewUrl} alt="Preview" className="h-40 w-full object-cover rounded-xl mb-3 shadow-lg" />
                                            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                                                <X className="h-3 w-3 cursor-pointer" onClick={(e) => { e.preventDefault(); setFile(null); setPreviewUrl(null); }} /> Alterar Foto
                                            </div>
                                        </div>
                                    ) : file ? (
                                        <div className="p-6 flex flex-col items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                                                <Paperclip className="h-6 w-6" />
                                            </div>
                                            <p className="text-sm font-bold text-foreground max-w-[200px] truncate text-center">{file.name}</p>
                                            <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} className="text-[10px] font-black uppercase text-red-500 hover:underline">Remover</button>
                                        </div>
                                    ) : (
                                        <div className="p-6 flex flex-col items-center gap-4 text-center">
                                            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                                <Camera className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">Clique para tirar foto ou anexar</p>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Atestado médico, declaração, etc.</p>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full h-16 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <Send className="h-5 w-5" />
                            {submitting ? "Enviando..." : "Enviar Justificativa"}
                        </button>
                    </form>

                    <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed">
                        Ao enviar, você declara que as informações são verdadeiras. <br />
                        O portal é monitorado pelo CETI NOVA ITARANA.
                    </p>
                </div>
            </div>
        </div>
    );
}
