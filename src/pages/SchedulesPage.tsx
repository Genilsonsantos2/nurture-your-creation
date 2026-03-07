import { Plus, Clock, Trash2, X, Save, Edit2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "entry" as "entry" | "exit" | "break", start_time: "", end_time: "", tolerance_minutes: "10", notify_whatsapp: true });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedules").select("*").order("start_time");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("schedules").insert({
        name: form.name,
        type: form.type,
        start_time: form.start_time,
        end_time: form.end_time,
        tolerance_minutes: parseInt(form.tolerance_minutes) || 5,
        notify_whatsapp: form.notify_whatsapp,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Horário criado!");
      resetForm();
    },
    onError: () => toast.error("Erro ao criar horário."),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from("schedules").update({
        name: form.name,
        type: form.type,
        start_time: form.start_time,
        end_time: form.end_time,
        tolerance_minutes: parseInt(form.tolerance_minutes) || 5,
        notify_whatsapp: form.notify_whatsapp,
      }).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Horário atualizado com sucesso!");
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar horário."),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", type: "entry", start_time: "", end_time: "", tolerance_minutes: "10", notify_whatsapp: true });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Horário removido.");
    },
    onError: () => toast.error("Erro ao remover. Verifique se você tem permissão de administrador."),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Horários</h1>
          <p className="text-sm text-muted-foreground">Configure as janelas de entrada e saída</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Nova Regra
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{editingId ? "Editar Horário" : "Novo Horário"}</h2>
            <button onClick={resetForm} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Nome *</label>
              <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Entrada Manhã"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tipo *</label>
              <select value={form.type} onChange={(e) => {
                const newType = e.target.value as "entry" | "exit" | "break";
                setForm(p => ({ ...p, type: newType }));
              }}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="entry">Entrada</option>
                <option value="exit">Saída</option>
                <option value="break">Intervalo</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tolerância (min)</label>
              <input type="number" value={form.tolerance_minutes}
                onChange={(e) => setForm(p => ({ ...p, tolerance_minutes: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Início *</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm(p => ({ ...p, start_time: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Fim *</label>
              <input type="time" value={form.end_time} onChange={(e) => setForm(p => ({ ...p, end_time: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input type="checkbox" id="notify" checked={form.notify_whatsapp}
                onChange={(e) => setForm(p => ({ ...p, notify_whatsapp: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring" />
              <label htmlFor="notify" className="text-sm text-foreground">Notificar via WhatsApp</label>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}
              disabled={!form.name || !form.start_time || !form.end_time || createMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
              <Save className="h-4 w-4" /> {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )
      }

      {
        isLoading ? (
          <div className="text-center text-muted-foreground py-8">Carregando...</div>
        ) : schedules.length === 0 ? (
          <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground text-sm">Nenhum horário cadastrado</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-card rounded-lg border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{schedule.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingId(schedule.id);
                      setForm({
                        name: schedule.name,
                        type: schedule.type as "entry" | "exit" | "break",
                        start_time: schedule.start_time,
                        end_time: schedule.end_time,
                        tolerance_minutes: schedule.tolerance_minutes.toString(),
                        notify_whatsapp: schedule.notify_whatsapp || false,
                      });
                      setShowForm(true);
                    }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => { if (confirm("Remover este horário?")) deleteMutation.mutate(schedule.id); }}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${schedule.type === "entry" ? "bg-success/15 text-success" : schedule.type === "exit" ? "bg-warning/15 text-warning" : "bg-info/15 text-info"
                    }`}>
                    {schedule.type === "entry" ? "Entrada" : schedule.type === "exit" ? "Saída" : "Intervalo"}
                  </span>
                  {schedule.notify_whatsapp && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-info/15 text-info">
                      Notifica WhatsApp
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {schedule.start_time.slice(0, 5)} — {schedule.end_time.slice(0, 5)}
                  </span>
                  <span>Tolerância: {schedule.tolerance_minutes}min</span>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div >
  );
}
