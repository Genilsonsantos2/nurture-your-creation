import { Save, Send, Power, PowerOff, ShieldAlert } from "lucide-react";
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
    systemActive: true,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        schoolName: settings.school_name,
        whatsappEnabled: settings.whatsapp_enabled || false,
        schoolPhone: settings.school_phone || "",
        apiKeyGlobal: settings.callmebot_api_key_global || "",
        exitLimit: String(settings.exit_limit_default || 3),
        systemActive: (settings as any).system_active ?? true,
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
        system_active: form.systemActive,
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
    <div className="max-w-4xl space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent p-8 rounded-[2.5rem] border border-primary/10 relative overflow-hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Configurações ⚙️</h1>
          <p className="text-muted-foreground font-medium">Ajuste os parâmetros gerais e o status operacional do sistema.</p>
        </div>
      </div>

      {/* EMERGENCY SECTION - SYSTEM STATUS */}
      <div className={`rounded-[2.5rem] p-8 border-2 transition-all duration-500 bg-card ${form.systemActive ? "border-success/20 shadow-lg shadow-success/5" : "border-destructive/30 bg-destructive/[0.02] animate-pulse"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${form.systemActive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {form.systemActive ? <Power className="h-7 w-7" /> : <PowerOff className="h-7 w-7" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Status do Sistema: {form.systemActive ? "Ativo" : "Suspenso"}
              </h2>
              <p className="text-sm text-muted-foreground font-medium mt-1 leading-relaxed max-w-md">
                {form.systemActive
                  ? "O sistema está operando normalmente. Todos os usuários (Portaria e Coordenação) têm acesso às suas funções."
                  : "O sistema está SUSPENSO. Apenas Administradores podem acessar o painel. Todos os outros usuários verão uma tela de manutenção."
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => update("systemActive", !form.systemActive)}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-3 ${form.systemActive
              ? "bg-destructive text-white hover:bg-destructive/90 shadow-destructive/20"
              : "bg-success text-white hover:bg-success/90 shadow-success/20"
              }`}
          >
            {form.systemActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            {form.systemActive ? "Suspender Sistema" : "Ativar Sistema"}
          </button>
        </div>

        {!form.systemActive && (
          <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p className="text-xs font-bold uppercase tracking-tight">ATENÇÃO: Operações de portaria e relatórios estão bloqueadas para a equipe no momento.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
      </div>

      <div className="flex justify-end pt-4">
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20">
          <Save className="h-4 w-4" /> {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}
