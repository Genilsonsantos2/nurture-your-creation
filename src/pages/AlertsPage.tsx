import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  absent: "Ausente",
  not_returned: "Não retornou",
  irregular_time: "Horário Irregular",
  excessive_exits: "Saídas Excessivas",
};

const typeColors: Record<string, string> = {
  absent: "bg-destructive/15 text-destructive",
  not_returned: "bg-warning/15 text-warning",
  irregular_time: "bg-info/15 text-info",
  excessive_exits: "bg-destructive/15 text-destructive",
};

export default function AlertsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      // Modificamos a busca para incluir também o telefone do responsável p/ contato rápido do WhatsApp
      const { data, error } = await supabase
        .from("alerts")
        .select("*, students(name, series, class, guardians(phone, name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.from("alerts").update({
        status: "resolved" as const,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
      }).eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alerta resolvido.");
    },
  });

  const pending = alerts.filter((a) => a.status === "pending");
  const resolved = alerts.filter((a) => a.status === "resolved");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
        <p className="text-sm text-muted-foreground">{pending.length} alertas pendentes</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Pendentes</h2>
        {pending.length === 0 ? (
          <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground text-sm">Nenhum alerta pendente</div>
        ) : (
          pending.map((alert: any) => (
            <div key={alert.id} className="bg-card rounded-lg border p-4 flex items-center gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{alert.students?.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[alert.type] || "bg-muted text-muted-foreground"}`}>
                    {typeLabels[alert.type] || alert.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{alert.students?.series} {alert.students?.class} — {alert.message}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {new Date(alert.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {alert.type === "absent" && alert.students?.guardians?.[0] && (
                  <button
                    onClick={() => {
                      const phone = alert.students.guardians[0].phone.replace(/\D/g, '');
                      const msg = encodeURIComponent(`Olá, responsável por ${alert.students.name}. Notamos que o(a) aluno(a) não registra entrada na escola há alguns dias. Está tudo bem?`);
                      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                    }}
                    className="text-xs font-medium bg-success/10 text-success px-3 py-1.5 rounded-full hover:bg-success/20 transition-all">
                    Chamar no Whats
                  </button>
                )}
                <button onClick={() => resolveMutation.mutate(alert.id)} className="text-xs font-medium text-primary hover:underline ml-2">Resolver</button>
              </div>
            </div>
          ))
        )}
      </div>

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolvidos</h2>
          {resolved.slice(0, 10).map((alert: any) => (
            <div key={alert.id} className="bg-card/50 rounded-lg border p-4 flex items-center gap-4 opacity-60">
              <div className="h-10 w-10 shrink-0 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{alert.students?.name}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
