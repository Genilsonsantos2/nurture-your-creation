import { Users, LogIn, LogOut, AlertTriangle, ScanLine, UserPlus, QrCode, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Total de Alunos", value: "342", icon: Users, color: "bg-primary" },
  { label: "Entradas Hoje", value: "287", icon: LogIn, color: "bg-success" },
  { label: "Saídas Hoje", value: "12", icon: LogOut, color: "bg-warning" },
  { label: "Alertas Pendentes", value: "5", icon: AlertTriangle, color: "bg-destructive" },
];

const quickActions = [
  { label: "Portaria", icon: ScanLine, path: "/portaria", color: "bg-primary text-primary-foreground" },
  { label: "Cadastrar Aluno", icon: UserPlus, path: "/alunos/novo", color: "bg-success text-success-foreground" },
  { label: "QR Codes", icon: QrCode, path: "/qrcodes", color: "bg-info text-info-foreground" },
  { label: "Relatórios", icon: BarChart3, path: "/relatorios", color: "bg-warning text-warning-foreground" },
];

const recentMovements = [
  { student: "João Silva", series: "7º Ano A", type: "Entrada", time: "07:12", photo: "JS" },
  { student: "Maria Santos", series: "8º Ano B", type: "Entrada", time: "07:15", photo: "MS" },
  { student: "Pedro Oliveira", series: "6º Ano A", type: "Saída", time: "07:18", photo: "PO" },
  { student: "Ana Costa", series: "9º Ano C", type: "Entrada", time: "07:20", photo: "AC" },
  { student: "Lucas Pereira", series: "7º Ano B", type: "Entrada", time: "07:22", photo: "LP" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Geral</h1>
        <p className="text-muted-foreground text-sm">Resumo do dia — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">5 alunos ausentes hoje</p>
          <p className="text-xs text-muted-foreground">Carlos M., Fernanda L., Ricardo S., Julia P., Marcos V.</p>
        </div>
        <Link to="/alertas" className="text-sm font-medium text-primary hover:underline shrink-0">
          Ver Alertas →
        </Link>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Acesso Rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path} className={`quick-action ${action.color} rounded-xl`}>
              <action.icon className="h-8 w-8" />
              <span className="text-sm">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent movements */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Movimentações Recentes</h2>
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="divide-y">
            {recentMovements.map((mov, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                  {mov.photo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{mov.student}</p>
                  <p className="text-xs text-muted-foreground">{mov.series}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  mov.type === "Entrada" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                }`}>
                  {mov.type}
                </span>
                <span className="text-xs text-muted-foreground w-12 text-right">{mov.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
