import { Plus, FileWarning, X, Save, FileDown, MessageCircle } from "lucide-react";
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
  unauthorized_exit: "bg-destructive/15 text-destructive",
  late: "bg-warning/15 text-warning",
  student_sick: "bg-info/15 text-info",
  guardian_pickup: "bg-muted text-muted-foreground",
  behavior: "bg-destructive/15 text-destructive",
  other: "bg-muted text-muted-foreground",
};

export default function OccurrencesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_id: "", type: "late" as string, description: "" });

  const { data: occurrences = [] } = useQuery({
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
    // Enrolment might not be in the query unless we specify it. The query in this component does not select enrollment, but we will add it to the query next!
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ocorrências</h1>
          <p className="text-sm text-muted-foreground">Registro de incidentes e situações especiais</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Registrar Ocorrência
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Nova Ocorrência</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Aluno *</label>
              <select value={form.student_id} onChange={(e) => setForm(p => ({ ...p, student_id: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.series} {s.class}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tipo *</label>
              <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Descrição</label>
              <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={() => createMutation.mutate()} disabled={!form.student_id || createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
              <Save className="h-4 w-4" /> {createMutation.isPending ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {occurrences.length === 0 ? (
          <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground text-sm">Nenhuma ocorrência registrada</div>
        ) : (
          occurrences.map((occ: any) => (
            <div key={occ.id} className="bg-card rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{occ.students?.name}</span>
                  <span className="text-xs text-muted-foreground">— {occ.students?.series} {occ.students?.class}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[occ.type] || "bg-muted text-muted-foreground"}`}>
                  {typeLabels[occ.type] || occ.type}
                </span>
              </div>
              {occ.description && <p className="text-sm text-foreground/80 bg-muted/30 p-3 rounded-md border border-border/50">{occ.description}</p>}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Registrado em {new Date(occ.created_at).toLocaleDateString("pt-BR")} às {new Date(occ.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button onClick={() => generatePDF(occ)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm">
                    <FileDown className="h-3.5 w-3.5" /> Baixar PDF
                  </button>
                  <button onClick={() => handleWhatsApp(occ)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] text-white px-3 py-1.5 text-xs font-semibold hover:bg-[#20bd5a] transition-colors shadow-sm">
                    <MessageCircle className="h-3.5 w-3.5" /> Enviar WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
