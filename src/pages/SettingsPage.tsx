import { Save, Send } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    schoolName: "Colégio Estadual de Tempo Integral de Nova Itarana",
    whatsappEnabled: true,
    schoolPhone: "75988880000",
    apiKeyGlobal: "",
    exitLimit: "3",
  });

  const update = (field: string, value: string | boolean) =>
    setSettings((prev) => ({ ...prev, [field]: value }));

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
          <input
            value={settings.schoolName}
            onChange={(e) => update("schoolName", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Limite padrão de saídas semanais</label>
          <input
            type="number"
            value={settings.exitLimit}
            onChange={(e) => update("exitLimit", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Integração WhatsApp (CallMeBot)</h2>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="whatsapp-toggle"
            checked={settings.whatsappEnabled}
            onChange={(e) => update("whatsappEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
          />
          <label htmlFor="whatsapp-toggle" className="text-sm text-foreground">Ativar envio de notificações via WhatsApp</label>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Número da Escola (remetente padrão)</label>
          <input
            value={settings.schoolPhone}
            onChange={(e) => update("schoolPhone", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">API Key Global (CallMeBot)</label>
          <input
            type="password"
            value={settings.apiKeyGlobal}
            onChange={(e) => update("apiKeyGlobal", e.target.value)}
            placeholder="Insira a chave global..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          <Send className="h-4 w-4" /> Enviar Mensagem de Teste
        </button>
      </div>

      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Save className="h-4 w-4" /> Salvar Configurações
        </button>
      </div>
    </div>
  );
}
