import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

const mockAlerts = [
  { id: 1, type: "Ausente", student: "Carlos Mendes", series: "6º Ano B", message: "Não registrou entrada até 08:30", time: "08:30", resolved: false },
  { id: 2, type: "Não retornou", student: "Fernanda Lima", series: "8º Ano A", message: "Saiu às 10:15 e não retornou", time: "18:30", resolved: false },
  { id: 3, type: "Horário Irregular", student: "Ricardo Silva", series: "7º Ano A", message: "Entrada fora da janela permitida", time: "09:45", resolved: false },
  { id: 4, type: "Ausente", student: "Julia Pinto", series: "9º Ano A", message: "Não registrou entrada até 08:30", time: "08:30", resolved: false },
  { id: 5, type: "Saídas Excessivas", student: "Marcos Vieira", series: "8º Ano B", message: "Atingiu limite de 3 saídas semanais", time: "14:20", resolved: false },
  { id: 6, type: "Ausente", student: "Ana Costa", series: "9º Ano C", message: "Não registrou entrada até 08:30", time: "08:30", resolved: true },
];

const typeColors: Record<string, string> = {
  "Ausente": "bg-destructive/15 text-destructive",
  "Não retornou": "bg-warning/15 text-warning",
  "Horário Irregular": "bg-info/15 text-info",
  "Saídas Excessivas": "bg-destructive/15 text-destructive",
};

export default function AlertsPage() {
  const pending = mockAlerts.filter((a) => !a.resolved);
  const resolved = mockAlerts.filter((a) => a.resolved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
        <p className="text-sm text-muted-foreground">{pending.length} alertas pendentes</p>
      </div>

      {/* Pending */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Pendentes</h2>
        {pending.map((alert) => (
          <div key={alert.id} className="bg-card rounded-lg border p-4 flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">{alert.student}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[alert.type] || "bg-muted text-muted-foreground"}`}>
                  {alert.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{alert.series} — {alert.message}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {alert.time}
              </span>
              <button className="text-xs font-medium text-primary hover:underline">Resolver</button>
            </div>
          </div>
        ))}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resolvidos</h2>
          {resolved.map((alert) => (
            <div key={alert.id} className="bg-card/50 rounded-lg border p-4 flex items-center gap-4 opacity-60">
              <div className="h-10 w-10 shrink-0 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{alert.student}</p>
                <p className="text-xs text-muted-foreground">{alert.series} — {alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
