import { Save, Send, Power, PowerOff, ShieldAlert, Settings2, Bell, Smartphone, School, Headphones, BookOpen, DoorOpen, GraduationCap, Link2, Ghost, RefreshCw, Smartphone as MobileIcon } from "lucide-react";
import { generateUserGuidePDF, generateGatekeeperGuidePDF, generateCoordinationGuidePDF } from "@/lib/userGuideGenerator";
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
    whatsappApiUrl: "",
    whatsappApiKey: "",
    whatsappInstanceName: "",
    whatsappBotType: "manual" as "manual" | "evolution",
    exitLimit: "3",
    systemActive: true,
    vocalFeedbackEnabled: true,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        schoolName: settings.school_name,
        whatsappEnabled: settings.whatsapp_enabled || false,
        schoolPhone: settings.school_phone || "",
        apiKeyGlobal: settings.callmebot_api_key_global || "",
        whatsappApiUrl: (settings as any).whatsapp_api_url || "",
        whatsappApiKey: (settings as any).whatsapp_api_key || "",
        whatsappInstanceName: (settings as any).whatsapp_instance_name || "",
        whatsappBotType: (settings as any).whatsapp_bot_type || "manual",
        exitLimit: String(settings.exit_limit_default || 3),
        systemActive: (settings as any).system_active ?? true,
        vocalFeedbackEnabled: (settings as any).vocal_feedback_enabled ?? true,
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
        whatsapp_api_url: form.whatsappApiUrl,
        whatsapp_api_key: form.whatsappApiKey,
        whatsapp_instance_name: form.whatsappInstanceName,
        whatsapp_bot_type: form.whatsappBotType,
        exit_limit_default: parseInt(form.exitLimit) || 3,
        system_active: form.systemActive,
        vocal_feedback_enabled: form.vocalFeedbackEnabled,
      } as any).eq("id", settings.id);
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
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-90 transition-transform duration-1000">
          <Settings2 className="w-64 h-64 text-primary" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-20 w-20 rounded-[2rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground">
            <Settings2 className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight drop-shadow-sm">Configurações Gerais</h1>
            <p className="text-sm text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              Parâmetros & Controle Operacional
            </p>
          </div>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="premium-button shadow-primary/20"
          >
            <Save className="h-4 w-4 mr-2" /> {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {/* Critical Status Panel */}
      <div className={`group relative overflow-hidden rounded-[3rem] border-2 transition-all duration-700 ${form.systemActive
        ? "bg-success/5 border-success/20 shadow-[0_32px_128px_-16px_rgba(34,197,94,0.15)]"
        : "bg-destructive/5 border-destructive/30 border-dashed animate-pulse"
        }`}>
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform duration-1000 group-hover:scale-110">
          {form.systemActive ? <Power className="w-48 h-48 text-success" /> : <PowerOff className="w-48 h-48 text-destructive" />}
        </div>

        <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex items-start gap-6">
            <div className={`h-20 w-20 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform ${form.systemActive ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {form.systemActive ? <Power className="h-10 w-10" /> : <PowerOff className="h-10 w-10" />}
            </div>
            <div>
              <h2 className={`text-2xl font-black tracking-tight mb-2 ${form.systemActive ? "text-success" : "text-destructive"}`}>
                Status do Ecossistema: {form.systemActive ? "ATIVO" : "SUSPENSO"}
              </h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xl">
                {form.systemActive
                  ? "O sistema está plenamente operacional. Todas as interfaces de Portaria e Coordenação estão acessíveis para coleta de dados e relatórios."
                  : "O sistema está em modo de MANUTENÇÃO. O acesso é restrito apenas a administradores. Use esta função apenas para backups ou atualizações críticas."
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => update("systemActive", !form.systemActive)}
            className={`px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-3 active:scale-95 ${form.systemActive
              ? "bg-destructive text-white hover:bg-destructive/90 shadow-destructive/20"
              : "bg-success text-white hover:bg-success/90 shadow-success/20"
              }`}
          >
            {form.systemActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            {form.systemActive ? "Suspender Sistema" : "Ativar Operação"}
          </button>
        </div>

        {!form.systemActive && (
          <div className="mx-10 mb-10 p-6 rounded-2xl bg-destructive text-white flex items-center gap-4 animate-bounce border-2 border-white/20">
            <ShieldAlert className="h-6 w-6 shrink-0" />
            <p className="text-xs font-black uppercase tracking-[0.15em]">Alerta Crítico: O sistema não está processando entradas de alunos no momento.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Institutional Section */}
        <div className="glass-panel p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <School className="w-40 h-40 text-primary" />
          </div>
          <div className="flex items-center gap-4 border-b border-border/50 pb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <School className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight uppercase text-xs tracking-[0.2em]">Identidade Institucional</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] ml-1">Nome Oficial da Unidade</label>
              <input
                value={form.schoolName}
                onChange={(e) => update("schoolName", e.target.value)}
                placeholder="Ex: Escola Técnica Estadual..."
                className="premium-input w-full"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] ml-1">Limite Semanal de Evasão (Padrão)</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.exitLimit}
                  onChange={(e) => update("exitLimit", e.target.value)}
                  className="premium-input w-full pr-20"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase">Saídas</span>
              </div>
            </div>

            <div className="pt-4 p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-start gap-4">
              <div className="mt-1">
                <div className={`relative h-6 w-12 rounded-full transition-colors cursor-pointer ${form.vocalFeedbackEnabled ? "bg-primary" : "bg-muted"}`}
                  onClick={() => update("vocalFeedbackEnabled", !form.vocalFeedbackEnabled)}>
                  <div className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full transition-transform ${form.vocalFeedbackEnabled ? "translate-x-6" : "translate-x-0"}`} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-black text-foreground tracking-tight">Feedback de Scanner</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Habilitar vozes e sinais sonoros durante a leitura de QR codes na portaria.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Section */}
        <div className="glass-panel p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Smartphone className="w-40 h-40 text-info" />
          </div>
          <div className="flex items-center justify-between border-b border-border/50 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-info/10 flex items-center justify-center text-info">
                <Smartphone className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-foreground tracking-tight uppercase text-xs tracking-[0.2em]">Notificações Inteligentes</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${form.whatsappEnabled ? "bg-success/10 text-success border-success/20" : "bg-muted/10 text-muted-foreground border-border"}`}>
              {form.whatsappEnabled ? "Ativo" : "Inativo"}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-[2rem] bg-info/5 border border-info/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground tracking-tight">Envio via WhatsApp</h4>
                  <p className="text-[10px] text-muted-foreground font-medium">Notificar pais sobre ocorrências</p>
                </div>
              </div>
              <div className={`relative h-6 w-12 rounded-full transition-colors cursor-pointer ${form.whatsappEnabled ? "bg-info" : "bg-muted"}`}
                onClick={() => update("whatsappEnabled", !form.whatsappEnabled)}>
                <div className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full transition-transform ${form.whatsappEnabled ? "translate-x-6" : "translate-x-0"}`} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-[2rem] bg-info/5 border border-info/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
                      <MobileIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-foreground tracking-tight">Modo de Operação</h4>
                      <p className="text-[10px] text-muted-foreground font-medium">Como as mensagens serão enviadas</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => update("whatsappBotType", "manual")}
                    className={`px-4 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${form.whatsappBotType === 'manual' ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 text-muted-foreground hover:border-primary/30'}`}
                  >
                    Link Manual (wa.me)
                  </button>
                  <button
                    onClick={() => update("whatsappBotType", "evolution")}
                    className={`px-4 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${form.whatsappBotType === 'evolution' ? 'border-info bg-info/5 text-info' : 'border-border/50 text-muted-foreground hover:border-info/30'}`}
                  >
                    Bot Automático (Evolution)
                  </button>
                </div>
              </div>

              {form.whatsappBotType === 'evolution' ? (
                <div className="space-y-5 p-6 rounded-[2rem] border-2 border-info/20 bg-info/5 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <Ghost className="h-4 w-4 text-info" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-info">Configuração da API Evolution</span>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] ml-1">URL da API</label>
                    <div className="relative">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        value={form.whatsappApiUrl}
                        onChange={(e) => update("whatsappApiUrl", e.target.value)}
                        placeholder="https://api.seubot.com"
                        className="premium-input w-full pl-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] ml-1">Instância</label>
                      <input
                        value={form.whatsappInstanceName}
                        onChange={(e) => update("whatsappInstanceName", e.target.value)}
                        placeholder="NomeDaInstancia"
                        className="premium-input w-full"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] ml-1">API Key</label>
                      <input
                        type="password"
                        value={form.whatsappApiKey}
                        onChange={(e) => update("whatsappApiKey", e.target.value)}
                        placeholder="••••••••"
                        className="premium-input w-full"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const { whatsappService } = await import("@/services/whatsappService");
                      const res = await whatsappService.checkInstanceStatus();
                      if (res.success) {
                        toast.success(`Bot Conectado! Status: ${res.status}`);
                      } else {
                        toast.error("Não foi possível conectar ao Bot.");
                      }
                    }}
                    className="w-full py-4 rounded-xl bg-info text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-info/90 transition-all"
                  >
                    <RefreshCw className="h-4 w-4" /> Testar Conexão com Bot
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] ml-1">Telefone da Unidade (DDI + DDD)</label>
                    <input
                      value={form.schoolPhone}
                      onChange={(e) => update("schoolPhone", e.target.value)}
                      placeholder="Ex: 5571999999999"
                      className="premium-input w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] ml-1">CallMeBot API Key (Global)</label>
                    <input
                      type="password"
                      value={form.apiKeyGlobal}
                      onChange={(e) => update("apiKeyGlobal", e.target.value)}
                      placeholder="••••••••••••••••"
                      className="premium-input w-full"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  const { whatsappService } = await import("@/services/whatsappService");
                  const res = await whatsappService.sendMessage(form.schoolPhone || "5571999999999", "Mensagem de teste do CETI Digital!");
                  if (res.success) {
                    toast.success("Mensagem enviada pelo Bot!");
                  } else if (res.manualLink) {
                    window.open(res.manualLink, "_blank");
                    toast.info("Abrindo link manual...");
                  }
                }}
                className="w-full py-5 rounded-2xl bg-info/10 text-info text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-info hover:text-white transition-all shadow-lg shadow-info/10 active:scale-95"
              >
                <Send className="h-4 w-4" /> Disparar Mensagem de Teste
              </button>
            </div>
          </div>
        </div>

        {/* User Guides */}
        <div className="glass-panel p-10 border-primary/10 lg:col-span-2">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground tracking-tight">Documentação</h2>
              <p className="text-xs text-muted-foreground font-medium">Guias do sistema em PDF para cada perfil</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => generateUserGuidePDF()}
              className="py-5 rounded-2xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] flex flex-col items-center justify-center gap-3 hover:bg-primary hover:text-primary-foreground transition-all shadow-lg shadow-primary/10 active:scale-95"
            >
              <BookOpen className="h-6 w-6" />
              Guia Completo
              <span className="text-[8px] font-medium opacity-70 normal-case tracking-normal">Todos os módulos</span>
            </button>
            <button
              onClick={() => generateGatekeeperGuidePDF()}
              className="py-5 rounded-2xl bg-success/10 text-success text-[10px] font-black uppercase tracking-[0.2em] flex flex-col items-center justify-center gap-3 hover:bg-success hover:text-success-foreground transition-all shadow-lg shadow-success/10 active:scale-95"
            >
              <DoorOpen className="h-6 w-6" />
              Guia do Porteiro
              <span className="text-[8px] font-medium opacity-70 normal-case tracking-normal">Operações de portaria</span>
            </button>
            <button
              onClick={() => generateCoordinationGuidePDF()}
              className="py-5 rounded-2xl bg-info/10 text-info text-[10px] font-black uppercase tracking-[0.2em] flex flex-col items-center justify-center gap-3 hover:bg-info hover:text-info-foreground transition-all shadow-lg shadow-info/10 active:scale-95"
            >
              <GraduationCap className="h-6 w-6" />
              Guia da Coordenação
              <span className="text-[8px] font-medium opacity-70 normal-case tracking-normal">Gestão pedagógica</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
