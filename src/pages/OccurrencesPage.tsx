import { Plus, FileWarning, X, Save, FileDown, MessageCircle, AlertCircle, History, User } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";

const typeLabels: Record<string, string> = {
  unauthorized_exit: "Saída sem autorização",
  guardian_pickup: "Responsável buscou",
  student_sick: "Aluno passou mal",
  behavior: "Comportamento",
  late: "Atraso",
  other: "Outro",
};

const typeColors: Record<string, string> = {
  unauthorized_exit: "bg-destructive text-white shadow-destructive/20",
  late: "bg-warning text-white shadow-warning/20",
  student_sick: "bg-info text-white shadow-info/20",
  guardian_pickup: "bg-muted text-muted-foreground",
  behavior: "bg-destructive text-white shadow-destructive/20",
  other: "bg-muted text-muted-foreground",
};

export default function OccurrencesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_id: "", type: "late" as string, description: "" });

  const { data: occurrences = [], isLoading } = useQuery({
    queryKey: ["occurrences"],
    queryFn: async () => {
      const { data, error } = await supabase.from("occurrences").select("*, students(name, series, class, enrollment)").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, name, series, class").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("occurrences").insert({
        student_id: form.student_id,
        type: form.type as any,
        description: form.description || null,
        registered_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
      toast.success("Ocorrência registrada!");
      setShowForm(false);
      setForm({ student_id: "", type: "late", description: "" });
    },
    onError: () => toast.error("Erro ao registrar ocorrência."),
  });

  const generatePDF = (occ: any) => {
    const doc = new jsPDF() as any;
    const dateStr = new Date(occ.created_at).toLocaleDateString("pt-BR");
    const timeStr = new Date(occ.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Header
    doc.setFillColor(15, 62, 122);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CETI NOVA ITARANA", 105, 20, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("COMUNICADO DISCIPLINAR OFICIAL", 105, 30, { align: "center" });

    // Body layout
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO ALUNO", 20, 60);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${occ.students?.name || "Desconhecido"}`, 20, 70);
    doc.text(`Série/Turma: ${occ.students?.series} ${occ.students?.class}`, 20, 78);
    doc.text(`Matrícula: ${occ.students?.enrollment || "Não informada"}`, 20, 86);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DETALHES DA OCORRÊNCIA", 20, 110);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Data do Registro: ${dateStr} às ${timeStr}`, 20, 120);
    doc.text(`Motivo/Tipo: ${typeLabels[occ.type] || occ.type}`, 20, 128);

    doc.setFont("helvetica", "bold");
    doc.text("Descrição do Ocorrido:", 20, 142);
    doc.setFont("helvetica", "normal");

    const splitDesc = doc.splitTextToSize(occ.description || "Nenhuma descrição detalhada foi fornecida para esta ocorrência.", 170);
    doc.text(splitDesc, 20, 150);

    // Signature lines
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.5);

    doc.line(30, 240, 95, 240);
    doc.setFontSize(9);
    doc.text("Assinatura da Coordenação", 62.5, 246, { align: "center" });

    doc.line(115, 240, 180, 240);
    doc.text("Assinatura do Responsável", 147.5, 246, { align: "center" });

    doc.save(`Ocorrencia_${(occ.students?.name || "Aluno").split(" ")[0]}_${dateStr.replace(/\//g, "-")}.pdf`);
  };

  const handleWhatsApp = (occ: any) => {
    const text = `⚠️ *CETI NOVA ITARANA* | *Comunicado Escolar*\n\nOlá, responsável.\nRegistramos uma ocorrência disciplinar para o aluno(a) *${occ.students?.name}* hoje (${new Date(occ.created_at).toLocaleDateString("pt-BR")}).\n\n*Motivo:* ${typeLabels[occ.type] || occ.type}\n*Observação:* ${occ.description || "Sem detalhes adicionais inseridos no sistema."}\n\nRecomendamos que compareça à coordenação da escola para assinar o termo físico ou para maiores esclarecimentos.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent p-10 rounded-[3rem] border border-destructive/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <FileWarning className="w-64 h-64 text-destructive" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-20 w-20 rounded-[2rem] bg-destructive shadow-2xl shadow-destructive/40 flex items-center justify-center text-white">
            <AlertCircle className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">Centro de Ocorrências</h1>
            <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
              Gestão Disciplinar & Monitoramento
            </p>
          </div>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => setShowForm(!showForm)}
            className={`premium-button ${showForm ? "bg-muted text-foreground shadow-none" : "bg-destructive text-white shadow-destructive/40"}`}
          >
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showForm ? "Fechar Formulário" : "Nova Ocorrência"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-panel p-10 border-destructive/20 shadow-2xl animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
          <div className="relative z-10 space-y-8">
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">Registro de Incidente</h2>
              <p className="text-sm text-muted-foreground font-medium mt-1">Preencha os detalhes abaixo para gerar o relatório oficial.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-foreground uppercase tracking-[0.15em] ml-1">Aluno Alvo</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm(p => ({ ...p, student_id: e.target.value }))}
                  className="premium-input w-full appearance-none pr-10"
                >
                  <option value="">Buscar aluno...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.series} {s.class}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-foreground uppercase tracking-[0.15em] ml-1">Natureza da Ocorrência</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                  className="premium-input w-full appearance-none pr-10"
                >
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-black text-foreground uppercase tracking-[0.15em] ml-1">Relatório Detalhado</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descreva minuciosamente o ocorrido, citando horários e envolvidos se necessário..."
                  rows={4}
                  className="premium-input w-full py-5 resize-none shadow-inner"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <button onClick={() => setShowForm(false)} className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all">
                Cancelar
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.student_id || createMutation.isPending}
                className="premium-button bg-primary shadow-primary/30"
              >
                <Save className="h-4 w-4 mr-2" /> {createMutation.isPending ? "Processando..." : "Confirmar Registro"}
              </button>
            </div>
          </div>

          {/* Subtle background icon for form */}
          <div className="absolute bottom-0 right-0 p-10 opacity-5 pointer-events-none scale-150">
            <Save className="w-48 h-48 text-primary" />
          </div>
        </div>
      )}

      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-3 px-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-black text-foreground tracking-tight">Timeline de Registros</h3>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4 opacity-40">
              <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <p className="text-xs font-black uppercase tracking-widest">Sincronizando registros...</p>
            </div>
          ) : occurrences.length === 0 ? (
            <div className="glass-panel p-20 text-center space-y-4 opacity-50 border-dashed border-2">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <FileWarning className="h-10 w-10" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest">Nenhuma ocorrência encontrada no período.</p>
            </div>
          ) : (
            occurrences.map((occ: any, i) => (
              <div key={occ.id} className="group glass-panel p-1 border-none bg-transparent hover:translate-x-2 transition-transform">
                <div className="bg-card rounded-[2.5rem] border border-border/50 p-8 flex flex-col lg:flex-row lg:items-center gap-8 shadow-xl">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-muted to-muted/20 flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                      <User className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-foreground tracking-tight">{occ.students?.name}</span>
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${typeColors[occ.type] || "bg-muted text-muted-foreground"}`}>
                          {typeLabels[occ.type] || occ.type}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {occ.students?.series} {occ.students?.class} • Matricula {occ.students?.enrollment}
                      </p>
                    </div>
                  </div>

                  <div className="lg:max-w-md flex-1">
                    <p className="text-sm text-foreground/70 font-medium leading-relaxed bg-muted/30 p-5 rounded-2xl border border-border/40 italic group-hover:bg-muted/50 transition-colors line-clamp-2 hover:line-clamp-none cursor-help">
                      "{occ.description || "Nenhuma descrição detalhada inserida."}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 lg:border-l border-border/50 lg:pl-8">
                    <div className="text-right mr-4 hidden sm:block">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registrado em</p>
                      <p className="text-sm font-black text-foreground mt-1">
                        {new Date(occ.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generatePDF(occ)}
                        title="Exportar como PDF"
                        className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white dark:bg-black shadow-lg hover:bg-primary hover:text-white border border-border/50 transition-all active:scale-95"
                      >
                        <FileDown className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleWhatsApp(occ)}
                        title="Enviar via WhatsApp"
                        className="h-12 w-12 flex items-center justify-center rounded-2xl bg-success text-white shadow-lg shadow-success/20 hover:scale-110 transition-all active:scale-95"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </button>
                    </div>
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
