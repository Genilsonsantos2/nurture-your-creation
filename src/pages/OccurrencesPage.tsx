import { Plus, FileWarning, X, Save } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
      const { data, error } = await supabase.from("occurrences").select("*, students(name, series, class)").order("created_at", { ascending: false }).limit(100);
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
              {occ.description && <p className="text-sm text-muted-foreground">{occ.description}</p>}
              <p className="text-xs text-muted-foreground">
                {new Date(occ.created_at).toLocaleDateString("pt-BR")} às {new Date(occ.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
