import { Save, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    schoolName: "",
    whatsappEnabled: false,
    schoolPhone: "",
    apiKeyGlobal: "",
    exitLimit: "3",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        schoolName: settings.school_name,
        whatsappEnabled: settings.whatsapp_enabled || false,
        schoolPhone: settings.school_phone || "",
        apiKeyGlobal: settings.callmebot_api_key_global || "",
        exitLimit: String(settings.exit_limit_default || 3),
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings) return;
      const { error } = await supabase.from("settings").update({
        school_name: form.schoolName,
        whatsapp_enabled: form.whatsappEnabled,
        school_phone: form.schoolPhone,
        callmebot_api_key_global: form.apiKeyGlobal,
        exit_limit_default: parseInt(form.exitLimit) || 3,
      }).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas!");
    },
    onError: () => toast.error("Erro ao salvar configurações."),
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Ajuste os parâmetros gerais do sistema</p>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Dados da Escola</h2>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Nome da Escola</label>
          <input value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Limite padrão de saídas semanais</label>
          <input type="number" value={form.exitLimit} onChange={(e) => update("exitLimit", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Integração WhatsApp (CallMeBot)</h2>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="whatsapp-toggle" checked={form.whatsappEnabled}
            onChange={(e) => update("whatsappEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-ring" />
          <label htmlFor="whatsapp-toggle" className="text-sm text-foreground">Ativar envio de notificações via WhatsApp</label>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Número da Escola</label>
          <input value={form.schoolPhone} onChange={(e) => update("schoolPhone", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">API Key Global (CallMeBot)</label>
          <input type="password" value={form.apiKeyGlobal} onChange={(e) => update("apiKeyGlobal", e.target.value)}
            placeholder="Insira a chave global..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          <Send className="h-4 w-4" /> Enviar Mensagem de Teste
        </button>
      </div>

      <div className="flex justify-end">
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
          <Save className="h-4 w-4" /> {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}
