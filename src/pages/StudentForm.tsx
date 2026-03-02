import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function StudentForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "", series: "", class: "", enrollment: "", exitLimit: "",
    guardianName: "", guardianPhone: "", guardianRelation: "",
    whatsappEnabled: false,
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      // Insert student
      const { data: student, error: studentErr } = await supabase.from("students").insert({
        name: form.name,
        series: form.series,
        class: form.class,
        enrollment: form.enrollment,
        exit_limit: form.exitLimit ? parseInt(form.exitLimit) : null,
      }).select().single();

      if (studentErr) throw studentErr;

      // Insert guardian if provided
      if (form.guardianName && form.guardianPhone) {
        const { error: guardianErr } = await supabase.from("guardians").insert({
          student_id: student.id,
          name: form.guardianName,
          phone: form.guardianPhone,
          relation: form.guardianRelation || null,
          whatsapp_enabled: form.whatsappEnabled,
        });
        if (guardianErr) throw guardianErr;
      }

      return student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Aluno cadastrado com sucesso!");
      navigate("/alunos");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Matrícula já cadastrada.");
      } else {
        toast.error("Erro ao cadastrar aluno.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastrar Aluno</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados do aluno e responsável</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Dados do Aluno</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Nome Completo *</label>
              <input required value={form.name} onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Série *</label>
              <select required value={form.series} onChange={(e) => update("series", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                {["6º Ano", "7º Ano", "8º Ano", "9º Ano", "1ª Série EM", "2ª Série EM", "3ª Série EM"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Turma *</label>
              <select required value={form.class} onChange={(e) => update("class", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                {["A", "B", "C"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Matrícula *</label>
              <input required value={form.enrollment} onChange={(e) => update("enrollment", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Limite de Saídas/Semana</label>
              <input type="number" value={form.exitLimit} onChange={(e) => update("exitLimit", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Dados do Responsável</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Nome do Responsável</label>
              <input value={form.guardianName} onChange={(e) => update("guardianName", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Telefone (WhatsApp)</label>
              <input placeholder="75988880001" value={form.guardianPhone} onChange={(e) => update("guardianPhone", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Parentesco</label>
              <select value={form.guardianRelation} onChange={(e) => update("guardianRelation", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecione...</option>
                {["Mãe", "Pai", "Avó", "Avô", "Tio(a)", "Outro"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input type="checkbox" id="whatsapp" checked={form.whatsappEnabled}
                onChange={(e) => update("whatsappEnabled", e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring" />
              <label htmlFor="whatsapp" className="text-sm text-foreground">Receber notificações via WhatsApp</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save className="h-4 w-4" /> {mutation.isPending ? "Salvando..." : "Salvar Aluno"}
          </button>
        </div>
      </form>
    </div>
  );
}
